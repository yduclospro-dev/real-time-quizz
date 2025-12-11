"use client";

import { Pencil, Clock } from "lucide-react";
import { QuizQuestion } from "@/types/quiz.types";

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  isActive: boolean;
  isDragged: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export default function QuestionCard({
  question,
  index,
  isActive,
  isDragged,
  onClick,
  onEdit,
  onDragStart,
  onDragOver,
  onDragEnd,
}: QuestionCardProps) {
  return (
    <div
      className="relative group"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div
        onClick={onClick}
        className={`w-full text-left p-3 rounded-lg transition-all cursor-move ${
          isActive
            ? "bg-blue-100 border-2 border-blue-500"
            : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
        } ${isDragged ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-2">
            <div className="font-medium text-sm flex items-center gap-2">
              <span>Question {index + 1}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {question.timeLimit}s
              </span>
            </div>
            <div className="text-xs text-gray-500 truncate">
              {question.question || "Nouvelle question"}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
          >
            <Pencil className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
