import { Button } from "@/components/ui/Button";

interface SessionLobbyProps {
  isTeacher: boolean;
  sessionCode: string;
  participants: string[];
  onStart: () => void;
  onCopyCode: () => void;
}

export function SessionLobby({
  isTeacher,
  sessionCode,
  participants,
  onStart,
  onCopyCode,
}: SessionLobbyProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Session Code Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Code de la session
          </h2>
          <div
            className="bg-linear-to-r from-purple-500 to-blue-500 rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform"
            onClick={onCopyCode}
          >
            <p className="text-5xl font-bold text-white text-center tracking-wider">
              {sessionCode}
            </p>
            <p className="text-white/80 text-center mt-2 text-sm">
              Cliquez pour copier
            </p>
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Participants ({participants.length})
          </h2>
          {participants.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun participant pour le moment...
            </p>
          ) : (
            <div className="space-y-2">
              {participants.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    {name.charAt(0)}
                  </div>
                  <span className="text-gray-900 font-medium">{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Button (Teacher only) */}
        {isTeacher && (
          <Button
            variant="primary"
            onClick={onStart}
            disabled={participants.length === 0}
            className="w-full py-4 text-lg"
          >
            Démarrer le quiz
          </Button>
        )}

        {/* Waiting Message (Student) */}
        {!isTeacher && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center mb-4">
            <p className="text-blue-800 font-medium">
              En attente du démarrage par le professeur...
            </p>
          </div>
        )}
      </div>
  );
}
