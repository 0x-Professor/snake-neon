
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
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
  const [particleEffects, setParticleEffects] = useState<Array<{
    id: string;
    position: Vector3;
    type: 'eating' | 'collision' | 'trail';
    active: boolean;
  }>>([]);
  const [cameraShake, setCameraShake] = useState(false);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState !== 'playing') return;

    const keyMap = settings.keyMapping;
    switch (event.key.toLowerCase()) {
      case keyMap.up:
        event.preventDefault();
        moveSnake('up');
        break;
      case keyMap.down:
        event.preventDefault();
        moveSnake('down');
        break;
      case keyMap.left:
        event.preventDefault();
        moveSnake('left');
        break;
      case keyMap.right:
        event.preventDefault();
        moveSnake('right');
        break;
      case ' ':
        event.preventDefault();
        pauseGame();
        break;
    }
  }, [gameState, moveSnake, pauseGame, settings.keyMapping]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState === 'playing') {
      if (timestamp - lastUpdateRef.current > (600 - settings.gameSpeed * 50)) {
        updateGame();
        lastUpdateRef.current = timestamp;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, settings.gameSpeed, updateGame]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
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
    // Create eating particle effect
    const headPos = snake[0];
    if (headPos) {
      const newEffect = {
        id: Date.now().toString(),
        position: new Vector3(headPos.x - 10, 0.5, headPos.z - 10),
        type: 'eating' as const,
        active: true
      };
      
      setParticleEffects(prev => [...prev, newEffect]);
      
      // Remove effect after animation
      setTimeout(() => {
        setParticleEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 2000);
    }
  }, [snake]);

  const handleCollision = useCallback(() => {
    setCameraShake(true);
    
    // Create collision particle effect
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
    
    // Stop camera shake after a short time
    setTimeout(() => setCameraShake(false), 500);
  }, [snake]);

  // Monitor game state changes for effects
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

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black relative overflow-hidden">
      <SoundManager3D />
      
      {/* Enhanced 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 8], fov: 75 }}
        className="absolute inset-0"
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance"
        }}
      >
        {/* Advanced Lighting Setup */}
        <AdvancedLighting />
        
        {/* HDRI Environment */}
        <Environment preset="night" />
        
        {/* Realistic Environment */}
        <RealisticEnvironment />
        
        {/* Enhanced Snake */}
        <RealisticSnake 
          segments={snake} 
          isAlive={gameState === 'playing'} 
        />
        
        {/* Enhanced Food */}
        {food.map((item, index) => (
          <RealisticFood
            key={index}
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
        
        {/* Post-processing Effects - Fixed props */}
        <EffectComposer>
          <Bloom 
            intensity={0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
          <DepthOfField 
            focusDistance={0.1}
            focalLength={0.02}
            bokehScale={2}
          />
          <Vignette 
            offset={0.1}
            darkness={0.9}
          />
        </EffectComposer>
        
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

      {/* Enhanced Touch Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onTouchStart={() => moveSnake('up')}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-cyan-400 text-2xl font-bold">↑</span>
          </button>
          <div></div>
          <button
            onTouchStart={() => moveSnake('left')}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-cyan-400 text-2xl font-bold">←</span>
          </button>
          <button
            onTouchStart={() => pauseGame()}
            className="w-14 h-14 bg-purple-500/30 border-2 border-purple-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-purple-400 text-sm font-bold">⏸</span>
          </button>
          <button
            onTouchStart={() => moveSnake('right')}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-cyan-400 text-2xl font-bold">→</span>
          </button>
          <div></div>
          <button
            onTouchStart={() => moveSnake('down')}
            className="w-14 h-14 bg-cyan-500/30 border-2 border-cyan-400/50 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-cyan-400/25"
          >
            <span className="text-cyan-400 text-2xl font-bold">↓</span>
          </button>
          <div></div>
        </div>
      </div>
    </div>
  );
};
