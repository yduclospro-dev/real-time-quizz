"use client";

import { useRef, useEffect } from "react";
import { QuizQuestion } from "@/types/quiz.types";
import QuestionCard from "./QuestionCard";

interface QuestionSidebarProps {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  draggedIndex: number | null;
  shouldScrollToBottom?: boolean;
  onScrollComplete?: () => void;
  onQuestionSelect: (index: number) => void;
  onQuestionEdit: (index: number) => void;
  onAddQuestion: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export default function QuestionSidebar({
  questions,
  currentQuestionIndex,
  draggedIndex,
  shouldScrollToBottom,
  onScrollComplete,
  onQuestionSelect,
  onQuestionEdit,
  onAddQuestion,
  onDragStart,
  onDragOver,
  onDragEnd,
}: QuestionSidebarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldScrollToBottom && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      onScrollComplete?.();
    }
  }, [shouldScrollToBottom, questions.length]);
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col max-h-[calc(100vh-12rem)]">
      <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
      <div ref={scrollContainerRef} className="space-y-2 overflow-y-auto flex-1 mb-4">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            isActive={currentQuestionIndex === index}
            isDragged={draggedIndex === index}
            onClick={() => onQuestionSelect(index)}
            onEdit={() => onQuestionEdit(index)}
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
      <button
        onClick={onAddQuestion}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
      >
        + Ajouter une question
      </button>
    </div>
  );
}
