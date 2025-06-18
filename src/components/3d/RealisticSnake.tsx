
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3, Mesh, TubeGeometry, MeshPhysicalMaterial } from 'three';
import { Position } from '../../store/gameStore';

interface RealisticSnakeProps {
  segments: Position[];
  isAlive: boolean;
}

export const RealisticSnake: React.FC<RealisticSnakeProps> = ({ segments, isAlive }) => {
  const snakeRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshPhysicalMaterial>(null);

  // Create smooth curve from snake segments
  const snakeCurve = useMemo(() => {
    if (segments.length < 2) return null;
    
    const points = segments.map(segment => 
      new Vector3(segment.x - 10, 0.3, segment.z - 10)
    );
    
    // Add extra points for smoother curves
    const smoothPoints: Vector3[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      smoothPoints.push(points[i]);
      const midPoint = new Vector3().lerpVectors(points[i], points[i + 1], 0.5);
      smoothPoints.push(midPoint);
    }
    smoothPoints.push(points[points.length - 1]);
    
    return new CatmullRomCurve3(smoothPoints);
  }, [segments]);

  const snakeGeometry = useMemo(() => {
    if (!snakeCurve) return null;
    
    // Create tube geometry with varying radius for organic look
    const radius = 0.15;
    const radialSegments = 12;
    const tubularSegments = Math.max(32, segments.length * 4);
    
    return new TubeGeometry(snakeCurve, tubularSegments, radius, radialSegments, false);
  }, [snakeCurve, segments.length]);

  // Animate snake material
  useFrame((state) => {
    if (materialRef.current && isAlive) {
      materialRef.current.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      materialRef.current.roughness = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  useEffect(() => {
    if (snakeRef.current && snakeCurve) {
      // Add subtle undulation animation
      const animate = () => {
        if (snakeRef.current && isAlive) {
          snakeRef.current.position.y = 0.3 + Math.sin(Date.now() * 0.003) * 0.05;
        }
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [snakeCurve, isAlive]);

  if (!snakeGeometry) return null;

  return (
    <mesh ref={snakeRef} geometry={snakeGeometry}>
      <meshPhysicalMaterial
        ref={materialRef}
        color="#00ff88"
        emissive="#004422"
        emissiveIntensity={0.2}
        metalness={0.1}
        roughness={0.4}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
        transparent
        opacity={isAlive ? 1 : 0.5}
      />
    </mesh>
  );
};
