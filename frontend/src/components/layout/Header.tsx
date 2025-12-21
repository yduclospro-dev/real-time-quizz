"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/Button";
import { useAuth } from '@/hooks/useAuth';

export function Header({ title, showUser = true, onQuit, hideLogout = false }: { title?: string; children?: React.ReactNode; showUser?: boolean; onQuit?: () => void; hideLogout?: boolean }) {
  const { user, logout, isLoading } = useAuth();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onQuit) {
      e.preventDefault();
      onQuit();
    }
  };

  return (
    <div className="bg-white border-b-2 border-gray-200 shadow-lg">
      <div className="px-8 py-4 max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-blue-600 text-white font-bold text-xl px-3 py-2 rounded-lg">
              Q
            </div>
            <span className="text-xl font-bold text-gray-900">Quiz Real-Time</span>
          </Link>
          {title && <span className="text-gray-300">|</span>}
          {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
        </div>

        <div>
          {showUser && (user ? (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <div className="font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              {onQuit && (
                <Button variant="outline" onClick={onQuit} className="ml-2">
                  Quitter
                </Button>
              )}
              {!hideLogout && (
                <Button variant="outline" onClick={() => logout()} disabled={isLoading}>
                  Déconnexion
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm text-blue-600 hover:underline">Se connecter</a>
              <a href="/register" className="text-sm text-blue-600 hover:underline">S&apos;inscrire</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
