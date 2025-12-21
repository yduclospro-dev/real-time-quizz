"use client";

import { useState } from "react";
import { useQuizEditor } from '@/hooks/useQuizEditor';
import { useQuizValidation } from '@/hooks/useQuizValidation';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/lib/api-hooks';
import { useRouter } from "next/navigation";
import QuizEditorLayout from "@/components/quiz/QuizEditorLayout";
import { CreateQuizDto } from "@/types/quiz.types";
import { quizService } from "@/services/quiz.service";
import toast from "react-hot-toast";

export default function QuizCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const { validateQuiz } = useQuizValidation();

  const editor = useQuizEditor();
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    isModalOpen,
    setIsModalOpen,
    editingQuestionIndex,
    setEditingQuestionIndex,
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

  const createMutation = useApiMutation<
    Parameters<typeof quizService.createQuiz>[0],
    Awaited<ReturnType<typeof quizService.createQuiz>>
  >(quizService.createQuiz, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz créé avec succès !');
      router.push('/quiz');
    },
  });

  const handleSaveQuiz = async () => {
    try {
      const quizData: CreateQuizDto = {
        title,
        questions: questions.map((q) => ({
          question: q.question,
          image: (q as unknown as { imageUrl?: string }).imageUrl,
          type: q.type,
          answers: q.answers,
          timeLimit: q.timeLimit,
        })),
      };

      // Client-side validation with Zod
      if (!validateQuiz(quizData)) {
        return;
      }

      await createMutation.mutateAsync(quizData);
    } catch (error) {
      toast.error("Erreur lors de la création du quiz");
      console.error("Failed to create quiz:", error);
    }
  };
  
  return (
    <QuizEditorLayout
      title={title}
      onTitleChange={setTitle}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      onQuestionSelect={setCurrentQuestionIndex}
      onQuestionUpdate={handleUpdateQuestion}
      onQuestionDelete={handleDeleteQuestion}
      onQuestionAdd={handleAddQuestion}
      onQuestionEdit={handleEditQuestionSettings}
      draggedIndex={draggedIndex}
      shouldScrollToBottom={shouldScrollToBottom}
      onScrollComplete={() => setShouldScrollToBottom(false)}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      isModalOpen={isModalOpen}
      onModalClose={() => {
        setIsModalOpen(false);
        setEditingQuestionIndex(null);
      }}
      onModalConfirm={handleConfirmQuestionSettings}
      editingQuestionIndex={editingQuestionIndex}
      isDeleteModalOpen={isDeleteModalOpen}
      onDeleteModalClose={() => setIsDeleteModalOpen(false)}
      onDeleteModalConfirm={confirmDeleteQuestion}
      questionToDelete={questionToDelete}
      isExitModalOpen={isExitModalOpen}
      onExitModalClose={() => setIsExitModalOpen(false)}
      onExitModalConfirm={confirmExit}
      onExit={handleExit}
      onSave={handleSaveQuiz}
      saveButtonText="Créer"
    />
  );
}
