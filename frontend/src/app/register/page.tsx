"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useFormValidation } from "@/hooks/useFormValidation";
import { registerSchema, RegisterFormData } from "@/schemas/auth.schema";
import { Role } from "@shared/enums/role";
import { useFieldErrorContext } from '@/contexts/FieldErrorContext';

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Élève" },
  { value: "TEACHER", label: "Professeur" },
];

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const { validate } = useFormValidation(registerSchema);
  const { setFieldErrorsFromApiError } = useFieldErrorContext();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: Role.STUDENT || Role.TEACHER,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const { isValid, errors: validationErrors } = validate(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    try {
      await register({
        ...formData,
        role: formData.role as Role,
      });
    } catch (err: any) {
      if (err?.details) {
        setFieldErrorsFromApiError(err);
      }
      // global toast is handled by useApiMutation; nothing to do here
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Inscription
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Prénom"
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              disabled={isLoading}
            />

            <Input
              label="Nom"
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              disabled={isLoading}
            />

            <Input
              label="Email"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isLoading}
            />

            <Input
              label="Mot de passe"
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
            />

            <Select
              label="Rôle"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={ROLE_OPTIONS}
              error={errors.role}
              disabled={isLoading}
            />

            <Button type="submit" isLoading={isLoading}>
              S&apos;inscrire
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
