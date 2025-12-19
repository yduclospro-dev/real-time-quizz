import { QuizQuestion } from "@/types/quiz.types";
import { QuestionType } from '@shared/enums/question-type';
import { SessionState } from '@shared/enums/session-state';

/**
 * MOCK DATA FOR DEVELOPMENT
 * This file contains mock data structures for testing the session UI
 * Backend devs: Use these structures as reference for WebSocket events and API responses
 */

// Mock session data
export const MOCK_SESSION = {
  sessionCode: "ABC123",
  participants: [
    "Jean Dupont",
    "Marie Martin",
    "Pierre Dubois",
    "Sophie Laurent"
  ],
  // Use backend enum values for state to keep mocks consistent with server
  state: SessionState.CREATED as SessionState,
};

// Mock quiz questions
export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "1",
    question: "Quelle est la capitale de la France ?",
    type: QuestionType.SINGLE_CHOICE,
    timeLimit: 10,
    imageUrl: undefined,
    answers: [
      { id: "1", text: "Paris", isCorrect: true, color: "red" },
      { id: "2", text: "Lyon", isCorrect: false, color: "blue" },
      { id: "3", text: "Marseille", isCorrect: false, color: "yellow" },
      { id: "4", text: "Toulouse", isCorrect: false, color: "green" },
    ],
  },
  {
    id: "2",
    question: "Quels sont des langages de programmation ?",
    type: QuestionType.MULTIPLE_CHOICE,
    timeLimit: 10,
    imageUrl: undefined,
    answers: [
      { id: "1", text: "Python", isCorrect: true, color: "red" },
      { id: "2", text: "HTML", isCorrect: false, color: "blue" },
      { id: "3", text: "JavaScript", isCorrect: true, color: "yellow" },
      { id: "4", text: "CSS", isCorrect: false, color: "green" },
    ],
  },
  {
    id: "3",
    question: "Combien font 2 + 2 ?",
    type: QuestionType.SINGLE_CHOICE,
    timeLimit: 10,
    imageUrl: undefined,
    answers: [
      { id: "1", text: "3", isCorrect: false, color: "red" },
      { id: "2", text: "4", isCorrect: true, color: "blue" },
      { id: "3", text: "5", isCorrect: false, color: "yellow" },
      { id: "4", text: "6", isCorrect: false, color: "green" },
    ],
  },
];

// Mock student answers (for teacher view)
export const MOCK_STUDENT_ANSWERS = [
  { studentName: "Jean Dupont", selectedAnswers: ["1"] },
  { studentName: "Marie Martin", selectedAnswers: ["1"] },
  { studentName: "Pierre Dubois", selectedAnswers: ["2"] },
];

// Mock final results
export const MOCK_FINAL_RESULTS = [
  { studentName: "Jean Dupont", score: 8, totalQuestions: 10 },
  { studentName: "Marie Martin", score: 9, totalQuestions: 10 },
  { studentName: "Pierre Dubois", score: 7, totalQuestions: 10 },
  { studentName: "Sophie Laurent", score: 6, totalQuestions: 10 },
].sort((a, b) => a.studentName.localeCompare(b.studentName));

/**
 * EXPECTED WEBSOCKET EVENTS
 * Backend devs: Implement these WebSocket events
 */
export const WEBSOCKET_EVENTS = {
  // Client -> Server
  JOIN_SESSION: "session:join",
  SUBMIT_ANSWER: "session:answer",
  START_QUIZ: "session:start",

  // Server -> Client
  PARTICIPANT_JOINED: "session:participant-joined",
  PARTICIPANT_LEFT: "session:participant-left",
  QUIZ_STARTED: "session:quiz-started",
  QUESTION_START: "session:question-start",
  ANSWER_RECEIVED: "session:answer-received", // For teacher view
  QUESTION_END: "session:question-end",
  QUIZ_END: "session:quiz-end",
  SESSION_ERROR: "session:error",
};

/**
 * EXPECTED API ENDPOINTS
 * Backend devs: Implement these REST endpoints
 */
export const API_ENDPOINTS = {
  // POST /api/sessions/:quizId/start - Start a new session
  // Response: { sessionId: string, sessionCode: string }
  
  // GET /api/sessions/:sessionId - Get session details
  // Response: { sessionId, sessionCode, quizId, participants[], state, currentQuestion? }
  
  // POST /api/sessions/join - Join session by code
  // Body: { sessionCode: string }
  // Response: { sessionId: string, quizId: string }
};
