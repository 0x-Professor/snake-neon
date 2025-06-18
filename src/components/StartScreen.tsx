
import React from 'react';
import { useGameStore } from '../store/gameStore';

export const StartScreen: React.FC = () => {
  const { startGame, toggleSettings, toggleLeaderboard, highScore } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="text-center z-10 max-w-md mx-auto px-6">
        {/* Game Title */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 animate-pulse">
            NEON
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            SNAKE
          </h2>
          <p className="text-cyan-300 text-lg mt-4 opacity-80">
            Next-Generation Gaming Experience
          </p>
        </div>

        {/* High Score */}
        {highScore > 0 && (
          <div className="mb-8 p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg backdrop-blur-sm">
            <p className="text-purple-300 text-sm uppercase tracking-wider">High Score</p>
            <p className="text-cyan-400 text-3xl font-bold">{highScore.toLocaleString()}</p>
          </div>
        )}

        {/* Game Mode Selection */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => startGame('classic')}
            className="w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg border-2 border-cyan-400/50 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/25"
          >
            <span className="text-xl">🎯 CLASSIC MODE</span>
            <p className="text-sm opacity-80 mt-1">Traditional Snake gameplay</p>
          </button>

          <button
            onClick={() => startGame('survival')}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg border-2 border-purple-400/50 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-400/25"
          >
            <span className="text-xl">💀 SURVIVAL MODE</span>
            <p className="text-sm opacity-80 mt-1">Multiple lives, increasing difficulty</p>
          </button>

          <button
            onClick={() => startGame('multiplayer')}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold rounded-lg border-2 border-green-400/50 hover:border-green-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-400/25"
          >
            <span className="text-xl">🤝 MULTIPLAYER</span>
            <p className="text-sm opacity-80 mt-1">Compete against AI snakes</p>
          </button>
        </div>

        {/* Menu Options */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={toggleLeaderboard}
            className="py-3 px-6 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 font-semibold rounded-lg hover:bg-yellow-600/30 hover:border-yellow-400 transition-all duration-300"
          >
            🏆 Leaderboard
          </button>

          <button
            onClick={toggleSettings}
            className="py-3 px-6 bg-gray-600/20 border border-gray-500/50 text-gray-400 font-semibold rounded-lg hover:bg-gray-600/30 hover:border-gray-400 transition-all duration-300"
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-cyan-300 text-sm opacity-60">
          <p>Use ARROW KEYS or TOUCH to control</p>
          <p>SPACEBAR to pause • Collect power-ups for special abilities</p>
        </div>
      </div>
    </div>
  );
};
