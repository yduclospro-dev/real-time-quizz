"use client";

import { useState, useRef, useEffect, startTransition } from "react";
import { useQuizEditor } from '@/hooks/useQuizEditor';
import { useQuizValidation } from '@/hooks/useQuizValidation';
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/lib/api-hooks';
import { Button } from "@/components/ui/Button";
import QuizEditorLayout from "@/components/quiz/QuizEditorLayout";
import { UpdateQuizDto, Quiz } from "@/types/quiz.types";
import { quizService } from "@/services/quiz.service";
import toast from "react-hot-toast";
import type { ApiError } from '@/lib/api-client';
import { useGlobalError } from '@/providers/ReactQueryProvider';
import { useAuth } from '@/hooks/useAuth';
import { Role } from "@shared/enums/role";

export default function QuizEditorPage() {
  const params = useParams();
  const quizID = params.quizID as string;

  const [title, setTitle] = useState("");
  
  // Per-question timeLimit is stored on each question; editor hook will manage state

  // Editor must be initialized before fetching so we can set questions on success
  const editor = useQuizEditor();
  const {
    questions,
    setQuestions,
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

  // Load quiz data if in edit mode
  const queryClient = useQueryClient();
  const { showError } = useGlobalError();

  const initRef = useRef(false);
  const queryResult = useQuery<Quiz | undefined, ApiError>({
    queryKey: ['quiz', quizID],
    queryFn: () => quizService.getQuizById(quizID),
    retry: false,
    enabled: !!quizID,
  });

  const { data: quizData, isLoading: isQueryLoading, isError: isQueryError, error: queryError } = queryResult;

  useEffect(() => {
    if (!initRef.current && quizData) {
      console.log('Loaded quiz data (effect):', quizData);
      startTransition(() => {
        setTitle(quizData.title ?? '');
        setQuestions(quizData.questions ?? []);
        setCurrentQuestionIndex(0);
        initRef.current = true;
      });
    }
  }, [quizData, setQuestions, setCurrentQuestionIndex]);

  useEffect(() => {
    if (queryError) {
      console.error('Failed to load quiz (effect)', queryError);
      try {
        // Use centralized error display which maps backend codes to user-friendly messages
        if ((queryError as ApiError)?.code) {
            // Use centralized error handler; force true ensures toasts show even for validation details
            showError(queryError as ApiError, { force: true });
        } else if ((queryError as unknown as Error)?.message) {
          toast.error((queryError as unknown as Error).message);
        } else {
          toast.error('Erreur lors du chargement du quiz');
        }
      } catch {}
    }
  }, [queryError, showError]);

  const router = useRouter();
  const { user } = useAuth();
  const { validateQuiz } = useQuizValidation();

  useEffect(() => {
    if (isQueryError) {
      try {
        const status = (queryError as ApiError | undefined)?.status;
        if (status === 401) {
          router.push('/login');
        }
      } catch {
        // ignore
      }
    }
  }, [isQueryError, queryError, router]);

  

  const updateMutation = useApiMutation<
    { id: string; data: UpdateQuizDto },
    Awaited<ReturnType<typeof quizService.updateQuiz>>
  >(({ id, data }) => quizService.updateQuiz(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz', quizID] });
      toast.success('Quiz mis à jour avec succès !');
      router.push('/quiz');
    },
  }, { suppressToastOnFieldErrors: false });

  // Editor hook provides all handlers and state

  const handleSaveQuiz = async () => {
    try {
      console.log('Saving quiz with title:', title, 'and questions:', questions);
      const quizData: UpdateQuizDto = {
        title,
        questions: questions.map(q => ({
          question: q.question,
          imageUrl: (q as unknown as { imageUrl?: string }).imageUrl,
          type: q.type,
          answers: q.answers,
          timeLimit: q.timeLimit,
        })),
      };

      // Client-side validation with Zod
      if (!validateQuiz(quizData)) {
        return;
      }

      console.log('Quiz data to be sent for update:', quizData, 'for quiz ID:', quizID);
      await updateMutation.mutateAsync({ id: quizID, data: quizData });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du quiz");
      console.error("Failed to save quiz:", error);
    }
  };

  const startSessionButton = user?.role === Role.TEACHER ? (
    <Button
      variant="secondary"
      onClick={async () => {
        try {
          const resp = await quizService.startSession(quizID);
          console.log('Started session with response:', resp.sessionId);
          toast.success('Session démarrée');
          router.push(`/quiz/${quizID}/session/${resp.sessionId}`);
        } catch (e) {
          console.error('Failed to start session', e);
          toast.error('Impossible de démarrer la session');
        }
      }}
    >
      Démarrer la session
    </Button>
  ) : null;

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
      saveButtonText="Enregistrer"
      isLoading={isQueryLoading && questions.length === 0}
      error={isQueryError ? (queryError?.message ?? "Une erreur s'est produite") : null}
      headerActions={startSessionButton}
    />
  );
}
