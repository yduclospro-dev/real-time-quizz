"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { LoginData, RegisterData } from '@/types/auth.types';
import toast from 'react-hot-toast';
import type { UserDto } from '@shared/types/user-dto';
import { ApiError } from '@/lib/api-client';
import { useFieldErrorContext } from '@/contexts/FieldErrorContext';
import { useGlobalError } from '@/providers/ReactQueryProvider';
import { useApiMutation } from '@/lib/api-hooks';

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { setFieldErrorsFromApiError } = useFieldErrorContext();
  const { showError } = useGlobalError();

  const { data: user = null, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authService.getCurrentUser();
        return response.data;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation pour le login
  const loginMutation = useApiMutation<any, any> (authService.login, {
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(['auth', 'me'], response.data.user);
        toast.success('Connexion réussie !');
        router.push('/');
      }
    },
  }, { suppressToastOnFieldErrors: true });

  // Mutation pour l'inscription
  const registerMutation = useApiMutation<any, any>(authService.register, {
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(['auth', 'me'], response.data.user);
        toast.success('Inscription réussie !');
        router.push('/');
      }
    },
  }, { suppressToastOnFieldErrors: true });

  // Mutation pour la déconnexion
  const logoutMutation = useApiMutation<any, any>(authService.logout, {
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      toast.success('Déconnexion réussie !');
    },
  });

  const login = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync(undefined);
  };

  const checkAuth = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
