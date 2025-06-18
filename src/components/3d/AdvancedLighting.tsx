
import React from 'react';
import { useThree } from '@react-three/fiber';

export const AdvancedLighting: React.FC = () => {
  const { scene } = useThree();

  return (
    <>
      {/* Main directional light (sun) */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Ambient light for global illumination */}
      <ambientLight intensity={0.3} color="#404080" />
      
      {/* Hemisphere light for natural lighting */}
      <hemisphereLight
        skyColor="#87CEEB"
        groundColor="#2F4F4F"
        intensity={0.5}
      />
      
      {/* Rim lighting */}
      <directionalLight
        position={[-10, 5, -10]}
        intensity={0.3}
        color="#ff6600"
      />
      
      {/* Spot light for dramatic effect */}
      <spotLight
        position={[0, 15, 0]}
        angle={Math.PI / 4}
        penumbra={0.5}
        intensity={0.5}
        color="#00ffff"
        castShadow
      />
    </>
  );
};
