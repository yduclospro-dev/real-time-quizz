'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { LoginData, RegisterData } from '@/types/auth.types';
import toast from 'react-hot-toast';
import { UserDto } from '../../../backend/src/common/types/user-dto';

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
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(['auth', 'me'], response.data.user);
        toast.success('Connexion réussie !');
        router.push('/');
      }
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Erreur lors de la connexion';
      toast.error(message);
    },
  });

  // Mutation pour l'inscription
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData(['auth', 'me'], response.data.user);
        toast.success('Inscription réussie !');
        router.push('/');
      }
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Erreur lors de l'inscription";
      toast.error(message);
    },
  });

  // Mutation pour la déconnexion
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
      toast.success('Déconnexion réussie !');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Erreur lors de la déconnexion';
      toast.error(message);
    },
  });

  const login = async (data: LoginData) => {
    await loginMutation.mutateAsync(data);
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
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
