
import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import { Position, Direction } from '../../store/gameStore';

interface GLTFSnakeProps {
  segments: Position[];
  isAlive: boolean;
  direction: Direction;
}

const SnakeModel: React.FC<{ segments: Position[]; isAlive: boolean; direction: Direction }> = ({ 
  segments, 
  isAlive, 
  direction 
}) => {
  const groupRef = useRef<Group>(null);
  const gltfGroupRef = useRef<Group>(null);
  const [loadError, setLoadError] = useState(false);
  const animationTime = useRef(0);

  // Load the realistic snake model from Sketchfab
  let gltf, actions;
  try {
    gltf = useGLTF('/models/snake.glb'); // From provided Sketchfab link
    const animationsResult = useAnimations(gltf.animations, gltfGroupRef);
    actions = animationsResult.actions;
  } catch (error) {
    console.warn('Failed to load snake GLTF model:', error);
    setLoadError(true);
  }

  const clonedScene = useMemo(() => {
    if (gltf && gltf.scene && !loadError) {
      try {
        const scene = gltf.scene.clone();
        // Apply PBR materials and shadows
        scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.2;
              child.material.roughness = 0.4;
              child.material.metalness = 0.1;
            }
          }
        });
        return scene;
      } catch (error) {
        console.warn('Failed to clone snake GLTF scene:', error);
        setLoadError(true);
        return null;
      }
    }
    return null;
  }, [gltf, loadError]);

  // Setup animations
  useEffect(() => {
    if (actions && clonedScene && isAlive) {
      const actionNames = Object.keys(actions);
      if (actionNames.length > 0 && actions[actionNames[0]]) {
        actions[actionNames[0]].play();
      }
    }
  }, [actions, clonedScene, isAlive]);

  useFrame((state, delta) => {
    animationTime.current += delta;

    if (groupRef.current && segments.length > 0) {
      const headPos = segments[0];
      const worldHeadPos = new Vector3(headPos.x - 10, 0.1, headPos.z - 10);
      
      groupRef.current.position.copy(worldHeadPos);
      
      // Rotate based on direction
      const rotationMap: Record<Direction, number> = {
        right: 0,
        down: Math.PI / 2,
        left: Math.PI,
        up: -Math.PI / 2
      };
      
      groupRef.current.rotation.y = rotationMap[direction];
      
      // Add realistic movement animations
      if (isAlive) {
        groupRef.current.position.y += Math.sin(animationTime.current * 6) * 0.02;
        groupRef.current.rotation.z = Math.sin(animationTime.current * 3) * 0.03;
      } else {
        // Death animation - fall and fade
        groupRef.current.rotation.x = Math.PI / 2;
      }
    }
  });

  if (clonedScene && !loadError) {
    return (
      <group ref={groupRef}>
        <group
          ref={gltfGroupRef}
          scale={isAlive ? [0.4, 0.4, 0.4] : [0.35, 0.35, 0.35]}
        >
          <primitive object={clonedScene} />
        </group>
        
        {/* Snake head glow */}
        {isAlive && (
          <pointLight
            position={[0, 0.2, 0]}
            color="#00FF00"
            intensity={0.4}
            distance={3}
            decay={2}
          />
        )}
      </group>
    );
  }

  // Fallback procedural snake if GLTF fails
  return (
    <group ref={groupRef}>
      {/* Enhanced Snake Head */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshPhysicalMaterial
          color={isAlive ? '#2A5A2A' : '#555555'}
          emissive={isAlive ? '#0A2A0A' : '#222222'}
          emissiveIntensity={0.3}
          metalness={0.1}
          roughness={0.3}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Snake Body Segments with improved materials */}
      {segments.slice(1).map((segment, index) => (
        <mesh
          key={`segment-${index}`}
          position={[segment.x - segments[0].x, 0.1, segment.z - segments[0].z]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[Math.max(0.1, 0.25 - index * 0.01), 16, 16]} />
          <meshPhysicalMaterial
            color={isAlive ? '#1A4A1A' : '#444444'}
            emissive={isAlive ? '#0A1A0A' : '#111111'}
            emissiveIntensity={0.2}
            metalness={0.1}
            roughness={0.4}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}
      
      {/* Enhanced Eyes */}
      <mesh position={[0.2, 0.1, 0.1]} castShadow>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshPhysicalMaterial 
          color="#000000" 
          emissive={isAlive ? "#FF0000" : "#440000"} 
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0.2, 0.1, -0.1]} castShadow>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshPhysicalMaterial 
          color="#000000" 
          emissive={isAlive ? "#FF0000" : "#440000"} 
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Animated Tongue */}
      {isAlive && (
        <mesh 
          position={[0.3, 0, 0]} 
          rotation={[0, 0, Math.sin(animationTime.current * 10) * 0.3]}
          castShadow
        >
          <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
          <meshPhysicalMaterial 
            color="#FF2020" 
            emissive="#FF2020" 
            emissiveIntensity={0.5}
            metalness={0.2}
            roughness={0.3}
          />
        </mesh>
      )}
    </group>
  );
};

export const GLTFSnake: React.FC<GLTFSnakeProps> = ({ segments, isAlive, direction }) => {
  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <Suspense fallback={
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#228822" />
      </mesh>
    }>
      <SnakeModel segments={segments} isAlive={isAlive} direction={direction} />
    </Suspense>
  );
};
