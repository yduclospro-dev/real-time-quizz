# 🎯 Real-Time Quiz Platform

## 📋 Présentation

Plateforme de quiz interactif en temps réel permettant aux **enseignants** de créer et animer des quiz, et aux **étudiants** de participer via un code de session.

**Fonctionnalités principales** :
- Communication temps réel via WebSockets (Socket.io)
- Authentication JWT avec rôles (TEACHER/STUDENT)
- Timer synchronisé côté serveur
- Classement en direct
- Éditeur de quiz avec drag & drop

---

## ✨ Fonctionnalités

### Pour les Enseignants
- ✏️ **Créer des quiz** avec éditeur drag & drop :
  - Questions à **choix unique** (une seule bonne réponse) ou **choix multiple** (plusieurs bonnes réponses)
  - Minimum 2 réponses par question, au moins une correcte
  - Upload d'images optionnel pour chaque question
  - Timer personnalisable par question (10-300 secondes)
  - Réorganisation des questions par glisser-déposer
- 🚀 Lancer des sessions avec code d'accès unique
- 👥 Visualiser les participants en temps réel dans le lobby
- ▶️ Démarrer le quiz (ensuite automatique)
- 📊 Voir les statistiques de réponses en direct
- 📈 Consulter les résultats et classement final
- 📚 Accéder à l'historique des sessions

### Pour les Étudiants
- 🔑 Rejoindre une session via code d'accès
- ✍️ Répondre aux questions avec timer synchronisé
- 🏆 Visualiser classement en temps réel entre chaque question
- 📊 Consulter son score et sa position
- 📜 Accéder à la correction complète après la session
- 📚 Voir l'historique de ses participations

---

## 🛠️ Stack Technologique

### Backend
| Technologie | Version | Usage |
|------------|---------|-------|
| **NestJS** | 11.0 | Framework backend Node.js |
| **TypeScript** | 5.7 | Typage statique |
| **Prisma** | 7.1 | ORM PostgreSQL |
| **PostgreSQL** | 15 | Base de données |
| **Socket.io** | 4.8 | WebSockets temps réel |
| **JWT** | 11.0 | Authentication |
| **bcrypt** | 6.0 | Hash des mots de passe |

### Frontend
| Technologie | Version | Usage |
|------------|---------|-------|
| **Next.js** | 16.0 | Framework React avec App Router |
| **React** | 19.2 | UI library |
| **TypeScript** | 5.7 | Typage statique |
| **Tailwind CSS** | 4.0 | Styling |
| **TanStack Query** | 5.90 | Cache et synchronisation |
| **Socket.io Client** | 4.8 | Client WebSocket |
| **@dnd-kit** | 6.3 | Drag & drop |

### Shared
- Enums TypeScript partagés (`Role`, `QuestionType`, `SessionState`)
- Types communs (`ApiResponse`, `UserDto`, `AnswerColor`)

---

## 🚀 Installation

### Prérequis
- Node.js v20+
- Docker (ou PostgreSQL 15+ local)

### 1. Installation
```bash
# Cloner le projet
git clone <repository-url>
cd real-time-quizz

# Installer toutes les dépendances
npm run install:all
```

### 2. Base de données
```bash
# Démarrer PostgreSQL avec Docker
docker-compose up -d

# Base accessible sur localhost:5433
```

### 3. Configuration

**Backend** (`backend/.env`) :
```env
DATABASE_URL="postgresql://quiz:quiz@localhost:5433/quizdb"
JWT_SECRET="your-secret-key-64-chars-min"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:8080"
```

**Frontend** (optionnel `frontend/.env.local`) :
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```


### 4. Initialisation Prisma
```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate
```

### 5. Lancement
```bash
# Démarrer frontend + backend
npm run dev

