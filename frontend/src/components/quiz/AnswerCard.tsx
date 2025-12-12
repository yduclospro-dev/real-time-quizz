"use client";

import { X } from "lucide-react";
import { useFieldError } from '@/hooks/useFieldError';
import { QuizAnswer } from "@/types/quiz.types";

interface AnswerCardProps {
  answer: QuizAnswer;
  index: number;
  questionIndex?: number;
  questionType: "single" | "multiple";
  questionId: string;
  canDelete: boolean;
  onTextChange: (text: string) => void;
  onToggleCorrect: () => void;
  onDelete: () => void;
}

const ANSWER_COLORS = {
  red: "bg-red-500 hover:bg-red-600",
  blue: "bg-blue-500 hover:bg-blue-600",
  yellow: "bg-yellow-500 hover:bg-yellow-600",
  green: "bg-green-500 hover:bg-green-600",
  purple: "bg-purple-500 hover:bg-purple-600",
  orange: "bg-orange-500 hover:bg-orange-600",
};

export default function AnswerCard({
  answer,
  index,
  questionIndex,
  questionType,
  questionId,
  canDelete,
  onTextChange,
  onToggleCorrect,
  onDelete,
}: AnswerCardProps) {
  const getAnswerLabel = (index: number) => {
    return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
  };

  return (
    <div className="relative">
      <div
        className={`${ANSWER_COLORS[answer.color]} rounded-lg p-4 text-white transition-all ${
          answer.isCorrect ? "ring-4 ring-yellow-400" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl font-bold flex-shrink-0">
            {getAnswerLabel(index)}
          </div>
          <div className="flex-1">
            <input
              name={questionIndex !== undefined ? `questions.${questionIndex}.answers.${index}.text` : undefined}
              type="text"
              value={answer.text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={`Réponse ${index + 1}${index >= 2 ? " (optionnelle)" : ""}`}
              className="w-full bg-transparent border-none text-white placeholder-white/70 focus:outline-none"
            />
            {/* field error (white text since card background is colored) */}
            {questionIndex !== undefined && (
              <p className="mt-1 text-xs text-white">{useFieldError(`questions.${questionIndex}.answers.${index}.text`)}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <input
              type={questionType === "single" ? "radio" : "checkbox"}
              name={questionType === "single" ? `correct-answer-${questionId}` : undefined}
              checked={answer.isCorrect}
              onChange={onToggleCorrect}
              className="w-5 h-5 cursor-pointer"
            />
            {canDelete && (
              <button
                onClick={onDelete}
                className="text-white/70 hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
