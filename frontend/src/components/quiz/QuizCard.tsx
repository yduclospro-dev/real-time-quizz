import Link from "next/link";
import { Pencil, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { QuizListItem } from "@/types/quiz.types";

interface QuizCardProps {
  quiz: QuizListItem;
  onDelete: (id: string) => void;
  onStartSession: (id: string) => void;
}

export function QuizCard({ quiz, onDelete, onStartSession }: QuizCardProps) {
  const formattedDate = new Date(quiz.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 shadow-lg p-6 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {quiz.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{quiz.questionCount} question{quiz.questionCount > 1 ? "s" : ""}</span>
          <span>•</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => onStartSession(quiz.id)}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Démarrer
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.href = `/quiz/${quiz.id}`}
          className="flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Modifier
        </Button>
        <Button
          variant="outline"
          onClick={() => onDelete(quiz.id)}
          className="!p-2"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}
