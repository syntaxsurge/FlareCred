# FlareCred – AI-Assisted Talent Verification on Flare

FlareCred is an AI-powered talent-verification SaaS built on Flare that lets candidates, issuers, recruiters and admins meet in a single Next.js 14 dashboard to mint deterministic Flare DIDs, anchor Verifiable Credentials as ERC-721 NFTs, and settle Base or Plus subscriptions in FLR with live USD pricing from the FTSO oracle.

Credentials flow UNVERIFIED → PENDING → VERIFIED through an issuer approval pipeline that replays EVM, JSON-API or payment proofs via the on-chain FlareCred Verifier (FDC), while candidates can trigger RNG-seeded Skill-Check quizzes whose passing hashes are minted straight to CredentialNFT and deep-linked to Flarescan for instant proof.

Recruiters explore full-text talent search, skill sliders and Kanban pipelines fed by real-time credential status, and administrators oversee issuers, users, plan prices and the platform DID—so every action, from team invite to payment, emits an on-chain or logged event that gives users cryptographic trust without exposing them to blockchain complexity.

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


## 3. Application Flows by Role & UI Pages

FlareCred revolves around four personas—Candidate, Recruiter, Hiring Manager and Administrator. The table below shows _where_ each persona begins and the primary UI surfaces they touch. Expand a row for a step-by-step walk-through with file references.

| Persona | Entry Point (Route) | Core UI Files | Key Actions |
| --- | --- | --- | --- |
| **Candidate** | `/` | `cta-section.tsx`  <br>`candidate/onboarding.tsx` | Connect Wallet, Verify Credentials |
| **Recruiter** | `/recruiter` | `recruiter/dashboard.tsx`  <br>`recruiter/job-post.tsx` | Post Job, Review Applicants |
| **Hiring Manager** | `/manager` | `manager/pipeline.tsx`  <br>`manager/interview.tsx` | Interview, Issue Offers |
| **Administrator** | `/admin` | `admin/overview.tsx`  <br>`admin/settings.tsx` | Manage Tenants, System Health |

**3.1 Candidate Flow**

1.  **Entry / Wallet Session** — User lands on `cta-section.tsx`, selects _“I’m a Candidate”_, and connects a self-custody wallet.
2.  **Onboarding** — `candidate/onboarding.tsx` requests an VP of education and work credentials via `did-connect.ts`.
3.  **Credential Check** — Smart-contract `CredentialRegistry.sol` is queried. Invalid VPs trigger `<AlertDialog />`.
4.  **Profile Mint** — Upon pass, `profile-mint.ts` mints an ERC-721 _Talent NFT_ to the candidate’s wallet.
5.  **Redirect** — Successful flow pushes `/candidate/dashboard`.

**3.2 Recruiter Flow**

1.  **Dashboard** — `recruiter/dashboard.tsx` lists open requisitions via GraphQL `QUERY_JOBS`.
2.  **Create Job** — `job-post.tsx` posts metadata to IPFS and stores the CID in `JobBoard.sol`.
3.  **Review Pipeline** — `applicant-table.tsx` renders candidates fetched through `useApplicants()`.
4.  **Advance Stage** — Each row exposes _Advance_/_Reject_ actions that update `Pipeline.sol`.

**3.3 Hiring Manager Flow**

1.  **Pipeline View** — `manager/pipeline.tsx` subscribes to `PipelineUpdated` events via ethers v6.
2.  **Interview** — `interview.tsx` integrates Jitsi SDK for live calls and stores feedback in DynamoDB.
3.  **Offer** — `offer-modal.tsx` signs an off-chain offer letter and pushes it to the candidate through XMTP.

**3.4 Administrator Flow**

1.  **Overview** — `admin/overview.tsx` aggregates system metrics from Prometheus.
2.  **Tenant Management** — `tenants.tsx` lets admins add or suspend organization DIDs.
3.  **Configuration** — `settings.tsx` toggles feature flags persisted in FeatureFlag Service.


## 4. Data Layer, Proof Pipelines & Backend Services

FlareCred’s backend is _verifiability-first_: every critical byte is either fetched directly from a Flare contract or deterministically reproduced from an on-chain event. PostgreSQL is purely a cache for queries and derived metrics. The diagram below shows how a dashboard click turns into a DB row & an ERC-721 hash:

| Step | Artefact | Purpose |
| --- | --- | --- |
| 1 Schema | `lib/db/schema/*` | Drizzle DSL → typed rows, auto-migrations |
| 2 Server Action | `validatedActionWithUser()` | Zod + JWT guard → Drizzle insert/update |
| 3 On-chain Call | `lib/flare.*()` | Read/write via ethers → Solidity helper libs |
| 4 Worker / Hook | `workers/* \| useFlareUsdPrice` | External data or oracle polling |
| 5 UI | `components/dashboard/**` | Tables & toasts render the final state |

**4.1 Relational Schema & Migrations**

*   Columns (`proofType`, `proofData`, `seed`) are **NOT NULL** to eliminate “pending nulls”.
*   `lib/db/setup.ts` runs outstanding SQL inside a transaction and snapshots the schema for deterministic CI.

**4.2 Server Action → Query Pattern**

client form
  └─✅ zod.validate()
      └─✅ getUser() → role/JWT
          └─✅ Drizzle query
              └─📬 toast | redirect
    

Explicit `select({…})` lists keep TypeScript in lock-step with the schema so drift won’t compile.

**4.3 Proof Verification Pipeline**

1.  **Submit** – candidate posts `proofType + proofData`
2.  **Review** – issuer calls `flare.verifyFdcProof()` → `FlareCredVerifier.verify*`
3.  **Mint** – VC hashed, `CredentialNFT.mintCredential()`
4.  **Deep-link** – UI shows [Verify on Flare](https://flarescan.com)

Verification happens _before_ minting: a credential cannot be VERIFIED unless its proof passes on-chain.

**4.4 GitHub Metrics Worker (Bonus Track)**

*   `workers/githubMetrics.ts` → Octokit → JSON-API proof → IPFS CID.
*   Endpoint: `/api/tools/github-metrics?repo=<owner/repo>`
*   Issuer approves via `verifyJson()`; credential gets “Open-Source Contribution” badge.

**4.5 Random Number Seed Service (RNG)**

*   `/api/rng-seed?max=n` → `RngHelper.randomMod()`
*   Seed stored in `quizAttempts.seed`; auditors can replay shuffle.

**4.6 Live Price Feed Hook (FTSO)**

`useFlareUsdPrice` polls `FtsoHelper.flrUsdPriceWei()` every 60 s.  
Buttons disable & toast if data > 1 h old.

**4.7 Security Middleware & Route Fences**

*   Edge `middleware.ts` blocks unauthorised roles at URL level.
*   Server actions double-check ownership via Drizzle joins.

**4.8 Utility Libraries & Extension Points**

*   Pure helpers in `lib/utils/**` (checksum, time, avatars).
*   Email stubs document how to plug Postmark/SendGrid without touching contracts.
*   

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
