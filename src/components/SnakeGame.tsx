import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { SettingsPanel } from './SettingsPanel';
import { Leaderboard } from './Leaderboard';
import { RealisticSnake } from './3d/RealisticSnake';
import { RealisticFood } from './3d/RealisticFood';
import { ParticleEffects } from './3d/ParticleEffects';
import { AdvancedLighting } from './3d/AdvancedLighting';
import { RealisticEnvironment } from './3d/RealisticEnvironment';
import { SoundManager3D } from './3d/SoundManager3D';
import { Vector3 } from 'three';

export const SnakeGame: React.FC = () => {
  const {
    gameState,
    snake,
    food,
    score,
    direction,
    startGame,
    pauseGame,
    moveSnake,
    updateGame,
    settings,
    showSettings,
    showLeaderboard,
  } = useGameStore();

  const gameLoopRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const lastDirectionRef = useRef(direction);
  const [isInitialized, setIsInitialized] = useState(false);
  const [particleEffects, setParticleEffects] = useState<Array<{
    id: string;
    position: Vector3;
    type: 'eating' | 'collision' | 'trail';
    active: boolean;
  }>>([]);
  const [cameraShake, setCameraShake] = useState(false);
  const [realisticMode, setRealisticMode] = useState(true);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      const key = event.key.toLowerCase();
      let newDirection = direction;

      switch (key) {
        case 'arrowup':
        case 'w':
          if (direction !== 'down') newDirection = 'up';
          break;
        case 'arrowdown':
        case 's':
          if (direction !== 'up') newDirection = 'down';
          break;
        case 'arrowleft':
        case 'a':
          if (direction !== 'right') newDirection = 'left';
          break;
        case 'arrowright':
        case 'd':
          if (direction !== 'left') newDirection = 'right';
          break;
        case ' ':
          event.preventDefault();
          pauseGame();
          return;
        case 'r':
          setRealisticMode((prev) => !prev);
          return;
      }

      if (newDirection !== direction) {
        moveSnake(newDirection);
        lastDirectionRef.current = newDirection;
      }

      event.preventDefault();
    },
    [gameState, direction, moveSnake, pauseGame]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (gameState === 'playing') {
        const gameSpeed = Math.max(100, 400 - settings.gameSpeed * 30);
        if (timestamp - lastUpdateRef.current > gameSpeed) {
          updateGame();
          lastUpdateRef.current = timestamp;
        }
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      }
    },
    [gameState, settings.gameSpeed, updateGame]
  );

  useEffect(() => {
    if (gameState === 'playing') {
      lastUpdateRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, gameLoop]);

  const handleFoodEaten = useCallback(() => {
    const headPos = snake[0];
    if (headPos) {
      const newEffect = {
        id: Date.now().toString(),
        position: new Vector3(headPos.x - 10, 0.3, headPos.z - 10),
        type: 'eating' as const,
        active: true,
      };
      setParticleEffects((prev) => prev.slice(-10).concat([newEffect]));
      setTimeout(() => setParticleEffects((prev) => prev.filter((e) => e.id !== newEffect.id)), 1500);
    }
  }, [snake]);

  const handleCollision = useCallback(() => {
    setCameraShake(true);
    const headPos = snake[0];
    if (headPos) {
      const newEffect = {
        id: Date.now().toString(),
        position: new Vector3(headPos.x - 10, 0.3, headPos.z - 10),
        type: 'collision' as const,
        active: true,
      };
      setParticleEffects((prev) => prev.slice(-10).concat([newEffect]));
    }
    setTimeout(() => setCameraShake(false), 400);
  }, [snake]);

  useEffect(() => {
    if (gameState === 'gameOver') handleCollision();
  }, [gameState, handleCollision]);

  // Camera animation component
  const CameraController = () => {
    useFrame(({ camera }) => {
      if (snake[0]) {
        const headPos = new Vector3(snake[0].x - 10, 0.3, snake[0].z - 10);
        const offset = new Vector3(0, realisticMode ? 5 : 10, realisticMode ? 8 : 12);
        const targetPos = headPos.clone().add(offset);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(headPos);
        if (cameraShake) {
          camera.position.add(
            new Vector3(
              Math.random() * 0.2 - 0.1,
              Math.random() * 0.2 - 0.1,
              Math.random() * 0.2 - 0.1
            )
          );
        }
      }
    });
    return null;
  };

  if (showSettings) return <SettingsPanel />;
  if (showLeaderboard) return <Leaderboard />;
  if (gameState === 'menu') return <StartScreen />;
  if (!isInitialized) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-cyan-400 text-2xl font-bold animate-pulse">
          Initializing Cyber Snake Nexus...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        {Array.from({ length: 30 }).map((_, i) => (
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
        camera={{ position: [0, 10, 15], fov: 50, near: 0.1, far: 1000 }}
        className="absolute inset-0"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <CameraController />
        <AdvancedLighting />
        <Environment preset="sunset" />
        <RealisticEnvironment realisticMode={realisticMode} />
        <RealisticSnake
          segments={snake}
          isAlive={gameState === 'playing'}
          direction={direction}
        />
        {food.map((item, i) => (
          <RealisticFood
            key={`food-${i}-${item.x}-${item.z}`}
            food={item}
            onEaten={handleFoodEaten}
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
      </Canvas>

      {/* HUD and UI */}
      <div className="absolute inset-0 pointer-events-none">
        <GameHUD />
        <div className="absolute top-4 right-4 pointer-events-auto">
          <button
            onClick={() => setRealisticMode(!realisticMode)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-200"
          >
            {realisticMode ? 'Performance Mode' : 'Realistic Mode'}
          </button>
        </div>
      </div>

      {/* UI borders */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-400 opacity-50"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-cyan-400 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-cyan-400 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cyan-400 opacity-50"></div>
      </div>

      {/* Touch Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden pointer-events-auto">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'down') moveSnake('up');
            }}
            className="w-16 h-16 bg-gradient-to-t from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-all duration-200"
          >
            <span className="text-white text-2xl font-bold">↑</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'right') moveSnake('left');
            }}
            className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-white text-2xl font-bold">←</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              pauseGame();
            }}
            className="w-16 h-16 bg-gradient-to-t from-purple-600 to-purple-400 border-2 border-purple-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-purple-400/25"
          >
            <span className="text-white text-sm font-bold">⏸</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'left') moveSnake('right');
            }}
            className="w-16 h-16 bg-gradient-to-l from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-white text-2xl font-bold">→</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'up') moveSnake('down');
            }}
            className="w-16 h-16 bg-gradient-to-b from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-white text-2xl font-bold">↓</span>
          </button>
          <div></div>
        </div>
      </div>

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-pulse"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
          }}
        ></div>
      </div>

      {/* Game status */}
      {gameState === 'playing' && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-mono text-sm">
              {realisticMode ? 'REALISTIC SYSTEM ACTIVE' : 'PERFORMANCE SYSTEM ACTIVE'}
            </span>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl font-bold text-cyan-400 mb-4 animate-pulse">PAUSED</div>
            <div className="text-cyan-300 font-mono">Press SPACE to continue</div>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-auto">
          <div className="text-center p-8 bg-gray-900/80 rounded-xl border border-red-500">
            <div className="text-6xl font-bold text-red-400 mb-4 animate-pulse">GAME OVER</div>
            <div className="text-red-300 font-mono mb-6">Final Score: {score}</div>
            <button
              onClick={() => startGame('classic')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 font-bold"
            >
              RESTART MISSION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
