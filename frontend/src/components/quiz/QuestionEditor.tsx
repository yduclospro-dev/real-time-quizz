"use client";

import { Trash2, Image, Clock } from "lucide-react";
import { QuizQuestion, QuizAnswer } from "@/types/quiz.types";
import AnswerCard from "./AnswerCard";

interface QuestionEditorProps {
  question: QuizQuestion;
  questionNumber: number;
  onUpdate: (question: QuizQuestion) => void;
  onDelete: () => void;
  canDelete: boolean;
}

export default function QuestionEditor({
  question,
  questionNumber,
  onUpdate,
  onDelete,
  canDelete,
}: QuestionEditorProps) {
  const handleQuestionTextChange = (text: string) => {
    onUpdate({ ...question, question: text });
  };

  const handleAnswerChange = (answerId: string, text: string) => {
    const updatedAnswers = question.answers.map((answer) =>
      answer.id === answerId ? { ...answer, text } : answer
    );
    onUpdate({ ...question, answers: updatedAnswers });
  };

  const handleSetCorrect = (answerId: string) => {
    if (question.type === "single") {
      // Single answer - radio behavior
      const updatedAnswers = question.answers.map((answer) => ({
        ...answer,
        isCorrect: answer.id === answerId,
      }));
      onUpdate({ ...question, answers: updatedAnswers });
    } else {
      // Multiple answers - checkbox behavior
      const updatedAnswers = question.answers.map((answer) =>
        answer.id === answerId ? { ...answer, isCorrect: !answer.isCorrect } : answer
      );
      onUpdate({ ...question, answers: updatedAnswers });
    }
  };

  const handleAddAnswer = () => {
    if (question.answers.length >= 6) return;
    const colors = ["red", "blue", "yellow", "green", "purple", "orange"] as const;
    const colorIndex = question.answers.length % colors.length;

    const newAnswer: QuizAnswer = {
      id: Date.now().toString(),
      text: "",
      isCorrect: false,
      color: colors[colorIndex],
    };
    onUpdate({ ...question, answers: [...question.answers, newAnswer] });
  };

  const handleRemoveAnswer = (answerId: string) => {
    if (question.answers.length <= 2) return;
    const colors = ["red", "blue", "yellow", "green", "purple", "orange"] as const;
    const updatedAnswers = question.answers
      .filter((a) => a.id !== answerId)
      .map((answer, index) => ({
        ...answer,
        color: colors[index],
      }));
    onUpdate({ ...question, answers: updatedAnswers });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 min-h-6">
          <div className="text-base font-medium text-gray-700 flex items-center gap-2">
            <span>Question {questionNumber}</span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {question.timeLimit}s
            </span>
          </div>
          {canDelete && (
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>
        <textarea
          value={question.question}
          onChange={(e) => handleQuestionTextChange(e.target.value)}
          placeholder="Entrez votre question ici"
          className="w-full text-2xl font-semibold border-2 border-gray-300 rounded-lg p-3 resize-none"
          rows={2}
        />
      </div>

      {/* Image Upload Section */}
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          id={`image-upload-${question.id}`}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // TODO: Handle image upload (Cloudinary integration)
              console.log('Image selected:', file.name);
            }
          }}
        />
        <label
          htmlFor={`image-upload-${question.id}`}
          className="flex items-center justify-center h-72 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Image className="w-12 h-12 mb-3 text-gray-400" />
            <p className="text-sm text-gray-500 mb-2">Rechercher et insérer une image</p>
            <p className="text-xs text-gray-400">Télécharger un fichier ou glisser-déposer ici</p>
          </div>
        </label>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {question.answers.map((answer, index) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            index={index}
            questionType={question.type}
            questionId={question.id}
            canDelete={question.answers.length > 2}
            onTextChange={(text) => handleAnswerChange(answer.id, text)}
            onToggleCorrect={() => handleSetCorrect(answer.id)}
            onDelete={() => handleRemoveAnswer(answer.id)}
          />
        ))}
      </div>

      {/* Add Answer Button */}
      {question.answers.length < 6 && (
        <button
          onClick={handleAddAnswer}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          <span>Ajouter une réponse</span>
        </button>
      )}
    </div>
  );
}
