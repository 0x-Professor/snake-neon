
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, CatmullRomCurve3, TubeGeometry, Mesh } from 'three';
import { Position, Direction } from '../../store/gameStore';

interface AnimatedSnakeProps {
  segments: Position[];
  isAlive: boolean;
  direction: Direction;
  score?: number;
}

export const AnimatedSnake: React.FC<AnimatedSnakeProps> = ({ 
  segments, 
  isAlive, 
  direction, 
  score = 0 
}) => {
  const snakeGroupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const animationTime = useRef(0);

  // Calculate speed progression based on score
  const speedMultiplier = useMemo(() => {
    return 1 + (score * 0.02); // Gradually increase speed with score
  }, [score]);

  // Create smooth curve for snake body
  const snakeCurve = useMemo(() => {
    if (segments.length < 2) return null;

    const points = segments.map(segment => 
      new Vector3(segment.x - 10, 0.1, segment.z - 10)
    );

    // Add extra points for smoother curves
    if (points.length >= 3) {
      return new CatmullRomCurve3(points);
    }
    return null;
  }, [segments]);

  // Create tube geometry for snake body
  const tubeGeometry = useMemo(() => {
    if (!snakeCurve) return null;
    
    const segmentCount = Math.max(20, segments.length * 4);
    return new TubeGeometry(snakeCurve, segmentCount, 0.15, 8, false);
  }, [snakeCurve, segments.length]);

  useFrame((state, delta) => {
    animationTime.current += delta * speedMultiplier;

    if (headRef.current && segments.length > 0) {
      const headPosition = segments[0];
      const worldHeadPos = new Vector3(headPosition.x - 10, 0.1, headPosition.z - 10);
      
      headRef.current.position.copy(worldHeadPos);
      
      // Smooth rotation based on direction
      const targetRotation = {
        up: Math.PI / 2,
        down: -Math.PI / 2,
        left: Math.PI,
        right: 0
      }[direction] || 0;
      
      headRef.current.rotation.y = targetRotation;
      
      if (isAlive) {
        // Smooth breathing animation
        headRef.current.position.y = 0.1 + Math.sin(animationTime.current * 3) * 0.03;
        headRef.current.rotation.z = Math.sin(animationTime.current * 2) * 0.05;
      }
    }

    // Animate body undulation
    if (bodyRef.current && isAlive) {
      bodyRef.current.rotation.y = Math.sin(animationTime.current * 1.5) * 0.02;
    }
  });

  if (!segments || segments.length === 0) {
    return null;
  }

  const headPosition = segments[0];
  const worldHeadPos = new Vector3(headPosition.x - 10, 0.1, headPosition.z - 10);

  return (
    <group ref={snakeGroupRef}>
      {/* Snake Head - Realistic with PBR materials */}
      <group ref={headRef} position={worldHeadPos}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshPhysicalMaterial
            color={isAlive ? '#2d5a2d' : '#555555'}
            emissive={isAlive ? '#0a2a0a' : '#222222'}
            emissiveIntensity={0.2}
            metalness={0.05}
            roughness={0.3}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
            transmission={0.02}
            thickness={0.1}
          />
        </mesh>
        
        {/* Eyes with realistic reflections */}
        <mesh position={[0.18, 0.08, 0.1]} castShadow>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshPhysicalMaterial 
            color="#000000" 
            emissive={isAlive ? "#ff3030" : "#662222"} 
            emissiveIntensity={isAlive ? 0.8 : 0.3}
            metalness={0.9}
            roughness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
        <mesh position={[0.18, 0.08, -0.1]} castShadow>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshPhysicalMaterial 
            color="#000000" 
            emissive={isAlive ? "#ff3030" : "#662222"} 
            emissiveIntensity={isAlive ? 0.8 : 0.3}
            metalness={0.9}
            roughness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
        
        {/* Animated tongue */}
        {isAlive && (
          <mesh 
            position={[0.25, 0, 0]} 
            rotation={[0, 0, Math.sin(animationTime.current * 8) * 0.2]}
            castShadow
          >
            <cylinderGeometry args={[0.008, 0.008, 0.15, 6]} />
            <meshPhysicalMaterial 
              color="#ff4040" 
              emissive="#ff2020" 
              emissiveIntensity={0.4}
              metalness={0.1}
              roughness={0.4}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
            />
          </mesh>
        )}
        
        {/* Head glow effect */}
        {isAlive && (
          <pointLight
            position={[0, 0.1, 0]}
            color="#40ff40"
            intensity={0.3}
            distance={2}
            decay={2}
          />
        )}
      </group>

      {/* Snake Body - Smooth tube geometry */}
      {tubeGeometry && (
        <mesh 
          ref={bodyRef}
          geometry={tubeGeometry} 
          castShadow 
          receiveShadow
        >
          <meshPhysicalMaterial
            color={isAlive ? '#1a4a1a' : '#444444'}
            emissive={isAlive ? '#0a2a0a' : '#111111'}
            emissiveIntensity={0.15}
            metalness={0.08}
            roughness={0.4}
            clearcoat={0.7}
            clearcoatRoughness={0.2}
            envMapIntensity={1.2}
            bumpScale={0.02}
          />
        </mesh>
      )}

      {/* Fallback body segments for short snake */}
      {segments.length <= 3 && segments.slice(1).map((segment, index) => (
        <mesh
          key={`segment-${index}`}
          position={[segment.x - 10, 0.1, segment.z - 10]}
          scale={Math.max(0.1, 0.2 - index * 0.02)}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshPhysicalMaterial
            color={isAlive ? '#1a4a1a' : '#444444'}
            emissive={isAlive ? '#0a2a0a' : '#111111'}
            emissiveIntensity={0.15}
            metalness={0.08}
            roughness={0.4}
            clearcoat={0.7}
            clearcoatRoughness={0.2}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}

      {/* Tail glow effect */}
      {isAlive && segments.length > 2 && (
        <mesh 
          position={[
            segments[segments.length - 1].x - 10, 
            0.05, 
            segments[segments.length - 1].z - 10
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial 
            color="#40ff40" 
            transparent 
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Ground shadow */}
      {isAlive && (
        <mesh 
          position={[headPosition.x - 10, 0.01, headPosition.z - 10]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.3, 16]} />
          <meshBasicMaterial 
            color="#000000" 
            transparent 
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  );
};
