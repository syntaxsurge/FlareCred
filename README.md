## 1\. Platform Architecture Overview

**FlareCred** is deliberately organised so that every directory maps to a concrete concern: the `app/` tree contains route handlers and React Server/Client Components, `components/` holds reusable UI atoms and domain-specific tables or boards, `lib/` encapsulates shared business logic (auth middleware, database queries, typed on-chain helpers), while `blockchain/` keeps Hardhat-compiled Solidity contracts plus deterministic deployment scripts. Walking through the root you will therefore see that an inbound HTTP request flows "file-system → Next 14 App Router → server action → drizzle query → optional contract call” and finally renders back through a shadcn/ui component that already knows its role guard and tailwind styles.

The first actor touching the codebase is _any visitor_ who lands on `/`. They receive a purely static marketing shell rendered from `components/landing/*`; no session is required. The instant they select a persona—candidate, issuer, recruiter, or admin—the UI calls from `components/auth/wallet-onboard-modal.tsx`. That client component reads the Wagmi config prepared in `lib/wallet.tsx`, prompts for a browser wallet, and posts the address to `app/api/auth/wallet-onboard/route.ts`. A JWT stored in `auth.session.ts` is returned, which the edge `middleware.ts` then inspects on every navigation; this is how the role-based gates sprinkled across `app/(dashboard)` routes are enforced without duplicating logic.

Immediately after onboarding the user lands inside their role-scoped dashboard segment (`/candidate`, `/issuer`, `/recruiter`, or `/admin`). Each segment is a folder in `app/(dashboard)` that only imports hooks and components resident under the same namespace—e.g. `candidate/profile/page.tsx` pulls `…/profile-detailed-view.tsx` and `lib/db/queries/candidate-details.ts`—making the coupling explicit. The `layout.tsx` shared at the dashboard root injects the left-hand navigation (`components/dashboard/sidebar-nav.tsx`) which renders menu items conditionally based on the `role` stored in React context, ensuring that a recruiter never sees admin pages and so on. These guards are double-checked server-side with early `redirect()` calls, as shown in `recruiter/page.tsx` and dozens of similar files.

The very first mission for a **candidate** is minting a deterministic decentralized identifier. When they click "Create Flare DID” the client component in `candidate/create-did/create-did-button.tsx` calls → `DIDRegistry.createDID()` on Coston 2, waits for the receipt, and then persists the resulting `did:flare:0x…` string back to the Postgres `teams` table. All follow-up credential flows pivot around that DID: every experience highlight, project, or skill-check VC ultimately embeds it as `credentialSubject.id`. The wallet signature required to submit the DID transaction anchors the user’s identity to a private key they already control, meaning there is no central password store in the whole repository.

Billing is handled by the **SubscriptionManager** contract in `blockchain/contracts/SubscriptionManager.sol`. The React hook `lib/hooks/useFlareUsdPrice.ts` executes a read-only call → `FtsoHelper.flrUsdPriceWei()` every sixty seconds; the tuple `{priceWei, timestamp}` is decoded in `lib/flare.ts` so that UI buttons such as `pricing/submit-button.tsx` can simultaneously show "5 FLR ≈ $1.23” and disable themselves when `Date.now()/1000 – timestamp > 3600`. When the user proceeds, the button composes a `paySubscription(team, planKey)` transaction targeting the chain id injected via `NEXT_PUBLIC_FLARE_CHAIN_ID`; the Solidity logic automatically extends `paidUntil` by one `30 days` period. The corresponding `SubscriptionPaid` event is parsed by a server action and streamed into `settings/activity` so that owners can audit who topped up, when, and using which plan.

