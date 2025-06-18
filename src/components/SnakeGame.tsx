
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { SettingsPanel } from './SettingsPanel';
import { Leaderboard } from './Leaderboard';
import { RealisticSnake } from './3d/RealisticSnake';
import { RealisticFood } from './3d/RealisticFood';
import { ParticleEffects } from './3d/ParticleEffects';
import { AdvancedLighting } from './3d/AdvancedLighting';
import { CinematicCamera } from './3d/CinematicCamera';
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
    showLeaderboard
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

  useEffect(() => {
    console.log('SnakeGame component initialized');
    setIsInitialized(true);
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.key, 'Game state:', gameState);
    
    if (gameState !== 'playing') return;

    const key = event.key.toLowerCase();
    let newDirection = direction;

    // Handle direction changes with proper opposite direction prevention
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
    }

    if (newDirection !== direction) {
      console.log('Direction changed from', direction, 'to', newDirection);
      moveSnake(newDirection);
      lastDirectionRef.current = newDirection;
    }

    event.preventDefault();
  }, [gameState, direction, moveSnake, pauseGame]);

  useEffect(() => {
    console.log('Setting up keyboard listeners');
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      console.log('Cleaning up keyboard listeners');
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState === 'playing') {
      const gameSpeed = Math.max(100, 400 - settings.gameSpeed * 30);
      if (timestamp - lastUpdateRef.current > gameSpeed) {
        console.log('Game loop tick - updating game state');
        updateGame();
        lastUpdateRef.current = timestamp;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, settings.gameSpeed, updateGame]);

  useEffect(() => {
    console.log('Game state changed to:', gameState);
    if (gameState === 'playing') {
      console.log('Starting game loop');
      lastUpdateRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        console.log('Stopping game loop');
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  const handleFoodEaten = useCallback(() => {
    console.log('Food eaten - creating particle effect');
    const headPos = snake[0];
    if (headPos) {
      const newEffect = {
        id: Date.now().toString(),
        position: new Vector3(headPos.x - 10, 0.5, headPos.z - 10),
        type: 'eating' as const,
        active: true
      };
      
      setParticleEffects(prev => [...prev, newEffect]);
      
      setTimeout(() => {
        setParticleEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 2000);
    }
  }, [snake]);

  const handleCollision = useCallback(() => {
    console.log('Collision detected - creating effects');
    setCameraShake(true);
    
    const headPos = snake[0];
    if (headPos) {
      const newEffect = {
        id: Date.now().toString(),
        position: new Vector3(headPos.x - 10, 0.5, headPos.z - 10),
        type: 'collision' as const,
        active: true
      };
      
      setParticleEffects(prev => [...prev, newEffect]);
    }
    
    setTimeout(() => setCameraShake(false), 500);
  }, [snake]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      handleCollision();
    }
  }, [gameState, handleCollision]);

  if (showSettings) {
    return <SettingsPanel />;
  }

  if (showLeaderboard) {
    return <Leaderboard />;
  }

  if (gameState === 'menu') {
    return <StartScreen />;
  }

  if (!isInitialized) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-cyan-400 text-2xl font-bold animate-pulse">
          Initializing Cyber Snake Nexus...
        </div>
      </div>
    );
  }

  console.log('Rendering Snake Game with state:', gameState, 'Snake:', snake, 'Direction:', direction);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      {/* Animated background particles */}
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
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <SoundManager3D />
      
      {/* Enhanced 3D Canvas with static camera */}
      <Canvas
        shadows
        camera={{ position: [0, 20, 15], fov: 45, near: 0.1, far: 1000 }}
        className="absolute inset-0"
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          shadowMap: { enabled: true, type: 2 }
        }}
      >
        {/* Advanced Lighting Setup */}
        <AdvancedLighting />
        
        {/* HDRI Environment */}
        <Environment preset="night" />
        
        {/* Static Professional Environment */}
        <RealisticEnvironment />
        
        {/* Enhanced Snake with smooth movement */}
        <RealisticSnake 
          segments={snake} 
          isAlive={gameState === 'playing'}
          direction={direction}
        />
        
        {/* Enhanced Food with PBR materials */}
        {food.map((item, index) => (
          <RealisticFood
            key={`food-${index}-${item.x}-${item.z}`}
            food={item}
            onEaten={handleFoodEaten}
          />
        ))}
        
        {/* Particle Effects */}
        {particleEffects.map(effect => (
          <ParticleEffects
            key={effect.id}
            position={effect.position}
            active={effect.active}
            type={effect.type}
          />
        ))}
        
        {/* Static camera looking down at the game board */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          enableRotate={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Game HUD with animations */}
      <div className="absolute inset-0 pointer-events-none">
        <GameHUD />
      </div>

      {/* Futuristic UI borders */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-cyan-400 opacity-50"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-cyan-400 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-cyan-400 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-cyan-400 opacity-50"></div>
      </div>

      {/* Enhanced Touch Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden pointer-events-auto">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'down') moveSnake('up');
            }}
            onClick={() => {
              if (direction !== 'down') moveSnake('up');
            }}
            className="w-16 h-16 bg-gradient-to-t from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-all duration-200 hover:shadow-cyan-400/50"
          >
            <span className="text-white text-2xl font-bold">↑</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'right') moveSnake('left');
            }}
            onClick={() => {
              if (direction !== 'right') moveSnake('left');
            }}
            className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-all duration-200 hover:shadow-cyan-400/50"
          >
            <span className="text-white text-2xl font-bold">←</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              pauseGame();
            }}
            onClick={pauseGame}
            className="w-16 h-16 bg-gradient-to-t from-purple-600 to-purple-400 border-2 border-purple-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-purple-400/25 active:scale-95 transition-all duration-200 hover:shadow-purple-400/50"
          >
            <span className="text-white text-sm font-bold">⏸</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'left') moveSnake('right');
            }}
            onClick={() => {
              if (direction !== 'left') moveSnake('right');
            }}
            className="w-16 h-16 bg-gradient-to-l from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-all duration-200 hover:shadow-cyan-400/50"
          >
            <span className="text-white text-2xl font-bold">→</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'up') moveSnake('down');
            }}
            onClick={() => {
              if (direction !== 'up') moveSnake('down');
            }}
            className="w-16 h-16 bg-gradient-to-b from-cyan-600 to-cyan-400 border-2 border-cyan-300 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-all duration-200 hover:shadow-cyan-400/50"
          >
            <span className="text-white text-2xl font-bold">↓</span>
          </button>
          <div></div>
        </div>
      </div>

      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-pulse" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)'
        }}></div>
      </div>

      {/* Game status indicator */}
      {gameState === 'playing' && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-mono text-sm">SYSTEM ACTIVE</span>
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
