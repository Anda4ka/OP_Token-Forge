import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from './ConnectButton';

const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/deploy', label: 'Deploy Token' },
    { to: '/explore', label: 'Explore' },
];

export function Header() {
    const location = useLocation();

    return (
        <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="text-lg font-bold text-white">
                        Vibe<span className="text-accent-light">Factory</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                    location.pathname === link.to
                                        ? 'text-white bg-surface-lighter'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <ConnectButton />
            </div>
        </header>
    );
}
