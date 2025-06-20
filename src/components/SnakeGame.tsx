
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { SettingsPanel } from './SettingsPanel';
import { Leaderboard } from './Leaderboard';
import { ParticleEffects } from './3d/ParticleEffects';
import { ElegantEnvironment } from './3d/ElegantEnvironment';
import { AnimatedSnake } from './3d/AnimatedSnake';
import { SoundManager3D } from './3d/SoundManager3D';
import { StaticCamera } from './3d/StaticCamera';
import { RealisticFruit } from './3d/RealisticFruit';
import { Vector3 } from 'three';

export const SnakeGame: React.FC = () => {
  console.log('SnakeGame render');

  // Use a single, stable selector that returns all needed state at once
  const gameData = useGameStore((state) => ({
    gameState: state.gameState,
    showSettings: state.showSettings,
    showLeaderboard: state.showLeaderboard,
    snake: state.snake,
    food: state.food,
    direction: state.direction,
    score: state.score,
  }));

  const gameLoopRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [particleEffects, setParticleEffects] = useState<Array<{
    id: string;
    position: Vector3;
    type: 'eating' | 'collision' | 'trail';
    active: boolean;
  }>>([]);
  const [cameraShake, setCameraShake] = useState(false);

  // Initialize once
  useEffect(() => {
    console.log('Initializing game');
    setIsInitialized(true);
  }, []);

  // Stable keyboard handler
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.key);
    const key = event.key.toLowerCase();
    
    const store = useGameStore.getState();
    
    if (key === 'escape') {
      if (store.gameState === 'playing') store.pauseGame();
      else if (store.gameState === 'paused') store.pauseGame();
      event.preventDefault();
      return;
    }
    
    if (key === 'h') {
      if (store.gameState === 'menu') return;
      store.resetGame();
      event.preventDefault();
      return;
    }

    if (store.gameState !== 'playing') return;

    let newDirection = store.direction;

    switch (key) {
      case 'arrowup':
      case 'w':
        if (store.direction !== 'down') newDirection = 'up';
        break;
      case 'arrowdown':
      case 's':
        if (store.direction !== 'up') newDirection = 'down';
        break;
      case 'arrowleft':
      case 'a':
        if (store.direction !== 'right') newDirection = 'left';
        break;
      case 'arrowright':
      case 'd':
        if (store.direction !== 'left') newDirection = 'right';
        break;
      case ' ':
        event.preventDefault();
        store.pauseGame();
        return;
    }

    if (newDirection !== store.direction) {
      store.moveSnake(newDirection);
    }

    event.preventDefault();
  }, []);

  // Keyboard setup
  useEffect(() => {
    console.log('Setting up keyboard listeners');
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      console.log('Cleaning up keyboard listeners');
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Game loop - completely isolated
  const runGameLoop = useCallback(() => {
    const loop = (timestamp: number) => {
      const store = useGameStore.getState();
      if (store.gameState === 'playing') {
        const baseSpeed = 400;
        const speedIncrease = Math.floor(store.score / 50) * 20;
        const gameSpeed = Math.max(150, baseSpeed - store.settings.gameSpeed * 30 - speedIncrease);
        
        if (timestamp - lastUpdateRef.current > gameSpeed) {
          store.updateGame();
          lastUpdateRef.current = timestamp;
        }
        gameLoopRef.current = requestAnimationFrame(loop);
      }
    };
    
    lastUpdateRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(loop);
  }, []);

  // Game loop management
  useEffect(() => {
    console.log('Game loop effect, state:', gameData.gameState);
    
    if (gameData.gameState === 'playing') {
      runGameLoop();
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameData.gameState, runGameLoop]);

  // Stable event handlers
  const addParticleEffect = useCallback((type: 'eating' | 'collision') => {
    const newEffect = {
      id: Date.now().toString(),
      position: new Vector3(0, 0.3, 0),
      type,
      active: true,
    };
    setParticleEffects(prev => [...prev.slice(-10), newEffect]);
    
    if (type === 'collision') {
      setCameraShake(true);
      setTimeout(() => setCameraShake(false), 400);
    }
    
    setTimeout(() => {
      setParticleEffects(prev => prev.filter((e) => e.id !== newEffect.id));
    }, 1500);
  }, []);

  // Early returns for different states
  if (gameData.showSettings) return <SettingsPanel />;
  if (gameData.showLeaderboard) return <Leaderboard />;
  if (gameData.gameState === 'menu') return <StartScreen />;
  
  if (!isInitialized) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-cyan-400 text-2xl font-bold animate-pulse">
          Loading Cyber Snake Nexus...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <SoundManager3D />

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 25, 15], fov: 60, near: 0.1, far: 1000 }}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <StaticCamera 
            snakeHead={gameData.snake[0] || { x: 10, z: 10 }}
            shake={cameraShake}
          />
          
          <ElegantEnvironment />
          
          <AnimatedSnake
            segments={gameData.snake}
            isAlive={gameData.gameState === 'playing'}
            direction={gameData.direction}
            score={gameData.score}
          />
          
          {gameData.food.map((item, i) => (
            <RealisticFruit
              key={`fruit-${i}-${item.x}-${item.z}`}
              food={item}
              onEaten={() => addParticleEffect('eating')}
            />
          ))}
          
          {particleEffects.map((effect) => (
            <ParticleEffects
              key={effect.id}
              position={effect.position}
              active={effect.active}
              type={effect.type}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* UI overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <GameHUD />
        
        <div className="absolute top-4 right-4 pointer-events-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full max-w-sm">
            <button
              onClick={() => useGameStore.getState().pauseGame()}
              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 text-sm font-medium shadow-lg transform hover:scale-105"
            >
              <span className="mr-2">{gameData.gameState === 'paused' ? '▶️' : '⏸️'}</span>
              {gameData.gameState === 'paused' ? 'Resume' : 'Pause'}
            </button>
            
            <button
              onClick={() => useGameStore.getState().resetGame()}
              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-500 hover:to-orange-500 transition-all duration-300 text-sm font-medium shadow-lg transform hover:scale-105"
            >
              <span className="mr-2">🏠</span>
              Home
            </button>
          </div>
        </div>
        
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="flex flex-col gap-3">
            {gameData.gameState === 'playing' && (
              <div className="bg-black/50 backdrop-blur-md border border-green-500/40 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-mono text-sm font-semibold">
                    PROFESSIONAL MODE ACTIVE
                  </span>
                </div>
              </div>
            )}
            
            <div className="bg-black/50 backdrop-blur-md border border-cyan-500/40 rounded-lg p-3">
              <div className="text-cyan-300 text-xs space-y-1">
                <div className="font-semibold text-cyan-400 mb-2">CONTROLS</div>
                <div>WASD/Arrows: Move</div>
                <div>SPACE: Pause</div>
                <div>H: Home</div>
                <div>ESC: Back/Pause</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile controls */}
      <div className="absolute bottom-4 right-4 md:hidden pointer-events-auto">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              useGameStore.getState().moveSnake('up');
            }}
            className="w-12 h-12 bg-gradient-to-t from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">↑</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              useGameStore.getState().moveSnake('left');
            }}
            className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">←</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              useGameStore.getState().pauseGame();
            }}
            className="w-12 h-12 bg-gradient-to-t from-purple-600 to-purple-400 border border-purple-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-xs">⏸</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              useGameStore.getState().moveSnake('right');
            }}
            className="w-12 h-12 bg-gradient-to-l from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">→</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              useGameStore.getState().moveSnake('down');
            }}
            className="w-12 h-12 bg-gradient-to-b from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">↓</span>
          </button>
          <div></div>
        </div>
      </div>

      {/* Game state overlays */}
      {gameData.gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl font-bold text-cyan-400 mb-4 animate-pulse">PAUSED</div>
            <div className="text-cyan-300 font-mono">Press SPACE to continue</div>
            <div className="text-cyan-300 font-mono mt-2">Press H to return home</div>
          </div>
        </div>
      )}

      {gameData.gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
          <div className="text-center p-8 bg-gray-900/90 rounded-xl border border-red-500 max-w-md">
            <div className="text-5xl font-bold text-red-400 mb-4 animate-pulse">GAME OVER</div>
            <div className="text-red-300 font-mono mb-6 text-xl">Final Score: {gameData.score}</div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => useGameStore.getState().startGame('classic')}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 font-bold"
              >
                RESTART MISSION
              </button>
              <button
                onClick={() => useGameStore.getState().resetGame()}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 font-bold"
              >
                RETURN HOME
              </button>
              <button
                onClick={() => useGameStore.getState().toggleLeaderboard()}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 font-bold"
              >
                LEADERBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-pulse"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
          }}
        ></div>
      </div>
    </div>
  );
};
