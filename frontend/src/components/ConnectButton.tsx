import { useWallet } from '../hooks/useWallet';

export function ConnectButton() {
    const { address, isConnected, isConnecting, walletAvailable, error, connect, disconnect } = useWallet();

    if (!walletAvailable) {
        return (
            <a
                href="https://opnet.org"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-surface-lighter text-sm text-gray-400 hover:text-white transition-colors"
            >
                Install OP_WALLET
            </a>
        );
    }

    if (isConnected && address) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-sm text-accent-light font-mono">
                    {address.slice(0, 10)}...{address.slice(-6)}
                </span>
                <button
                    onClick={disconnect}
                    className="px-3 py-1.5 rounded-lg bg-surface-lighter text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={connect}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && <span className="text-xs text-error">{error}</span>}
        </div>
    );
}
