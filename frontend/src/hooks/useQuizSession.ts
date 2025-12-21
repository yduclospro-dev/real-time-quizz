import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizQuestion } from "@/types/quiz.types";
import toast from "react-hot-toast";
import { QuestionType } from '../../../shared/enums/question-type';
import { SessionState as SharedSessionState } from '../../../shared/enums/session-state';
import { sessionService } from '@/services/session.service';
import { useAuth } from './useAuth';
import { Role } from '../../../shared/enums/role';
import { io, Socket } from 'socket.io-client';

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

export function useQuizSession() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const quizId = params.quizId as string;
  const { user } = useAuth();
  
  // WebSocket connection
  const socketRef = useRef<Socket | null>(null);
  
  // Refs to track current state for socket listeners (avoid stale closures)
  const participantsRef = useRef<string[]>([]);
  const studentAnswersRef = useRef<StudentAnswer[]>([]);
  const questionsRef = useRef<QuizQuestion[]>([]);
  const currentQuestionIndexRef = useRef<number>(0);

  // ============================================
  // STATE: Session Connection & User Role
  // ============================================
  // Use shared enum for persisted session state (CREATED / STARTED / FINISHED)
  const [sessionState, setSessionState] = useState<SharedSessionState>(SharedSessionState.CREATED);
  // Local transient flag for UI between-questions state
  const [isBetweenQuestions, setIsBetweenQuestions] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const isTeacher = user?.role === Role.TEACHER;

  // ============================================
  // STATE: Quiz Progress & Questions
  // ============================================
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
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
  const [userAnswers, setUserAnswers] = useState<Array<{ questionId: string; selectedAnswerIds: string[]; isCorrect: boolean }>>([]);

  // ============================================
  // STATE: UI Controls
  // ============================================
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  
  // Sync refs with state to avoid stale closures in socket listeners
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);
  
  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);
  
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // ============================================
  // SESSION INITIALIZATION & WEBSOCKET CONNECTION
  // ============================================
  useEffect(() => {
    if (!sessionId || !user) return;
    
    const initSession = async () => {
      // Initialize WebSocket connection
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000', {
        withCredentials: true,
      });
      
      socketRef.current = socket;

      // Join the session room via WebSocket - will receive all data via session:state
      socket.emit('session:join', { sessionId, userId: user.id });

      // ============================================
      // WEBSOCKET EVENT LISTENERS
      // ============================================================
    
    // Receive current session state
    socket.on('session:state', (state: any) => {
      // Extract questions from session state
      if (state.questions && state.questions.length > 0) {
        const mappedQuestions = state.questions.map((q: any) => ({
          ...q,
          question: q.text,
          imageUrl: q.image,
        }));
        setQuestions(mappedQuestions);
        
        // ALWAYS set current question when session is STARTED and we have a valid index
        if (state.state === 'STARTED' && state.currentSessionIndex !== undefined && mappedQuestions[state.currentSessionIndex]) {
          const currentQ = mappedQuestions[state.currentSessionIndex];
          setCurrentQuestion(currentQ);
          setCurrentQuestionIndex(state.currentSessionIndex);
          
          // Calculate and set timer
          if (state.currentQuestionEndsAt) {
            const endsAt = new Date(state.currentQuestionEndsAt).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
            setTimeLeft(remaining);
          } else if (currentQ.timeLimit) {
            setTimeLeft(currentQ.timeLimit);
          }
        }
      }
      
      updateSessionState(state);
    });
    
    // Handle pause state when rejoining during between-questions period
    const handlePauseState = (data: any) => {
      if (data.isBetweenQuestions) {
        setIsBetweenQuestions(true);
        setPauseTimeLeft(data.pauseTimeLeft || 10);
      }
    };
    
    // Handle pause:start event when timer expires
    const handlePauseStart = (data: any) => {
      setIsBetweenQuestions(true);
      setPauseTimeLeft(data.pauseDuration || 10);
    };

    // Session started event
    const handleSessionStarted = (session: any) => {
      setSessionState(SharedSessionState.STARTED);
      toast.success('Quiz démarré !', { id: `session-started-${sessionId}` });
    };

    // Question advanced event
    const handleQuestionAdvanced = (data: any) => {
      setCurrentQuestionIndex(data.currentQuestionIndex);
      setIsBetweenQuestions(false);
      setSelectedAnswers([]);
      
      // Set current question IMMEDIATELY from event data
      if (data.question) {
        const mappedQuestion = {
          ...data.question,
          question: data.question.text,
          imageUrl: data.question.image,
        };
        
        // Set as current question for INSTANT display
        setCurrentQuestion(mappedQuestion);
        
        // Also update questions array
        setQuestions(prev => {
          const updated = [...prev];
          updated[data.currentQuestionIndex] = mappedQuestion;
          return updated;
        });
        
        // Set timer immediately
        if (data.question.timeLimit) {
          setTimeLeft(data.question.timeLimit);
        }
      }
    };

    // Timer update from server (every second)
    const handleTimerUpdate = (data: any) => {
      setTimeLeft(data.timeLeft);
    };

    // Timer expired
    const handleTimerExpired = (data: any) => {
      // Use refs to get CURRENT state values (avoid stale closure)
      const currentParticipants = participantsRef.current;
      const currentStudentAnswers = studentAnswersRef.current;
      const currentQuestions = questionsRef.current;
      const currentIdx = currentQuestionIndexRef.current;
      
      // Calculate results from current question (for teacher view only)
      const currentQuestion = currentQuestions[currentIdx];
      if (currentQuestion && isTeacher) {
        const correctAnswerIds = currentQuestion.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id)
          .sort();

        // Create results for ALL participants, not just those who answered
        const results = currentParticipants.map((participantName) => {
          const submission = currentStudentAnswers.find((sa) => sa.studentName === participantName);
          
          if (!submission || submission.selectedAnswers.length === 0) {
            // No answer submitted
            return {
              studentName: participantName,
              selectedAnswers: [],
              isCorrect: false,
              answeredInTime: false,
            };
          }

          const sortedSelected = [...submission.selectedAnswers].sort();
          const isCorrect =
            correctAnswerIds.length === sortedSelected.length &&
            correctAnswerIds.every((id) => sortedSelected.includes(id));

          return {
            studentName: participantName,
            selectedAnswers: submission.selectedAnswers,
            isCorrect,
            answeredInTime: true,
          };
        });

        setStudentResults(results);
      }
      
      // Show between-questions state
      setIsBetweenQuestions(true);
      setPauseTimeLeft(10);
    };

    // Scores update from server (after each question)
    const handleScoresUpdate = (data: any) => {
      if (data.scores && Array.isArray(data.scores)) {
        const newScores = data.scores.map((s: any) => ({
          studentName: s.displayName,
          score: s.score,
          totalQuestions: data.totalQuestions,
        }));
        
        // Complete replacement - single source of truth for scores
        setLiveScores(newScores);
      }
    };

    // Answer confirmed (for student)
    const handleAnswerConfirmed = (data: any) => {
      // Don't update score here - would reveal if answer is correct!
    };
    
    // Restore answer when rejoining (user had already selected answers)
    const handleAnswerRestore = (data: any) => {
      if (data.questionId && data.selectedAnswerIds) {
        setSelectedAnswers(data.selectedAnswerIds);
      }
    };

    // Question stats (for teacher real-time view)
    const handleQuestionStats = (stats: any) => {
      if (stats.submissions) {
        setStudentAnswers(stats.submissions.map((sub: any) => ({
          studentName: sub.displayName,
          selectedAnswers: sub.selectedAnswerIds,
        })));
      }
    };

    // Session finished event (triggers REST fetch)
    const handleSessionFinished = async (session: any) => {
      setSessionState(SharedSessionState.FINISHED);
      // Fetch final results via REST
      await loadResults();
    };

    // Participant joined
    const handleParticipantJoined = (data: any) => {
      if (data.participants) {
        setParticipants(data.participants.map((p: any) => p.displayName));
        // DO NOT update liveScores here - ONLY scores:update event does that
      }
    };

    // Participant disconnected
    const handleParticipantDisconnected = (data: any) => {
      // Participant list updated via participant:joined event
    };

    // Error handling
    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      toast.error(error.message || 'Une erreur est survenue');
    };

    // Register all event listeners
    socket.on('session:state', updateSessionState);
    socket.on('pause:state', handlePauseState);
    socket.on('pause:start', handlePauseStart);
    socket.on('session:started', handleSessionStarted);
    socket.on('question:advanced', handleQuestionAdvanced);
    socket.on('timer:update', handleTimerUpdate);
    socket.on('timer:expired', handleTimerExpired);
    socket.on('scores:update', handleScoresUpdate);
    socket.on('answer:confirmed', handleAnswerConfirmed);
    socket.on('answer:restore', handleAnswerRestore);
    socket.on('question:stats', handleQuestionStats);
    socket.on('session:finished', handleSessionFinished);
    socket.on('participant:joined', handleParticipantJoined);
    socket.on('participant:disconnected', handleParticipantDisconnected);
    socket.on('error', handleError);

    // Cleanup on unmount - remove ALL listeners
    return () => {
      socket.off('session:state', updateSessionState);
      socket.off('pause:state', handlePauseState);
      socket.off('pause:start', handlePauseStart);
      socket.off('session:started', handleSessionStarted);
      socket.off('question:advanced', handleQuestionAdvanced);
      socket.off('timer:update', handleTimerUpdate);
      socket.off('timer:expired', handleTimerExpired);
      socket.off('scores:update', handleScoresUpdate);
      socket.off('answer:restore', handleAnswerRestore);
      socket.off('answer:confirmed', handleAnswerConfirmed);
      socket.off('question:stats', handleQuestionStats);
      socket.off('session:finished', handleSessionFinished);
      socket.off('participant:joined', handleParticipantJoined);
      socket.off('participant:disconnected', handleParticipantDisconnected);
      socket.off('error', handleError);
      socket.disconnect();
      socketRef.current = null;
    };
    };
    
    initSession();
  }, [sessionId, user]);

  const updateSessionState = (state: any) => {
    setSessionState(state.state as SharedSessionState);
    
    // Set session code from WebSocket
    if (state.code) {
      setSessionCode(state.code);
    }
    
    if (state.participants) {
      setParticipants(state.participants.map((p: any) => p.displayName));
      
      // ONLY initialize if scoreboard is empty to prevent overwriting scores:update
      setLiveScores(prev => {
        if (prev.length === 0) {
          return state.participants.map((p: any) => ({
            studentName: p.displayName,
            score: 0,
            totalQuestions: state.totalQuestions || 0,
          }));
        }
        return prev;
      });
    }
    
    if (state.currentSessionIndex !== undefined) {
      setCurrentQuestionIndex(state.currentSessionIndex);
      
      // Calculate remaining timer from currentQuestionEndsAt
      if (state.currentQuestionEndsAt) {
        const endsAt = new Date(state.currentQuestionEndsAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
        setTimeLeft(remaining);
      }
    }
  };

  // Session data now loaded exclusively via WebSocket (session:state event)

  const loadResults = async () => {
    try {
      const results = await sessionService.getResults(sessionId);
      
      // Set final results for results screen
      setFinalResults(results.results.map((r: any) => ({
        studentName: r.displayName,
        score: r.score,
        totalQuestions: r.totalQuestions,
      })));
      
      // DO NOT set liveScores here - scores:update is the ONLY source of truth during session
      // liveScores is managed by WebSocket, finalResults is for the results screen
      
      // Find current user's score and answers
      if (user && !isTeacher) {
        const userResult = results.results.find((r: any) => r.userId === user.id);
        if (userResult) {
          setUserScore(userResult.score);
          setUserAnswers(userResult.answers || []);
        }
      }
    } catch (error) {
      console.error("Failed to load results:", error);
    }
  };

  // ============================================
  // LOAD RESULTS FROM DB (for rejoining finished sessions)
  // ============================================
  useEffect(() => {
    // If session is already finished when we join (rejoining later), fetch results from DB
    if (sessionState === SharedSessionState.FINISHED && finalResults.length === 0) {
      loadResults();
    }
  }, [sessionState, finalResults.length]);

  // ============================================
  // TIMER MANAGEMENT
  // ============================================
  // Timer is now fully managed by server WebSocket broadcasts
  // No local countdown needed

  useEffect(() => {
    if (isBetweenQuestions && pauseTimeLeft > 0) {
      const timer = setTimeout(() => setPauseTimeLeft(pauseTimeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isBetweenQuestions && pauseTimeLeft === 0) {
      // Server handles auto-advance after 10 seconds, just clear local state
      setIsBetweenQuestions(false);
      setSelectedAnswers([]);
      setStudentAnswers([]);
      setStudentResults([]);
    }
  }, [isBetweenQuestions, pauseTimeLeft]);

  // ============================================
  // EVENT HANDLERS: Quiz Flow
  // ============================================
  const handleStartQuiz = async () => {
    if (!socketRef.current || !user) return;
    
    try {
      // Emit WebSocket event
      socketRef.current.emit('session:start', { sessionId, userId: user.id });
    } catch (error) {
      console.error("Failed to start quiz:", error);
      toast.error("Erreur lors du démarrage du quiz");
    }
  };

  const handleAnswerSelect = async (answerId: string) => {
    if (!socketRef.current || !user) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    let newSelectedAnswers: string[];
    
    if (currentQuestion.type === QuestionType.SINGLE_CHOICE) {
      newSelectedAnswers = [answerId];
    } else {
      newSelectedAnswers = selectedAnswers.includes(answerId)
        ? selectedAnswers.filter((id) => id !== answerId)
        : [...selectedAnswers, answerId];
    }
    
    setSelectedAnswers(newSelectedAnswers);
    
    // Submit answer via WebSocket
    try {
      socketRef.current.emit('answer:submit', {
        sessionId,
        userId: user.id,
        questionId: currentQuestion.id,
        selectedAnswerIds: newSelectedAnswers,
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error("Erreur lors de l'envoi de la réponse");
    }
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
    isBetweenQuestions,
    questions,
    currentQuestion,
    currentQuestionIndex,
    timeLeft,
    selectedAnswers,
    studentAnswers,
    studentResults,
    finalResults,
    userScore,
    userAnswers,
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