The platform leans heavily on **helper libraries** hosted under `blockchain/contracts/lib`. `FtsoHelper.sol` wraps `getFeedByIdInWei` so the front-end never speaks to the oracle directly; `RngHelper.sol` exposes `randomMod(bound)` which seeds the candidate skill-check shuffle through the `api/rng-seed/route.ts` endpoint; and `FdcHelper.sol` or, more specifically, the `FlareCredVerifier` delegate contract, gives issuers a one-liner to call `verifyJson`/`verifyEVM` etc. Because every helper’s address is exported from `lib/flare.ts` as an `ethers.Contract` instance, any server action can invoke on-chain verification without re-importing ABIs or worrying about providers—resulting in tiny, readable files such as `issuer/credentials/actions.ts`.

On the client side `lib/db` holds Drizzle-generated TypeScript models so that data returned from queries remains strongly typed end-to-end. When a server component inside `app/(dashboard)/candidate` calls `db.select()` the resulting row shape mirrors the TypeScript interfaces compiled from `lib/db/schema/*.ts`. This arrangement means that if a migration adds a column—e.g. `proofType`—the compiler forces a revisit of every place that was destructuring `candidateCredentials`; hence runtime drift is virtually impossible.

Finally, a note on **visual cohesion**. All buttons, cards, modals, and badges you see across the app are powered by shadcn/ui primitives located in `components/ui`. The `components/ui/button.tsx` file defines the cva-based variant map that sandboxes spacing, rounded-corner rules, focus rings, and motion transitions (`transition-all hover:scale-[1.02]`) in one location. Therefore as new blazor routes are added the contributor only has to import Button, Card, or Badge; design consistency is preserved automatically. Dark-mode support is handled by `components/theme-provider.tsx`, which toggles Tailwind’s `dark:` classes in lock-step with `localStorage.theme` and the OS preference.

## 2\. Smart Contracts & On-Chain Integrations

**FlareCred’s on-chain layer** is compact enough that a newcomer can audit every line in one sitting yet powerful enough to express a full credential-issuance life-cycle without hidden off-chain assumptions. Six Solidity compilation units live under `blockchain/contracts/`: three state-bearing root contracts (`DIDRegistry.sol`, `CredentialNFT.sol`, `SubscriptionManager.sol`), one thin delegate (`FlareCredVerifier.sol`), and two helper libraries (`lib/FtsoHelper.sol` and `lib/RngHelper.sol`). Each of these artefacts is surfaced to the TypeScript codebase through `lib/flare.ts`; that file performs _single-source-of-truth_ address assertions, exposes read-only `ethers.Contract` instances, and ships convenience wrappers such as `issueFlareCredential()` or `readFlrUsdPriceWei()`. Because both the server actions and the React client-side hooks import from exactly that module, address drift between server and browser is impossible.

The first contract a user interacts with is `DIDRegistry`. When a candidate clicks the “Create Flare DID” button the client component in `app/(dashboard)/candidate/create-did/create-did-button.tsx` performs the following linear path: wagmi.writeContract → DIDRegistry.createDID(bytes32 docHash). The registry derives the identifier by concatenating the constant prefix `"did:flare:"` with a 20-byte, zero-padded hexadecimal representation of `msg.sender`. The result is stored in `mapping(address ⇒ string) didOf`, and an event `DIDCreated` is emitted; that hash is never re-computable for a second address, so DID collisions are provably impossible. Candidates can later update their DID document pointer through `setDocument(uri, docHash)`, while admins hold an `adminSetDocument()` override for moderated corrections. No function is `payable` and the registry holds no funds, which eliminates any re-entrancy vector in that piece of code.

Once identity is minted the next touchpoint is `CredentialNFT`. Unlike designs that merely emit events, FlareCred permanently anchors the keccak-256 hash of every Verifiable Credential inside an ERC-721 token. The issuance flow looks like this:

issuer dashboard Approve click
   → server action `issuer/credentials/actions.ts`
        ├─💾 fetch cred + issuer row via Drizzle
        ├─🔒 call `verifyFdcProof(proofType, proofData)` (see below)
        ├─🧮 compute vcHash = keccak256(vcJson)
        └─⛓️  `issueFlareCredential({ to, vcHash, uri: '' })`
                ↳ `credentialNftSigner.write.mintCredential(to, vcHash, uri)`

