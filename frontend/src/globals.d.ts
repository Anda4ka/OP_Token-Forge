export {};

interface OPWalletWeb3 {
    signInteraction(params: unknown): Promise<unknown>;
    signAndBroadcastInteraction(params: unknown): Promise<[unknown, unknown, unknown[], string]>;
    deployContract(params: unknown): Promise<{ contractAddress: string; contractPubKey: string; utxos: unknown[] }>;
    cancelTransaction(params: unknown): Promise<unknown>;
    customTransaction(params: unknown): Promise<unknown>;
    broadcast(transactions: unknown[]): Promise<unknown[]>;
    signSchnorr(message: string): Promise<string>;
    getMLDSAPublicKey(): Promise<string>;
    signMLDSAMessage(message: string): Promise<unknown>;
    verifyMLDSASignature(message: string, signature: unknown): Promise<boolean>;
}

interface OPWallet {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    requestAccounts(): Promise<string[]>;
    getAccounts(): Promise<string[]>;
    getNetwork(): Promise<string>;
    getPublicKey(): Promise<string>;
    getBalance(): Promise<{ confirmed: number; unconfirmed: number; total: number }>;
    signMessage(message: string, type?: string): Promise<string>;
    signPsbt(psbtHex: string, options?: unknown): Promise<string>;
    pushTx(options: { rawtx: string }): Promise<string>;
    on(event: 'accountsChanged' | 'chainChanged' | 'disconnect', listener: (...args: unknown[]) => void): void;
    removeListener(event: string, listener: (...args: unknown[]) => void): void;
    web3: OPWalletWeb3;
}

declare global {
    interface Window {
        opnet?: OPWallet;
    }
}
