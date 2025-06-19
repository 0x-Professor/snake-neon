
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Mesh, Vector3, Group } from 'three';
import { Food } from '../../store/gameStore';

interface GLTFFoodProps {
  food: Food;
  onEaten: () => void;
}

const FOOD_MODELS = {
  apple: '/models/apple.glb',
  rat: '/models/rat.glb',
  frog: '/models/frog.glb',
  egg: '/models/egg.glb'
};

const FALLBACK_FOODS = [
  { 
    color: '#FF4444', 
    emissive: '#441111', 
    shape: 'apple',
    geometry: <sphereGeometry args={[0.15, 12, 12]} />
  },
  { 
    color: '#8B4513', 
    emissive: '#2B1505', 
    shape: 'rat',
    geometry: <boxGeometry args={[0.3, 0.15, 0.2]} />
  },
  { 
    color: '#228B22', 
    emissive: '#0A2A0A', 
    shape: 'frog',
    geometry: <sphereGeometry args={[0.12, 10, 10]} />
  },
  { 
    color: '#FFFACD', 
    emissive: '#333322', 
    shape: 'egg',
    geometry: <sphereGeometry args={[0.13, 12, 16]} />
  }
];

export const GLTFFood: React.FC<GLTFFoodProps> = ({ food, onEaten }) => {
  const meshRef = useRef<Mesh>(null);
  const gltfGroupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const animationTime = useRef(0);

  // Select food type based on position (deterministic)
  const foodIndex = useMemo(() => {
    return (food.x + food.z * 20) % FALLBACK_FOODS.length;
  }, [food.x, food.z]);

  const selectedFood = FALLBACK_FOODS[foodIndex];
  const modelKey = Object.keys(FOOD_MODELS)[foodIndex] as keyof typeof FOOD_MODELS;

  // Try to load GLTF model with fallback
  let gltf;
  try {
    gltf = useGLTF(FOOD_MODELS[modelKey]);
  } catch (error) {
    console.warn(`Failed to load food model ${modelKey}:`, error);
    gltf = null;
  }

  const hasValidGLTF = gltf && gltf.scene && gltf.scene.children.length > 0;

  // Create a cloned scene for safe rendering
  const clonedScene = useMemo(() => {
    if (hasValidGLTF) {
      try {
        return gltf.scene.clone();
      } catch (error) {
        console.warn('Failed to clone GLTF scene:', error);
        return null;
      }
    }
    return null;
  }, [hasValidGLTF, gltf]);

  useFrame((state, delta) => {
    animationTime.current += delta;
    
    const targetRef = clonedScene ? gltfGroupRef : meshRef;
    
    if (targetRef.current) {
      // Floating animation
      const floatHeight = 0.3 + Math.sin(animationTime.current * 2 + food.x * 0.5) * 0.1;
      targetRef.current.position.y = floatHeight;
      
      // Rotation
      targetRef.current.rotation.y += delta * (food.type === 'power' ? 2 : 1);
      
      // Pulsing for power food
      if (food.type === 'power') {
        const scale = 1 + Math.sin(animationTime.current * 4) * 0.1;
        targetRef.current.scale.setScalar(scale);
      }
      
      // Hover effect
      if (hovered) {
        targetRef.current.scale.multiplyScalar(1.2);
      }
    }
  });

  const handleClick = () => {
    console.log('Food clicked:', selectedFood.shape);
    onEaten();
  };

  const handlePointerEnter = () => setHovered(true);
  const handlePointerLeave = () => setHovered(false);

  return (
    <group position={[food.x - 10, 0, food.z - 10]}>
      {clonedScene ? (
        <group
          ref={gltfGroupRef}
          onClick={handleClick}
          onPointerOver={handlePointerEnter}
          onPointerOut={handlePointerLeave}
          scale={[0.2, 0.2, 0.2]}
        >
          <primitive object={clonedScene} />
        </group>
      ) : (
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={handlePointerEnter}
          onPointerOut={handlePointerLeave}
        >
          {selectedFood.geometry}
          <meshPhysicalMaterial
            color={selectedFood.color}
            emissive={selectedFood.emissive}
            emissiveIntensity={food.type === 'power' ? 0.5 : 0.2}
            metalness={0.1}
            roughness={0.3}
            clearcoat={0.8}
            transparent
            opacity={hovered ? 0.9 : 1.0}
          />
        </mesh>
      )}
      
      {/* Glow effect */}
      <pointLight
        position={[0, 0.3, 0]}
        color={selectedFood.color}
        intensity={food.type === 'power' ? 0.6 : 0.3}
        distance={2}
      />
    </group>
  );
};
