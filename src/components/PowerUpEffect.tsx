
import React, { useRef, useEffect } from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

interface PowerUpEffectProps {
  position: [number, number, number];
  type: 'speed' | 'shrink' | 'magnet';
}

export const PowerUpEffect: React.FC<PowerUpEffectProps> = ({ position, type }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const getColor = () => {
    switch (type) {
      case 'speed': return "#ffff00"; // Yellow
      case 'shrink': return "#ff0000"; // Red
      case 'magnet': return "#00ff00"; // Green
      default: return "#ffffff";
    }
  };

  const getEmissive = () => {
    switch (type) {
      case 'speed': return "#444400";
      case 'shrink': return "#440000";
      case 'magnet': return "#004400";
      default: return "#000000";
    }
  };

  useEffect(() => {
    if (meshRef.current) {
      const animate = () => {
        if (meshRef.current) {
          meshRef.current.rotation.x += 0.03;
          meshRef.current.rotation.y += 0.03;
          meshRef.current.rotation.z += 0.01;
          
          // Floating animation
          meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.008) * 0.2;
          
          // Pulsing scale
          const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
          meshRef.current.scale.setScalar(scale);
        }
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [position]);

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[0.6, 0.6, 0.6]}
    >
      <meshPhongMaterial 
        color={getColor()}
        emissive={getEmissive()}
        shininess={100}
        transparent
        opacity={0.9}
      />
    </Box>
  );
};
