"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import QuestionSidebar from "@/components/quiz/QuestionSidebar";
import QuestionEditor from "@/components/quiz/QuestionEditor";
import QuestionSettingsModal from "@/components/quiz/QuestionSettingsModal";
import ConfirmDeleteModal from "@/components/quiz/ConfirmDeleteModal";
import ConfirmExitModal from "@/components/quiz/ConfirmExitModal";
import { QuizQuestion } from "@/types/quiz.types";

export default function CreateQuizPage() {
  const router = useRouter();
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
    router.back();
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

  const handleSaveQuiz = () => {
    // TODO: Validate and save to backend
    console.log({
      title,
      description,
      timePerQuestion,
      questions,
    });
    // For now, just redirect back
    router.push("/dashboard/teacher");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Input
            label=""
            type="text"
            placeholder="Titre du quiz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold max-w-md"
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExit}>
              Quitter
            </Button>
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
