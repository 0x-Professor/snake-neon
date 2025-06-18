
import React from 'react';
import { useGameStore } from '../store/gameStore';

export const GameHUD: React.FC = () => {
  const { 
    score, 
    level, 
    lives, 
    gameMode, 
    gameState, 
    activePowerUps,
    pauseGame,
    resetGame,
    toggleSettings 
  } = useGameStore();

  if (gameState === 'menu') return null;

  return (
    <>
      {/* Top HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        {/* Score and Stats */}
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 min-w-[200px]">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-cyan-300 text-sm uppercase tracking-wider">Score</p>
              <p className="text-white text-2xl font-bold">{score.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-cyan-500/30"></div>
            <div>
              <p className="text-purple-300 text-sm uppercase tracking-wider">Level</p>
              <p className="text-white text-2xl font-bold">{level}</p>
            </div>
            {gameMode === 'survival' && (
              <>
                <div className="w-px h-8 bg-cyan-500/30"></div>
                <div>
                  <p className="text-red-300 text-sm uppercase tracking-wider">Lives</p>
                  <p className="text-white text-2xl font-bold">{lives}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex space-x-2">
          <button
            onClick={pauseGame}
            className="bg-purple-600/20 border border-purple-500/50 text-purple-400 p-3 rounded-lg hover:bg-purple-600/30 transition-all duration-300"
          >
            {gameState === 'paused' ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={toggleSettings}
            className="bg-gray-600/20 border border-gray-500/50 text-gray-400 p-3 rounded-lg hover:bg-gray-600/30 transition-all duration-300"
          >
            ⚙️
          </button>
          <button
            onClick={resetGame}
            className="bg-red-600/20 border border-red-500/50 text-red-400 p-3 rounded-lg hover:bg-red-600/30 transition-all duration-300"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Active Power-ups */}
      {activePowerUps.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-300 text-sm uppercase tracking-wider text-center mb-2">Active Power-ups</p>
            <div className="flex space-x-2">
              {activePowerUps.map((powerUp, index) => (
                <div key={index} className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg p-2 text-center">
                  <span className="text-yellow-400 text-lg">
                    {powerUp.type === 'speed' && '⚡'}
                    {powerUp.type === 'shrink' && '🔻'}
                    {powerUp.type === 'magnet' && '🧲'}
                  </span>
                  <p className="text-yellow-300 text-xs capitalize">{powerUp.type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Mode Indicator */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3">
          <p className="text-cyan-300 text-sm uppercase tracking-wider">
            {gameMode === 'classic' && '🎯 Classic'}
            {gameMode === 'survival' && '💀 Survival'}
            {gameMode === 'multiplayer' && '🤝 Multiplayer'}
          </p>
        </div>
      </div>

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-black/80 border border-cyan-500/50 rounded-lg p-8 text-center">
            <h2 className="text-4xl font-bold text-cyan-400 mb-4">PAUSED</h2>
            <p className="text-cyan-300 mb-6">Press SPACEBAR or tap Pause to continue</p>
            <div className="space-y-3">
              <button
                onClick={pauseGame}
                className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all duration-300"
              >
                Resume Game
              </button>
              <button
                onClick={resetGame}
                className="w-full py-3 px-6 bg-red-600/20 border border-red-500/50 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 transition-all duration-300"
              >
                Restart Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-black/90 border border-red-500/50 rounded-lg p-8 text-center max-w-md">
            <h2 className="text-5xl font-bold text-red-400 mb-4">GAME OVER</h2>
            <div className="mb-6">
              <p className="text-white text-2xl font-bold mb-2">Final Score: {score.toLocaleString()}</p>
              <p className="text-gray-400">Level {level} • {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)} Mode</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={resetGame}
                className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all duration-300"
              >
                Play Again
              </button>
              <button
                onClick={resetGame}
                className="w-full py-3 px-6 bg-gray-600/20 border border-gray-500/50 text-gray-400 font-semibold rounded-lg hover:bg-gray-600/30 transition-all duration-300"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
