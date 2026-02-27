# OP_Token Forge

One-click OP_20 token factory on native Bitcoin L1 via OPNet.

Deploy your own memecoins, DeFi tokens, or utility tokens directly on Bitcoin — no bridges, no L2s.

## How It Works

1. **Connect** your OP_WALLET browser extension
2. **Fill in** token parameters (name, symbol, supply, decimals)
3. **Deploy** — the dApp handles the two-step process:
   - Deploys the OP_20 WASM contract on-chain
   - Waits for on-chain confirmation
   - Registers the token in the VibeTokenFactory registry
4. **Done** — your token is live on Bitcoin L1

## Tech Stack

- **Smart Contract**: AssemblyScript (VibeTokenFactory) compiled to WASM, deployed on OPNet testnet
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS
- **Wallet**: OP_WALLET browser extension
- **Libraries**: `opnet`, `@btc-vision/transaction`, `@btc-vision/bitcoin`

## Deployed Contract

| Network | Address |
|---------|---------|
| OPNet Testnet | `opt1sqznrflg7krnelcuvvl8zmq66cg36yqqcgufmpuxz` |

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
/
├── src/factory/           # VibeTokenFactory smart contract (AssemblyScript)
├── abis/                  # Contract ABIs
├── frontend/              # React dApp
│   ├── src/
│   │   ├── components/    # UI components (DeployForm, DeployProgress, TokenList...)
│   │   ├── services/      # deploy.ts, factory.ts, provider.ts, wallet.ts
│   │   ├── contexts/      # WalletContext (OP_WALLET integration)
│   │   ├── pages/         # HomePage, DeployPage, ExplorePage
│   │   └── config/        # Constants, network config
│   └── public/
│       └── op20-token.wasm  # Pre-built OP_20 token binary
├── example-contracts/     # CLI deploy/register scripts
├── Dockerfile             # Railway deployment
└── railway.json           # Railway config
```

## MLDSA Key Management

OP_WALLET handles MLDSA (quantum-resistant) key linking automatically — it derives the same keypair from your wallet seed and manages the one-time on-chain binding transparently.

**Important**: Do not mix CLI-generated MLDSA keys (`.quantum_key` files) with OP_WALLET for the same address. The wallet derives its own MLDSA keypair from the seed, and if a different key was previously linked to your address via CLI scripts, subsequent wallet transactions will fail with "Can not reassign existing MLDSA public key." Use a fresh address if switching between CLI and wallet workflows.

## License

MIT
