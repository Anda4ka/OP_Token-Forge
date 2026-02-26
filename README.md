# OP_Token Forge

One-click OP_20 token factory on native Bitcoin L1 via OPNet.

Deploy your own memecoins, DeFi tokens, or utility tokens directly on Bitcoin — no bridges, no L2s.

## How It Works

1. **Connect** your OP_WALLET browser extension
2. **Fill in** token parameters (name, symbol, supply, decimals)
3. **Deploy** — the dApp handles the two-step process:
   - Deploys the OP_20 WASM contract on-chain
   - Waits for MLDSA key confirmation
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

## Known Issue: OP_WALLET v1.8.1 Bug

The OP_WALLET browser extension (v1.8.1) has a bug where `linkMLDSAPublicKeyToAddress` is **hardcoded to `true`** in three methods inside `background.js` (`signInteractionInternal`, `deployContract`, `cancelTransaction`), completely ignoring the dApp's parameter value.

This causes the factory registration transaction (step 3) to revert with:

> "Can not reassign existing MLDSA public key to legacy or hashed key."

### Root Cause

```javascript
// In OP_WALLET v1.8.1 background.js (minified):
// signInteractionInternal:
linkMLDSAPublicKeyToAddress: true  // HARDCODED — ignores r.linkMLDSAPublicKeyToAddress

// deployContract:
linkMLDSAPublicKeyToAddress: true  // HARDCODED — ignores e.linkMLDSAPublicKeyToAddress

// cancelTransaction:
linkMLDSAPublicKeyToAddress: true  // HARDCODED — ignores e.linkMLDSAPublicKeyToAddress
```

### Fix

Replace each hardcoded `true` with the dApp's parameter (defaulting to `true` for backward compatibility):

```javascript
// signInteractionInternal:
linkMLDSAPublicKeyToAddress: r.linkMLDSAPublicKeyToAddress ?? true

// deployContract:
linkMLDSAPublicKeyToAddress: e.linkMLDSAPublicKeyToAddress ?? true

// cancelTransaction:
linkMLDSAPublicKeyToAddress: e.linkMLDSAPublicKeyToAddress ?? true
```

### Workaround

Until the official fix is released, you can patch the wallet locally:

1. Download [OP_WALLET v1.8.1](https://github.com/btc-vision/opwallet/releases/tag/v1.8.1) zip
2. Extract it
3. In `background.js`, replace the three hardcoded `linkMLDSAPublicKeyToAddress:!0` occurrences (at byte offsets ~2973865, ~2974799, ~3019961) with the parameter-respecting versions above
4. Load the patched extension as "unpacked" in `chrome://extensions/`

**Bug report**: [btc-vision/opwallet](https://github.com/btc-vision/opwallet/issues)

## License

MIT
