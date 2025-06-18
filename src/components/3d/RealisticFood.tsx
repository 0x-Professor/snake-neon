
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Color } from 'three';
import { Food } from '../../store/gameStore';

interface RealisticFoodProps {
  food: Food;
  onEaten: () => void;
}

// Randomized food configurations for variety
const FOOD_VARIANTS = {
  normal: [
    { color: '#ff4444', emissive: '#441111', shape: 'sphere', metalness: 0.1, roughness: 0.3 },
    { color: '#ff6644', emissive: '#441100', shape: 'sphere', metalness: 0.2, roughness: 0.4 },
    { color: '#ff2266', emissive: '#440022', shape: 'octahedron', metalness: 0.0, roughness: 0.5 },
    { color: '#cc4488', emissive: '#330022', shape: 'dodecahedron', metalness: 0.3, roughness: 0.2 }
  ],
  power: [
    { color: '#ff00ff', emissive: '#440044', shape: 'octahedron', metalness: 0.4, roughness: 0.1 },
    { color: '#8800ff', emissive: '#220044', shape: 'icosahedron', metalness: 0.6, roughness: 0.2 },
    { color: '#ff0088', emissive: '#440022', shape: 'dodecahedron', metalness: 0.8, roughness: 0.1 },
    { color: '#6600ff', emissive: '#220044', shape: 'octahedron', metalness: 0.5, roughness: 0.15 }
  ]
};

export const RealisticFood: React.FC<RealisticFoodProps> = ({ food, onEaten }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const animationTime = useRef(0);
  
  // Randomized food variant based on position (deterministic)
  const foodVariant = useMemo(() => {
    const variants = FOOD_VARIANTS[food.type];
    const index = (food.x + food.z * 20) % variants.length;
    return variants[index];
  }, [food.x, food.z, food.type]);

  console.log('RealisticFood rendering at:', food.x, food.z, 'Type:', food.type, 'Variant:', foodVariant);

  // Enhanced scale calculation for different food types
  const baseScale = food.type === 'power' ? 0.4 : 0.3;
  const hoverScale = hovered ? baseScale * 1.3 : baseScale;

  // Dynamic geometry based on shape variant
  const geometry = useMemo(() => {
    const { shape } = foodVariant;
    switch (shape) {
      case 'octahedron':
        return <octahedronGeometry args={[1, 0]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[1, 0]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[1, 0]} />;
      case 'sphere':
      default:
        return <sphereGeometry args={[1, 16, 16]} />;
    }
  }, [foodVariant.shape]);

  // Enhanced animation with realistic physics
  useFrame((state, delta) => {
    animationTime.current += delta;
    
    if (meshRef.current) {
      // Enhanced floating animation with natural motion
      const floatHeight = 0.5 + Math.sin(animationTime.current * 2 + food.x * 0.5) * 0.15;
      const lateralSway = Math.sin(animationTime.current * 1.5 + food.z * 0.3) * 0.02;
      
      meshRef.current.position.y = floatHeight;
      meshRef.current.position.x = (food.x - 10) + lateralSway;
      
      // Complex rotation based on food type and variant
      if (food.type === 'power') {
        // Power food spins faster with multiple axes
        meshRef.current.rotation.y += delta * 3;
        meshRef.current.rotation.x = Math.sin(animationTime.current * 2) * 0.3;
        meshRef.current.rotation.z = Math.cos(animationTime.current * 1.5) * 0.2;
        
        // Pulsing scale for power food
        const pulseFactor = 1 + Math.sin(animationTime.current * 6) * 0.2;
        meshRef.current.scale.setScalar(hoverScale * pulseFactor);
      } else {
        // Normal food has gentler rotation
        meshRef.current.rotation.y += delta * 1.5;
        meshRef.current.rotation.x = Math.sin(animationTime.current * 1.2) * 0.1;
        
        // Subtle breathing scale
        const breatheFactor = 1 + Math.sin(animationTime.current * 3) * 0.05;
        meshRef.current.scale.setScalar(hoverScale * breatheFactor);
      }
    }
  });

  // Enhanced material properties with PBR
  const materialProps = useMemo(() => ({
    color: foodVariant.color,
    emissive: foodVariant.emissive,
    emissiveIntensity: food.type === 'power' ? 0.5 : 0.3,
    metalness: foodVariant.metalness,
    roughness: foodVariant.roughness,
    clearcoat: food.type === 'power' ? 0.9 : 0.7,
    clearcoatRoughness: food.type === 'power' ? 0.1 : 0.2,
    transmission: food.type === 'power' ? 0.3 : 0,
    ior: 1.5,
    thickness: food.type === 'power' ? 0.5 : 0,
    transparent: true,
    opacity: hovered ? 0.9 : 1.0
  }), [foodVariant, food.type, hovered]);

  const handleClick = () => {
    console.log('Food clicked at:', food.x, food.z);
    onEaten();
  };

  const handlePointerEnter = () => {
    console.log('Food hovered');
    setHovered(true);
  };

  const handlePointerLeave = () => {
    setHovered(false);
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[food.x - 10, 0.5, food.z - 10]}
        onClick={handleClick}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
        scale={hoverScale}
      >
        {geometry}
        <meshPhysicalMaterial {...materialProps} />
      </mesh>
      
      {/* Enhanced glow effect with dynamic intensity */}
      <pointLight
        position={[food.x - 10, 0.5, food.z - 10]}
        color={new Color(foodVariant.color)}
        intensity={food.type === 'power' ? 0.8 : 0.4}
        distance={food.type === 'power' ? 4 : 2}
        decay={2}
      />

      {/* Additional visual effects for power food */}
      {food.type === 'power' && (
        <>
          {/* Orbiting particles */}
          <mesh position={[food.x - 10 + Math.sin(animationTime.current * 4) * 0.8, 0.5, food.z - 10 + Math.cos(animationTime.current * 4) * 0.8]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color={foodVariant.color} transparent opacity={0.7} />
          </mesh>
          <mesh position={[food.x - 10 + Math.sin(animationTime.current * 4 + Math.PI) * 0.8, 0.5, food.z - 10 + Math.cos(animationTime.current * 4 + Math.PI) * 0.8]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color={foodVariant.color} transparent opacity={0.7} />
          </mesh>
        </>
      )}
    </group>
  );
};
