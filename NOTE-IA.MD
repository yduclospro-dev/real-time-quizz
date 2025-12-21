# NOTE-IA

## Outils utilisés
- **GitHub Copilot** sur VSCode avec modèle **Claude Haiku 4.5**
- **ChatGPT 4.0**

## Exemples d'utilisation

**1. Gestion des stale closures dans les event listeners WebSocket**
- **Prompt :** Comment éviter les stale closures quand on lit le state React dans des event listeners Socket.io ? Les valeurs capturées au moment du `socket.on()` restent figées même si le state React change.
- **Réponse :** Utiliser des `useRef` pour chaque état qu'on lit dans les listeners. Les refs sont mutables et conservent la dernière valeur. Dans les handlers, lire depuis `participantsRef.current` au lieu de `participants`. Mettre à jour les refs via `useEffect` quand le state change : `participantsRef.current = participants`.

**2. Gestion des uploads d'images avec Cloudinary et validation côté serveur**
- **Prompt :** Pour l'upload d'images des questions, comment gérer proprement les files buffer avec Multer, les transformer avec Cloudinary, et valider les types MIME côté backend ?
- **Réponse :** Utiliser `Express.Multer.File` avec le buffer en mémoire. Configuration Cloudinary avec transformations automatiques (resize 1200x800, qualité auto). Promise wrapper autour de `upload_stream()` car Cloudinary utilise des callbacks. Validation MIME côté middleware avant d'atteindre le service. Folder `quiz-images` pour organiser les assets.

**3. Choix architectural : Express vs NestJS pour WebSockets temps réel**
- **Prompt :** Pour un projet de quiz temps réel avec WebSockets, monorepo TypeScript et authentification JWT, quel framework backend recommandes-tu entre Express et NestJS ?
- **Réponse :** NestJS pour ce projet. L'architecture modulaire (Controllers/Services/Gateways) structure naturellement les WebSockets avec Socket.io. L'injection de dépendances simplifie les tests. Le décorateur `@WebSocketGateway` gère l'auth et les rooms automatiquement. En monorepo, les types partagés s'intègrent mieux. Express nécessiterait plus de boilerplate pour la même structure.

**4. Optimiser les requêtes Prisma imbriquées pour les scores en temps réel**
- **Prompt :** Mon `getResults()` fait une grosse requête avec include sur 4 niveaux (session > quiz > questions > answers + participants > submissions). C'est lent avec beaucoup de participants. Comment optimiser ?
- **Réponse :** Split en 2 requêtes : d'abord les métadonnées (session, quiz, questions), puis une requête séparée pour les submissions avec `groupBy` ou `select`. Utiliser `findMany` avec `where: { sessionId }` au lieu d'include massif. Alternative : implémenter un cache Redis pour les scores intermédiaires, recalculer seulement les deltas lors des soumissions.

**5. Persistance des réponses lors des reconnexions WebSocket**
- **Prompt :** Comment restaurer automatiquement les réponses déjà soumises quand un étudiant se reconnecte à une question en cours ?
- **Réponse :** Dans `handleJoinSession`, utiliser `getSessionWithSubmissions()` pour récupérer l'historique des `AnswerSubmission` du participant. Filtrer par `questionId` actuelle, prendre la plus récente, et émettre `answer:restore` avec les `selectedAnswerIds`. Côté frontend, le hook met à jour `setSelectedAnswers()` avant le rendu du composant.

**6. Nettoyage des références pour éviter les données obsolètes**
- **Prompt :** Comment nettoyer proprement les références et event listeners WebSocket pour éviter que les calculs utilisent des données d'anciennes sessions ?
- **Réponse :** Dans le cleanup du `useEffect` WebSocket, réinitialiser toutes les refs : `participantsRef.current = []`, `questionsRef.current = []`. Supprimer tous les listeners avec `socket.off()` avant `socket.disconnect()`. Mettre les refs à jour dans chaque handler d'événement pour maintenir la cohérence.
