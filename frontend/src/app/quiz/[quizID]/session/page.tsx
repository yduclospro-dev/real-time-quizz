"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StudentQuestionView } from "@/components/session/StudentQuestionView";
import { TeacherQuestionView } from "@/components/session/TeacherQuestionView";
import { QuestionResults } from "@/components/session/QuestionResults";
import TeacherQuestionResults from "@/components/session/TeacherQuestionResults";
import { ConfirmQuitSessionModal } from "@/components/session/ConfirmQuitSessionModal";
import { QuizQuestion } from "@/types/quiz.types";
import toast from "react-hot-toast";

type SessionState = "lobby" | "in-progress" | "between-questions" | "finished";

interface StudentAnswer {
  studentName: string;
  selectedAnswers: string[];
}

interface FinalResult {
  studentName: string;
  score: number;
  totalQuestions: number;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const quizID = params.quizID as string;

  const [sessionState, setSessionState] = useState<SessionState>("lobby");
  const [sessionCode, setSessionCode] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isTeacher, setIsTeacher] = useState(true); // TODO: Get from auth context
  
  // Quiz data
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Student state
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  
  // Teacher state
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [studentResults, setStudentResults] = useState<
    Array<{
      studentName: string;
      selectedAnswers: string[];
      isCorrect: boolean;
      answeredInTime: boolean;
    }>
  >([]);
  
  // Results
  const [finalResults, setFinalResults] = useState<FinalResult[]>([]);
  const [userScore, setUserScore] = useState(0);
  
  // Quit modal
  const [showQuitModal, setShowQuitModal] = useState(false);
  
  // Pause timer (between questions)
  const [pauseTimeLeft, setPauseTimeLeft] = useState(10);

  useEffect(() => {
    // TODO BACKEND: Connect to WebSocket
    // TODO BACKEND: Emit JOIN_SESSION event with sessionId
    // TODO BACKEND: Listen for PARTICIPANT_JOINED, QUIZ_STARTED, QUESTION_START, etc.
    // See: /mocks/sessionMockData.ts for WebSocket event structure
    loadSession();
  }, [quizID]);

  useEffect(() => {
    if (sessionState === "in-progress" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (sessionState === "in-progress" && timeLeft === 0) {
      handleQuestionTimeout();
    }
  }, [sessionState, timeLeft]);
  
  useEffect(() => {
    if (sessionState === "between-questions" && pauseTimeLeft > 0) {
      const timer = setTimeout(() => setPauseTimeLeft(pauseTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [sessionState, pauseTimeLeft]);

  const loadSession = async () => {
    try {
      // TODO BACKEND: GET /api/sessions/:sessionId
      // Expected response: { sessionId, sessionCode, quizId, participants[], questions[], state }
      // For now, using mock data from /mocks/sessionMockData.ts
      
      const { MOCK_SESSION, MOCK_QUIZ_QUESTIONS } = await import("@/mocks/sessionMockData");
      setSessionCode(MOCK_SESSION.sessionCode);
      setParticipants(MOCK_SESSION.participants);
      setQuestions(MOCK_QUIZ_QUESTIONS);
    } catch (error) {
      toast.error("Erreur lors du chargement de la session");
      console.error("Failed to load session:", error);
      router.push("/quiz");
    }
  };
  
  const handleQuitSession = () => {
    setShowQuitModal(true);
  };
  
  const handleConfirmQuit = () => {
    // TODO BACKEND: Emit LEAVE_SESSION WebSocket event
    if (isTeacher) {
      router.push("/quiz");
    } else {
      router.push("/join");
    }
  };

  const handleStartQuiz = () => {
    if (participants.length === 0) {
      toast.error("Aucun étudiant n'a rejoint la session");
      return;
    }
    // TODO BACKEND: Emit START_QUIZ WebSocket event
    // Server should broadcast QUIZ_STARTED to all participants
    // See: /mocks/sessionMockData.ts for event structure
    setSessionState("in-progress");
    setTimeLeft(questions[0]?.timeLimit || 30);
    toast.success("Quiz démarré !");
  };

  const handleAnswerSelect = (answerId: string) => {
    if (sessionState !== "in-progress") return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.type === "single") {
      setSelectedAnswers([answerId]);
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(answerId)
          ? prev.filter((id) => id !== answerId)
          : [...prev, answerId]
      );
    }
    // TODO BACKEND: Emit SUBMIT_ANSWER WebSocket event
    // Event data: { questionId, selectedAnswers: string[] }
    // Teacher should receive ANSWER_RECEIVED event for real-time stats
  };

  const handleQuestionTimeout = () => {
    // TODO BACKEND: Server should automatically handle question timeout
    // Server broadcasts QUESTION_END event with correct answers and all student results
    // Then after 5s, broadcasts QUESTION_START for next question or QUIZ_END
    
    // Calculate student results (check if answers are correct)
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIds = currentQuestion.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id);
    
    // TODO BACKEND: Receive student results from server
    // For now, using mock data
    import("@/mocks/sessionMockData").then(({ MOCK_STUDENT_ANSWERS }) => {
      const results = MOCK_STUDENT_ANSWERS.map((student) => {
        const isCorrect =
          student.selectedAnswers.length === correctAnswerIds.length &&
          student.selectedAnswers.every((id) => correctAnswerIds.includes(id));
        return {
          studentName: student.studentName,
          selectedAnswers: student.selectedAnswers,
          isCorrect,
          answeredInTime: true,
        };
      });
      setStudentResults(results);
    });
    
    setSessionState("between-questions");
    setPauseTimeLeft(10);
    
    // Mock: Auto-advance to next question after 10 seconds
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswers([]);
        setStudentAnswers([]);
        setStudentResults([]);
        setTimeLeft(questions[currentQuestionIndex + 1]?.timeLimit || 30);
        setSessionState("in-progress");
      } else {
        // Quiz finished
        setSessionState("finished");
        // TODO BACKEND: Receive QUIZ_END event with final results
        // For now, using mock data
        import("@/mocks/sessionMockData").then(({ MOCK_FINAL_RESULTS }) => {
          setFinalResults(MOCK_FINAL_RESULTS);
        });
        setUserScore(7);
      }
    }, 10000);
  };

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode);
    toast.success("Code copié !");
  };

  // Lobby state
  if (sessionState === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <Header title={isTeacher ? "Session - En attente" : "En attente du professeur"} onQuit={handleQuitSession} />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Session Code Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
              Code de la session
            </h2>
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={copySessionCode}
            >
              <p className="text-5xl font-bold text-white text-center tracking-wider">
                {sessionCode}
              </p>
              <p className="text-white/80 text-center mt-2 text-sm">
                Cliquez pour copier
              </p>
            </div>
          </div>

          {/* Participants List */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Participants ({participants.length})
            </h2>
            {participants.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun participant pour le moment...
              </p>
            ) : (
              <div className="space-y-2">
                {participants.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                      {name.charAt(0)}
                    </div>
                    <span className="text-gray-900 font-medium">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start Button (Teacher only) */}
          {isTeacher && (
            <Button
              variant="primary"
              onClick={handleStartQuiz}
              disabled={participants.length === 0}
              className="w-full py-4 text-lg"
            >
              Démarrer le quiz
            </Button>
          )}

          {/* Waiting Message (Student) */}
          {!isTeacher && (
            <>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center mb-4">
                <p className="text-blue-800 font-medium">
                  En attente du démarrage par le professeur...
                </p>
              </div>
              {/* TODO: Remove this test button before production */}
              <Button
                variant="outline"
                onClick={handleStartQuiz}
                className="w-full"
              >
                [TEST] Démarrer quand même
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // In-progress state
  if (sessionState === "in-progress") {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <Header title={`Question ${currentQuestionIndex + 1}/${questions.length}`} onQuit={handleQuitSession} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {isTeacher ? (
            <TeacherQuestionView
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              timeLeft={timeLeft}
              studentAnswers={studentAnswers}
              totalStudents={participants.length}
            />
          ) : (
            <StudentQuestionView
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              timeLeft={timeLeft}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={handleAnswerSelect}
            />
          )}
        </div>
      </div>
    );
  }

  // Between questions state
  if (sessionState === "between-questions") {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <Header title="Résultat" onQuit={handleQuitSession} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {isTeacher ? (
            <TeacherQuestionResults
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              studentResults={studentResults}
              pauseTimeLeft={pauseTimeLeft}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
            />
          ) : (
            <QuestionResults
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              userAnswers={selectedAnswers}
              isTeacher={false}
              pauseTimeLeft={pauseTimeLeft}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
            />
          )}
        </div>
      </div>
    );
  }

  // Finished state
  if (sessionState === "finished") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <Header title="Quiz terminé" onQuit={handleQuitSession} />
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

                {/* Detailed results for each question */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Récapitulatif</h3>
                  {questions.map((question, index) => {
                    // TODO BACKEND: Get actual student answers from session data
                    // For now, using mock data - assuming student selected first answer
                    const studentAnswers = index === 0 ? ["1"] : [];
                    const correctAnswerIds = question.answers
                      .filter((a) => a.isCorrect)
                      .map((a) => a.id);
                    const isCorrect =
                      studentAnswers.length === correctAnswerIds.length &&
                      studentAnswers.every((id) => correctAnswerIds.includes(id));

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
                              <p className="text-gray-900 font-medium">{question.question}</p>
                            </div>

                            {/* Answers */}
                            <div className="space-y-2">
                              {/* Student's answer */}
                              <div className="flex items-start gap-2">
                                <span className="text-sm font-semibold text-gray-700 min-w-[120px]">
                                  Votre réponse:
                                </span>
                                <span className={`text-sm ${isCorrect ? "text-green-700 font-medium" : "text-gray-900"}`}>
                                  {studentAnswers.length > 0
                                    ? studentAnswers
                                        .map((id) => question.answers.find((a) => a.id === id)?.text)
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

            {isTeacher && (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Classement (alphabétique)
                </h3>
                <div className="space-y-3">
                  {finalResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
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
                  ))}
                </div>
              </>
            )}

            <Button
              variant="primary"
              onClick={() => router.push("/quiz")}
              className="w-full mt-8"
            >
              Retour à la liste des quiz
            </Button>
          </div>
        </div>
        <ConfirmQuitSessionModal
          isOpen={showQuitModal}
          onClose={() => setShowQuitModal(false)}
          onConfirm={handleConfirmQuit}
        />
      </div>
    );
  }

  return (
    <>
      <ConfirmQuitSessionModal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        onConfirm={handleConfirmQuit}
      />
    </>
  );
}
