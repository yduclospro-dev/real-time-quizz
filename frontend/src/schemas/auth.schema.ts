import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z
    .string()
    .min(1, "L'email est requis")
    .pipe(z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "L'email est invalide")),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .pipe(z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères")),
  role: z.enum(["STUDENT", "TEACHER"], {
    message: "Veuillez sélectionner un rôle",
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .pipe(z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "L'email est invalide")),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
