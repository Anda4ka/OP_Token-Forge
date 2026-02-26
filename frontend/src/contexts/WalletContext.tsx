import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { connectWallet, disconnectWallet, waitForOPWallet } from '../services/wallet';

interface WalletState {
    address: string | null;
    publicKey: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    walletAvailable: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

export const WalletContext = createContext<WalletState>({
    address: null,
    publicKey: null,
    isConnected: false,
    isConnecting: false,
    walletAvailable: false,
    error: null,
    connect: async () => {},
    disconnect: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [walletAvailable, setWalletAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        waitForOPWallet().then(setWalletAvailable);
    }, []);

    useEffect(() => {
        const wallet = window.opnet;
        if (!wallet) return;

        const onAccountsChanged = (accounts: unknown) => {
            const accs = accounts as string[];
            if (accs.length === 0) {
                setAddress(null);
                setPublicKey(null);
            } else {
                setAddress(accs[0]);
            }
        };

        const onDisconnect = () => {
            setAddress(null);
            setPublicKey(null);
        };

        if (typeof wallet.on === 'function') {
            wallet.on('accountsChanged', onAccountsChanged);
            wallet.on('disconnect', onDisconnect);
        }

        return () => {
            if (typeof wallet.removeListener === 'function') {
                wallet.removeListener('accountsChanged', onAccountsChanged);
                wallet.removeListener('disconnect', onDisconnect);
            }
        };
    }, [walletAvailable]);

    const connect = useCallback(async () => {
        setError(null);
        setIsConnecting(true);
        try {
            const result = await connectWallet();
            setAddress(result.address);
            setPublicKey(result.publicKey);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        await disconnectWallet();
        setAddress(null);
        setPublicKey(null);
        setError(null);
    }, []);

    return (
        <WalletContext.Provider
            value={{
                address,
                publicKey,
                isConnected: !!address,
                isConnecting,
                walletAvailable,
                error,
                connect,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}