# Frontend : http://localhost:8080
# Backend : http://localhost:3000
# API Docs : http://localhost:3000/api
```

---

## 📖 Utilisation

### Créer un compte enseignant
1. Accédez à http://localhost:8080/register
2. Sélectionnez "Enseignant"
3. Créez votre compte

### Créer et lancer un quiz (enseignant)
1. Cliquez sur "Créer un quiz"
2. Ajoutez des questions (min 2 réponses, timer 10-300s)
3. Réorganisez par drag & drop si besoin
4. Enregistrez le quiz
5. Cliquez sur "Démarrer une session"
6. Partagez le code généré (ex: ABC123)
7. Attendez les participants dans le lobby
8. Cliquez sur "Démarrer le quiz"

### Rejoindre une session (étudiant)
1. Créez un compte "Étudiant"
2. Cliquez sur "Rejoindre une session"
3. Entrez le code fourni
4. Répondez aux questions quand elles apparaissent
5. Consultez votre classement et résultats

---

## 📚 Documentation API

**Documentation interactive** : http://localhost:3000/api  
Interface Scalar UI permettant de tester tous les endpoints avec authentication JWT intégrée.

**Spécification OpenAPI** : http://localhost:3000/openapi.json  
Format OpenAPI 3.0 importable dans Postman/Insomnia.

### Endpoints principaux

**Authentication**
```
POST /auth/register    # Inscription
POST /auth/login       # Connexion (retourne JWT en cookie)
GET  /auth/me          # Utilisateur actuel
POST /auth/logout      # Déconnexion
```

**Quiz** (Teacher only)
```
POST   /quiz           # Créer un quiz
GET    /quiz           # Liste des quiz
GET    /quiz/:id       # Détails d'un quiz
PUT    /quiz/:id       # Modifier un quiz
DELETE /quiz/:id       # Supprimer un quiz
POST   /quiz/:id/start # Créer une session
```

**Session**
```
POST /session/join           # Rejoindre avec code
GET  /session/:id            # Détails session
POST /session/:id/start      # Démarrer (Teacher)
POST /session/:id/submit     # Soumettre réponse (Student)
POST /session/:id/advance    # Question suivante 
POST /session/:id/finish     # Terminer 
GET  /session/:id/results    # Résultats finaux
GET  /session/history        # Historique utilisateur
```

---

## 🔌 WebSockets

### Architecture
- **Backend** : Gateway NestJS avec Socket.io
- **Frontend** : Hook React `useQuizSession` gérant la connexion
- **Rooms** : Chaque session est une room isolée

### Événements principaux

**Client → Serveur**
- `session:join` - Rejoindre une session
- `session:start` - Démarrer le quiz
- `answer:submit` - Soumettre une réponse
- `question:advance` - Avancer à la question suivante (appelé auto par timer)
- `session:finish` - Terminer la session (appelé auto en fin de quiz)

**Serveur → Client**
- `session:state` - État complet de la session
- `participant:joined` - Nouveau participant
- `session:started` - Quiz démarré
- `question:advanced` - Nouvelle question
- `timer:update` - Mise à jour timer (chaque seconde)
- `answer:confirmed` - Confirmation de soumission
- `scores:update` - Classement mis à jour
- `session:finished` - Session terminée

### Timer synchronisé & Avancement automatique
Le timer est géré **côté serveur** et diffusé chaque seconde à tous les clients pour éviter toute triche.

**Avancement automatique** : Quand le timer d'une question expire, le serveur avance automatiquement à la question suivante et affiche le classement. À la fin du quiz, la session se termine automatiquement.

---

## 🏗️ Architecture

### Choix : Monorepo
```
real-time-quizz/
├── frontend/          # Next.js 16 + React 19
├── backend/           # NestJS 11 + Prisma 7
└── shared/            # Types TypeScript partagés
```

**Pourquoi un monorepo ?**
- **Partage de types** : Les enums (`Role`, `QuestionType`, `SessionState`) et interfaces sont importés directement depuis `@shared/` sans duplication
- **Synchronisation** : Une modification de type côté backend est immédiatement détectée côté frontend par TypeScript
- **Déploiement simplifié** : Un seul repository à cloner, une seule CI/CD à configurer
- **Refactoring sécurisé** : Renommer un enum met à jour automatiquement tous les usages (front + back)

**Alternative considérée** : Repos séparés avec package npm pour les types → rejeté car nécessite publication et versioning

### Backend - Modules NestJS
- `auth/` - Authentication JWT
- `user/` - Gestion utilisateurs
- `quiz/` - CRUD quiz
- `question/` - Gestion questions
- `session/` - Sessions et soumissions
- `websocket/` - Gateway Socket.io
- `prisma/` - Service ORM

### Base de données - Prisma
9 modèles : `User`, `Quiz`, `Question`, `Answer`, `Session`, `SessionParticipant`, `AnswerSubmission` + enums

---

## 🎯 Choix Techniques Justifiés

### Pourquoi NestJS ?
- **Architecture structurée** : Modules, controllers, services (similaire à Spring Boot)
- **Dependency Injection native** : Facilite les tests et la maintenabilité
- **WebSockets intégrés** : Support natif de Socket.io via `@nestjs/websockets`
- **TypeScript first** : Typage strict côté serveur
- **Alternative considérée** : Express.js → rejeté car trop minimaliste, nécessite beaucoup de configuration manuelle

### Pourquoi Prisma ORM ?
- **Type-safety complet** : Client TypeScript généré automatiquement depuis le schéma
- **Migrations automatiques** : `prisma migrate dev` gère l'évolution du schéma
- **Requêtes optimisées** : Prisma génère des requêtes SQL optimales
- **Protection SQL Injection** : Requêtes paramétrées par défaut
- **Alternative considérée** : TypeORM → rejeté car moins type-safe et plus verbeux

### Pourquoi Socket.io pour WebSockets ?
- **Fallback automatique** : Si WebSocket échoue, bascule sur long-polling
- **Rooms natifs** : Parfait pour isoler les sessions (chaque session = une room)
- **Reconnexion automatique** : Gère les coupures réseau sans intervention
- **Broadcast simplifié** : `server.to(sessionId).emit()` envoie à tous les participants
- **Alternative considérée** : WebSocket natif → rejeté car pas de fallback ni de rooms

### Pourquoi Next.js ?
- **App Router moderne** : Routing basé sur le système de fichiers
- **Server Components** : Rendu côté serveur pour de meilleures performances
- **Optimisations automatiques** : Code splitting, image optimization
- **Alternative considérée** : Create React App → obsolète, pas de SSR

### Pourquoi TanStack Query ?
- **Cache intelligent** : Évite les requêtes API inutiles
- **Synchronisation auto** : Refetch au focus de la fenêtre
- **Optimistic updates** : UI réactive avant la réponse serveur
- **Alternative considérée** : SWR → moins de fonctionnalités avancées

---

## 🔄 Gestion des Déconnexions et Reconnexions

### Côté Serveur (WebSocket Gateway)
```typescript
async handleDisconnect(client: Socket) {
  const sessionId = this.userSessions.get(client.id);
  
  if (sessionId) {
    this.userSessions.delete(client.id);
    
    // Notifier les autres participants
    this.server.to(sessionId).emit('participant:disconnected', {
      socketId: client.id,
    });

    // Si la room est vide, nettoyer les timers
    const room = this.server.sockets.adapter.rooms.get(sessionId);
    if (!room || room.size === 0) {
      this.stopTimerBroadcast(sessionId);
    }
  }
}
```

**Comportement** :
- Les autres participants sont notifiés quand quelqu'un se déconnecte
- Les réponses déjà soumises restent en base de données
- Si la room devient vide, les timers sont arrêtés pour libérer les ressources
- La session reste en base et continue de tourner

### Côté Client (Socket.io Client)
Socket.io gère automatiquement la reconnexion avec backoff exponentiel :
- Reconnexion automatique après coupure réseau
- Le hook `useQuizSession` se réabonne aux événements après reconnexion
- L'utilisateur est renvoyé directement à la question en cours (pas besoin de recommencer)
- Son score et toutes ses réponses sont intacts

---

## 🧪 Tests

### Backend
```bash
cd backend

# Tous les tests
npm test

# Avec coverage
npm run test:cov
```

**Coverage actuel** : 77.57% statements

**Tests implémentés** :
- ✅ Authentication (register, login, JWT)
- ✅ Quiz CRUD et validation
- ✅ Session (join, submit, advance, finish)
- ✅ WebSocket (connexion, événements, timer)