The minting function is `onlyRole(ISSUER_ROLE)`; roles are granted immediately after deployment by `blockchain/scripts/deployCredentialNFT.ts` which reads a comma-separated `ISSUER_ADDRESSES` env var. Every successful mint triggers `event CredentialMinted(address to,uint256 tokenId,bytes32 vcHash,string uri)`, and the server action persists both the `tokenId` and the transaction hash into the `vcJson` blob so that UI tables can deep-link to Flarescan.

`SubscriptionManager` underpins SaaS billing. It stores a `mapping(address ⇒ uint256) paidUntil` plus a dynamic `planPriceWei` lookup, both guarded by `ADMIN_ROLE`. The payable `paySubscription(team, planKey)` function verifies that `msg.value == planPriceWei[planKey]`, then rolls the active window forward in 30-day increments. No re-entrancy hazards exist because the contract does not call external addresses, and role administration is locked down in the constructor. On the UI side, all FLR amounts are first translated to USD using the oracle helper described below and buttons remain disabled whenever the oracle timestamp is older than one hour, guaranteeing price freshness.

Data-integrity of external attestations is enforced by `FlareCredVerifier`, a **stateless delegate** that caches `IFdcVerification` from Flare’s `ContractRegistry`. Its four wrapper functions—`verifyEVM`, `verifyJson`, `verifyPayment`, and `verifyAddress`—are all `view` calls that bubble up whatever boolean the canonical verifier returns. Because the delegate itself never stores anything it can be replaced by deploying a new instance and updating `NEXT_PUBLIC_FDC_VERIFIER_ADDRESS` without touching live NFTs or DIDs. Server-side enforcement resides in `issuer/credentials/actions.ts`; that file parses `proofData`, chooses the correct wrapper, and aborts the approval if the verifier flips `false` or reverts.

Two helper libraries round off the stack. `FtsoHelper.sol` decorates `TestFtsoV2Interface.getFeedByIdInWei` so the front end can call a simple `flrUsdPriceWei()` method that already returns a 256-bit price and its oracle timestamp. The Hook `useFlareUsdPrice.ts` pulls that value every sixty seconds, converts it to a floating USD amount inside `formatUsd()`, and sets a `stale` flag once the feed exceeds the 3600-second threshold. Buttons inside `pricing`, `settings/team`, and `wallet-onboard-modal` bail out early with a red toast (→ “Oracle data stale – retry later”) whenever `stale === true`, thereby satisfying hackathon requirements for oracle integrity.

`RngHelper.sol` plugs Flare’s Random Number Generator into candidate quizzes. The public `randomMod(uint256 modulus)` divides a cryptographically random uint256 by the provided modulus, returning a bounded result in a single `view` call. That function is invoked by the `api/rng-seed/route.ts` endpoint; the returned hex seed is stored alongside the quiz attempt in Postgres (`quizAttempts.seed` column) and displayed back to recruiters so anyone can recompute the original Fisher–Yates shuffle. Because the helper stores no state, its presence cannot introduce miner-extractable value or replay attacks.

Every contract exposes its own `supportsInterface` override in accordance with ERC-165, enabling future composability (e.g., credential revocation registries) and on-chain discovery. The Hardhat config uses Solidity 0.8.25 for global arithmetic overflow checks, and the `.solhint.json` file enforces “no wildcard re-entrancy” and “no inline assembly” rules across the repository.

Deployment scripts under `blockchain/scripts/` guide developers through:

1.  `deployDIDRegistry.ts` – emits address & verifies on Routescan;
2.  `deployCredentialNFT.ts` – grants ISSUER\_ROLE & PLATFORM\_ROLE;
3.  `deploySubscriptionManager.ts` – seeds plan prices via env and grants ADMIN\_ROLE to the platform wallet;
4.  `deployFlareCredVerifier.ts` – prints `VERIFIER_ADDRESS=…` reminder.

