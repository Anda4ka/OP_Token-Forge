interface TokenCardProps {
    address: string;
    index: number;
}

export function TokenCard({ address, index }: TokenCardProps) {
    const short = address.length > 20
        ? `${address.slice(0, 12)}...${address.slice(-8)}`
        : address;

    return (
        <div className="card-glow bg-surface-light border border-border rounded-xl p-4 transition-all hover:border-accent/50">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">#{index + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-light">OP_20</span>
            </div>
            <p className="font-mono text-sm text-gray-300 break-all">{short}</p>
            <a
                href={`https://opscan.org/addresses/${address}?network=op_testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-light hover:underline mt-2 inline-block"
            >
                View on Explorer
            </a>
        </div>
    );
}
