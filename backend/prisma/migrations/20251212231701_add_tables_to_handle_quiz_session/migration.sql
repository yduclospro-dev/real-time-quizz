-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('CREATED', 'STARTED', 'FINISHED');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "state" "SessionState" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "currentQuestionEndsAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "participantToken" TEXT,

    CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerSubmission" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswerIds" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFinal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AnswerSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_code_key" ON "Session"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SessionParticipant_sessionId_userId_key" ON "SessionParticipant"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionParticipant" ADD CONSTRAINT "SessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerSubmission" ADD CONSTRAINT "AnswerSubmission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerSubmission" ADD CONSTRAINT "AnswerSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SessionParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerSubmission" ADD CONSTRAINT "AnswerSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
