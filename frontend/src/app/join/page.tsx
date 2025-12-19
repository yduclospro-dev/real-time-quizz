"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { sessionService } from "@/services/session.service";
import { useAuth } from '@/hooks/useAuth';

export default function JoinSessionPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error("Veuillez entrer un code de session");
      return;
    }

    try {
      if (!user) {
        toast.error('Vous devez vous connecter pour rejoindre une session');
        router.push('/login');
        return;
      }
      setIsLoading(true);
      const res = await sessionService.join(code);
      router.push(`/quiz/${res.quizId}/session?sessionId=${res.sessionId}`);
    } catch (error) {
      console.error("Failed to join session:", error);
      toast.error("Code de session invalide");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Rejoindre un quiz
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Entrez le code de session fourni par votre enseignant
          </p>

          <div className="space-y-6">
            <Input
              label="Code de session"
              type="text"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-2xl font-bold tracking-wider"
              maxLength={6}
            />

            <Button
              variant="primary"
              onClick={handleJoin}
              disabled={isLoading || !code.trim()}
              className="w-full"
            >
              {isLoading ? "Connexion..." : "Rejoindre"}
            </Button>
          </div>
        </div>
      </div>
  );
}
