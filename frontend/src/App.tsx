import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { DeployPage } from './pages/DeployPage';
import { ExplorePage } from './pages/ExplorePage';

export default function App() {
    return (
        <WalletProvider>
            <BrowserRouter>
                <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1 max-w-6xl mx-auto w-full px-4">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/deploy" element={<DeployPage />} />
                            <Route path="/explore" element={<ExplorePage />} />
                        </Routes>
                    </main>
                    <footer className="border-t border-border py-6 text-center text-gray-600 text-sm">
                        VibeToken Factory &middot; Powered by OPNet &middot; Bitcoin L1
                    </footer>
                </div>
            </BrowserRouter>
        </WalletProvider>
    );
}
