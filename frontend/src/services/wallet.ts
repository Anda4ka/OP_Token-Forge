export function getOPWallet() {
    return window.opnet ?? null;
}

export async function connectWallet(): Promise<{ address: string; publicKey: string }> {
    const wallet = getOPWallet();
    if (!wallet) {
        throw new Error('OP_WALLET not installed. Please install the OP_WALLET browser extension.');
    }

    // requestAccounts() serves as both connect and account request in UniSat-compatible wallets
    const accounts = await wallet.requestAccounts();
    if (accounts.length === 0) {
        throw new Error('No accounts returned from wallet.');
    }

    const publicKey = await wallet.getPublicKey();
    return { address: accounts[0], publicKey };
}

export async function disconnectWallet(): Promise<void> {
    const wallet = getOPWallet();
    if (wallet && typeof wallet.disconnect === 'function') {
        await wallet.disconnect();
    }
}

export function waitForOPWallet(timeout = 3000): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.opnet) return resolve(true);
        const interval = setInterval(() => {
            if (window.opnet) {
                clearInterval(interval);
                resolve(true);
            }
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            resolve(false);
        }, timeout);
    });
}
