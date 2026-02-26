import { TokenList } from '../components/TokenList';

export function ExplorePage() {
    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-3xl font-bold mb-2">Explore Tokens</h1>
            <p className="text-gray-400 mb-8">
                Browse all tokens deployed through VibeToken Factory.
            </p>
            <TokenList />
        </div>
    );
}
