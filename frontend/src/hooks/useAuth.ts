import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { RegisterDto, LoginDto, ApiError } from "@/types/auth.types";

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const register = async (data: RegisterDto) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      router.push("/login");
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginDto) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      toast.success("Connexion réussie !");

      // Redirect based on role
      const redirectPath =
        response.user.role === "teacher"
          ? "/dashboard/teacher"
          : "/dashboard/student";
      
      router.push(redirectPath);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message);
    }
  };

  return {
    register,
    login,
    logout,
    isLoading,
  };
};
