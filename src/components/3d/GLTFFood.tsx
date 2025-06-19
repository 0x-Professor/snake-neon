
import React, { useRef, useState, useMemo, Suspense, useEffect } from 'react';
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
  apple: '/models/apple.glb',
  cheese: '/models/cheese.glb', 
  frog: '/models/frog.glb',
  egg: '/models/egg.glb'
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

const FoodModel: React.FC<{ 
  modelPath: string; 
  fallback: any; 
  scale: number; 
  position: Vector3; 
  onClick: () => void; 
  onHover: (hovered: boolean) => void 
}> = ({ modelPath, fallback, scale, position, onClick, onHover }) => {
  const gltfGroupRef = useRef<Group>(null);
  const fallbackRef = useRef<Mesh>(null);
  const [loadError, setLoadError] = useState(false);
  const [gltfData, setGltfData] = useState<any>(null);
  
  // Load GLTF with proper error handling
  useEffect(() => {
    let cancelled = false;
    
    const loadModel = async () => {
      try {
        const gltf = await useGLTF.preload(modelPath);
        if (!cancelled) {
          setGltfData(gltf);
        }
      } catch (error) {
        console.warn(`Failed to load food model ${modelPath}:`, error);
        if (!cancelled) {
          setLoadError(true);
        }
      }
    };
    
    loadModel();
    
    return () => {
      cancelled = true;
    };
  }, [modelPath]);

  const clonedScene = useMemo(() => {
    if (gltfData && gltfData.scene && !loadError) {
      try {
        const scene = gltfData.scene.clone();
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
        return null;
      }
    }
    return null;
  }, [gltfData, loadError]);

  useFrame((state, delta) => {
    const targetRef = clonedScene ? gltfGroupRef : fallbackRef;
    
    if (targetRef.current) {
      const floatHeight = position.y + Math.sin(state.clock.elapsedTime * 2 + position.x * 0.5) * 0.1;
      targetRef.current.position.y = floatHeight;
      targetRef.current.rotation.y += delta;
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
      
      <pointLight
        position={[food.x - 10, 0.5, food.z - 10]}
        color={selectedFood.color}
        intensity={food.type === 'power' ? 0.8 : 0.4}
        distance={food.type === 'power' ? 4 : 2}
        decay={2}
        castShadow
      />

      {food.type === 'power' && (
        <mesh position={[food.x - 10, 0.3, food.z - 10]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial 
            color={selectedFood.color} 
            transparent 
            opacity={0.1}
            wireframe
          />
        </mesh>
      )}
      
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
