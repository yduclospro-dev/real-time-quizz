"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import QuestionSidebar from "@/components/quiz/QuestionSidebar";
import QuestionEditor from "@/components/quiz/QuestionEditor";
import QuestionSettingsModal from "@/components/quiz/QuestionSettingsModal";
import ConfirmDeleteModal from "@/components/quiz/ConfirmDeleteModal";
import ConfirmExitModal from "@/components/quiz/ConfirmExitModal";
import { QuizQuestion } from "@/types/quiz.types";
import { quizService } from "@/services/quiz.service";
import toast from "react-hot-toast";

export default function QuizEditorPage() {
  const router = useRouter();
  const params = useParams();
  const quizID = params.quizID as string;
  const isCreateMode = quizID === "create";

  const [isLoading, setIsLoading] = useState(!isCreateMode);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: "1",
      question: "",
      type: "single",
      timeLimit: 30,
      answers: [
        { id: "1", text: "", isCorrect: false, color: "red" },
        { id: "2", text: "", isCorrect: false, color: "blue" },
        { id: "3", text: "", isCorrect: false, color: "yellow" },
        { id: "4", text: "", isCorrect: false, color: "green" },
      ],
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // Load quiz data if in edit mode
  useEffect(() => {
    if (!isCreateMode) {
      loadQuiz();
    }
  }, [quizID, isCreateMode]);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      const quiz = await quizService.getQuizById(quizID);
      setTitle(quiz.title);
      setDescription(quiz.description || "");
      setTimePerQuestion(quiz.timePerQuestion);
      setQuestions(quiz.questions);
    } catch (error) {
      toast.error("Erreur lors du chargement du quiz");
      console.error("Failed to load quiz:", error);
      router.push("/quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestionIndex(null);
    setIsModalOpen(true);
  };

  const handleEditQuestionSettings = (index: number) => {
    setEditingQuestionIndex(index);
    setIsModalOpen(true);
  };

  const handleConfirmQuestionSettings = (type: "single" | "multiple", timeLimit: number) => {
    if (editingQuestionIndex !== null) {
      // Edit existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = {
        ...updatedQuestions[editingQuestionIndex],
        type,
        timeLimit,
      };
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      const newQuestion: QuizQuestion = {
        id: Date.now().toString(),
        question: "",
        type,
        timeLimit,
        answers: [
          { id: Date.now().toString(), text: "", isCorrect: false, color: "red" },
          { id: (Date.now() + 1).toString(), text: "", isCorrect: false, color: "blue" },
          { id: (Date.now() + 2).toString(), text: "", isCorrect: false, color: "yellow" },
          { id: (Date.now() + 3).toString(), text: "", isCorrect: false, color: "green" },
        ],
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestionIndex(questions.length);
      setShouldScrollToBottom(true);
    }
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestionToDelete(index);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete === null) return;
    const newQuestions = questions.filter((_, i) => i !== questionToDelete);
    setQuestions(newQuestions);
    if (currentQuestionIndex >= newQuestions.length) {
      setCurrentQuestionIndex(newQuestions.length - 1);
    }
    setQuestionToDelete(null);
  };

  const handleExit = () => {
    setIsExitModalOpen(true);
  };

  const confirmExit = () => {
    router.push("/quiz");
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: QuizQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedQuestion);

    setQuestions(newQuestions);
    
    // Update current question index to follow the moved question
    if (currentQuestionIndex === draggedIndex) {
      setCurrentQuestionIndex(index);
    } else if (draggedIndex < currentQuestionIndex && index >= currentQuestionIndex) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (draggedIndex > currentQuestionIndex && index <= currentQuestionIndex) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveQuiz = async () => {
    try {
      const quizData = {
        title,
        description,
        timePerQuestion,
        questions: questions.map(q => ({
          question: q.question,
          imageUrl: q.imageUrl,
          type: q.type,
          answers: q.answers,
          timeLimit: q.timeLimit,
        })),
      };

      if (isCreateMode) {
        await quizService.createQuiz(quizData);
        toast.success("Quiz créé avec succès !");
      } else {
        await quizService.updateQuiz(quizID, quizData);
        toast.success("Quiz mis à jour avec succès !");
      }
      router.push("/quiz");
    } catch (error) {
      toast.error(`Erreur lors de ${isCreateMode ? "la création" : "la mise à jour"} du quiz`);
      console.error("Failed to save quiz:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700">Chargement...</div>
      </div>
    );
  }

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
              {isCreateMode ? "Créer" : "Enregistrer"}
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
          initialType={editingQuestionIndex !== null ? questions[editingQuestionIndex].type : "single"}
          initialTimeLimit={editingQuestionIndex !== null ? questions[editingQuestionIndex].timeLimit : timePerQuestion}
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
