"use client";

import { ConfirmQuitSessionModal } from "@/components/session/ConfirmQuitSessionModal";
import { SessionLobby } from "@/components/session/SessionLobby";
import { SessionInProgress } from "@/components/session/SessionInProgress";
import { SessionBetweenQuestions } from "@/components/session/SessionBetweenQuestions";
import { SessionFinished } from "@/components/session/SessionFinished";
import { Header } from "@/components/layout/Header";
import { useQuizSession } from "@/hooks/useQuizSession";
import { SessionState } from '../../../../../../../shared/enums/session-state';

/**
 * Session orchestrator - renders the appropriate component based on session state.
 * All logic and state management is in useQuizSession hook.
 */
export default function SessionPage() {
  const {
    sessionState,
    sessionCode,
    participants,
    isTeacher,
    isBetweenQuestions,
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
  } = useQuizSession();

  // Render state-specific components
  let content: React.ReactNode = null;
  let headerTitle = '';
  let showHeader = false;

  // sessionState is a shared enum (CREATED/STARTED/FINISHED). We use a local flag for between-questions in the hook.
  if (sessionState === SessionState.CREATED) {
    showHeader = true;
    headerTitle = 'Session en attente';
    content = (
      <SessionLobby
        isTeacher={isTeacher}
        sessionCode={sessionCode}
        participants={participants}
        onStart={handleStartQuiz}
        onCopyCode={copySessionCode}
      />
    );
  } else if (sessionState === SessionState.STARTED && !isBetweenQuestions) {
    const currentQuestion = questions[currentQuestionIndex];
    showHeader = true;
    headerTitle = `Question ${currentQuestionIndex + 1}/${questions.length}`;
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
        onAnswerSelect={handleAnswerSelect}
      />
    );
  } else if (sessionState === SessionState.STARTED && isBetweenQuestions) {
    const currentQuestion = questions[currentQuestionIndex];
    showHeader = true;
    headerTitle = 'Résultat';
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
      />
    );
  } else if (sessionState === SessionState.FINISHED) {
    showHeader = true;
    headerTitle = 'Quiz terminé';
    content = (
      <SessionFinished
        isTeacher={isTeacher}
        questions={questions}
        finalResults={finalResults}
        userScore={userScore}
        showCorrection={showCorrection}
        onToggleCorrection={setShowCorrection}
      />
    );
  }

  return (
    <>
      {showHeader && <Header title={headerTitle} onQuit={handleQuitSession} hideLogout={true} />}
      {content}
      <ConfirmQuitSessionModal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        onConfirm={handleConfirmQuit}
      />
    </>
  );
}