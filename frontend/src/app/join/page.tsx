"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Header } from "@/components/layout/Header";
import toast from "react-hot-toast";

export default function JoinSessionPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error("Veuillez entrer un code de session");
      return;
    }

    try {
      setIsLoading(true);
      // TODO BACKEND: POST /api/sessions/join
      // Body: { sessionCode: string }
      // Response: { sessionId: string, quizId: string }
      // Then redirect to /quiz/:quizId/session
      // For now, mock: just redirect to session page
      router.push(`/quiz/${code}/session`);
    } catch (error) {
      toast.error("Code de session invalide");
      console.error("Failed to join session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <Header title="Rejoindre une session" />

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
    </div>
  );
}
