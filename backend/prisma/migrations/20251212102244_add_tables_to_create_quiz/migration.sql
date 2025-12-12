/*
  Warnings:

  - The values [QCU,QCM] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('SingleChoice', 'MultipleChoice');
ALTER TABLE "Question" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "public"."QuestionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "description";

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
