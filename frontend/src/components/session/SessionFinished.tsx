import { Button } from "@/components/ui/Button";
import { QuizQuestion } from "@/types/quiz.types";
import { useRouter } from "next/navigation";

interface FinalResult {
  studentName: string;
  score: number;
  totalQuestions: number;
}

interface UserAnswer {
  questionId: string;
  selectedAnswerIds: string[];
  isCorrect: boolean;
}

interface SessionFinishedProps {
  isTeacher: boolean;
  questions: QuizQuestion[];
  finalResults: FinalResult[];
  userScore: number;
  userAnswers: UserAnswer[];
  showCorrection: boolean;
  onToggleCorrection: (show: boolean) => void;
}

export function SessionFinished({
  isTeacher,
  questions,
  finalResults,
  userScore,
  userAnswers,
  showCorrection,
  onToggleCorrection,
}: SessionFinishedProps) {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            🎉 Quiz terminé !
          </h2>

          {!isTeacher && (
            <>
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-center">
                <p className="text-white text-lg mb-2">Votre score</p>
                <p className="text-5xl font-bold text-white">
                  {userScore}/{questions.length}
                </p>
              </div>

              {/* Toggle buttons */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={!showCorrection ? "primary" : "outline"}
                  onClick={() => onToggleCorrection(false)}
                  className="flex-1"
                >
                  Classement
                </Button>
                <Button
                  variant={showCorrection ? "primary" : "outline"}
                  onClick={() => onToggleCorrection(true)}
                  className="flex-1"
                >
                  Correction
                </Button>
              </div>

              {!showCorrection ? (
                /* Show ranking */
                <>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Classement final
                  </h3>
                  <div className="space-y-3">
                    {finalResults
                      .sort((a, b) => b.score - a.score)
                      .map((result, index) => {
                        const rankColors = [
                          "bg-yellow-400 text-yellow-900",
                          "bg-gray-300 text-gray-900",
                          "bg-orange-400 text-orange-900",
                        ];
                        const rankColor =
                          index < 3
                            ? rankColors[index]
                            : "bg-gray-100 text-gray-700";

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${rankColor}`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                                {result.studentName.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">
                                {result.studentName}
                              </span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">
                              {result.score}/{result.totalQuestions}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                /* Show correction */
                <>
                  {/* Detailed results for each question */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      Récapitulatif
                    </h3>
                    {questions.map((question, index) => {
                      // Get actual user answer from backend
                      const userAnswer = userAnswers.find(a => a.questionId === question.id);
                      const studentAnswerIds = userAnswer?.selectedAnswerIds || [];
                      const isCorrect = userAnswer?.isCorrect || false;

                      return (
                        <div
                          key={question.id}
                          className={`rounded-xl p-5 ${ 
                            isCorrect ? "bg-green-50" : "bg-red-50"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Status Icon */}
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isCorrect ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              <span className="text-white font-bold text-lg">
                                {isCorrect ? "✓" : "✗"}
                              </span>
                            </div>

                            <div className="flex-1">
                              {/* Question */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                                  Question {index + 1}
                                </h4>
                                <p className="text-gray-900 font-medium">
                                  {question.question}
                                </p>
                              </div>

                              {/* Answers */}
                              <div className="space-y-2">
                                {/* Student's answer */}
                                <div className="flex items-start gap-2">
                                  <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                                    Votre réponse:
                                  </span>
                                  <span
                                    className={`text-sm ${
                                      isCorrect
                                        ? "text-green-700 font-medium"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {studentAnswerIds.length > 0
                                      ? studentAnswerIds
                                          .map(
                                            (id) =>
                                              question.answers.find(
                                                (a) => a.id === id
                                              )?.text
                                          )
                                          .join(", ")
                                      : "Pas de réponse"}
                                  </span>
                                </div>

                                {/* Correct answer - only show if incorrect */}
                                {!isCorrect && (
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm font-semibold text-green-700 min-w-[120px]">
                                      Bonne réponse:
                                    </span>
                                    <span className="text-sm text-green-700 font-medium">
                                      {question.answers
                                        .filter((a) => a.isCorrect)
                                        .map((a) => a.text)
                                        .join(", ")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {isTeacher && (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Classement final
              </h3>
              <div className="space-y-3">
                {finalResults
                  .sort((a, b) => b.score - a.score)
                  .map((result, index) => {
                    const rankColors = [
                      "bg-yellow-400 text-yellow-900",
                      "bg-gray-300 text-gray-900",
                      "bg-orange-400 text-orange-900",
                    ];
                    const rankColor =
                      index < 3 ? rankColors[index] : "bg-gray-100 text-gray-700";

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${rankColor}`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                            {result.studentName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {result.studentName}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {result.score}/{result.totalQuestions}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          <Button
            variant="primary"
            onClick={() => router.push("/")}
            className="w-full mt-8"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
  );
}
