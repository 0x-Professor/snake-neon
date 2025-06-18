
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Vector3 } from 'three';
import { Food } from '../../store/gameStore';

interface RealisticFoodProps {
  food: Food;
  onEaten: () => void;
}

const FOOD_MODELS = {
  normal: {
    color: '#ff4444',
    emissive: '#441111',
    scale: 0.3,
    shape: 'sphere'
  },
  power: {
    color: '#ff00ff',
    emissive: '#440044',
    scale: 0.4,
    shape: 'octahedron'
  }
};

export const RealisticFood: React.FC<RealisticFoodProps> = ({ food, onEaten }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const modelData = FOOD_MODELS[food.type];

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Rotation animation
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      
      // Pulsing scale for power food
      if (food.type === 'power') {
        const scale = modelData.scale * (1 + Math.sin(state.clock.elapsedTime * 4) * 0.2);
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  const handleClick = () => {
    onEaten();
  };

  return (
    <mesh
      ref={meshRef}
      position={[food.x - 10, 0.5, food.z - 10]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? modelData.scale * 1.2 : modelData.scale}
    >
      {modelData.shape === 'sphere' ? (
        <sphereGeometry args={[1, 16, 16]} />
      ) : (
        <octahedronGeometry args={[1, 0]} />
      )}
      <meshPhysicalMaterial
        color={modelData.color}
        emissive={modelData.emissive}
        emissiveIntensity={0.3}
        metalness={0.2}
        roughness={0.3}
        clearcoat={0.9}
        clearcoatRoughness={0.1}
        transmission={food.type === 'power' ? 0.3 : 0}
        ior={1.5}
      />
      
      {/* Glow effect */}
      <pointLight
        position={[0, 0, 0]}
        color={modelData.color}
        intensity={0.5}
        distance={3}
      />
    </mesh>
  );
};
