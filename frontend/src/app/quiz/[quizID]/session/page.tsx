"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { StudentQuestionView } from "@/components/session/StudentQuestionView";
import { TeacherQuestionView } from "@/components/session/TeacherQuestionView";
import { QuestionResults } from "@/components/session/QuestionResults";
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
  
  // Results
  const [finalResults, setFinalResults] = useState<FinalResult[]>([]);
  const [userScore, setUserScore] = useState(0);

  useEffect(() => {
    // TODO: Connect to WebSocket
    // TODO: Load session data
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

  const loadSession = async () => {
    try {
      // TODO: Fetch session from backend
      // For now, mock data
      setSessionCode("ABC123");
      setParticipants(["Jean Dupont", "Marie Martin"]);
      
      // Mock questions
      setQuestions([
        {
          id: "1",
          question: "Quelle est la capitale de la France ?",
          type: "single",
          timeLimit: 30,
          answers: [
            { id: "1", text: "Paris", isCorrect: true, color: "red" },
            { id: "2", text: "Lyon", isCorrect: false, color: "blue" },
            { id: "3", text: "Marseille", isCorrect: false, color: "yellow" },
            { id: "4", text: "Toulouse", isCorrect: false, color: "green" },
          ],
        },
      ]);
    } catch (error) {
      toast.error("Erreur lors du chargement de la session");
      console.error("Failed to load session:", error);
      router.push("/quiz");
    }
  };

  const handleStartQuiz = () => {
    if (participants.length === 0) {
      toast.error("Aucun étudiant n'a rejoint la session");
      return;
    }
    // TODO: Send start event via WebSocket
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
    // TODO: Send answer to WebSocket
  };

  const handleQuestionTimeout = () => {
    // TODO: Send final answers via WebSocket
    setSessionState("between-questions");
    
    // Auto-advance to next question after 5 seconds
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswers([]);
        setStudentAnswers([]);
        setTimeLeft(questions[currentQuestionIndex + 1]?.timeLimit || 30);
        setSessionState("in-progress");
      } else {
        // Quiz finished
        setSessionState("finished");
        // TODO: Calculate final results
        setFinalResults([
          { studentName: "Jean Dupont", score: 8, totalQuestions: 10 },
          { studentName: "Marie Martin", score: 9, totalQuestions: 10 },
        ].sort((a, b) => a.studentName.localeCompare(b.studentName)));
        setUserScore(7);
      }
    }, 5000);
  };

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode);
    toast.success("Code copié !");
  };

  // Lobby state
  if (sessionState === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <Header title={isTeacher ? "Session - En attente" : "En attente du professeur"} />

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
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-800 font-medium">
                En attente du démarrage par le professeur...
              </p>
            </div>
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
        <Header title={`Question ${currentQuestionIndex + 1}/${questions.length}`} />
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
        <Header title="Résultat" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <QuestionResults
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            userAnswers={!isTeacher ? selectedAnswers : undefined}
            isTeacher={isTeacher}
          />
        </div>
      </div>
    );
  }

  // Finished state
  if (sessionState === "finished") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <Header title="Quiz terminé" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              🎉 Quiz terminé !
            </h2>

            {!isTeacher && (
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-center">
                <p className="text-white text-lg mb-2">Votre score</p>
                <p className="text-5xl font-bold text-white">
                  {userScore}/{questions.length}
                </p>
              </div>
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
      </div>
    );
  }

  return null;
}
