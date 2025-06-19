
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { Position, Direction } from '../../store/gameStore';

interface AnimatedSnakeProps {
  segments: Position[];
  isAlive: boolean;
  direction: Direction;
}

const SnakeModel: React.FC<AnimatedSnakeProps> = ({ segments, isAlive, direction }) => {
  const groupRef = useRef<Group>(null);

  // Animation loop with boundary checks
  useFrame((state, delta) => {
    if (groupRef.current && segments.length > 0) {
      const headPos = segments[0];
      
      // Enforce boundary constraints (prevent clipping through walls)
      const constrainedX = Math.max(-9.5, Math.min(9.5, headPos.x - 10));
      const constrainedZ = Math.max(-9.5, Math.min(9.5, headPos.z - 10));
      
      const worldHeadPos = new Vector3(constrainedX, 0.2, constrainedZ);
      groupRef.current.position.copy(worldHeadPos);
      
      // Direction-based rotation
      const rotationMap: Record<Direction, number> = {
        right: 0,
        down: Math.PI / 2,
        left: Math.PI,
        up: -Math.PI / 2
      };
      
      groupRef.current.rotation.y = rotationMap[direction];
      
      // Alive animations
      if (isAlive) {
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 4) * 0.03;
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      } else {
        // Death animation
        groupRef.current.rotation.x = Math.PI / 2;
        groupRef.current.rotation.z = 0;
      }
    }
  });

  // Procedural snake with enhanced materials
  return (
    <group ref={groupRef}>
      {/* Snake head */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshPhysicalMaterial
          color={isAlive ? '#2a5a2a' : '#555555'}
          emissive={isAlive ? '#0a2a0a' : '#222222'}
          emissiveIntensity={0.4}
          metalness={0.1}
          roughness={0.3}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          envMapIntensity={2.0}
        />
      </mesh>
      
      {/* Enhanced lighting for the snake */}
      {isAlive && (
        <pointLight
          position={[0, 0.3, 0]}
          color="#00aa00"
          intensity={0.6}
          distance={4}
          decay={2}
        />
      )}
      
      {/* Snake body segments for length visualization */}
      {segments.slice(1).map((segment, index) => (
        <mesh
          key={`body-${index}`}
          position={[
            Math.max(-9.5, Math.min(9.5, segment.x - 10)),
            0.1,
            Math.max(-9.5, Math.min(9.5, segment.z - 10))
          ]}
          scale={Math.max(0.15, 0.3 - index * 0.02)}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshPhysicalMaterial
            color={isAlive ? '#1a4a1a' : '#444444'}
            emissive={isAlive ? '#0a2a0a' : '#111111'}
            emissiveIntensity={0.3}
            metalness={0.1}
            roughness={0.4}
            clearcoat={0.7}
            clearcoatRoughness={0.3}
            envMapIntensity={1.8}
          />
        </mesh>
      ))}
      
      {/* Enhanced eyes with reflections */}
      <mesh position={[0.25, 0.08, 0.12]} castShadow>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshPhysicalMaterial 
          color="#000000" 
          emissive={isAlive ? "#ff0000" : "#440000"} 
          emissiveIntensity={1.0}
          metalness={1.0}
          roughness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
        />
      </mesh>
      <mesh position={[0.25, 0.08, -0.12]} castShadow>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshPhysicalMaterial 
          color="#000000" 
          emissive={isAlive ? "#ff0000" : "#440000"} 
          emissiveIntensity={1.0}
          metalness={1.0}
          roughness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
        />
      </mesh>
    </group>
  );
};

export const AnimatedSnake: React.FC<AnimatedSnakeProps> = ({ segments, isAlive, direction }) => {
  if (!segments || segments.length === 0) {
    return null;
  }

  return <SnakeModel segments={segments} isAlive={isAlive} direction={direction} />;
};
