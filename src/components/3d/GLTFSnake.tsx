
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { 
  Group, 
  CatmullRomCurve3, 
  Vector3,
  Quaternion,
  Euler
} from 'three';
import { Position, Direction } from '../../store/gameStore';

interface GLTFSnakeProps {
  segments: Position[];
  isAlive: boolean;
  direction: Direction;
}

export const GLTFSnake: React.FC<GLTFSnakeProps> = ({ segments, isAlive, direction }) => {
  const groupRef = useRef<Group>(null);
  const gltfGroupRef = useRef<Group>(null);
  const [gltfLoaded, setGltfLoaded] = useState(false);
  const animationTime = useRef(0);

  // Try to load GLTF model with fallback
  let gltf, actions;
  try {
    gltf = useGLTF('/models/snake.glb');
    const animationsResult = useAnimations(gltf.animations, gltfGroupRef);
    actions = animationsResult.actions;
    setGltfLoaded(true);
  } catch (error) {
    console.warn('Failed to load snake GLTF model:', error);
    gltf = null;
    actions = null;
  }

  const hasValidGLTF = gltf && gltfLoaded && gltf.scene && gltf.scene.children.length > 0;

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

  // Create fallback snake geometry if GLTF fails to load
  const fallbackSnake = useMemo(() => {
    if (segments.length === 0) return null;
    
    const points = segments.map((segment, index) => {
      const baseY = 0.2;
      const waveY = Math.sin(index * 0.3) * 0.05;
      return new Vector3(segment.x - 10, baseY + waveY, segment.z - 10);
    });

    if (points.length >= 2) {
      return new CatmullRomCurve3(points, false, 'catmullrom', 0.3);
    }
    return null;
  }, [segments]);

  // Setup animations
  useEffect(() => {
    if (actions && clonedScene) {
      // Play the first animation if available
      const actionNames = Object.keys(actions);
      if (actionNames.length > 0 && actions[actionNames[0]]) {
        actions[actionNames[0]].play();
      }
    }
  }, [actions, clonedScene]);

  // Animate the snake
  useFrame((state, delta) => {
    animationTime.current += delta;

    if (groupRef.current && segments.length > 0) {
      const headPos = segments[0];
      const worldHeadPos = new Vector3(headPos.x - 10, 0.2, headPos.z - 10);
      
      // Position the main group at the head
      groupRef.current.position.copy(worldHeadPos);
      
      // Rotate based on direction
      const rotationMap: Record<Direction, number> = {
        right: 0,
        down: Math.PI / 2,
        left: Math.PI,
        up: -Math.PI / 2
      };
      
      groupRef.current.rotation.y = rotationMap[direction];
      
      // Add subtle animations
      if (isAlive) {
        groupRef.current.position.y += Math.sin(animationTime.current * 4) * 0.02;
        groupRef.current.rotation.z = Math.sin(animationTime.current * 2) * 0.05;
      }
    }
  });

  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* GLTF Model */}
      {clonedScene && (
        <group
          ref={gltfGroupRef}
          scale={isAlive ? [0.3, 0.3, 0.3] : [0.25, 0.25, 0.25]}
        >
          <primitive object={clonedScene} />
        </group>
      )}
      
      {/* Fallback procedural snake if GLTF fails */}
      {!clonedScene && (
        <>
          {/* Snake Head */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshPhysicalMaterial
              color={isAlive ? '#2A5A2A' : '#555555'}
              emissive={isAlive ? '#0A2A0A' : '#222222'}
              emissiveIntensity={0.2}
              metalness={0.1}
              roughness={0.3}
            />
          </mesh>
          
          {/* Snake Body Segments */}
          {segments.slice(1).map((segment, index) => (
            <mesh
              key={`segment-${index}`}
              position={[segment.x - 10, 0.15, segment.z - 10]}
            >
              <sphereGeometry args={[0.2 - index * 0.01, 12, 12]} />
              <meshPhysicalMaterial
                color={isAlive ? '#1A4A1A' : '#444444'}
                emissive={isAlive ? '#0A1A0A' : '#111111'}
                emissiveIntensity={0.1}
                metalness={0.1}
                roughness={0.4}
              />
            </mesh>
          ))}
          
          {/* Eyes */}
          <mesh position={[0.15, 0.1, 0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial 
              color="#000000" 
              emissive={isAlive ? "#FF0000" : "#440000"} 
              emissiveIntensity={0.5} 
            />
          </mesh>
          <mesh position={[0.15, 0.1, -0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial 
              color="#000000" 
              emissive={isAlive ? "#FF0000" : "#440000"} 
              emissiveIntensity={0.5} 
            />
          </mesh>
          
          {/* Animated Tongue */}
          {isAlive && (
            <mesh 
              position={[0.25, 0, 0]} 
              rotation={[0, 0, Math.sin(animationTime.current * 8) * 0.2]}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.15, 6]} />
              <meshStandardMaterial 
                color="#FF2020" 
                emissive="#FF2020" 
                emissiveIntensity={0.3} 
              />
            </mesh>
          )}
        </>
      )}
      
      {/* Particle effects */}
      {isAlive && (
        <pointLight
          position={[0, 0.2, 0]}
          color="#00FF00"
          intensity={0.3}
          distance={2}
        />
      )}
    </group>
  );
};
