import { QuizQuestion } from "@/types/quiz.types";
import { QuestionType } from '@shared/enums/question-type';

interface StudentAnswer {
  studentName: string;
  selectedAnswers: string[];
}

interface TeacherQuestionViewProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  studentAnswers: StudentAnswer[];
  totalStudents: number;
}

const ANSWER_COLORS = {
  red: "bg-red-100 border-red-300 text-red-900",
  blue: "bg-blue-100 border-blue-300 text-blue-900",
  yellow: "bg-yellow-100 border-yellow-300 text-yellow-900",
  green: "bg-green-100 border-green-300 text-green-900",
};

export function TeacherQuestionView({
  question,
  questionNumber,
  totalQuestions,
  timeLeft,
  studentAnswers,
  totalStudents,
}: TeacherQuestionViewProps) {
  const answeredCount = studentAnswers.length;

  const getAnswerCount = (answerId: string) => {
    return studentAnswers.filter((sa) => sa.selectedAnswers.includes(answerId)).length;
  };

  const getStudentsForAnswer = (answerId: string) => {
    return studentAnswers
      .filter((sa) => sa.selectedAnswers.includes(answerId))
      .map((sa) => sa.studentName);
  };

  return (
    <div className="space-y-6">
      {/* Header with timer and stats */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 font-medium">
            Question {questionNumber}/{totalQuestions}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {answeredCount}/{totalStudents} réponses
            </span>
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          {question.type === QuestionType.MULTIPLE_CHOICE ? "Choix multiples" : "Choix unique"}
        </div>
      </div>

      {/* Answer cards with real-time stats */}
      <div className="grid grid-cols-2 gap-4">
        {question.answers.map((answer) => {
          const colorClass = ANSWER_COLORS[answer.color as keyof typeof ANSWER_COLORS];
          const count = getAnswerCount(answer.id);
          const students = getStudentsForAnswer(answer.id);
          const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

          return (
            <div
              key={answer.id}
              className={`
                relative p-6 rounded-xl border-2 
                ${colorClass}
                min-h-[150px] flex flex-col justify-between
                shadow-lg
              `}
            >
              {/* Answer text */}
              <div className="font-bold text-lg mb-3">{answer.text}</div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{count} réponse{count !== 1 ? "s" : ""}</span>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-current transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Student names */}
                {students.length > 0 && (
                  <div className="text-sm space-y-1 max-h-20 overflow-y-auto">
                    {students.map((name, idx) => (
                      <div key={idx} className="text-xs opacity-75">
                        • {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
