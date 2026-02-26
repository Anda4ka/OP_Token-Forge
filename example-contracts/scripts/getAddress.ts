import { Wallet, MLDSASecurityLevel } from '@btc-vision/transaction';
import { networks } from '@btc-vision/bitcoin';

const PRIVATE_KEY_WIF = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY_WIF) throw new Error('Set PRIVATE_KEY env variable (testnet WIF)');

const t = Wallet.generate(networks.testnet, MLDSASecurityLevel.LEVEL2);
const w = Wallet.fromWif(PRIVATE_KEY_WIF, t.toQuantumBase58(), networks.testnet, MLDSASecurityLevel.LEVEL2);

console.log("Стандартный Bitcoin testnet адрес (для фоссета):");
console.log(w.p2tr);
