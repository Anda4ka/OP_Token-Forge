import { useCallback, useEffect, useState } from 'react';
import { getDeploymentCount, getDeployedTokens } from '../services/factory';

export function useFactory() {
    const [tokenCount, setTokenCount] = useState<number>(0);
    const [tokens, setTokens] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [count, tokenList] = await Promise.all([
                getDeploymentCount(),
                getDeployedTokens(),
            ]);
            setTokenCount(count);
            setTokens(tokenList);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { tokenCount, tokens, loading, error, refresh };
}
