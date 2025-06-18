import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3, Mesh, TubeGeometry, MeshPhysicalMaterial, SphereGeometry, Group, TextureLoader, Vector2 } from 'three';
import { Position, Direction } from '../../store/gameStore';

interface RealisticSnakeProps {
  segments: Position[];
  isAlive: boolean;
  direction?: Direction;
}

export const RealisticSnake: React.FC<RealisticSnakeProps> = ({ segments, isAlive, direction = 'right' }) => {
  const snakeGroupRef = useRef<Group>(null);
  const headRef = useRef<Mesh>(null);
  const bodyRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshPhysicalMaterial>(null);
  const animationTime = useRef(0);

  // Load textures for realistic scales
  const textureLoader = new TextureLoader();
  const scaleTexture = useMemo(() => {
    try {
      return textureLoader.load('/textures/snake-scales.jpg');
    } catch (e) {
      console.warn('Failed to load snake-scales.jpg, using fallback color');
      return null;
    }
  }, []);
  const normalTexture = useMemo(() => {
    try {
      return textureLoader.load('/textures/snake-scales-normal.jpg');
    } catch (e) {
      console.warn('Failed to load snake-scales-normal.jpg');
      return null;
    }
  }, []);

  // Create snake geometry with tapering and smooth curves
  const { snakeCurve, headGeometry, bodyGeometry } = useMemo(() => {
    if (segments.length === 0) {
      return { snakeCurve: null, headGeometry: null, bodyGeometry: null };
    }

    // Map segments to world positions with slight vertical variation
    const points = segments.map((segment, index) => new Vector3(
      segment.x - 10,
      0.1 + Math.sin(index * 0.2) * 0.03,
      segment.z - 10
    ));

    // Create smooth interpolation points
    const smoothPoints: Vector3[] = points.length === 1
      ? [points[0], points[0].clone().add(new Vector3(0.1, 0, 0))]
      : points.reduce<Vector3[]>((acc, curr, i) => {
          acc.push(curr);
          if (i < points.length - 1) {
            acc.push(new Vector3().lerpVectors(curr, points[i + 1], 0.4));
            acc.push(new Vector3().lerpVectors(curr, points[i + 1], 0.8));
          }
          return acc;
        }, []).concat([points[points.length - 1]]);

    const curve = new CatmullRomCurve3(smoothPoints, false, 'catmullrom', 0.3);

    // Head geometry: elongated sphere
    const headGeo = new SphereGeometry(0.25, 32, 32, 0, Math.PI * 2, 0, Math.PI).scale(1.2, 1, 1);

    // Body geometry: tapered tube
    const bodyGeo = smoothPoints.length >= 2 ? new TubeGeometry(
      curve,
      Math.max(32, segments.length * 8),
      (t: number) => 0.18 * (1 - t * 0.6),
      16,
      false
    ) : null;

    return { snakeCurve: curve, headGeometry: headGeo, bodyGeometry: bodyGeo };
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
    map: scaleTexture,
    normalMap: normalTexture,
    normalScale: new Vector2(0.5, 0.5), // Changed to Vector2
    transparent: true,
    opacity: isAlive ? 1 : 0.6,
  }), [isAlive, scaleTexture, normalTexture]);

  // Animate snake with slithering motion
  useFrame((state, delta) => {
    animationTime.current += delta;

    if (headRef.current && isAlive) {
      headRef.current.position.y = 0.1 + Math.sin(animationTime.current * 2.5) * 0.02;
      const targetRotation = { up: Math.PI / 2, down: -Math.PI / 2, left: Math.PI, right: 0 }[direction] || 0;
      headRef.current.rotation.y = targetRotation;
      headRef.current.rotation.z = Math.sin(animationTime.current * 3.5) * 0.1;
    }

    if (bodyRef.current && isAlive) {
      bodyRef.current.position.y = 0.1 + Math.sin(animationTime.current * 2 + 1) * 0.015;
      bodyRef.current.rotation.z = Math.sin(animationTime.current * 2.5) * 0.08;
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
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#000000" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.18, 0.05, -0.08]}>
          <sphereGeometry args={[0.03, 16, 16]} />
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

      {/* Snake Body */}
      {bodyGeometry && segments.length > 1 && (
        <mesh ref={bodyRef} geometry={bodyGeometry}>
          <meshPhysicalMaterial {...materialProps} emissiveIntensity={materialProps.emissiveIntensity * 0.8} />
        </mesh>
      )}

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