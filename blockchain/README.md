# FlareCred Blockchain Package

Everything inside `/blockchain` is an _isolated_ Hardhat project that compiles, tests and deploys the Solidity layer powering the FlareCred app. This document explains the **folder layout**, required **environment variables**, and—most importantly—the exact commands you execute in order, with an explanation of what each step does.

---

## 📂 Folder structure

| Path                                                  | Description                                                                                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `contracts/`                                          | All on-chain logic: `DIDRegistry`, `CredentialNFT`, `SubscriptionManager`, oracle/RNG helpers and the `FlareCredVerifier` FDC delegate. |
| `scripts/`                                            | One Hardhat script per deployable component. Each script is _idempotent_ and prints the deployed address.                               |
| `.env.example`                                        | Template containing every variable referenced by scripts & Hardhat config. Copy to `.env` and fill real values.                         |
| `hardhat.config.ts`                                   | Hardhat & explorer configuration; picks up RPC endpoints and API keys from `.env`.                                                      |
| `tsconfig.json`, `eslint.config.mjs`, `.solhint.json` | Developer-experience helpers—strict TypeScript, ESLint + Prettier, Solidity linting.                                                    |
| `package.json`                                        | Hardhat, TypeChain, OpenZeppelin, Flare periphery libraries and common tooling.                                                         |

## 🛠 Prerequisites

```
pnpm install                 # install dependencies
cp .env.example .env         # create your local env file
```

Inside `.env`, supply _at minimum_:

```
# accounts / pricing
ADMIN_ADDRESS=<0xAdminWallet>
PLATFORM_ADDRESS=<0xPlatformWallet>
PRIVATE_KEY="<private-key-matching-ADMIN_ADDRESS>"
SUBSCRIPTION_PRICE_WEI_BASE=5000000000000000000   # 5 FLR
SUBSCRIPTION_PRICE_WEI_PLUS=10000000000000000000  # 10 FLR

# RPC & explorer keys
FLARE_RPC_API_KEY=<free portal key>
FLARESCAN_API_KEY=<routescan key>
```

## 🔨 Compile, test, type-gen

```
pnpm hardhat compile     # Solidity → bytecode / ABI
pnpm hardhat test        # mocha / chai unit tests
pnpm typechain           # generate TypeScript typings (optional)
```

## 📝 One-off helper: generate a burner wallet

```
node -e "const {Wallet}=require('ethers');const w=Wallet.createRandom();console.log(w.address,w.privateKey)"
```

Only the **private key** goes in `.env`; never commit it.

## 🚀 Deployment flow

All commands assume you pass the `--network <hardhat-network-alias>` flag (e.g. `coston2`, `flare`, `localhost`).

| #   | Contract / script       | Purpose                                                                                                                                                   | Command                                                                   |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | **FtsoHelper**          | Wraps `getFeedByIdInWei` so the UI can pull FLR↔USD price in one call.                                                                                   | `pnpm hardhat run scripts/deployFtsoHelper.ts --network coston2`          |
| 2   | **RngHelper**           | Thin helper around Flare RNG so the React quiz fetches a bounded random seed.                                                                             | `pnpm hardhat run scripts/deployRngHelper.ts --network coston2`           |
| 3   | **FlareCredVerifier**   | Immutable delegate that forwards FDC proof checks to the canonical verification contract in `ContractRegistry`.                                           | `pnpm hardhat run scripts/deployFlareCredVerifier.ts --network coston2`   |
| 4   | **DIDRegistry**         | Each team & issuer mints a deterministic `did:flare:0x…`.                                                                                                 | `pnpm hardhat run scripts/deployDIDRegistry.ts --network coston2`         |
| 5   | **CredentialNFT**       | ERC-721 anchoring of hashed Verifiable Credentials. The script also grants `ISSUER_ROLE` to `ISSUER_ADDRESSES` and `PLATFORM_ROLE` to `PLATFORM_ADDRESS`. | `pnpm hardhat run scripts/deployCredentialNFT.ts --network coston2`       |
| 6   | **SubscriptionManager** | On-chain billing (30-day periods). Takes FLR prices from `$SUBSCRIPTION_PRICE_WEI_BASE`/`PLUS` and grants `ADMIN_ROLE` to `PLATFORM_ADDRESS`.             | `pnpm hardhat run scripts/deploySubscriptionManager.ts --network coston2` |

### Automatic explorer verification

Every deploy script attempts `hardhat verify`. Provide the appropriate API keys (`FLARESCAN_API_KEY` / Routescan, or Etherscan on other EVM networks) and the contracts appear with verified source.

## 🔑 Post-deploy summary

| Purpose                     | Env var to copy                            | Where to paste |
| --------------------------- | ------------------------------------------ | -------------- |
| DID Registry address        | `NEXT_PUBLIC_DID_REGISTRY_ADDRESS`         | `../.env`      |
| Credential NFT address      | `NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS`       | `../.env`      |
| SubscriptionManager address | `NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS` | `../.env`      |
| FtsoHelper address          | `NEXT_PUBLIC_FTSO_HELPER_ADDRESS`          | `../.env`      |
| RngHelper address           | `NEXT_PUBLIC_RNG_HELPER_ADDRESS`           | `../.env`      |
| FlareCredVerifier address   | `NEXT_PUBLIC_FDC_VERIFIER_ADDRESS`         | `../.env`      |

Commit those addresses so the Next .js front-end and server utilities talk to the live contracts.

## 🏗 Local development

```
# spin up an isolated Hardhat node with Flare opcodes
pnpm hardhat node --hostname 0.0.0.0 --port 8545

# in another shell, deploy everything against that node
NETWORK=localhost pnpm tsx scripts/deployFtsoHelper.ts   # …repeat for every script
```

Because each script is independent, you can iterate on a single contract, re-compile, and re-run just its script without touching the rest.

## 🧪 Testing tips

- **Unit tests** live in `test/` and run on a fork of Flare by default (the fork URL is pulled from `.env`).
- Run coverage with `pnpm hardhat coverage`.
- Lint Solidity with `pnpm solhint "**/*.sol"`.

## ❓ FAQ

- **Why separate FtsoHelper/RngHelper instead of calling the protocols directly?**  
  Gas economy (one SLOAD vs many) and upgrade safety—if Flare changes ABI, only the helper is redeployed.
- **What happens if I change plan prices?**  
  Call `SubscriptionManager.setPlanPrice(planKey, newWeiPrice)` from an address holding `ADMIN_ROLE`.
- **How do I add a new issuer after deployment?**  
  Execute `CredentialNFT.grantRole(ISSUER_ROLE, <issuer-wallet>)`.
- **Can I redeploy contracts and keep the same addresses?**  
  No; use Create2 or transparent upgrade proxies if you need address stability.

**Happy hacking 🚀**
