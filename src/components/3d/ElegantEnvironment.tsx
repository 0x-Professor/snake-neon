
import React from 'react';
import { Environment } from '@react-three/drei';

const GRID_SIZE = 20;

export const ElegantEnvironment: React.FC = () => {
  return (
    <>
      {/* Sophisticated HDRI environment */}
      <Environment preset="studio" />
      
      {/* Elegant game board with premium materials */}
      <mesh receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GRID_SIZE + 2, GRID_SIZE + 2]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          roughness={0.15}
          metalness={0.7}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          envMapIntensity={2.0}
          reflectivity={0.8}
        />
      </mesh>

      {/* Minimal elegant boundary walls */}
      {[
        { pos: [0, 0.5, -GRID_SIZE/2 - 0.6] as [number, number, number], size: [GRID_SIZE + 1.2, 1, 0.2] as [number, number, number] },
        { pos: [0, 0.5, GRID_SIZE/2 + 0.6] as [number, number, number], size: [GRID_SIZE + 1.2, 1, 0.2] as [number, number, number] },
        { pos: [-GRID_SIZE/2 - 0.6, 0.5, 0] as [number, number, number], size: [0.2, 1, GRID_SIZE] as [number, number, number] },
        { pos: [GRID_SIZE/2 + 0.6, 0.5, 0] as [number, number, number], size: [0.2, 1, GRID_SIZE] as [number, number, number] }
      ].map((wall, index) => (
        <mesh key={`wall-${index}`} position={wall.pos} castShadow receiveShadow>
          <boxGeometry args={wall.size} />
          <meshPhysicalMaterial
            color="#0066cc"
            emissive="#003366"
            emissiveIntensity={0.3}
            metalness={0.8}
            roughness={0.2}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>
      ))}

      {/* Sophisticated lighting setup */}
      <directionalLight
        position={[15, 20, 10]}
        intensity={2.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.001}
      />
      
      {/* Soft ambient lighting */}
      <ambientLight intensity={0.6} color="#e6f3ff" />
      
      {/* Subtle accent lighting for depth */}
      <pointLight
        position={[0, 8, 0]}
        color="#ffffff"
        intensity={0.8}
        distance={25}
        decay={2}
        castShadow
      />

      {/* Atmospheric fog for elegance */}
      <fog attach="fog" args={['#16213e', 30, 80]} />
    </>
  );
};