Security conscious readers will note that none of the contracts perform _delegatecall_s, that all mapping writes follow `checks-effects-interactions`, and that the sole `payable` function (`paySubscription`) transfers no ether outwards, making re-entrancy technically impossible. Role administrators are immutable once the constructor exits, reducing governance overhead to a single spare multisig wallet that holds the `ADMIN_ROLE` on testnets and main-net. For the hackathon scope this strikes a pragmatic balance between auditability and upgradability; future iterations could wrap `SubscriptionManager` in a transparent proxy without touching front-end hooks because `lib/flare.ts` centralises the ABI references.

In essence, FlareCred’s contract suite encodes _identity → attestation → payment_ as three orthogonal layers, joined together by a stateless verifier and two data-access helpers. This deliberate separation keeps the codebase readable, reduces the audit surface, and lets each React screen wire itself to the exact on-chain primitive it needs with zero duplicate ABIs or scattered address constants.

## 3\. Application Flows by Role & UI Pages

_FlareCred_ exposes four first-class personas—**candidates, issuers, recruiters** and an **administrator**—each confined to a namespaced folder under `app/(dashboard)`. This section maps, with file-level precision, how a page load for every role fans out across Server Components, server actions, Drizzle queries, React client components, and ultimately Solidity methods. All references correspond exactly to the repository tree shipped with the platform; no speculative modules are introduced.

### 3.1 Candidate Journey

The visitor who selects Candidate in `components/landing/cta-section.tsx` is routed to `/connect-wallet`. Here `app/(auth)/connect-wallet/page.tsx` mounts `<WalletOnboardModal/>`, which relies on `lib/wallet.tsx` to initialise Wagmi and WalletConnect. Successfully signed addresses are posted to `api/auth/wallet-onboard/route.ts`; `lib/auth/session.ts` stores a `JWT` that `middleware.ts` validates on subsequent navigations.

**Profile → DID creation**:

*   `/candidate/profile/page.tsx` draws `ProfileForm` (client). When submitted the form targets `candidate/profile/actions.ts`, which updates `candidates.bio`, social URLs and name via Drizzle.
*   Immediately afterwards the sidebar directs to `/candidate/create-did`. The page checks for an existing identifier by joining `teamMembers` and `teams.did`; if none is found it renders explanatory copy plus `<CreateDidButton/>` from `candidate/create-did/create-did-button.tsx`.
*   The button signs a transaction → `DIDRegistry.createDID(bytes32 docHash)`. Receipt data are persisted in `teams.did` and an activity-log row is appended through `lib/db/queries/activity.ts`.

**Credential submission** flow:

AddCredentialDialog (client)
   → add-credential-form.tsx
        • user picks category, type, issuer
        • selects proofType (EVM | JSON | PAYMENT | ADDRESS) & uploads/links proofData
   → server action candidate/credentials/actions.tsx
        • Zod validates payload (CategoryEnum, ProofTypeEnum)
        • Drizzle inserts into candidate\_credentials (proofType + proofData now non-null)
        • Activity entry logged

**AI Skill-Check** loop:

1.  `/candidate/skill-check/page.tsx` lists quizzes from `skillQuizzes`.
2.  A start button inside `start-quiz-form.tsx` fetches `/api/rng-seed?max=n`. The endpoint calls `lib/flare.randomMod()`, which performs a read-only `ethers` call against the on-chain `RngHelper` library.
3.  The returned hex seed initialises a Fisher–Yates shuffle in the browser; both seed and question order are written into `quizAttempts` together with the score.
4.  Passing triggers a server action that creates a VC JSON, hashes it, and calls `CredentialNFT.mintCredential()`. The `tokenId` plus the minting transaction hash are injected back into the `vcJson` blob so candidates immediately receive “Verify on Flare” deep-links in `components/dashboard/candidate/credentials-table.tsx`.

### 3.2 Issuer Workflow

