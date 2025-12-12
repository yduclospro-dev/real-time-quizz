"use client";

import { useParams } from "next/navigation";
import { ConfirmQuitSessionModal } from "@/components/session/ConfirmQuitSessionModal";
import { SessionLobby } from "@/components/session/SessionLobby";
import { SessionInProgress } from "@/components/session/SessionInProgress";
import { SessionBetweenQuestions } from "@/components/session/SessionBetweenQuestions";
import { SessionFinished } from "@/components/session/SessionFinished";
import { useQuizSession } from "@/hooks/useQuizSession";

/**
 * Session orchestrator - renders the appropriate component based on session state.
 * All logic and state management is in useQuizSession hook.
 */
export default function SessionPage() {
  const params = useParams();
  const quizID = params.quizID as string;

  const {
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
  } = useQuizSession(quizID);

  // Render state-specific components
  let content;

  if (sessionState === "lobby") {
    content = (
      <SessionLobby
        isTeacher={isTeacher}
        sessionCode={sessionCode}
        participants={participants}
        onQuit={handleQuitSession}
        onStart={handleStartQuiz}
        onCopyCode={copySessionCode}
      />
    );
  } else if (sessionState === "in-progress") {
    const currentQuestion = questions[currentQuestionIndex];
    content = (
      <SessionInProgress
        isTeacher={isTeacher}
        currentQuestion={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        timeLeft={timeLeft}
        selectedAnswers={selectedAnswers}
        studentAnswers={studentAnswers}
        totalStudents={participants.length}
        liveScores={liveScores}
        onQuit={handleQuitSession}
        onAnswerSelect={handleAnswerSelect}
      />
    );
  } else if (sessionState === "between-questions") {
    const currentQuestion = questions[currentQuestionIndex];
    content = (
      <SessionBetweenQuestions
        isTeacher={isTeacher}
        currentQuestion={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        userAnswers={selectedAnswers}
        studentResults={studentResults}
        pauseTimeLeft={pauseTimeLeft}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        liveScores={liveScores}
        onQuit={handleQuitSession}
      />
    );
  } else if (sessionState === "finished") {
    content = (
      <SessionFinished
        isTeacher={isTeacher}
        questions={questions}
        finalResults={finalResults}
        userScore={userScore}
        showCorrection={showCorrection}
        onToggleCorrection={setShowCorrection}
        onQuit={handleQuitSession}
      />
    );
  }

  return (
    <>
      {content}
      <ConfirmQuitSessionModal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        onConfirm={handleConfirmQuit}
      />
    </>
  );
}
