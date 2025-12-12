import { QuizQuestion } from "@/types/quiz.types";

interface StudentResult {
  studentName: string;
  selectedAnswers: string[];
  isCorrect: boolean;
  answeredInTime: boolean;
}

interface TeacherQuestionResultsProps {
  question: QuizQuestion;
  questionNumber: number;
  studentResults: StudentResult[];
  pauseTimeLeft: number;
  isLastQuestion: boolean;
}

export default function TeacherQuestionResults({
  question,
  questionNumber,
  studentResults,
  pauseTimeLeft,
  isLastQuestion,
}: TeacherQuestionResultsProps) {
  const correctStudents = studentResults.filter((s) => s.isCorrect);
  const incorrectStudents = studentResults.filter(
    (s) => !s.isCorrect && s.answeredInTime
  );
  const noAnswerStudents = studentResults.filter((s) => !s.answeredInTime);

  const correctPercentage = studentResults.length > 0
    ? Math.round((correctStudents.length / studentResults.length) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-gray-500 text-sm mb-2">Question {questionNumber}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{question.question}</h2>
        
        {/* Success Rate */}
        <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-6 mb-6">
          <div className="text-white/90 text-sm mb-2">Taux de réussite</div>
          <div className="text-5xl font-bold text-white mb-2">{correctPercentage}%</div>
          <div className="text-white/80 text-sm">
            {correctStudents.length} / {studentResults.length} étudiants ont répondu correctement
          </div>
        </div>
      </div>

      {/* Student Results */}
      <div className="space-y-4">
        {/* Correct Answers */}
        {correctStudents.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-400">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Réponses correctes ({correctStudents.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {correctStudents.map((student, idx) => (
                <div
                  key={idx}
                  className="bg-green-100 rounded-lg p-3 border border-green-300"
                >
                  <div className="text-gray-900 font-medium text-sm">
                    {student.studentName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incorrect Answers */}
        {incorrectStudents.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-400">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✗</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Réponses incorrectes ({incorrectStudents.length})
              </h3>
            </div>
            <div className="space-y-3">
              {incorrectStudents.map((student, idx) => {
                const selectedAnswerTexts = student.selectedAnswers
                  .map((id) => question.answers.find((a) => a.id === id)?.text)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={idx}
                    className="bg-red-100 rounded-lg p-3 border border-red-300 flex justify-between items-center"
                  >
                    <div className="text-gray-900 font-medium">{student.studentName}</div>
                    <div className="text-gray-600 text-sm">
                      A répondu: {selectedAnswerTexts}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Answer */}
        {noAnswerStudents.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">⊘</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                N'ont pas répondu ({noAnswerStudents.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {noAnswerStudents.map((student, idx) => (
                <div
                  key={idx}
                  className="bg-gray-100 rounded-lg p-3 border border-gray-300"
                >
                  <div className="text-gray-900 font-medium text-sm">
                    {student.studentName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auto-advance message */}
      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          {isLastQuestion 
            ? `Résultats finaux dans ${pauseTimeLeft} seconde${pauseTimeLeft > 1 ? 's' : ''}...`
            : `Prochaine question dans ${pauseTimeLeft} seconde${pauseTimeLeft > 1 ? 's' : ''}...`
          }
        </p>
      </div>
    </div>
  );
}
