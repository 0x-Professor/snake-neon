
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
    gameMode,
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
  const canvasRef = useRef<HTMLCanvasElement>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [particleEffects, setParticleEffects] = useState<Array<{
    id: string;
    position: Vector3;
    type: 'eating' | 'collision' | 'trail';
    active: boolean;
  }>>([]);
  const [cameraShake, setCameraShake] = useState(false);

  // Initialize game on component mount
  useEffect(() => {
    console.log('SnakeGame component initialized');
    setIsInitialized(true);
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.key, 'Game state:', gameState);
    
    if (gameState !== 'playing') return;

    // Use both arrow keys and WASD for better compatibility
    switch (event.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        event.preventDefault();
        console.log('Moving snake up');
        moveSnake('up');
        break;
      case 'arrowdown':
      case 's':
        event.preventDefault();
        console.log('Moving snake down');
        moveSnake('down');
        break;
      case 'arrowleft':
      case 'a':
        event.preventDefault();
        console.log('Moving snake left');
        moveSnake('left');
        break;
      case 'arrowright':
      case 'd':
        event.preventDefault();
        console.log('Moving snake right');
        moveSnake('right');
        break;
      case ' ':
        event.preventDefault();
        pauseGame();
        break;
    }
  }, [gameState, moveSnake, pauseGame]);

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
      const gameSpeed = Math.max(100, 600 - settings.gameSpeed * 50);
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

  // Handle canvas initialization
  const handleCanvasCreated = useCallback((canvas: HTMLCanvasElement) => {
    console.log('Canvas created and initialized');
    canvasRef.current = canvas;
    
    // Ensure canvas is properly mounted
    if (canvas && canvas.parentElement) {
      console.log('Canvas successfully appended to DOM');
    }
  }, []);

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
      <SoundManager3D />
      
      {/* Enhanced 3D Canvas with proper initialization */}
      <Canvas
        shadows
        camera={{ position: [0, 12, 12], fov: 60 }}
        className="absolute inset-0"
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          console.log('React Three Fiber canvas created');
          handleCanvasCreated(gl.domElement);
        }}
      >
        {/* Advanced Lighting Setup */}
        <AdvancedLighting />
        
        {/* HDRI Environment */}
        <Environment preset="night" />
        
        {/* Realistic Environment */}
        <RealisticEnvironment />
        
        {/* Enhanced Snake with better positioning */}
        <RealisticSnake 
          segments={snake} 
          isAlive={gameState === 'playing'}
          direction={direction}
        />
        
        {/* Enhanced Food with randomized textures */}
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
        
        {/* Cinematic Camera Controller */}
        <CinematicCamera
          snakeHead={snake[0] || { x: 10, z: 10 }}
          direction={direction}
          gameState={gameState}
          shake={cameraShake}
        />
        
        {/* Optional Orbit Controls (disabled during gameplay) */}
        {gameState !== 'playing' && (
          <OrbitControls 
            enablePan={false} 
            enableZoom={true}
            maxDistance={20}
            minDistance={5}
          />
        )}
      </Canvas>

      {/* Game HUD */}
      <GameHUD />

      {/* Enhanced Touch Controls with better responsiveness */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              console.log('Touch control: up');
              moveSnake('up');
            }}
            onClick={() => {
              console.log('Click control: up');
              moveSnake('up');
            }}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-transform"
          >
            <span className="text-cyan-400 text-2xl font-bold">↑</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              console.log('Touch control: left');
              moveSnake('left');
            }}
            onClick={() => {
              console.log('Click control: left');
              moveSnake('left');
            }}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-transform"
          >
            <span className="text-cyan-400 text-2xl font-bold">←</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              pauseGame();
            }}
            onClick={pauseGame}
            className="w-14 h-14 bg-purple-500/30 border-2 border-purple-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-transform"
          >
            <span className="text-purple-400 text-sm font-bold">⏸</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              console.log('Touch control: right');
              moveSnake('right');
            }}
            onClick={() => {
              console.log('Click control: right');
              moveSnake('right');
            }}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-transform"
          >
            <span className="text-cyan-400 text-2xl font-bold">→</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              console.log('Touch control: down');
              moveSnake('down');
            }}
            onClick={() => {
              console.log('Click control: down');
              moveSnake('down');
            }}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25 active:scale-95 transition-transform"
          >
            <span className="text-cyan-400 text-2xl font-bold">↓</span>
          </button>
          <div></div>
        </div>
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded text-xs">
          <div>Game State: {gameState}</div>
          <div>Snake Length: {snake.length}</div>
          <div>Direction: {direction}</div>
          <div>Score: {score}</div>
        </div>
      )}
    </div>
  );
};
