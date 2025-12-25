"use client";

import { TrendingUp } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../Auth/context/AuthProvider';

export function Header() {
    const { user, logout } = useAuth();

    async function handleLogout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch {}
      logout();
    }

    return (
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto max-w-7xl flex items-center justify-between h-14 px-2 sm:px-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-linear-to-br from-bcv to-paralelo">
                        <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-sm sm:text-base">
                        Monitor Cambiario VE
                    </span>
                </div>
                <div className="flex items-center gap-2">
                  {user && (
                    <div className="flex rounded-lg border border-border bg-muted/50 p-1">
                      <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-background text-foreground shadow-sm"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                  <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
