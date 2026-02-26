import { Link } from 'react-router-dom';
import { useFactory } from '../hooks/useFactory';

export function HomePage() {
    const { tokenCount, loading } = useFactory();

    return (
        <div>
            {/* Hero */}
            <section className="py-24 text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                    Create Your <span className="text-accent-light">Token</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
                    Deploy OP_20 tokens on Bitcoin with a few clicks.
                    No coding required. Powered by OPNet.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        to="/deploy"
                        className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/80 text-white font-semibold transition-colors"
                    >
                        Launch Token
                    </Link>
                    <Link
                        to="/explore"
                        className="px-6 py-3 rounded-lg bg-surface-lighter border border-border text-gray-300 hover:text-white transition-colors"
                    >
                        Explore Tokens
                    </Link>
                </div>
            </section>

            {/* Stats */}
            <section className="py-12 border-t border-border">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <p className="text-3xl font-bold text-white">
                            {loading ? '...' : tokenCount}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">Tokens Deployed</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">Bitcoin</p>
                        <p className="text-gray-500 text-sm mt-1">L1 Network</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-white">Testnet</p>
                        <p className="text-gray-500 text-sm mt-1">Network</p>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 border-t border-border">
                <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { step: '1', title: 'Connect Wallet', desc: 'Link your OP_WALLET browser extension' },
                        { step: '2', title: 'Configure Token', desc: 'Set name, symbol, supply and decimals' },
                        { step: '3', title: 'Deploy', desc: 'Token contract is deployed and registered on Bitcoin' },
                    ].map((item) => (
                        <div key={item.step} className="bg-surface-light border border-border rounded-xl p-6 text-center">
                            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent-light font-bold flex items-center justify-center mx-auto mb-4">
                                {item.step}
                            </div>
                            <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                            <p className="text-gray-500 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
