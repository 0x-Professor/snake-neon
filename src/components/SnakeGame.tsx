import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Bloom, EffectComposer, Vignette } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { SettingsPanel } from './SettingsPanel';
import { Leaderboard } from './Leaderboard';
import { GLTFSnake } from './3d/GLTFSnake';
import { GLTFFood } from './3d/GLTFFood';
import { ParticleEffects } from './3d/ParticleEffects';
import { AdvancedLighting } from './3d/AdvancedLighting';
import { RealisticEnvironment } from './3d/RealisticEnvironment';
import { SoundManager3D } from './3d/SoundManager3D';
import { EnhancedCameraController } from './3d/EnhancedCameraController';
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
    resetGame,
    toggleSettings,
    toggleLeaderboard,
  } = useGameStore();

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
  const [cameraMode, setCameraMode] = useState<'follow' | 'overview' | 'cinematic'>('follow');
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      // Global controls
      if (key === 'escape') {
        if (gameState === 'playing') pauseGame();
        else if (gameState === 'paused') pauseGame();
        else if (showSettings || showLeaderboard) {
          toggleSettings();
          toggleLeaderboard();
        }
        event.preventDefault();
        return;
      }
      
      if (key === 'h') {
        if (gameState === 'menu') return;
        resetGame();
        event.preventDefault();
        return;
      }

      if (gameState !== 'playing') return;

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
        case 'c':
          // Cycle camera modes
          const modes: Array<'follow' | 'overview' | 'cinematic'> = ['follow', 'overview', 'cinematic'];
          const currentIndex = modes.indexOf(cameraMode);
          setCameraMode(modes[(currentIndex + 1) % modes.length]);
          return;
        case 'o':
          setOrbitControlsEnabled(!orbitControlsEnabled);
          return;
      }

      if (newDirection !== direction) {
        moveSnake(newDirection);
      }

      event.preventDefault();
    },
    [gameState, direction, moveSnake, pauseGame, resetGame, showSettings, showLeaderboard, toggleSettings, toggleLeaderboard, cameraMode, orbitControlsEnabled]
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
  }, [gameState, updateGame]);

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

  if (showSettings) return <SettingsPanel />;
  if (showLeaderboard) return <Leaderboard />;
  if (gameState === 'menu') return <StartScreen />;
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

      {/* Enhanced 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 15, 15], fov: 50, near: 0.1, far: 1000 }}
        className="absolute inset-0"
      >
        {orbitControlsEnabled ? (
          <OrbitControls enablePan enableZoom enableRotate />
        ) : (
          <EnhancedCameraController
            snakeHead={snake[0] || { x: 10, z: 10 }}
            direction={direction}
            gameState={gameState}
            shake={cameraShake}
            mode={cameraMode}
          />
        )}
        
        <AdvancedLighting />
        <Environment preset="sunset" />
        
        {/* Post-processing effects */}
        <EffectComposer>
          <Bloom intensity={0.5} luminanceThreshold={0.9} />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
        
        <RealisticEnvironment />
        
        <GLTFSnake
          segments={snake}
          isAlive={gameState === 'playing'}
          direction={direction}
        />
        
        {food.map((item, i) => (
          <GLTFFood
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

      {/* Enhanced HUD and UI */}
      <div className="absolute inset-0 pointer-events-none">
        <GameHUD />
        
        {/* Control Panel */}
        <div className="absolute top-4 right-4 pointer-events-auto space-y-2">
          <button
            onClick={() => setCameraMode(cameraMode === 'follow' ? 'overview' : cameraMode === 'overview' ? 'cinematic' : 'follow')}
            className="block w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 text-sm"
          >
            Camera: {cameraMode.charAt(0).toUpperCase() + cameraMode.slice(1)}
          </button>
          <button
            onClick={() => setOrbitControlsEnabled(!orbitControlsEnabled)}
            className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 text-sm"
          >
            {orbitControlsEnabled ? 'Free Cam ON' : 'Free Cam OFF'}
          </button>
          <button
            onClick={() => resetGame()}
            className="block w-full px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-500 hover:to-orange-500 transition-all duration-200 text-sm"
          >
            Home (H)
          </button>
        </div>
        
        {/* Game Controls Info */}
        <div className="absolute bottom-4 left-4 pointer-events-none text-cyan-300 text-xs space-y-1">
          <div>WASD/Arrows: Move</div>
          <div>SPACE: Pause</div>
          <div>C: Camera Mode</div>
          <div>O: Orbit Controls</div>
          <div>H: Home</div>
          <div>ESC: Back/Pause</div>
        </div>
      </div>

      {/* Touch Controls for Mobile */}
      <div className="absolute bottom-4 right-4 md:hidden pointer-events-auto">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'down') moveSnake('up');
            }}
            className="w-12 h-12 bg-gradient-to-t from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">↑</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'right') moveSnake('left');
            }}
            className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">←</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              pauseGame();
            }}
            className="w-12 h-12 bg-gradient-to-t from-purple-600 to-purple-400 border border-purple-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-xs">⏸</span>
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'left') moveSnake('right');
            }}
            className="w-12 h-12 bg-gradient-to-l from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">→</span>
          </button>
          <div></div>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (direction !== 'up') moveSnake('down');
            }}
            className="w-12 h-12 bg-gradient-to-b from-cyan-600 to-cyan-400 border border-cyan-300 rounded-lg flex items-center justify-center backdrop-blur-md shadow-lg"
          >
            <span className="text-white text-lg">↓</span>
          </button>
          <div></div>
        </div>
      </div>

      {/* Game Status Overlays */}
      {gameState === 'playing' && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-mono text-sm">
              REALISTIC MODE ACTIVE
            </span>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl font-bold text-cyan-400 mb-4 animate-pulse">PAUSED</div>
            <div className="text-cyan-300 font-mono">Press SPACE to continue</div>
            <div className="text-cyan-300 font-mono mt-2">Press H to return home</div>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
          <div className="text-center p-8 bg-gray-900/90 rounded-xl border border-red-500 max-w-md">
            <div className="text-5xl font-bold text-red-400 mb-4 animate-pulse">GAME OVER</div>
            <div className="text-red-300 font-mono mb-6 text-xl">Final Score: {score}</div>
            <div className="space-y-4">
              <button
                onClick={() => startGame('classic')}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 font-bold"
              >
                RESTART MISSION
              </button>
              <button
                onClick={() => resetGame()}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 font-bold"
              >
                RETURN HOME
              </button>
              <button
                onClick={() => toggleLeaderboard()}
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
