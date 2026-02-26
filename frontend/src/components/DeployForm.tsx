import { useState, type FormEvent } from 'react';
import { useWallet } from '../hooks/useWallet';
import type { TokenParams } from '../services/deploy';

interface DeployFormProps {
    onSubmit: (params: TokenParams) => void;
    disabled?: boolean;
}

export function DeployForm({ onSubmit, disabled }: DeployFormProps) {
    const { isConnected } = useWallet();
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [totalSupply, setTotalSupply] = useState('21000000');
    const [decimals, setDecimals] = useState('8');
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'Token name is required';
        else if (name.length > 64) errs.name = 'Max 64 characters';

        if (!symbol.trim()) errs.symbol = 'Symbol is required';
        else if (symbol.length > 32) errs.symbol = 'Max 32 characters';

        const supply = Number(totalSupply);
        if (!totalSupply || isNaN(supply) || supply <= 0) errs.totalSupply = 'Must be greater than 0';

        const dec = Number(decimals);
        if (isNaN(dec) || dec < 0 || dec > 18) errs.decimals = 'Between 0 and 18';

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        const dec = Number(decimals);
        const rawSupply = BigInt(totalSupply) * BigInt(10 ** dec);

        onSubmit({
            name: name.trim(),
            symbol: symbol.trim().toUpperCase(),
            totalSupply: rawSupply,
            decimals: dec,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm text-gray-400 mb-1.5">Token Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Token"
                    maxLength={64}
                    className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border text-white placeholder-gray-600 focus:border-accent focus:outline-none transition-colors"
                    disabled={disabled}
                />
                {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-1.5">Symbol</label>
                <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. MTK"
                    maxLength={32}
                    className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border text-white placeholder-gray-600 focus:border-accent focus:outline-none transition-colors uppercase"
                    disabled={disabled}
                />
                {errors.symbol && <p className="text-xs text-error mt-1">{errors.symbol}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Total Supply</label>
                    <input
                        type="text"
                        value={totalSupply}
                        onChange={(e) => setTotalSupply(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="21000000"
                        className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border text-white placeholder-gray-600 focus:border-accent focus:outline-none transition-colors"
                        disabled={disabled}
                    />
                    {errors.totalSupply && <p className="text-xs text-error mt-1">{errors.totalSupply}</p>}
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Decimals</label>
                    <input
                        type="number"
                        value={decimals}
                        onChange={(e) => setDecimals(e.target.value)}
                        min={0}
                        max={18}
                        className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border text-white placeholder-gray-600 focus:border-accent focus:outline-none transition-colors"
                        disabled={disabled}
                    />
                    {errors.decimals && <p className="text-xs text-error mt-1">{errors.decimals}</p>}
                </div>
            </div>

            <button
                type="submit"
                disabled={disabled || !isConnected}
                className="w-full py-3 rounded-lg bg-accent hover:bg-accent/80 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {!isConnected ? 'Connect Wallet First' : disabled ? 'Deploying...' : 'Deploy Token'}
            </button>
        </form>
    );
}
