"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuizCard } from "@/components/quiz/QuizCard";
import { ConfirmDeleteQuizModal } from "@/components/quiz/ConfirmDeleteQuizModal";
import { quizService } from "@/services/quiz.service";
import type { QuizListItem } from "@/types/quiz.types";
import toast from "react-hot-toast";

export default function QuizListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<QuizListItem | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuizzes(quizzes);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredQuizzes(
        quizzes.filter(
          (quiz) =>
            quiz.title.toLowerCase().includes(query) ||
            quiz.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, quizzes]);

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      const data = await quizService.getQuizzes();
      setQuizzes(data);
      setFilteredQuizzes(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des quiz");
      console.error("Failed to load quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    const quiz = quizzes.find((q) => q.id === id);
    if (quiz) {
      setQuizToDelete(quiz);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!quizToDelete) return;

    try {
      await quizService.deleteQuiz(quizToDelete.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizToDelete.id));
      toast.success("Quiz supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression du quiz");
      console.error("Failed to delete quiz:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setQuizToDelete(null);
    }
  };

  const handleStartSession = async (id: string) => {
    try {
      const { sessionId } = await quizService.startSession(id);
      router.push(`/quiz/${id}/session/${sessionId}`);
      console.log("Session started for quiz ID:", id);
      toast.success("Session démarrée !");
    } catch (error) {
      toast.error("Erreur lors du démarrage de la session");
      console.error("Failed to start session:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Content */}
      <div className="px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un quiz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
                variant="primary"
                onClick={() => router.push("/quiz/create")}
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Créer un quiz
              </Button>
          </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : (
          <>
            {filteredQuizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 mb-6">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                  {searchQuery ? "Aucun quiz trouvé" : "Aucun quiz créé"}
                </h2>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Essayez avec d'autres mots-clés"
                    : "Commencez par créer votre premier quiz"}
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {filteredQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onDelete={handleDelete}
                    onStartSession={handleStartSession}
                  />
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteQuizModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setQuizToDelete(null);
        }}
        onConfirm={confirmDelete}
        quizTitle={quizToDelete?.title || ""}
      />
    </div>
  );
}
