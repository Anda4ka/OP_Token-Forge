import { useFactory } from '../hooks/useFactory';
import { TokenCard } from './TokenCard';

export function TokenList() {
    const { tokens, tokenCount, loading, error, refresh } = useFactory();

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading tokens from factory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-error mb-3">{error}</p>
                <button
                    onClick={refresh}
                    className="px-4 py-2 rounded-lg bg-surface-lighter text-sm text-gray-300 hover:text-white transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No tokens deployed yet</p>
                <p className="text-gray-600 text-sm">Be the first to create a token!</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-gray-400 text-sm">
                    {tokenCount} token{tokenCount !== 1 ? 's' : ''} deployed
                </p>
                <button
                    onClick={refresh}
                    className="px-3 py-1.5 rounded-lg bg-surface-lighter text-xs text-gray-400 hover:text-white transition-colors"
                >
                    Refresh
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tokens.map((address, i) => (
                    <TokenCard key={address + i} address={address} index={i} />
                ))}
            </div>
        </div>
    );
}
