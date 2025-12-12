import { z } from "zod";

export const quizAnswerSchema = z.object({
  text: z.string().min(1, "La réponse ne peut pas être vide"),
  isCorrect: z.boolean(),
  color: z.enum(["red", "blue", "yellow", "green", "purple", "orange"]),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1, "La question ne peut pas être vide"),
  type: z.enum(["single", "multiple"]),
  answers: z
    .array(quizAnswerSchema)
    .min(2, "Au moins 2 réponses sont requises")
    .max(6, "Maximum 6 réponses")
    .refine(
      (answers) => answers.some((answer) => answer.isCorrect),
      "Au moins une réponse doit être correcte"
    )
    .refine(
      (answers) => {
        const seen = new Set<string>();
        for (const a of answers) {
          const key = a.text.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      },
      "Les réponses doivent être uniques"
    ),
  timeLimit: z.number().min(5).max(300),
});

export const createQuizSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  questions: z
    .array(quizQuestionSchema)
    .min(1, "Au moins une question est requise"),
});

export type QuizAnswerFormData = z.infer<typeof quizAnswerSchema>;
export type QuizQuestionFormData = z.infer<typeof quizQuestionSchema>;
export type CreateQuizFormData = z.infer<typeof createQuizSchema>;
