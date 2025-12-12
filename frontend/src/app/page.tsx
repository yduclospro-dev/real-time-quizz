'use client';

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "../../../shared/enums/role";

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-xl font-bold text-gray-900">Quiz Real-Time</h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bienvenue, {user.firstName} !
            </h2>
            <p className="text-xl text-gray-600">
              {user.role === Role.TEACHER 
                ? 'Gérez vos quiz et lancez des sessions en temps réel' 
                : 'Rejoignez des sessions de quiz et testez vos connaissances'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.role === Role.TEACHER ? (
              <>
                <Link
                  href="/quiz"
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Créer un quiz
                  </h3>
                  <p className="text-gray-600">
                    Créez de nouveaux quiz avec vos questions personnalisées
                  </p>
                </Link>
                <Link
                  href="/quiz"
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Mes quiz
                  </h3>
                  <p className="text-gray-600">
                    Consultez et gérez tous vos quiz existants
                  </p>
                </Link>
                <Link
                  href="/sessions"
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Sessions actives
                  </h3>
                  <p className="text-gray-600">
                    Lancez et suivez vos sessions de quiz en direct
                  </p>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/join"
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Rejoindre une session
                  </h3>
                  <p className="text-gray-600">
                    Entrez le code pour rejoindre un quiz en temps réel
                  </p>
                </Link>
                <Link
                  href="/history"
                  className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    Mon historique
                  </h3>
                  <p className="text-gray-600">
                    Consultez vos résultats et performances passées
                  </p>
                </Link>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center justify-center gap-8 p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Quiz Real-Time
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Plateforme de quiz interactif en temps réel pour enseignants et étudiants
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 text-base font-medium">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-8 text-white transition-colors sm:w-auto"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-blue-600 px-8 text-blue-600 hover:bg-blue-50 transition-colors sm:w-auto"
          >
            S&apos;inscrire
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Pour les enseignants
            </h3>
            <p className="text-gray-600">
              Créez des quiz interactifs, lancez des sessions en temps réel et suivez les résultats de vos étudiants
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Pour les étudiants
            </h3>
            <p className="text-gray-600">
              Rejoignez des sessions de quiz, répondez en temps réel et consultez vos résultats instantanément
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}