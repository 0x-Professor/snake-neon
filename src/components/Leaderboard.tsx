
import React from 'react';
import { useGameStore } from '../store/gameStore';

export const Leaderboard: React.FC = () => {
  const { leaderboard, toggleLeaderboard } = useGameStore();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getModeEmoji = (mode: string) => {
    switch (mode) {
      case 'classic': return '🎯';
      case 'survival': return '💀';
      case 'multiplayer': return '🤝';
      default: return '🎮';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
      <div className="bg-black/60 backdrop-blur-lg border border-yellow-500/30 rounded-lg p-8 max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-yellow-400">🏆 Leaderboard</h2>
          <button
            onClick={toggleLeaderboard}
            className="text-yellow-400 hover:text-yellow-300 text-2xl"
          >
            ✕
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-yellow-300 text-lg mb-2">No scores yet!</p>
            <p className="text-gray-400">Play a game to see your scores here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  index === 0
                    ? 'bg-yellow-600/20 border-yellow-500/50'
                    : index === 1
                    ? 'bg-gray-600/20 border-gray-500/50'
                    : index === 2
                    ? 'bg-orange-600/20 border-orange-500/50'
                    : 'bg-gray-800/40 border-gray-600/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">
                        {entry.score.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {getModeEmoji(entry.gameMode)} {entry.gameMode} • {formatDate(entry.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-semibold">{entry.playerName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={toggleLeaderboard}
            className="w-full py-3 px-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
