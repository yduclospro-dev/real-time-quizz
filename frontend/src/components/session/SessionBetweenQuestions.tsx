import { Header } from "@/components/layout/Header";
import { QuestionResults } from "./QuestionResults";
import TeacherQuestionResults from "./TeacherQuestionResults";
import { Scoreboard } from "./Scoreboard";
import { QuizQuestion } from "@/types/quiz.types";

interface StudentResult {
  studentName: string;
  selectedAnswers: string[];
  isCorrect: boolean;
  answeredInTime: boolean;
}

interface SessionBetweenQuestionsProps {
  isTeacher: boolean;
  currentQuestion: QuizQuestion;
  questionNumber: number;
  userAnswers: string[];
  studentResults: StudentResult[];
  pauseTimeLeft: number;
  isLastQuestion: boolean;
  liveScores: Array<{ studentName: string; score: number; totalQuestions: number }>;
  onQuit: () => void;
}

export function SessionBetweenQuestions({
  isTeacher,
  currentQuestion,
  questionNumber,
  userAnswers,
  studentResults,
  pauseTimeLeft,
  isLastQuestion,
  liveScores,
  onQuit,
}: SessionBetweenQuestionsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <Header title="Résultat" onQuit={onQuit} />
      <div className="grid grid-cols-[280px_1fr_280px] gap-4 px-12 py-8">
        {/* Empty left spacer */}
        <div></div>

        {/* Main content - centered */}
        <div>
          {isTeacher ? (
            <TeacherQuestionResults
              question={currentQuestion}
              questionNumber={questionNumber}
              studentResults={studentResults}
              pauseTimeLeft={pauseTimeLeft}
              isLastQuestion={isLastQuestion}
            />
          ) : (
            <QuestionResults
              question={currentQuestion}
              questionNumber={questionNumber}
              userAnswers={userAnswers}
              isTeacher={false}
              pauseTimeLeft={pauseTimeLeft}
              isLastQuestion={isLastQuestion}
            />
          )}
        </div>

        {/* Scoreboard - right column */}
        <div>
          <Scoreboard
            scores={liveScores}
            currentUserId={!isTeacher ? "Current User" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
