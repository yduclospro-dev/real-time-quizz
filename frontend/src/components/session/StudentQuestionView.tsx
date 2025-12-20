import { QuizQuestion } from "@/types/quiz.types";
import { QuestionType } from '@shared/enums/question-type';

interface StudentQuestionViewProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  selectedAnswers: string[];
  onAnswerSelect: (answerId: string) => void;
}

const ANSWER_COLORS = {
  red: "bg-red-500 hover:bg-red-600 border-red-600",
  blue: "bg-blue-500 hover:bg-blue-600 border-blue-600",
  yellow: "bg-yellow-500 hover:bg-yellow-600 border-yellow-600",
  green: "bg-green-500 hover:bg-green-600 border-green-600",
  purple: "bg-purple-500 hover:bg-purple-600 border-purple-600",
  orange: "bg-orange-500 hover:bg-orange-600 border-orange-600",
};

export function StudentQuestionView({
  question,
  questionNumber,
  totalQuestions,
  timeLeft,
  selectedAnswers,
  onAnswerSelect,
}: StudentQuestionViewProps) {
  const isMultipleChoice = question.type === QuestionType.MULTIPLE_CHOICE;

  const isSelected = (answerId: string) => selectedAnswers.includes(answerId);

  return (
    <div className="space-y-6">
      {/* Header with timer */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 font-medium">
            Question {questionNumber}/{totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-bold ${timeLeft <= 5 ? "text-red-600 animate-pulse" : "text-gray-900"}`}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Question text */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {question.question}
        </h2>

        {/* Image if present */}
        {question.imageUrl && (
          <div className="mb-4">
            <img
              src={question.imageUrl}
              alt="Question"
              className="w-full max-h-64 object-contain rounded-lg"
            />
          </div>
        )}

        {/* Type indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {isMultipleChoice ? "Choix multiples" : "Choix unique"}
        </div>
      </div>

      {/* Answer cards */}
      <div className="grid grid-cols-2 gap-4">
        {question.answers.map((answer, index) => {
          const colors = Object.values(ANSWER_COLORS);
          const colorClass = colors[index % colors.length];
          const selected = isSelected(answer.id);

          return (
            <button
              key={answer.id}
              onClick={() => onAnswerSelect(answer.id)}
              className={`
                relative p-6 rounded-xl border-4 transition-all
                ${colorClass}
                ${selected ? "ring-4 ring-white" : "opacity-90"}
                text-white font-bold text-lg
                min-h-[120px] flex items-center justify-center
                shadow-lg hover:shadow-xl
              `}
            >
              {selected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {answer.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
