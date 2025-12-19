"use client";

import { useState } from "react";
import { useQuizEditor } from '@/hooks/useQuizEditor';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/lib/api-hooks';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import QuestionSidebar from "@/components/quiz/QuestionSidebar";
import QuestionEditor from "@/components/quiz/QuestionEditor";
import QuestionSettingsModal from "@/components/quiz/QuestionSettingsModal";
import ConfirmDeleteModal from "@/components/quiz/ConfirmDeleteModal";
import ConfirmExitModal from "@/components/quiz/ConfirmExitModal";
import { CreateQuizDto } from "@/types/quiz.types";
import { quizService } from "@/services/quiz.service";
import toast from "react-hot-toast";

export default function QuizCreatePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  

  const editor = useQuizEditor();
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    isModalOpen,
    setIsModalOpen,
    editingQuestionIndex,
    handleAddQuestion,
    handleEditQuestionSettings,
    handleConfirmQuestionSettings,
    handleDeleteQuestion,
    confirmDeleteQuestion,
    handleExit,
    confirmExit,
    handleUpdateQuestion,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    shouldScrollToBottom,
    setShouldScrollToBottom,
    draggedIndex,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    questionToDelete,
    isExitModalOpen,
    setIsExitModalOpen,
  } = editor;

  // Handlers provided by the editor hook are used directly

  const queryClient = useQueryClient();

  const createMutation = useApiMutation<
    Parameters<typeof quizService.createQuiz>[0],
    Awaited<ReturnType<typeof quizService.createQuiz>>
  >(quizService.createQuiz, {
    onSuccess: () => {
      // invalidate quiz list cache
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz créé avec succès !');
      router.push('/quiz');
    },
  });

  const handleSaveQuiz = async () => {
    const quizData: CreateQuizDto = {
      title,
      questions: questions.map((q) => ({
        question: q.question,
        imageUrl: (q as unknown as { imageUrl?: string }).imageUrl,
        type: q.type,
        answers: q.answers,
        timeLimit: q.timeLimit,
      })),
    };

    await createMutation.mutateAsync(quizData);
  };
  
  return (
    <div className="min-h-screen">
      <div className="bg-white border-b-2 border-gray-200 shadow-lg">
        <div className="px-8 py-4 max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <Input
              label=""
              type="text"
              placeholder="Titre du quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold max-w-md"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExit}>
              Quitter
            </Button>
            <Button onClick={handleSaveQuiz}>
              Créer
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
              onScrollComplete={() => setShouldScrollToBottom(false)}
              onQuestionSelect={setCurrentQuestionIndex}
              onQuestionEdit={handleEditQuestionSettings}
              onAddQuestion={handleAddQuestion}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          </div>

          <div className="col-span-9">
            <QuestionEditor
              question={questions[currentQuestionIndex]}
              questionNumber={currentQuestionIndex + 1}
              onUpdate={(updated) => handleUpdateQuestion(currentQuestionIndex, updated)}
              onDelete={() => handleDeleteQuestion(currentQuestionIndex)}
              canDelete={questions.length > 1}
            />
          </div>
        </div>

        <QuestionSettingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmQuestionSettings}
            initialType={editingQuestionIndex !== null ? questions[editingQuestionIndex].type : undefined}
          initialTimeLimit={editingQuestionIndex !== null ? questions[editingQuestionIndex].timeLimit : 30}
        />

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteQuestion}
          questionNumber={questionToDelete !== null ? questionToDelete + 1 : 0}
        />

        <ConfirmExitModal
          isOpen={isExitModalOpen}
          onClose={() => setIsExitModalOpen(false)}
          onConfirm={confirmExit}
        />
      </div>
    </div>
  );
}
