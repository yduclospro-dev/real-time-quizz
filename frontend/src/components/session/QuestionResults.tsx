import { QuizQuestion } from "@/types/quiz.types";

interface QuestionResultsProps {
  question: QuizQuestion;
  questionNumber: number;
  userAnswers?: string[];
  isTeacher: boolean;
  pauseTimeLeft: number;
  isLastQuestion: boolean;
}

const ANSWER_COLORS = {
  red: "border-red-500",
  blue: "border-blue-500",
  yellow: "border-yellow-500",
  green: "border-green-500",
};

export function QuestionResults({
  question,
  questionNumber,
  userAnswers = [],
  isTeacher,
  pauseTimeLeft,
  isLastQuestion,
}: QuestionResultsProps) {
  const correctAnswerIds = question.answers
    .filter((a) => a.isCorrect)
    .map((a) => a.id);

  const isCorrect = !isTeacher && 
    userAnswers.length > 0 &&
    userAnswers.length === correctAnswerIds.length &&
    userAnswers.every((id) => correctAnswerIds.includes(id));

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Question {questionNumber}
        </h2>
        <p className="text-gray-600">{question.question}</p>
      </div>

      {/* Student result indicator */}
      {!isTeacher && (
        <div className={`mb-6 p-4 rounded-xl ${isCorrect ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"}`}>
          <p className={`font-bold text-center text-lg ${isCorrect ? "text-green-900" : "text-red-900"}`}>
            {isCorrect ? "✓ Bonne réponse !" : "✗ Mauvaise réponse"}
          </p>
        </div>
      )}

      {/* Answers */}
      <div className="grid grid-cols-2 gap-4">
        {question.answers.map((answer) => {
          const colorClass = ANSWER_COLORS[answer.color as keyof typeof ANSWER_COLORS];
          const isCorrectAnswer = answer.isCorrect;
          const wasSelected = userAnswers.includes(answer.id);
          
          // Get background color with low opacity
          const bgColorClass = answer.color === 'red' ? 'bg-red-500/20' :
                               answer.color === 'blue' ? 'bg-blue-500/20' :
                               answer.color === 'yellow' ? 'bg-yellow-500/20' :
                               'bg-green-500/20';

          return (
            <div
              key={answer.id}
              className={`
                relative p-4 rounded-xl transition-all
                ${bgColorClass}
                ${isCorrectAnswer ? "ring-4 ring-green-500" : ""}
                ${!isTeacher && wasSelected && !isCorrectAnswer ? "ring-4 ring-red-500" : ""}
                min-h-[100px] flex items-center justify-center
              `}
            >
              {/* Correct indicator */}
              {isCorrectAnswer && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Wrong selection indicator */}
              {!isTeacher && wasSelected && !isCorrectAnswer && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <span className={`font-bold text-lg text-center ${isCorrectAnswer ? "text-green-900" : "text-gray-900"}`}>
                {answer.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Next question indicator */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 animate-pulse">
          {isLastQuestion 
            ? `Résultats finaux dans ${pauseTimeLeft} seconde${pauseTimeLeft > 1 ? 's' : ''}...`
            : `Prochaine question dans ${pauseTimeLeft} seconde${pauseTimeLeft > 1 ? 's' : ''}...`
          }
        </p>
      </div>
    </div>
  );
}
