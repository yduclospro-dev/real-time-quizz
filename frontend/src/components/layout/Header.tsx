"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from '@/hooks/useAuth';

export function Header({ title, children, showUser = true }: { title?: string; children?: React.ReactNode; showUser?: boolean }) {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="bg-white border-b-2 border-gray-200 shadow-lg">
      <div className="px-8 py-4 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
        </div>

        <div>
          {showUser && (user ? (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                <div className="font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <Button variant="outline" onClick={() => logout()} disabled={isLoading}>
                Déconnexion
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm text-blue-600 hover:underline">Se connecter</a>
              <a href="/register" className="text-sm text-blue-600 hover:underline">S'inscrire</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
