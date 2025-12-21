'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { Role } from '@shared/enums/role';
import { SessionState } from '@shared/enums/session-state';

interface SessionHistoryItem {
  id: string;
  code: string;
  state: SessionState;
  quizId: string;
  quizTitle: string;
  participantCount: number;
  createdAt: string;
  isAuthor: boolean;
}

export default function HistoryPage() {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['session-history'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SessionHistoryItem[] }>('/session/history');
      return response.data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  const getButtonText = (session: SessionHistoryItem) => {
    if (session.state === SessionState.STARTED || session.state === SessionState.CREATED) {
      return 'Retourner dans la session';
    }
    return session.isAuthor ? 'Voir les résultats du quiz' : 'Voir vos résultats';
  };

  const getButtonStyle = (session: SessionHistoryItem) => {
    if (session.state === SessionState.STARTED || session.state === SessionState.CREATED) {
      return 'bg-green-600 hover:bg-green-700';
    }
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getStateText = (state: SessionState) => {
    switch (state) {
      case SessionState.CREATED:
        return 'Créée';
      case SessionState.STARTED:
        return 'En cours';
      case SessionState.FINISHED:
        return 'Terminée';
      default:
        return state;
    }
  };

  const getStateBadgeColor = (state: SessionState) => {
    switch (state) {
      case SessionState.CREATED:
        return 'bg-yellow-100 text-yellow-800';
      case SessionState.STARTED:
        return 'bg-green-100 text-green-800';
      case SessionState.FINISHED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!sessions || sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">Aucune session trouvée</p>
          <p className="text-gray-400 mt-2">
            {user?.role === Role.TEACHER
              ? 'Créez un quiz et lancez une session pour commencer'
              : 'Rejoignez une session pour qu\'elle apparaisse ici'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {session.quizTitle}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStateBadgeColor(session.state)}`}
                    >
                      {getStateText(session.state)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Code:</span>
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{session.code}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>{session.participantCount} participant{session.participantCount > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {new Date(session.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/quiz/${session.quizId}/session/${session.id}`}
                  className={`ml-6 px-6 py-2.5 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap ${getButtonStyle(session)}`}
                >
                  {getButtonText(session)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
