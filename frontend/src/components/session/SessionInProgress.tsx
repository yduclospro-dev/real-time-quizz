import { StudentQuestionView } from "./StudentQuestionView";
import { TeacherQuestionView } from "./TeacherQuestionView";
import { Scoreboard } from "./Scoreboard";
import { QuizQuestion } from "@/types/quiz.types";

interface StudentAnswer {
  studentName: string;
  selectedAnswers: string[];
}

interface SessionInProgressProps {
  isTeacher: boolean;
  currentQuestion: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  selectedAnswers: string[];
  studentAnswers: StudentAnswer[];
  totalStudents: number;
  liveScores: Array<{ studentName: string; score: number; totalQuestions: number }>;
  onAnswerSelect: (answerId: string) => void;
}

export function SessionInProgress({
  isTeacher,
  currentQuestion,
  questionNumber,
  totalQuestions,
  timeLeft,
  selectedAnswers,
  studentAnswers,
  totalStudents,
  liveScores,
  onAnswerSelect,
}: SessionInProgressProps) {
  return (
    <div className="grid grid-cols-[280px_1fr_280px] gap-4 px-12 py-8">
        {/* Empty left spacer */}
        <div></div>

        {/* Main content - centered */}
        <div>
          {isTeacher ? (
            <TeacherQuestionView
              question={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              timeLeft={timeLeft}
              studentAnswers={studentAnswers}
              totalStudents={totalStudents}
            />
          ) : (
            <StudentQuestionView
              question={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              timeLeft={timeLeft}
              selectedAnswers={selectedAnswers}
              onAnswerSelect={onAnswerSelect}
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
  );
}
