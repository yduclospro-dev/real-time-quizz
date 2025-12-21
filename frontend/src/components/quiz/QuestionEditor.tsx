"use client";

import { Trash2, Image, Clock, X } from "lucide-react";
import { QuizQuestion, QuizAnswer } from "@/types/quiz.types";
import { useId, useRef, useState } from "react";
import AnswerCard from "./AnswerCard";
import { QuestionType } from '@shared/enums/question-type';
import { useFieldError } from '@/hooks/useFieldError';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const qIndex = questionNumber - 1;
  const questionError = useFieldError(`questions.${qIndex}.text`);
  const answersError = useFieldError(`questions.${qIndex}.answers`);
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
    if (question.type === QuestionType.SINGLE_CHOICE) {
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

  const reactId = useId();
  const localCounter = useRef(0);

  const handleAddAnswer = () => {
    if (question.answers.length >= 6) return;
    const colors = ["red", "blue", "yellow", "green", "purple", "orange"] as const;
    const colorIndex = question.answers.length % colors.length;

    const newAnswer: QuizAnswer = {
      id: `${reactId}-${localCounter.current++}`.replace(/[:]/g, ""),
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
          name={`questions.${qIndex}.text`}
          value={question.question}
          onChange={(e) => handleQuestionTextChange(e.target.value)}
          placeholder="Entrez votre question ici"
          className="w-full text-2xl font-semibold border-2 border-gray-300 rounded-lg p-3 resize-none"
          rows={2}
        />
        {questionError && <p className="mt-1 text-sm text-red-500">{questionError}</p>}
      </div>

      {/* Image Upload Section */}
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          id={`image-upload-${question.id}`}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            setUploadError(null);

            try {
              const formData = new FormData();
              formData.append('image', file);

              const response = await fetch('http://localhost:3000/upload/image', {
                method: 'POST',
                credentials: 'include',
                body: formData,
              });

              const data = await response.json();

              if (!response.ok || !data.success) {
                throw new Error(data.error?.message || 'Échec du téléchargement');
              }

              onUpdate({ ...question, imageUrl: data.data.imageUrl });
            } catch (error) {
              console.error('Upload error:', error);
              setUploadError(error instanceof Error ? error.message : 'Erreur lors du téléchargement');
            } finally {
              setIsUploading(false);
              e.target.value = '';
            }
          }}
          disabled={isUploading}
        />
        
        {question.imageUrl ? (
          <div className="relative">
            <img
              src={question.imageUrl}
              alt="Question illustration"
              className="w-full h-72 object-cover rounded-lg border-2 border-gray-300"
            />
            <button
              type="button"
              onClick={() => onUpdate({ ...question, imageUrl: undefined })}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Supprimer l'image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={`image-upload-${question.id}`}
            className={`flex items-center justify-center h-72 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              {isUploading ? (
                <>
                  <div className="w-12 h-12 mb-3 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Téléchargement en cours...</p>
                </>
              ) : (
                <>
                  <Image className="w-12 h-12 mb-3 text-gray-400" aria-hidden="true" />
                  <p className="text-sm text-gray-500 mb-2">Rechercher et insérer une image</p>
                  <p className="text-xs text-gray-400">Télécharger un fichier ou glisser-déposer ici</p>
                </>
              )}
            </div>
          </label>
        )}
        
        {uploadError && (
          <p className="mt-2 text-sm text-red-500">{uploadError}</p>
        )}
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {question.answers.map((answer, index) => (
            <AnswerCard
            key={answer.id}
            answer={answer}
            index={index}
            questionIndex={qIndex}
              questionType={question.type}
            questionId={question.id}
            canDelete={question.answers.length > 2}
            onTextChange={(text) => handleAnswerChange(answer.id, text)}
            onToggleCorrect={() => handleSetCorrect(answer.id)}
            onDelete={() => handleRemoveAnswer(answer.id)}
          />
        ))}
      </div>
      {/* Show answers-level field error (e.g. uniqueness) */}
      {answersError && (
        <p className="mt-1 text-sm text-red-500">{answersError}</p>
      )}

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
