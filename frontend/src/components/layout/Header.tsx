"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  title?: string;
  showUser?: boolean;
  userName?: string;
  children?: React.ReactNode;
}

export function Header({ title, showUser = true, userName = "Prénom Nom", children }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="bg-white border-b-2 border-gray-200 shadow-lg">
      <div className="px-8 py-6 flex items-center justify-between">
        {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
        {children}
        {showUser && (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{userName}</span>
            <Button variant="outline" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
