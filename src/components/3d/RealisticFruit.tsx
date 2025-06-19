
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Mesh, Vector3, Group } from 'three';
import { Food } from '../../store/gameStore';

interface RealisticFruitProps {
  food: Food;
  onEaten: () => void;
}

// Realistic fruit configurations with proper URLs
const FRUIT_MODELS = {
  apple: '/models/apple.glb',
  banana: '/models/banana.glb',
  mushroom: '/models/mushroom.glb',
  cherry: '/models/cherry.glb'
};

// Enhanced fallback fruits with realistic colors and properties
const FALLBACK_FRUITS = [
  { 
    color: '#FF4444', 
    emissive: '#AA1111', 
    shape: 'apple',
    geometry: <sphereGeometry args={[0.2, 20, 20]} />,
    scale: 0.35,
    name: 'Apple'
  },
  { 
    color: '#FFDD00', 
    emissive: '#BB9900', 
    shape: 'banana',
    geometry: <capsuleGeometry args={[0.08, 0.25, 4, 8]} />,
    scale: 0.4,
    name: 'Banana'
  },
  { 
    color: '#8B4513', 
    emissive: '#442211', 
    shape: 'mushroom',
    geometry: (
      <group>
        <sphereGeometry args={[0.15, 16, 8]} />
      </group>
    ),
    scale: 0.3,
    name: 'Mushroom'
  },
  { 
    color: '#DC143C', 
    emissive: '#881122', 
    shape: 'cherry',
    geometry: <sphereGeometry args={[0.12, 16, 16]} />,
    scale: 0.25,
    name: 'Cherry'
  }
];

const FruitModel: React.FC<{ 
  modelPath: string; 
  fallback: any; 
  scale: number; 
  position: Vector3; 
  onClick: () => void; 
  onHover: (hovered: boolean) => void;
  isPowerFood: boolean;
}> = ({ modelPath, fallback, scale, position, onClick, onHover, isPowerFood }) => {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const [loadError, setLoadError] = useState(false);
  
  // Try to load GLTF model with error handling
  let gltf;
  try {
    gltf = useGLTF(modelPath);
  } catch (error) {
    console.warn(`Failed to load fruit model ${modelPath}:`, error);
    setLoadError(true);
  }

  // Gentle floating animation
  useFrame((state, delta) => {
    const targetRef = gltf && !loadError ? groupRef : meshRef;
    
    if (targetRef.current) {
      const time = state.clock.elapsedTime;
      const floatHeight = position.y + Math.sin(time * 1.5 + position.x * 0.3) * 0.08;
      targetRef.current.position.y = floatHeight;
      
      // Gentle rotation
      targetRef.current.rotation.y += delta * 0.5;
      
      // Subtle pulsing for power food
      if (isPowerFood) {
        const pulseFactor = 1 + Math.sin(time * 3) * 0.15;
        targetRef.current.scale.setScalar(scale * pulseFactor);
      }
    }
  });

  // Use GLTF model if available, otherwise fallback
  if (gltf && !loadError && gltf.scene) {
    const clonedScene = gltf.scene.clone();
    
    // Apply enhanced materials to GLTF
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.envMapIntensity = 2.0;
        child.material.roughness = 0.2;
        child.material.metalness = 0.1;
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Add emissive glow
        child.material.emissive = child.material.color.clone().multiplyScalar(0.3);
        child.material.emissiveIntensity = isPowerFood ? 0.6 : 0.4;
      }
    });

    return (
      <group
        ref={groupRef}
        position={position}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
        scale={[scale, scale, scale]}
      >
        <primitive object={clonedScene} />
      </group>
    );
  }

  // Fallback procedural fruit
  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
      castShadow
      receiveShadow
      scale={[scale, scale, scale]}
    >
      {fallback.geometry}
      <meshPhysicalMaterial
        color={fallback.color}
        emissive={fallback.emissive}
        emissiveIntensity={isPowerFood ? 0.6 : 0.4}
        metalness={0.1}
        roughness={0.2}
        clearcoat={0.9}
        clearcoatRoughness={0.1}
        envMapIntensity={2.0}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
};

export const RealisticFruit: React.FC<RealisticFruitProps> = ({ food, onEaten }) => {
  const [hovered, setHovered] = useState(false);

  // Deterministic fruit selection based on position
  const fruitIndex = useMemo(() => {
    return (food.x + food.z * 13) % FALLBACK_FRUITS.length;
  }, [food.x, food.z]);

  const selectedFruit = FALLBACK_FRUITS[fruitIndex];
  const modelKey = Object.keys(FRUIT_MODELS)[fruitIndex] as keyof typeof FRUIT_MODELS;
  const modelPath = FRUIT_MODELS[modelKey];

  const isPowerFood = food.type === 'power';
  const baseScale = isPowerFood ? selectedFruit.scale * 1.4 : selectedFruit.scale;
  const finalScale = hovered ? baseScale * 1.2 : baseScale;

  const handleClick = () => {
    console.log(`${selectedFruit.name} eaten at:`, food.x, food.z);
    onEaten();
  };

  const position = new Vector3(food.x - 10, 0.4, food.z - 10);

  return (
    <group>
      <FruitModel
        modelPath={modelPath}
        fallback={selectedFruit}
        scale={finalScale}
        position={position}
        onClick={handleClick}
        onHover={setHovered}
        isPowerFood={isPowerFood}
      />
      
      {/* Enhanced lighting with fruit-specific colors */}
      <pointLight
        position={[food.x - 10, 0.6, food.z - 10]}
        color={selectedFruit.color}
        intensity={isPowerFood ? 1.2 : 0.8}
        distance={isPowerFood ? 5 : 3}
        decay={2}
        castShadow
      />

      {/* Power food special effects */}
      {isPowerFood && (
        <>
          <mesh position={[food.x - 10, 0.4, food.z - 10]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial 
              color={selectedFruit.color} 
              transparent 
              opacity={0.15}
              wireframe
            />
          </mesh>
          
          {/* Gentle sparkle effect */}
          <pointLight
            position={[food.x - 10, 0.4, food.z - 10]}
            color="#FFFFFF"
            intensity={0.5}
            distance={2}
            decay={3}
          />
        </>
      )}
      
      {/* Soft ground shadow */}
      <mesh 
        position={[food.x - 10, 0.02, food.z - 10]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};
