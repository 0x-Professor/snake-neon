
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

interface ParticleEffectsProps {
  position: Vector3;
  active: boolean;
  type: 'eating' | 'collision' | 'trail';
}

export const ParticleEffects: React.FC<ParticleEffectsProps> = ({ position, active, type }) => {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);

  const particleGeometry = useMemo(() => {
    const geometry = new BufferGeometry();
    const particleCount = type === 'trail' ? 50 : 100;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Initial positions around the center
      positions[i3] = position.x + (Math.random() - 0.5) * 2;
      positions[i3 + 1] = position.y + Math.random() * 2;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
      
      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = Math.random() * 0.2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new Float32BufferAttribute(velocities, 3));
    
    return geometry;
  }, [position, type]);

  useFrame((state, delta) => {
    if (pointsRef.current && active) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = pointsRef.current.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * delta * 10;
        positions[i + 1] += velocities[i + 1] * delta * 10;
        positions[i + 2] += velocities[i + 2] * delta * 10;
        
        // Gravity effect
        velocities[i + 1] -= delta * 9.8 * 0.1;
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Fade out over time
      if (materialRef.current) {
        materialRef.current.opacity = Math.max(0, materialRef.current.opacity - delta * 2);
      }
    }
  });

  if (!active) return null;

  const getColor = () => {
    switch (type) {
      case 'eating': return '#ffff00';
      case 'collision': return '#ff0000';
      case 'trail': return '#00ffff';
      default: return '#ffffff';
    }
  };

  return (
    <points ref={pointsRef} geometry={particleGeometry}>
      <pointsMaterial
        ref={materialRef}
        color={getColor()}
        size={0.1}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  );
};
