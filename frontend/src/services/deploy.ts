import { Address } from '@btc-vision/transaction';
import { OP20_WASM_PATH } from '../config/constants';
import { getProvider } from './provider';
import { getFactoryContract, getFactoryAddressHex } from './factory';
import { FACTORY_ADDRESS, opnetTestnet } from '../config/constants';

export type DeployStep = 'idle' | 'deploying_wasm' | 'waiting_confirmation' | 'registering' | 'success' | 'error';

export interface DeployState {
    step: DeployStep;
    message: string;
    txId?: string;
    tokenAddress?: string;
    tokenPubKey?: string;
    error?: string;
    pollAttempts?: number;
    canSkip?: boolean;
}

export interface TokenParams {
    name: string;
    symbol: string;
    totalSupply: bigint;
    decimals: number;
}

/** Mutable signal object — set skip=true from the UI to skip the confirmation wait */
export interface DeploySignal {
    skipWaiting: boolean;
}

/**
 * Two-step token deploy:
 * 1. Deploy OP_20 WASM via wallet
 * 2. Wait for on-chain confirmation (or user skip)
 * 3. Register in VibeTokenFactory
 *
 * MLDSA key linking is handled transparently by OP_WALLET —
 * the wallet derives the same MLDSA keypair from its seed and
 * manages the one-time on-chain binding automatically.
 */
export async function deployToken(
    params: TokenParams,
    onProgress: (state: DeployState) => void,
    signal?: DeploySignal,
): Promise<void> {
    const wallet = window.opnet;
    if (!wallet) throw new Error('OP_WALLET not connected');

    const provider = getProvider();
    const accounts = await wallet.getAccounts();
    const walletAddress = accounts[0];

    // ──────────────────────────────────────────────────────────────
    // Step 1: Deploy OP_20 WASM
    // ──────────────────────────────────────────────────────────────
    onProgress({ step: 'deploying_wasm', message: 'Deploying token contract...' });

    const wasmResponse = await fetch(OP20_WASM_PATH);
    const wasmBytes = new Uint8Array(await wasmResponse.arrayBuffer());

    const utxos = await provider.utxoManager.getUTXOs({ address: walletAddress });
    if (utxos.length === 0) {
        throw new Error('No UTXOs available. Please fund your wallet with testnet BTC.');
    }

    const challenge = await provider.getChallenge();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deployResult = await wallet.web3.deployContract({
        from: walletAddress,
        utxos,
        bytecode: Buffer.from(wasmBytes) as any,
        feeRate: 2,
        priorityFee: 0n,
        gasSatFee: 10_000n,
        challenge,
    } as any);

    const tokenBech32 = deployResult.contractAddress;
    const tokenPubKey = deployResult.contractPubKey;
    console.log('[deploy] Contract deployed:', tokenBech32, 'pubKey:', tokenPubKey);

    // ──────────────────────────────────────────────────────────────
    // Step 2: Wait for on-chain confirmation
    //
    // OP_20 detection via RPC is unreliable; skip button appears
    // after 30s. Factory registration will fail if the contract
    // isn't confirmed yet.
    // ──────────────────────────────────────────────────────────────
    const MAX_POLL_ATTEMPTS = 30; // 30 × 10s = 5 minutes
    const POLL_INTERVAL = 10_000; // 10 seconds
    const SKIP_AVAILABLE_AFTER = 3; // Show skip button after 3 polls (30s)

    let tokenResolved = false;

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        if (signal?.skipWaiting) {
            tokenResolved = true;
            break;
        }

        const canSkip = i >= SKIP_AVAILABLE_AFTER;

        onProgress({
            step: 'waiting_confirmation',
            message: i === 0
                ? `Token deployed at ${tokenBech32}. Waiting for on-chain confirmation...`
                : `Waiting for confirmation... (attempt ${i + 1}/${MAX_POLL_ATTEMPTS})`,
            tokenAddress: tokenBech32,
            tokenPubKey,
            pollAttempts: i + 1,
            canSkip,
        });

        await sleep(POLL_INTERVAL);

        if (signal?.skipWaiting) {
            tokenResolved = true;
            break;
        }

        // Try to detect token contract
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const code = await (provider as any).getCode(tokenBech32);
            if (code && code.bytecode) {
                tokenResolved = true;
                console.log('[deploy] Token contract detected via getCode');
                break;
            }
        } catch {
            // Not found yet
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const callResult = await (provider as any).call(
                tokenBech32,
                Buffer.from([0, 0, 0, 0]),
            );
            if (callResult && !callResult.error?.includes?.('Invalid contract')) {
                tokenResolved = true;
                console.log('[deploy] Token contract detected via call');
                break;
            }
        } catch {
            // Not available yet
        }
    }

    if (!tokenResolved) {
        onProgress({
            step: 'waiting_confirmation',
            message: 'Token detection timed out, proceeding to registration...',
            tokenAddress: tokenBech32,
            tokenPubKey,
            canSkip: false,
        });
    }

    // ──────────────────────────────────────────────────────────────
    // Step 3: Register token in factory
    // ──────────────────────────────────────────────────────────────
    onProgress({
        step: 'registering',
        message: 'Registering token in factory...',
        tokenAddress: tokenBech32,
        tokenPubKey,
    });

    // Construct token Address from deploy result's pubKey
    const tokenAddress = Address.fromString(
        tokenPubKey.startsWith('0x') ? tokenPubKey : '0x' + tokenPubKey,
    );
    const factory = await getFactoryContract();

    // Simulate the factory call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simulation = await (factory as any).deployToken(
        params.name,
        params.symbol,
        params.totalSupply,
        params.decimals,
        tokenAddress,
    );

    if (simulation.revert) {
        throw new Error(`Factory registration reverted: ${simulation.revert}`);
    }

    // Fresh UTXOs and challenge for step 3
    const registerUtxos = await provider.utxoManager.getUTXOs({ address: walletAddress });
    const registerChallenge = await provider.getChallenge();
    const factoryHex = getFactoryAddressHex();

    console.log('[deploy] Step 3: registering token in factory');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerResult = await wallet.web3.signAndBroadcastInteraction({
        from: walletAddress,
        to: FACTORY_ADDRESS,
        contract: factoryHex,
        utxos: registerUtxos,
        calldata: simulation.calldata,
        challenge: registerChallenge,
        feeRate: 2,
        priorityFee: 0n,
        gasSatFee: 10_000n,
        network: opnetTestnet,
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const broadcastResult = registerResult[1] as any;
    const txId = broadcastResult?.result ?? '';

    onProgress({
        step: 'success',
        message: 'Token successfully deployed and registered!',
        tokenAddress: tokenBech32,
        tokenPubKey,
        txId: String(txId),
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