An issuer begins at `/issuer/onboard`. The Server Component checks ownership of an `issuers` row; if none exists, `CreateIssuerForm` is displayed. Form submission flows through `issuer/onboard/actions.ts` inserting a PENDING issuer record. Admins see pending counts via `app/api/pending-counts/route.ts`.

Once promoted to ACTIVE, the issuer dashboard entry-point at `/issuer/requests` renders `IssuerRequestsTable`, sourcing rows from `getIssuerRequestsPage()`. Clicking a row drills into `/issuer/credentials/[id]`; the page composes:

*   Status badges/icon map (`issuer/[id]/page.tsx`) using `CredentialStatus` enum.
*   GitHub proof viewer (`GithubProofDialog`) if `isGithubRepoCredential()` returns true.
*   `<CredentialActions/>`, supplying `{credentialId,status,isGithub}`.

Approve → chain path:

CredentialActions APPROVE click
   → issuer/credentials/actions.ts
        ├─ fetch {proofType,proofData}
        ├─ lib/flare.verifyFdcProof() → FlareCredVerifier.verifyJson|EVM|…
        ├─ compose vcHash = keccak256(vcJson)
        └─ credentialNftSigner.write.mintCredential(to, vcHash, uri='')

The action embeds `proofTx` (extracted for JSON proofs or forwarded from EVM ones) into `vcJson`, sets `status='VERIFIED'`, and surfaces a toast on completion.

### 3.3 Recruiter Console

A recruiter visiting `/recruiter/talent` hits server component `recruiter/talent/page.tsx`. Query params like `verifiedOnly=1` or `skillMin=70` are parsed, then `getTalentSearchPage()` assembles candidate rows enriched with top-quiz scores, verification flags and bio excerpts. The rows hydrate `TalentTable.tsx`, a client component offering column sorting and text search.

Clicking a row navigates to `/recruiter/talent/[id]`. The detailed view aggregates:

*   Experience & project highlights via `candidate_highlights` joins.
*   Credential list plus proof metadata through `getCandidateCredentialsSection()`.
*   Pipeline participation summary by joining `pipelineCandidates` and `recruiterPipelines`.
*   Quiz attempts, each showing `seed` (stored in `quizAttempts.seed`) so hiring teams can verify randomisation.

Pipelines themselves are managed at `/recruiter/pipelines`. Creating a pipeline posts to `recruiter/pipelines/actions.ts`; the Kanban experience at `/recruiter/pipelines/[id]` renders `PipelineBoard` with columns derived from the `STAGES` constant. Dragging a card triggers a server action (`update-stage-form.tsx`) that updates `pipelineCandidates.stage` and revalidates the board.

### 3.4 Administrator Surface

The administrator’s left-nav is generated by `components/dashboard/sidebar-nav.tsx`, where links are added only if `role === 'admin'`. Key screens:

*   **Issuer review** – `/admin/issuers` renders `AdminIssuersTable`; approve/reject buttons call `admin/issuers/actions.ts`.
*   **Credential oversight** – `/admin/credentials` lists every candidate VC, showing `proofType` and “Verify on Flare” anchors derived from `vcJson.proofTx`.
*   **User directory** – `/admin/users` hydrates a paginated table through `getAdminUsersPage()`.
*   **Platform DID & plan pricing** – `/admin/platform-did` contains `UpdateDidForm`, whose submission writes to `.env` and optionally calls `SubscriptionManager.setPlanPrice()`.

### 3.5 Cross-Cutting Guards & UI Conventions

Every dashboard page begins with an auth check from `getUser()`; mismatches call `redirect()` early, preventing role escalation. Buttons that spend FLR import `useFlareUsdPrice.ts`; when `stale === true` they disable themselves and show a red toast (“Oracle data stale – retry later”).

