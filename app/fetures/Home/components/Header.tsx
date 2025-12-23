import { TrendingUp } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
    return (
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto max-w-7xl flex items-center justify-between h-14 px-2 sm:px-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-bcv to-paralelo">
                        <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base">
                        Monitor Cambiario VE
                    </span>
                </div>
                <ThemeToggle />
            </div>
        </header>
    );
}
