
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, Vector3, AnimationMixer } from 'three';
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
  const mixerRef = useRef<AnimationMixer>();
  const [gltf, setGltf] = useState<any>(null);
  const [hovered, setHovered] = useState(false);
  const animationTime = useRef(0);

  // Select food type based on position (deterministic)
  const foodIndex = useMemo(() => {
    return (food.x + food.z * 20) % FALLBACK_FOODS.length;
  }, [food.x, food.z]);

  const selectedFood = FALLBACK_FOODS[foodIndex];
  const modelKey = Object.keys(FOOD_MODELS)[foodIndex] as keyof typeof FOOD_MODELS;

  // Try to load GLTF model
  useEffect(() => {
    const loader = new GLTFLoader();
    const modelUrl = FOOD_MODELS[modelKey];
    
    loader.load(
      modelUrl,
      (gltfModel) => {
        console.log(`GLTF food model loaded: ${modelKey}`);
        setGltf(gltfModel);
        
        if (gltfModel.animations.length > 0) {
          const mixer = new AnimationMixer(gltfModel.scene);
          mixerRef.current = mixer;
          
          const action = mixer.clipAction(gltfModel.animations[0]);
          action.play();
        }
      },
      undefined,
      (error) => {
        console.warn(`Failed to load food model ${modelKey}:`, error);
        setGltf(null);
      }
    );
  }, [modelKey]);

  useFrame((state, delta) => {
    animationTime.current += delta;
    
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    if (meshRef.current) {
      // Floating animation
      const floatHeight = 0.3 + Math.sin(animationTime.current * 2 + food.x * 0.5) * 0.1;
      meshRef.current.position.y = floatHeight;
      
      // Rotation
      meshRef.current.rotation.y += delta * (food.type === 'power' ? 2 : 1);
      
      // Pulsing for power food
      if (food.type === 'power') {
        const scale = 1 + Math.sin(animationTime.current * 4) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
      
      // Hover effect
      if (hovered) {
        meshRef.current.scale.multiplyScalar(1.2);
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
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
      >
        {gltf ? (
          <primitive 
            object={gltf.scene.clone()} 
            scale={[0.2, 0.2, 0.2]}
          />
        ) : (
          <>
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
          </>
        )}
      </mesh>
      
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
