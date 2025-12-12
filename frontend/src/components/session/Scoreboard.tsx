interface ScoreboardEntry {
  studentName: string;
  score: number;
  totalQuestions: number;
}

interface ScoreboardProps {
  scores: ScoreboardEntry[];
  currentUserId?: string; // To highlight current user
}

export function Scoreboard({ scores, currentUserId }: ScoreboardProps) {
  // Sort by score descending
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🏆 Classement
      </h3>
      
      <div className="space-y-2">
        {sortedScores.map((entry, index) => {
          const isCurrentUser = currentUserId && entry.studentName === currentUserId;
          const rankColors = [
            "text-yellow-500", // 1st
            "text-gray-500",   // 2nd
            "text-orange-500", // 3rd
          ];
          const rankColor = index < 3 ? rankColors[index] : "text-gray-700";
          
          return (
            <div
              key={index}
              className="flex items-center gap-3"
            >
              {/* Rank badge */}
              <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${rankColor}`}>
                {index + 1}
              </div>
              
              {/* Student info */}
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${isCurrentUser ? "text-purple-900" : "text-gray-900"}`}>
                  {entry.studentName}
                  {isCurrentUser && <span className="ml-2 text-xs text-purple-600">(Vous)</span>}
                </div>
              </div>
              
              {/* Score */}
              <div className="text-lg font-bold text-gray-900">
                {entry.score}/{entry.totalQuestions}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
