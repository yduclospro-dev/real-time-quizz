import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuizQuestion } from "@/types/quiz.types";
import toast from "react-hot-toast";

type SessionState = "lobby" | "in-progress" | "between-questions" | "finished";

interface StudentAnswer {
  studentName: string;
  selectedAnswers: string[];
}

interface StudentResult {
  studentName: string;
  selectedAnswers: string[];
  isCorrect: boolean;
  answeredInTime: boolean;
}

interface FinalResult {
  studentName: string;
  score: number;
  totalQuestions: number;
}

export function useQuizSession(quizID: string) {
  const router = useRouter();

  // ============================================
  // STATE: Session Connection & User Role
  // ============================================
  const [sessionState, setSessionState] = useState<SessionState>("lobby");
  const [sessionCode, setSessionCode] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isTeacher, setIsTeacher] = useState(false); // TODO: Get from auth context

  // ============================================
  // STATE: Quiz Progress & Questions
  // ============================================
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pauseTimeLeft, setPauseTimeLeft] = useState(10);

  // ============================================
  // STATE: Student Answers & Selections
  // ============================================
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);

  // ============================================
  // STATE: Teacher Real-time Data
  // ============================================
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);

  // ============================================
  // STATE: Final Results & Scoring
  // ============================================
  const [finalResults, setFinalResults] = useState<FinalResult[]>([]);
  const [userScore, setUserScore] = useState(0);
  const [liveScores, setLiveScores] = useState<Array<{ studentName: string; score: number; totalQuestions: number }>>([]);

  // ============================================
  // STATE: UI Controls
  // ============================================
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);

  // ============================================
  // WEBSOCKET INTEGRATION & SESSION LOADING
  // ============================================
  useEffect(() => {
    // TODO BACKEND: Connect to WebSocket
    // TODO BACKEND: Emit JOIN_SESSION event with sessionId
    // TODO BACKEND: Listen for PARTICIPANT_JOINED, QUIZ_STARTED, QUESTION_START, etc.
    // See: /mocks/sessionMockData.ts for WebSocket event structure
    loadSession();
  }, [quizID]);

  // ============================================
  // TIMER MANAGEMENT
  // ============================================
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

  // ============================================
  // SESSION INITIALIZATION
  // ============================================
  const loadSession = async () => {
    try {
      // TODO BACKEND: GET /api/sessions/:sessionId
      // Mock data for development
      import("@/mocks/sessionMockData").then(
        ({ MOCK_SESSION, MOCK_QUIZ_QUESTIONS, MOCK_FINAL_RESULTS }) => {
          setSessionCode(MOCK_SESSION.sessionCode);
          setParticipants(MOCK_SESSION.participants);
          setQuestions(MOCK_QUIZ_QUESTIONS);
          setTimeLeft(MOCK_QUIZ_QUESTIONS[0]?.timeLimit || 30);
          setLiveScores(MOCK_FINAL_RESULTS);
        }
      );
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Erreur lors du chargement de la session");
    }
  };

  // ============================================
  // EVENT HANDLERS: Quiz Flow
  // ============================================
  const handleStartQuiz = () => {
    // TODO BACKEND: Emit START_QUIZ WebSocket event (teacher only)
    // All clients should receive QUIZ_STARTED event
    setSessionState("in-progress");
    setTimeLeft(questions[0]?.timeLimit || 30);

    // TODO BACKEND: Listen for ANSWER_RECEIVED event to update real-time stats
    // Mock: Simulate student answers coming in
    setTimeout(() => {
      import("@/mocks/sessionMockData").then(({ MOCK_STUDENT_ANSWERS }) => {
        setStudentAnswers(MOCK_STUDENT_ANSWERS);
      });
    }, 2000);
  };

  const handleAnswerSelect = (answerId: string) => {
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

    // TODO BACKEND: Update scoreboard ONLY at end of question (not during question)
    // This prevents students from seeing if they gained points during the question itself
    // Listen for QUESTION_END event which includes updated scores for all students
    // Event data: { questionId, scores: Array<{ studentName, score, totalQuestions }> }
    // Update liveScores state with the new scores
    // Example: setLiveScores(event.scores);

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

  // ============================================
  // EVENT HANDLERS: UI Actions
  // ============================================
  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode);
    toast.success("Code copié !");
  };

  const handleQuitSession = () => {
    setShowQuitModal(true);
  };

  const handleConfirmQuit = () => {
    // TODO BACKEND: Emit LEAVE_SESSION WebSocket event
    setShowQuitModal(false);
    if (isTeacher) {
      router.push("/quiz");
    } else {
      router.push("/join");
    }
  };

  // ============================================
  // RETURN: Expose state and handlers
  // ============================================
  return {
    sessionState,
    sessionCode,
    participants,
    isTeacher,
    questions,
    currentQuestionIndex,
    timeLeft,
    selectedAnswers,
    studentAnswers,
    studentResults,
    finalResults,
    userScore,
    showQuitModal,
    pauseTimeLeft,
    liveScores,
    showCorrection,
    setShowQuitModal,
    setShowCorrection,
    handleStartQuiz,
    handleAnswerSelect,
    copySessionCode,
    handleQuitSession,
    handleConfirmQuit,
  };
}
