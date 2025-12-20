"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import QuestionSidebar from "@/components/quiz/QuestionSidebar";
import QuestionEditor from "@/components/quiz/QuestionEditor";
import QuestionSettingsModal from "@/components/quiz/QuestionSettingsModal";
import ConfirmDeleteModal from "@/components/quiz/ConfirmDeleteModal";
import ConfirmExitModal from "@/components/quiz/ConfirmExitModal";
import type { QuizQuestion } from "@/types/quiz.types";
import type { QuestionType } from "@shared/enums/question-type";

interface QuizEditorLayoutProps {
  // Title state
  title: string;
  onTitleChange: (title: string) => void;

  // Questions state
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  onQuestionUpdate: (index: number, updated: QuizQuestion) => void;
  onQuestionDelete: (index: number) => void;
  onQuestionAdd: () => void;
  onQuestionEdit: (index: number) => void;

  // Drag and drop
  draggedIndex: number | null;
  shouldScrollToBottom: boolean;
  onScrollComplete: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;

  // Modals
  isModalOpen: boolean;
  onModalClose: () => void;
  onModalConfirm: (type: QuestionType, timeLimit: number) => void;
  editingQuestionIndex: number | null;

  isDeleteModalOpen: boolean;
  onDeleteModalClose: () => void;
  onDeleteModalConfirm: () => void;
  questionToDelete: number | null;

  isExitModalOpen: boolean;
  onExitModalClose: () => void;
  onExitModalConfirm: () => void;

  // Actions
  onExit: () => void;
  onSave: () => void;
  saveButtonText: string;
  
  // Optional loading/error states
  isLoading?: boolean;
  error?: string | null;
  
  // Additional header actions (e.g., "Start Session" button)
  headerActions?: ReactNode;
}

export default function QuizEditorLayout({
  title,
  onTitleChange,
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionAdd,
  onQuestionEdit,
  draggedIndex,
  shouldScrollToBottom,
  onScrollComplete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isModalOpen,
  onModalClose,
  onModalConfirm,
  editingQuestionIndex,
  isDeleteModalOpen,
  onDeleteModalClose,
  onDeleteModalConfirm,
  questionToDelete,
  isExitModalOpen,
  onExitModalClose,
  onExitModalConfirm,
  onExit,
  onSave,
  saveButtonText,
  isLoading = false,
  error = null,
  headerActions,
}: QuizEditorLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="bg-white border-b-2 border-gray-200 shadow-lg">
        <div className="px-8 py-4 max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <Input
              label=""
              type="text"
              name="title"
              placeholder="Titre du quiz"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-2xl font-bold max-w-md"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onExit}>
              Quitter
            </Button>
            {headerActions}
            <Button onClick={onSave}>
              {saveButtonText}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <QuestionSidebar
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              draggedIndex={draggedIndex}
              shouldScrollToBottom={shouldScrollToBottom}
              onScrollComplete={onScrollComplete}
              onQuestionSelect={onQuestionSelect}
              onQuestionEdit={onQuestionEdit}
              onAddQuestion={onQuestionAdd}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            />
          </div>

          <div className="col-span-9">
            {error ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-600 text-lg">Erreur lors du chargement du quiz</div>
                  <div className="text-sm text-gray-600 mt-2">{error}</div>
                </div>
              </div>
            ) : isLoading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-700">Chargement du quiz...</div>
              </div>
            ) : (
              <QuestionEditor
                question={questions[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                onUpdate={(updated) => onQuestionUpdate(currentQuestionIndex, updated)}
                onDelete={() => onQuestionDelete(currentQuestionIndex)}
                canDelete={questions.length > 1}
              />
            )}
          </div>
        </div>

        <QuestionSettingsModal
          isOpen={isModalOpen}
          onClose={onModalClose}
          onConfirm={onModalConfirm}
          initialType={editingQuestionIndex !== null ? questions[editingQuestionIndex]?.type : undefined}
          initialTimeLimit={editingQuestionIndex !== null ? questions[editingQuestionIndex]?.timeLimit : 30}
        />

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          onConfirm={onDeleteModalConfirm}
          questionNumber={questionToDelete !== null ? questionToDelete + 1 : 0}
        />

        <ConfirmExitModal
          isOpen={isExitModalOpen}
          onClose={onExitModalClose}
          onConfirm={onExitModalConfirm}
        />
      </div>
    </div>
  );
}
