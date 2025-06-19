
import React from 'react';

export const EnhancedLighting: React.FC = () => {
  return (
    <>
      {/* Main directional light (sun) with enhanced shadows */}
      <directionalLight
        position={[15, 30, 15]}
        intensity={2.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={100}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0001}
      />
      
      {/* Ambient light for global illumination */}
      <ambientLight intensity={0.4} color="#404080" />
      
      {/* Hemisphere light for natural lighting */}
      <hemisphereLight
        args={["#87CEEB", "#2F4F4F", 0.6]}
      />
      
      {/* Rim lighting for depth */}
      <directionalLight
        position={[-15, 10, -15]}
        intensity={0.5}
        color="#ff6600"
      />
      
      {/* Secondary rim light */}
      <directionalLight
        position={[15, 10, -15]}
        intensity={0.3}
        color="#0066ff"
      />
      
      {/* Spot lights for dramatic effect and reflections */}
      <spotLight
        position={[0, 20, 0]}
        angle={Math.PI / 3}
        penumbra={0.4}
        intensity={0.8}
        color="#00ffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Corner accent lights for atmosphere */}
      <pointLight
        position={[-10, 5, -10]}
        color="#ff0080"
        intensity={0.4}
        distance={15}
        decay={2}
      />
      <pointLight
        position={[10, 5, -10]}
        color="#00ff80"
        intensity={0.4}
        distance={15}
        decay={2}
      />
      <pointLight
        position={[-10, 5, 10]}
        color="#8000ff"
        intensity={0.4}
        distance={15}
        decay={2}
      />
      <pointLight
        position={[10, 5, 10]}
        color="#ff8000"
        intensity={0.4}
        distance={15}
        decay={2}
      />
    </>
  );
};
