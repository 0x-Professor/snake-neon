
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh, MeshPhysicalMaterial, SphereGeometry, Group, Vector2 } from 'three';
import { Position, Direction } from '../../store/gameStore';

interface RealisticSnakeProps {
  segments: Position[];
  isAlive: boolean;
  direction?: Direction;
}

export const RealisticSnake: React.FC<RealisticSnakeProps> = ({ segments, isAlive, direction = 'right' }) => {
  const snakeGroupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const materialRef = useRef<MeshPhysicalMaterial>(null);
  const animationTime = useRef(0);

  // Create simplified snake geometry
  const { headGeometry, bodySegments } = useMemo(() => {
    if (segments.length === 0) {
      return { headGeometry: null, bodySegments: [] };
    }

    // Head geometry: elongated sphere
    const headGeo = new SphereGeometry(0.25, 16, 16).scale(1.2, 1, 1);

    // Body segments: individual spheres
    const bodySegs = segments.slice(1).map((segment, index) => ({
      position: new Vector3(segment.x - 10, 0.1, segment.z - 10),
      scale: Math.max(0.15, 0.22 - index * 0.01), // Taper towards tail
      key: `segment-${index}-${segment.x}-${segment.z}`
    }));

    return { headGeometry: headGeo, bodySegments: bodySegs };
  }, [segments]);

  // Material properties for realistic scales
  const materialProps = useMemo(() => ({
    color: isAlive ? '#1A3C1A' : '#4A4A4A',
    emissive: isAlive ? '#0A1C0A' : '#222222',
    emissiveIntensity: isAlive ? 0.15 : 0.05,
    metalness: 0.05,
    roughness: 0.25,
    clearcoat: 0.95,
    clearcoatRoughness: 0.15,
    transparent: true,
    opacity: isAlive ? 1 : 0.6,
  }), [isAlive]);

  // Animate snake with slithering motion
  useFrame((state, delta) => {
    animationTime.current += delta;

    if (headRef.current && isAlive) {
      headRef.current.position.y = 0.1 + Math.sin(animationTime.current * 2.5) * 0.02;
      const targetRotation = { up: Math.PI / 2, down: -Math.PI / 2, left: Math.PI, right: 0 }[direction] || 0;
      headRef.current.rotation.y = targetRotation;
      headRef.current.rotation.z = Math.sin(animationTime.current * 3.5) * 0.1;
    }

    if (materialRef.current && isAlive) {
      materialRef.current.emissiveIntensity = 0.15 + Math.sin(animationTime.current * 2) * 0.05;
      materialRef.current.roughness = 0.25 + Math.sin(animationTime.current * 1.5) * 0.05;
    }
  });

  if (!segments || segments.length === 0) {
    return null;
  }

  const headPosition = segments[0];
  const worldHeadPos = new Vector3(headPosition.x - 10, 0.1, headPosition.z - 10);

  return (
    <group ref={snakeGroupRef}>
      {/* Snake Head */}
      <group ref={headRef} position={worldHeadPos}>
        <mesh geometry={headGeometry}>
          <meshPhysicalMaterial ref={materialRef} {...materialProps} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.18, 0.05, 0.08]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#000000" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.18, 0.05, -0.08]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#000000" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
        {/* Tongue */}
        {isAlive && (
          <mesh position={[0.28, 0, 0]} rotation={[0, 0, Math.sin(animationTime.current * 6) * 0.3]}>
            <boxGeometry args={[0.12, 0.01, 0.01]} />
            <meshStandardMaterial color="#FF4040" emissive="#FF4040" emissiveIntensity={0.3} />
          </mesh>
        )}
        {/* Head Glow */}
        {isAlive && (
          <pointLight position={[0, 0.1, 0]} color="#FF4040" intensity={0.2} distance={1.5} />
        )}
      </group>

      {/* Snake Body - Individual Segments */}
      {bodySegments.map((segment) => (
        <mesh key={segment.key} position={segment.position} scale={segment.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshPhysicalMaterial {...materialProps} emissiveIntensity={materialProps.emissiveIntensity * 0.8} />
        </mesh>
      ))}

      {/* Tail Glow */}
      {isAlive && segments.length > 3 && (
        <mesh position={[segments[segments.length - 1].x - 10, 0.05, segments[segments.length - 1].z - 10]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#FF4040" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Ground Shadow */}
      {isAlive && (
        <mesh position={[headPosition.x - 10, 0.01, headPosition.z - 10]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.25} />
        </mesh>
      )}
    </group>
  );
};
