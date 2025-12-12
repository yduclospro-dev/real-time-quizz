import { ApiError } from './api-client';

type MappedError = {
  title: string;
  message: string;
};

const MESSAGES: Record<string, MappedError> = {
  AUTH_FAILED: { title: 'Authentification', message: "Échec de l'authentification. Vérifiez vos identifiants." },
  VALIDATION_ERROR: { title: 'Validation', message: 'Certains champs sont invalides. Vérifiez les erreurs ci-dessous.' },
  EMAIL_TAKEN: { title: 'Email', message: "Cet email est déjà utilisé." },
  USER_NOT_FOUND: { title: 'Utilisateur', message: "Utilisateur introuvable." },
  FORBIDDEN: { title: 'Accès refusé', message: "Vous n'avez pas la permission d'effectuer cette action." },
  UNKNOWN_ERROR: { title: 'Erreur', message: "Une erreur inattendue est survenue." },
  // Add more mappings as backend codes stabilize
};

export const mapApiErrorToUserMessage = (err?: ApiError | null): MappedError => {
  if (!err) return { title: 'Erreur', message: 'Une erreur est survenue' };

  const mapped = err.code ? MESSAGES[err.code] : undefined;
  if (mapped) return mapped;

  // Fallback to the server message if present, otherwise generic
  return {
    title: err.code || 'Erreur',
    message: err.message || 'Une erreur est survenue',
  };
};

export default mapApiErrorToUserMessage;
