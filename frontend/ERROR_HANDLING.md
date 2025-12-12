Frontend / Error handling
------------------------

Principes:
- Le backend renvoie un format `ApiResponse` : `{ success: boolean, data, error: { code, message, details? } }`.
- Le client HTTP (`src/lib/api-client.ts`) convertit les erreurs en `ApiError` : `{ code, message, details?, status? }`.

Usage:
- Pour capturer et afficher une erreur globale, utilisez le provider `ReactQueryProvider` (déjà configuré). Pour déclencher l'affichage d'une erreur manuellement depuis un composant:

```tsx
import { useGlobalError } from './providers/ReactQueryProvider';

const { showError } = useGlobalError();
showError({ code: 'AUTH_FAILED', message: 'Authentification échouée' });
```

- Dans les hooks/custom services, remontez les erreurs telles qu'elles sont rejetées par `apiClient`; elles seront au format `ApiError`.

Conseil pour les développeurs backend:
- Utilisez `errorResponse(code, message, details?)` (backend util) pour renvoyer des erreurs structurées afin que le frontend puisse afficher un message clair et mapper les erreurs de champs.
