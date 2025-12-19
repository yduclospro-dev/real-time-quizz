"use client";

import { useState, useRef, useEffect, startTransition } from "react";
import { useQuizEditor } from '@/hooks/useQuizEditor';
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useApiMutation } from '@/lib/api-hooks';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import QuestionSidebar from "@/components/quiz/QuestionSidebar";
import QuestionEditor from "@/components/quiz/QuestionEditor";
import QuestionSettingsModal from "@/components/quiz/QuestionSettingsModal";
import ConfirmDeleteModal from "@/components/quiz/ConfirmDeleteModal";
import ConfirmExitModal from "@/components/quiz/ConfirmExitModal";
import { UpdateQuizDto, Quiz } from "@/types/quiz.types";
import { quizService } from "@/services/quiz.service";
import toast from "react-hot-toast";
import type { ApiError } from '@/lib/api-client';
import { useGlobalError } from '@/providers/ReactQueryProvider';
import { useFieldErrorContext } from '@/contexts/FieldErrorContext';
import { createQuizSchema } from '@/schemas/quiz.schema';
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
  const { setFieldErrorsFromApiError } = useFieldErrorContext();
  const { user } = useAuth();

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
      const validation = createQuizSchema.safeParse({ title: quizData.title, questions: quizData.questions });
      if (!validation.success) {
        // Map zod issues to ApiError-style details so the UI can show field errors
        const details = validation.error.issues.map((iss) => ({ field: iss.path.join('.'), message: iss.message }));
        const apiErr: ApiError = { code: 'VALIDATION_ERROR', message: 'Validation failed', details, status: 400 };
        try {
          setFieldErrorsFromApiError(apiErr);
        } catch {}
        try {
          showError(apiErr, { force: true });
        } catch {}
        return;
      }

      console.log('Quiz data to be sent for update:', quizData, 'for quiz ID:', quizID);
      await updateMutation.mutateAsync({ id: quizID, data: quizData });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du quiz");
      console.error("Failed to save quiz:", error);
    }
  };

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
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold max-w-md"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExit}>
              Quitter
            </Button>
            {user?.role === Role.TEACHER && (
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    const resp = await quizService.startSession(quizID);
                    console.log('Started session with response:', resp.sessionId);
                    toast.success('Session démarrée');
                    router.push(`/quiz/${quizID}/session?sessionId=${resp.sessionId}`);
                  } catch (e) {
                    console.error('Failed to start session', e);
                    toast.error('Impossible de démarrer la session');
                  }
                }}
              >
                Démarrer la session
              </Button>
            )}
            <Button onClick={handleSaveQuiz}>
              Enregistrer
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
            {isQueryError ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <div className="text-red-600 text-lg">Erreur lors du chargement du quiz</div>
                  <div className="text-sm text-gray-600 mt-2">{queryError?.message ?? 'Une erreur s\u2019est produite'}</div>
                  {queryError?.status === 401 && (
                    <div className="mt-4">
                      <a href="/login" className="text-blue-600 underline">Se connecter</a>
                    </div>
                  )}
                </div>
              </div>
            ) : questions.length === 0 && isQueryLoading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-700">Chargement du quiz...</div>
              </div>
            ) : (
              <QuestionEditor
                question={questions[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                onUpdate={(updated) => handleUpdateQuestion(currentQuestionIndex, updated)}
                onDelete={() => handleDeleteQuestion(currentQuestionIndex)}
                canDelete={questions.length > 1}
              />
            )}
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
