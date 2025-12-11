"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useFormValidation } from "@/hooks/useFormValidation";
import { loginSchema, LoginFormData } from "@/schemas/auth.schema";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { validate } = useFormValidation(loginSchema);

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof LoginFormData]) {
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
    await login(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Connexion
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isLoading}
              autoComplete="email"
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
              autoComplete="current-password"
            />

            <Button type="submit" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous n&apos;avez pas de compte ?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