All proof deep-links are built from the `vcJson.proofTx` persisted at verification time, guaranteeing a single-click pathway from any UI table to the canonical transaction on Flarescan. Because the same renderer logic exists in `candidate/credentials-table.tsx`, `issuer/requests-table.tsx`, and `admin/credentials-table.tsx`, end-users, issuers and auditors share an identical verification experience.

Through these interconnected pages the repository demonstrates an unbroken chain: wallet handshake → profile data → DID mint → credential submission → on-chain verification & anchoring → recruiter consumption, all realised with strongly-typed Drizzle queries, React Server Components and Solidity contracts. No hidden APIs, no placeholders—just production-grade TypeScript and smart-contract code stitched together by clear file-system boundaries.

## 4\. Data Layer, Proof Pipelines & Backend Services

Beneath FlareCred’s sleek React façade runs a carefully tiered backend whose prime directive is _verifiability_: every byte that matters either originates on-chain or is immutably reproduced from chain events, while the surrounding Postgres database exists only to accelerate queries and cache derived metrics. This section walks through that architecture layer-by-layer—schema, migrations, server actions, helper libraries, external workers, and security middleware—so that maintainers understand exactly how a click in the dashboard ends up as a row in the activity log or a hash inside an ERC-721 token.

### 4.1 Relational Schema & Migrations

