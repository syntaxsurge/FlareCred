## 1. Platform Architecture Overview

A quick-scan map of **where code lives** and **how a request moves** through the stack.

| Layer | Responsibility | Key Paths |
|-------|---------------|-----------|
| **Presentation** | React Server-/Client-Components driven by the Next .js 14 **App Router** | `app/` |
| **UI Atoms** | shadcn/ui primitives & feature-specific boards/tables/dialogs | `components/` |
| **Domain Logic** | Auth, Drizzle queries, typed on-chain helpers, React hooks | `lib/` |
| **Smart Contracts** | Solidity libraries & Hardhat scripts | `blockchain/` |

<details>
<summary>📡 Request lifecycle (click)</summary>

1. **File-system routing** → App Router  
2. **Server Action** (Zod-validated)  
3. **Drizzle query** and/or **ethers.js** on-chain call  
4. Render via **shadcn/ui** component (role-guarded, tailwind-styled)

</details>

### Authentication & Role Guards
* Static marketing shell (`components/landing/*`) served to all visitors.
* **Wallet Onboard Modal** posts the wallet address to `/api/auth/wallet-onboard` → issues JWT.
* Edge **middleware.ts** inspects the JWT on every navigation to enforce route-level guards.

### Dashboard Segments
* Users land on a role-scoped root: `/candidate`, `/issuer`, `/recruiter`, `/admin`.
* Each namespace imports **only** its own hooks/components – coupling is obvious.
* Sidebar navigation is driven by a React `RoleContext` and double‑checked server‑side with early `redirect()`.

### Key Flows
* **Deterministic DID** — `CreateDidButton` → `DIDRegistry.createDID()` (Coston 2) → store `did:flare:…` in Postgres and reference it as `credentialSubject.id`.
* **Billing** — `useFlareUsdPrice` polls `FtsoHelper.flrUsdPriceWei()` every 60 s; buttons disable if data is > 1 h old. Calling `paySubscription(team, planKey)` on `SubscriptionManager` adds **30 days** to `paidUntil`.
* **Helper Libraries** — `FtsoHelper` (oracle), `RngHelper` (randomness), `FlareCredVerifier` (FDC). All exposed once via `lib/flare.ts`.

### Type‑Safety Pipeline
Drizzle‑generated types mean a DB migration (e.g. adding `proofType`) **fails compilation** wherever the old shape is referenced—preventing silent runtime drift.

### Design System
Visual coherence comes from central shadcn/ui variants (`components/ui/**`). Dark‑mode is toggled by `components/theme-provider.tsx`, keeping Tailwind’s `dark:` utilities in sync with `localStorage.theme` *and* the OS preference.


## 2. Smart Contracts & On-Chain Integrations

### ✨ One-screen overview

| Layer | Solidity artefact | Purpose | Key security notes |
| --- | --- | --- | --- |
| **Identity** | `DIDRegistry.sol` | Mint deterministic `did:flare:0x…` per wallet & update doc pointer | No funds, non-payable ⇒ re-entrancy-proof |
| **Credentials** | `CredentialNFT.sol` | Hash + anchor every Verifiable Credential in an ERC-721 | Role-gated `mintCredential`, immutable admin |
| **Billing** | `SubscriptionManager.sol` | 30-day SaaS plans paid in FLR | Single payable fn, no outward calls |
| **Proofs** | `FlareCredVerifier.sol` | Stateless proxy to FDC verifier | View-only, hot-swappable via env var |
| **Oracle helper** | `lib/FtsoHelper.sol` | Read FLR/USD feed (wei precision) | Pure _view_ lib |
| **RNG helper** | `lib/RngHelper.sol` | Provable random `uint256` for quizzes | Pure _view_ lib |

- - -

### 🔗 Core flow (identity → attestation → payment)

1.  **Create DID**  
    `wagmi.writeContract → DIDRegistry.createDID(docHash)`  
    ⇒ emits `DIDCreated`
2.  **Issue credential**
    
    issuer/credentials/actions.ts
    ├ verifyFdcProof(proofType, proofData)   // on-chain
    ├ vcHash = keccak256(vcJson)
    └ credentialNftSigner.mintCredential(to, vcHash, '')
    
3.  **Pay subscription**  
    `SubscriptionManager.paySubscription(team, planKey, { value: priceWei })`  
    _priceWei_ comes from `FtsoHelper.flrUsdPriceWei()`; UI blocks if oracle data > 1 h old.

🎛 ABI access in `lib/flare.ts`

*   Centralised address assertions (`assertAddress`)
*   Shared read-only `ethers.Contract` instances for server & client
*   Helper wrappers: `createFlareDID()` ・ `issueFlareCredential()` ・ `readFlrUsdPriceWei()` ・ `randomMod()`

- - -

### 🛡 Security at a glance

*   **Checks-Effects-Interactions** everywhere
*   No `delegatecall`; upgrades = redeploy + env-var swap
*   Global overflow checks (Solidity 0.8.25)
*   `.solhint.json` bans inline assembly & wildcard re-entrancy
*   Only one `payable` function—and it never sends FLR out

- - -

### 🚀 One-command deployment

```
pnpm hardhat run blockchain/scripts/deployDIDRegistry.ts
pnpm hardhat run blockchain/scripts/deployCredentialNFT.ts
pnpm hardhat run blockchain/scripts/deploySubscriptionManager.ts
pnpm hardhat run blockchain/scripts/deployFlareCredVerifier.ts
```

Scripts auto-verify on Routescan and seed roles from `.env`.

> **Bottom line** — Three orthogonal contracts (plus two helpers and one delegate) cover _identity → credentials → billing_ in ≈700 LoC that a first-time auditor can read before lunch.


## 3. Application Flows by Role & UI Pages

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

## 4. Data Layer, Proof Pipelines & Backend Services

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

## 5. Deployment & Operational Playbook

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