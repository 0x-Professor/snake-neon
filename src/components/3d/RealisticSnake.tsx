
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3, Mesh, TubeGeometry, MeshPhysicalMaterial, SphereGeometry, Group } from 'three';
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

  console.log('RealisticSnake rendering with segments:', segments.length, 'Direction:', direction);

  // Create enhanced snake geometry with animated splines
  const { snakeCurve, headGeometry, bodyGeometry } = useMemo(() => {
    if (segments.length === 0) {
      console.log('No segments provided to snake');
      return { snakeCurve: null, headGeometry: null, bodyGeometry: null };
    }

    console.log('Creating snake geometry for segments:', segments);
    
    // Convert snake segments to world positions
    const points = segments.map((segment, index) => {
      const worldPos = new Vector3(segment.x - 10, 0.3 + Math.sin(index * 0.5) * 0.1, segment.z - 10);
      return worldPos;
    });
    
    // Create smooth curve with extra interpolation points
    let smoothPoints: Vector3[] = [];
    
    if (points.length === 1) {
      // Single segment (head only)
      smoothPoints = [points[0], points[0].clone().add(new Vector3(0.1, 0, 0))];
    } else {
      // Multiple segments - create smooth interpolation
      for (let i = 0; i < points.length - 1; i++) {
        smoothPoints.push(points[i]);
        
        // Add interpolation points between segments
        const midPoint = new Vector3().lerpVectors(points[i], points[i + 1], 0.3);
        const midPoint2 = new Vector3().lerpVectors(points[i], points[i + 1], 0.7);
        smoothPoints.push(midPoint);
        smoothPoints.push(midPoint2);
      }
      smoothPoints.push(points[points.length - 1]);
    }
    
    const curve = new CatmullRomCurve3(smoothPoints);
    
    // Create head geometry (larger sphere)
    const headGeo = new SphereGeometry(0.25, 16, 16);
    
    // Create body geometry (tube along curve)
    let bodyGeo = null;
    if (smoothPoints.length >= 2) {
      const radius = 0.15;
      const radialSegments = 12;
      const tubularSegments = Math.max(16, segments.length * 4);
      bodyGeo = new TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
    }
    
    return { 
      snakeCurve: curve, 
      headGeometry: headGeo, 
      bodyGeometry: bodyGeo 
    };
  }, [segments]);

  // Dynamic material properties based on game state
  const materialProps = useMemo(() => {
    const baseColor = isAlive ? '#00ff88' : '#666666';
    const emissiveColor = isAlive ? '#004422' : '#222222';
    
    return {
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity: isAlive ? 0.3 : 0.1,
      metalness: 0.1,
      roughness: 0.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: isAlive ? 1 : 0.5
    };
  }, [isAlive]);

  // Animate snake with realistic movement
  useFrame((state, delta) => {
    animationTime.current += delta;
    
    if (headRef.current && isAlive) {
      // Head movement animation
      headRef.current.position.y = 0.3 + Math.sin(animationTime.current * 3) * 0.05;
      
      // Head rotation based on direction
      const targetRotation = {
        up: Math.PI / 2,
        down: -Math.PI / 2,
        left: Math.PI,
        right: 0
      }[direction] || 0;
      
      headRef.current.rotation.y = targetRotation;
      
      // Subtle head bobbing
      headRef.current.rotation.x = Math.sin(animationTime.current * 4) * 0.1;
    }
    
    if (bodyRef.current && isAlive) {
      // Body undulation
      bodyRef.current.position.y = 0.3 + Math.sin(animationTime.current * 2 + 1) * 0.03;
    }
    
    if (materialRef.current && isAlive) {
      // Pulsing emissive effect
      materialRef.current.emissiveIntensity = 0.3 + Math.sin(animationTime.current * 2) * 0.1;
      
      // Dynamic roughness for organic feel
      materialRef.current.roughness = 0.4 + Math.sin(animationTime.current * 1.5) * 0.1;
    }
  });

  // Handle edge case where no segments exist
  if (!segments || segments.length === 0) {
    console.log('No segments to render');
    return null;
  }

  const headPosition = segments[0];
  const worldHeadPos = new Vector3(headPosition.x - 10, 0.3, headPosition.z - 10);

  return (
    <group ref={snakeGroupRef}>
      {/* Snake Head */}
      <mesh 
        ref={headRef}
        position={worldHeadPos}
        geometry={headGeometry}
      >
        <meshPhysicalMaterial
          ref={materialRef}
          {...materialProps}
        />
        
        {/* Head glow effect */}
        {isAlive && (
          <pointLight
            position={[0, 0, 0]}
            color="#00ff88"
            intensity={0.3}
            distance={2}
          />
        )}
      </mesh>

      {/* Snake Body */}
      {bodyGeometry && segments.length > 1 && (
        <mesh 
          ref={bodyRef}
          geometry={bodyGeometry}
        >
          <meshPhysicalMaterial
            color={materialProps.color}
            emissive={materialProps.emissive}
            emissiveIntensity={materialProps.emissiveIntensity * 0.7}
            metalness={materialProps.metalness}
            roughness={materialProps.roughness + 0.1}
            clearcoat={materialProps.clearcoat}
            clearcoatRoughness={materialProps.clearcoatRoughness}
            transparent={materialProps.transparent}
            opacity={materialProps.opacity}
          />
        </mesh>
      )}

      {/* Trailing particle effect */}
      {isAlive && segments.length > 3 && (
        <mesh position={[segments[segments.length - 1].x - 10, 0.2, segments[segments.length - 1].z - 10]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial 
            color="#00ff88" 
            transparent 
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};
