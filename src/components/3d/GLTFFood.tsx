
import React, { useRef, useState, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Mesh, Vector3, Group } from 'three';
import { Food } from '../../store/gameStore';

interface GLTFFoodProps {
  food: Food;
  onEaten: () => void;
}

// Updated food models from provided links
const FOOD_MODELS = {
  apple: '/models/apple.glb', // From Sketchfab apple model
  cheese: '/models/cheese.glb', // From Sketchfab cheese model
  frog: '/models/frog.glb', // From Sketchfab frog model
  egg: '/models/egg.glb' // From Sketchfab egg model
};

const FALLBACK_FOODS = [
  { 
    color: '#FF4444', 
    emissive: '#441111', 
    shape: 'apple',
    geometry: <sphereGeometry args={[0.15, 16, 16]} />,
    scale: 0.3
  },
  { 
    color: '#FFD700', 
    emissive: '#332200', 
    shape: 'cheese',
    geometry: <coneGeometry args={[0.15, 0.25, 6]} />,
    scale: 0.25
  },
  { 
    color: '#228B22', 
    emissive: '#0A2A0A', 
    shape: 'frog',
    geometry: <sphereGeometry args={[0.12, 12, 12]} />,
    scale: 0.2
  },
  { 
    color: '#FFFACD', 
    emissive: '#333322', 
    shape: 'egg',
    geometry: <sphereGeometry args={[0.13, 12, 16]} />,
    scale: 0.28
  }
];

const FoodModel: React.FC<{ modelPath: string; fallback: any; scale: number; position: Vector3; onClick: () => void; onHover: (hovered: boolean) => void }> = ({ 
  modelPath, 
  fallback, 
  scale, 
  position, 
  onClick, 
  onHover 
}) => {
  const gltfGroupRef = useRef<Group>(null);
  const fallbackRef = useRef<Mesh>(null);
  const [loadError, setLoadError] = useState(false);
  
  let gltf;
  try {
    gltf = useGLTF(modelPath);
  } catch (error) {
    console.warn(`Failed to load food model ${modelPath}:`, error);
    setLoadError(true);
  }

  const clonedScene = useMemo(() => {
    if (gltf && gltf.scene && !loadError) {
      try {
        const scene = gltf.scene.clone();
        // Apply PBR materials enhancement
        scene.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.envMapIntensity = 1.5;
            child.material.roughness = 0.3;
            child.material.metalness = 0.1;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        return scene;
      } catch (error) {
        console.warn('Failed to clone GLTF scene:', error);
        setLoadError(true);
        return null;
      }
    }
    return null;
  }, [gltf, loadError]);

  useFrame((state, delta) => {
    const targetRef = clonedScene ? gltfGroupRef : fallbackRef;
    
    if (targetRef.current) {
      // Floating animation
      const floatHeight = position.y + Math.sin(state.clock.elapsedTime * 2 + position.x * 0.5) * 0.1;
      targetRef.current.position.y = floatHeight;
      
      // Rotation
      targetRef.current.rotation.y += delta;
      
      // Pulsing for power food
      const basePulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      targetRef.current.scale.setScalar(scale * basePulse);
    }
  });

  if (clonedScene && !loadError) {
    return (
      <group
        ref={gltfGroupRef}
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

  // Fallback to procedural geometry
  return (
    <mesh
      ref={fallbackRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
      castShadow
      receiveShadow
    >
      {fallback.geometry}
      <meshPhysicalMaterial
        color={fallback.color}
        emissive={fallback.emissive}
        emissiveIntensity={0.3}
        metalness={0.1}
        roughness={0.3}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
        envMapIntensity={1.5}
      />
    </mesh>
  );
};

export const GLTFFood: React.FC<GLTFFoodProps> = ({ food, onEaten }) => {
  const [hovered, setHovered] = useState(false);

  // Select food type based on position (deterministic)
  const foodIndex = useMemo(() => {
    return (food.x + food.z * 20) % FALLBACK_FOODS.length;
  }, [food.x, food.z]);

  const selectedFood = FALLBACK_FOODS[foodIndex];
  const modelKey = Object.keys(FOOD_MODELS)[foodIndex] as keyof typeof FOOD_MODELS;
  const modelPath = FOOD_MODELS[modelKey];

  const handleClick = () => {
    console.log('Food clicked:', selectedFood.shape);
    onEaten();
  };

  const position = new Vector3(food.x - 10, 0.3, food.z - 10);

  return (
    <group>
      <Suspense fallback={
        <mesh position={position} castShadow receiveShadow>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      }>
        <FoodModel
          modelPath={modelPath}
          fallback={selectedFood}
          scale={selectedFood.scale * (food.type === 'power' ? 1.3 : 1)}
          position={position}
          onClick={handleClick}
          onHover={setHovered}
        />
      </Suspense>
      
      {/* Enhanced glow effect with better PBR */}
      <pointLight
        position={[food.x - 10, 0.5, food.z - 10]}
        color={selectedFood.color}
        intensity={food.type === 'power' ? 0.8 : 0.4}
        distance={food.type === 'power' ? 4 : 2}
        decay={2}
        castShadow
      />

      {/* Additional visual effects for power food */}
      {food.type === 'power' && (
        <>
          {/* Energy field */}
          <mesh position={[food.x - 10, 0.3, food.z - 10]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial 
              color={selectedFood.color} 
              transparent 
              opacity={0.1}
              wireframe
            />
          </mesh>
        </>
      )}
      
      {/* Ground shadow for realism */}
      <mesh 
        position={[food.x - 10, 0.01, food.z - 10]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};
