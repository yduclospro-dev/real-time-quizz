import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