Database tables live in `lib/db/schema` and are expressed with Drizzle’s [SQL-tagged](https://orm.drizzle.team) DSL so the same TypeScript source generates `CREATE TABLE` DDL, typed row interfaces, and typed `db.select()` helpers. A recent migration—visible in `migrations/0014_lean_freak.sql` and its snapshot—introduced three new columns that feature prominently across the codebase:

```
candidate_credentials.proofType  VARCHAR(30) NOT NULL
candidate_credentials.proofData  TEXT        NOT NULL
quiz_attempts.seed               VARCHAR(66) NOT NULL DEFAULT ''
```

The first two fields capture the raw Flare Data Connector proof that justifies a credential (`EVM`, `JSON`, `PAYMENT`, or `ADDRESS`) plus its opaque payload; the third stores the hex-encoded random-seed that bounded the candidate’s quiz shuffle. By design none of these columns are nullable, forcing every server action to supply a value and thereby eliminating "pending nulls” that could break the issuer approval flow later.

At bootstrap `lib/db/setup.ts` reads `drizzle.config.ts`, runs any outstanding SQL files inside a transactional block, then persists a _snapshot JSON_ for deterministic CI runs. Local developers therefore execute pnpm drizzle:migrate once and enjoy instant parity with the staging database.

### 4.2 Server Action → Query Pattern

All mutations travel through the `validatedActionWithUser()` wrapper (see `app/(auth)/actions.ts`). The chain looks like this:

client form submission
  ↳ zod schema validates → rejects 400 on error
      ↳ getUser() guarantees JWT + role
          ↳ Drizzle insert/update inside try/catch
              ↳ Toast / redirect

Because every action file imports its corresponding table types from `schema/*.ts`, TypeScript throws a compile-time error if the schema and query drift—e.g. forgetting to include `proofType` in an `insert` after the migration. Read paths mirror the same rigour: functions such as `getCandidateCredentialsPage()` _select {…}_ exact column lists so that AutoComplete reveals `proofData` and `seed` wherever available.

### 4.3 Proof Verification Pipeline

The flagship backend innovation is the asymmetric verification loop that turns an off-chain JSON blob into an on-chain assertion the recruiter can trust:

1.  **Candidate Submits →** `add-credential-form.tsx` captures `proofType` + `proofData`, then posts to `candidate/credentials/actions.tsx`.
2.  **Issuer Reviews →** the server action inside `issuer/credentials/actions.ts` hydrates that credential, calls `lib/flare.verifyFdcProof()`, _awaits the result_ from the on-chain `FlareCredVerifier` delegate (`verifyEVM`|`verifyJson`|…)
3.  **Mint & Record →** upon success the action hashes the VC, invokes `CredentialNFT.mintCredential()`, persists `{tokenId, txHash, proofTx}` back into the JSON, and finally updates `candidate_credentials.status → VERIFIED`.
4.  **UI Deep-link →** tables such as `components/dashboard/issuer/requests-table.tsx` render "Verify on Flare” anchors that point at `https://flarescan.com/tx/{proofTx}`.

Failure anywhere in the chain—verifier returns `false` or reverts—bubbles a precise revert reason up to the client toast so the issuer understands why a signature or JSON schema was malformed. Because verification happens _before_ the NFT is minted, the system guarantees that no credential can enter a VERIFIED state without a chain-confirmed proof.

### 4.4 External Data – GitHub Metrics Worker

The `workers/githubMetrics.ts` script demonstrates how FlareCred wraps web2 data in an `IJsonApi.Proof` on demand. Executed via CI or by hitting `api/tools/github-metrics?repo=owner/repo`, it:

1.  Fetches `stargazers_count`, `forks_count`, `pushed_at` through the Octokit REST v3 client.
2.  Packages that payload plus an ISO timestamp (helper `utils/time.ts::formatIso()`) into the canonical JSON-API proof schema.
3.  Uploads the JSON to IPFS via `ipfs-http-client` and returns a CID that the candidate form stores inside `proofData`.

When an issuer later clicks "Sign Open-Source Contribution” the previously described proof verification path kicks in, calling `FlareCredVerifier.verifyJson()` which in turn uses Flare’s on-chain JSON-API verifier implementation. This flow is the platform’s entry in the Hackathon “Best External Data Source Connected to Flare” track and is fully reproducible because the worker is deterministic given a GitHub token and repository slug.

### 4.5 Random Number Seed Service

Provable randomness backs every AI Skill-Check. The `api/rng-seed/route.ts` endpoint receives a `max` query param, calls `lib/flare.randomMod(max)` (read-only contract invocation), and returns `{ seed: '0x…' }`. Client code in `start-quiz-form.tsx` stores that seed in a hidden input, runs a Fisher–Yates shuffle, and finally inserts it into `quizAttempts.seed`. Recruiter views show the seed so any auditor can recompute the question order with a single script, meeting Flare’s “verifiable RNG” promise.

### 4.6 Live Price Feed Hook (FTSO)

`lib/hooks/useFlareUsdPrice.ts` polls `FtsoHelper.flrUsdPriceWei()` every sixty seconds via `ethers.js provider.call`. It returns `{ usd, stale, loading }`; `stale` flips true if the on-chain timestamp is older than 3 600 s. Components importing the hook (`pricing/submit-button.tsx`, `settings/team/settings.tsx`, `auth/wallet-onboard-modal.tsx`) disable all FLR payment buttons under staleness and surface a red toast. This guard prevents undersold subscriptions and wins Hackathon points for "ensuring oracle freshness.”

### 4.7 Security Middleware & Route Fences

Edge-runtime `middleware.ts` intercepts every navigation under `/dashboard` and checks the JWT-derived user role. Special routes (e.g. `/api/tools/github-metrics`) are whitelisted only for candidates via `lib/auth/middleware.ts`; other roles receive 403 instantly. For server actions that modify team members (`settings/team/actions.ts`) or pipelines (`recruiter/pipelines/actions.ts`), additional Drizzle joins confirm the current user’s ownership before any insert/update executes, stopping privilege escalation at the database level as well.

### 4.8 Utility Libraries & Extension Points

Reusable helpers—address checksums (`utils/address.ts`), human-readable time (`utils/time.ts`), avatar generation (`utils/avatar.ts`)—sit beneath `lib/utils/`. None make network calls, keeping them pure and testable. Email notifications are currently stubbed in `lib/utils`; comments inside the files explain how to wire Postmark or SendGrid without touching the contract layer, preserving the deterministic nature of on-chain proofs.

Collectively these services ensure that a candidate’s action is **provably anchored** → back-tested on-chain → surfaced to UI tables with zero hidden joins. The result is a transparent, tamper-evident backend that new contributors can reason about by following file paths rather than tribal knowledge.

## 5\. Deployment & Operational Playbook

**This final section provides a step-by-step blueprint for turning a fresh clone of FlareCred into a production-grade SaaS running on Coston 2 (or main-net) — using nothing more exotic than `pnpm`, Docker Compose and the Hardhat CLI already present in `devDependencies`. Everything listed below maps directly to files inside `./docker-compose.yml`, `blockchain/scripts/*.ts`, `.env.example`, `blockchain/.env.example` and the build scripts in `package.json`; no imaginary tooling is introduced.**

### 5.1 Local Environment ▶ Quick-Start

1. Duplicate the environment templates so secrets are never committed:

```
cp .env.example .env
cp blockchain/.env.example blockchain/.env
```

The root `.env` feeds Next.js, Drizzle and Wagmi while `blockchain/.env` governs Hardhat and Etherscan verification. Populate the RPC keys (e.g. `COSTON2_RPC_URL`) and set deterministic burner addresses if you do not yet own real accounts.

2. pnpm i fetches both workspace dependencies and Hardhat peer deps; Husky pre-commit hooks (configured in `package.json`) run `pnpm lint --fix` on staged files so the first commit always respects `eslint.config.js`.

3. Spin up Postgres with Docker: docker-compose up -d database. The service maps `5432:5432` and prefixes data with the project slug so multiple check-outs never collide.

4. Run your migrations with pnpm drizzle:migrate. The helper script executes `lib/db/setup.ts`, applies SQL files under `lib/db/migrations`, and then seeds lookup tables with `lib/db/seed/index.ts` (skill quizzes, default plans, demo users).

### 5.2 Smart-Contract ▶ Compile & Deploy

Contracts compile against Solidity 0.8.25. A one-shot build:

```
pnpm hardhat compile
```

or incremental watch mode:

```
pnpm hardhat compile --watch
```

Deployment order is codified in dedicated scripts that print follow-up commands on success:

*   `pnpm hardhat run blockchain/scripts/deployDIDRegistry.ts --network coston2`
*   `pnpm hardhat run blockchain/scripts/deployCredentialNFT.ts --network coston2`
*   `pnpm hardhat run blockchain/scripts/deploySubscriptionManager.ts --network coston2`
*   `pnpm hardhat run blockchain/scripts/deployFlareCredVerifier.ts --network coston2`

If `FLARESCAN_API_KEY` / `ETHERSCAN_API_KEY` are present, each script also verifies the byte-code on Routescan, saving manual clicks. Post-deploy addresses must be copied into `.env` (`NEXT_PUBLIC_*` prefixes) so `lib/flare.ts` can assert them during application boot.

### 5.3 Running Next 14 in Development

pnpm dev boots Next 14 at `http://localhost:3000`. During start-up the app prints a contract checksum table; any `assertAddress()` mismatch fails fast—a safeguard wired in `lib/flare.ts`. Live reload is instantaneous for `.tsx` and `.ts` edits, but Solidity recompiles trigger a single hard reload because ABIs are cached by Hardhat. Hot-module constraints for React Server Components are documented inside `components/ui/README.md` and boil down to “no global state, no side-effects”.

### 5.4 Background Worker ▶ GitHub Metrics

The sole long-running process is the external-data worker that wraps GitHub repo metrics in a JSON-API proof. Run it ad-hoc or schedule via cron:

```
pnpm run worker:github -- octocat/Hello-World
```

Under the hood `workers/githubMetrics.ts` pulls commit counts with `@octokit/rest`, constructs an FDC proof, uploads to IPFS (Pinata credentials live in `GITHUB_TOKEN`, `IPFS_PINATA_KEY`, `IPFS_PINATA_SECRET`), then echoes the CID which the candidate UI consumes. No data is persisted directly; everything flows through the standard “candidate submits credential” path so state integrity stays centralised.