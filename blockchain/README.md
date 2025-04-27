Generating an address locally

```bash
node -e "const {Wallet}=require('ethers');const w=Wallet.createRandom();console.log(w.address,w.privateKey)"
```

Keep the private key secret; only PRIVATE_KEY in .env needs it.


# DID registry
```bash
pnpm hardhat run scripts/deployDIDRegistry.ts --network coston2
```

# Credential NFT + initial role grants
```bash
pnpm hardhat run scripts/deployCredentialNFT.ts --network coston2
```

# Deploys SubscriptionManager, verifies it, and grants ADMIN_ROLE to the platform wallet.
```bash
pnpm hardhat run scripts/deploySubscriptionManager.ts --network coston2
```
