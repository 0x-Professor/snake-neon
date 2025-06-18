
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { GameHUD } from './GameHUD';
import { StartScreen } from './StartScreen';
import { SettingsPanel } from './SettingsPanel';
import { Leaderboard } from './Leaderboard';
import { PowerUpEffect } from './PowerUpEffect';
import { SoundManager } from './SoundManager';

const GRID_SIZE = 20;
const CELL_SIZE = 1;

interface SnakeSegmentProps {
  position: [number, number, number];
  isHead?: boolean;
}

const SnakeSegment: React.FC<SnakeSegmentProps> = ({ position, isHead = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      const scale = isHead ? 1.1 : 1.0;
      meshRef.current.scale.setScalar(scale);
    }
  }, [isHead]);

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9]}
    >
      <meshPhongMaterial 
        color={isHead ? "#00ffff" : "#0099cc"} 
        emissive={isHead ? "#004444" : "#002233"}
        shininess={100}
      />
    </Box>
  );
};

interface FoodProps {
  position: [number, number, number];
  type: 'normal' | 'power';
}

const Food: React.FC<FoodProps> = ({ position, type }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      const animate = () => {
        if (meshRef.current) {
          meshRef.current.rotation.y += 0.02;
          meshRef.current.position.y = Math.sin(Date.now() * 0.005) * 0.1;
        }
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, []);

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[CELL_SIZE * 0.8, CELL_SIZE * 0.8, CELL_SIZE * 0.8]}
    >
      <meshPhongMaterial 
        color={type === 'power' ? "#ff00ff" : "#ffff00"} 
        emissive={type === 'power' ? "#440044" : "#444400"}
        shininess={100}
      />
    </Box>
  );
};

const GameGrid: React.FC = () => {
  const gridLines = [];
  
  // Create horizontal lines
  for (let i = -GRID_SIZE/2; i <= GRID_SIZE/2; i++) {
    const points = [
      new THREE.Vector3(-GRID_SIZE/2, 0, i),
      new THREE.Vector3(GRID_SIZE/2, 0, i)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    gridLines.push(
      <line key={`h${i}`} geometry={geometry}>
        <lineBasicMaterial color="#333366" />
      </line>
    );
  }
  
  // Create vertical lines
  for (let i = -GRID_SIZE/2; i <= GRID_SIZE/2; i++) {
    const points = [
      new THREE.Vector3(i, 0, -GRID_SIZE/2),
      new THREE.Vector3(i, 0, GRID_SIZE/2)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    gridLines.push(
      <line key={`v${i}`} geometry={geometry}>
        <lineBasicMaterial color="#333366" />
      </line>
    );
  }
  
  return <group>{gridLines}</group>;
};

export const SnakeGame: React.FC = () => {
  const {
    gameState,
    snake,
    food,
    powerUps,
    score,
    gameMode,
    startGame,
    pauseGame,
    moveSnake,
    settings,
    showSettings,
    showLeaderboard
  } = useGameStore();

  const gameLoopRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

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
        // Game update logic will be handled by the store
        lastUpdateRef.current = timestamp;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, settings.gameSpeed]);

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
      <SoundManager />
      
      {/* Particle effects background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
      
      {/* 3D Game Canvas */}
      <Canvas
        camera={{ position: [0, 15, 15], fov: 60 }}
        className="absolute inset-0"
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <spotLight position={[0, 20, 0]} intensity={0.5} color="#00ffff" />
        
        <GameGrid />
        
        {/* Render Snake */}
        {snake.map((segment, index) => (
          <SnakeSegment
            key={index}
            position={[segment.x - GRID_SIZE/2, 0.5, segment.z - GRID_SIZE/2]}
            isHead={index === 0}
          />
        ))}
        
        {/* Render Food */}
        {food.map((item, index) => (
          <Food
            key={index}
            position={[item.x - GRID_SIZE/2, 0.5, item.z - GRID_SIZE/2]}
            type={item.type}
          />
        ))}
        
        {/* Render Power-ups */}
        {powerUps.map((powerUp, index) => (
          <PowerUpEffect
            key={index}
            position={[powerUp.x - GRID_SIZE/2, 0.5, powerUp.z - GRID_SIZE/2]}
            type={powerUp.type}
          />
        ))}
        
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>

      {/* Game HUD */}
      <GameHUD />

      {/* Touch Controls for Mobile */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onTouchStart={() => moveSnake('up')}
            className="w-12 h-12 bg-cyan-500/20 border border-cyan-500 rounded-lg flex items-center justify-center backdrop-blur-sm"
          >
            <span className="text-cyan-400 text-xl">↑</span>
          </button>
          <div></div>
          <button
            onTouchStart={() => moveSnake('left')}
            className="w-12 h-12 bg-cyan-500/20 border border-cyan-500 rounded-lg flex items-center justify-center backdrop-blur-sm"
          >
            <span className="text-cyan-400 text-xl">←</span>
          </button>
          <button
            onTouchStart={() => pauseGame()}
            className="w-12 h-12 bg-purple-500/20 border border-purple-500 rounded-lg flex items-center justify-center backdrop-blur-sm"
          >
            <span className="text-purple-400 text-xs">⏸</span>
          </button>
          <button
            onTouchStart={() => moveSnake('right')}
            className="w-12 h-12 bg-cyan-500/20 border border-cyan-500 rounded-lg flex items-center justify-center backdrop-blur-sm"
          >
            <span className="text-cyan-400 text-xl">→</span>
          </button>
          <div></div>
          <button
            onTouchStart={() => moveSnake('down')}
            className="w-12 h-12 bg-cyan-500/20 border border-cyan-500 rounded-lg flex items-center justify-center backdrop-blur-sm"
          >
            <span className="text-cyan-400 text-xl">↓</span>
          </button>
          <div></div>
        </div>
      </div>
    </div>
  );
};
