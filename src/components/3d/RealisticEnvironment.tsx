
import React from 'react';

const GRID_SIZE = 20;

interface RealisticEnvironmentProps {
  realisticMode?: boolean;
}

export const RealisticEnvironment: React.FC<RealisticEnvironmentProps> = ({ realisticMode = true }) => {
  return (
    <>
      {/* Main game board - professional cyber aesthetic */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshPhysicalMaterial
          color="#0a1a2a"
          roughness={0.7}
          metalness={0.3}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          emissive="#001122"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Glowing grid lines for cyber aesthetic */}
      {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
        <React.Fragment key={`grid-${i}`}>
          {/* Vertical lines */}
          <mesh position={[i - GRID_SIZE/2, 0.01, 0]}>
            <planeGeometry args={[0.05, GRID_SIZE]} />
            <meshStandardMaterial 
              color="#00ffff" 
              transparent 
              opacity={0.3}
              emissive="#00ffff"
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Horizontal lines */}
          <mesh position={[0, 0.01, i - GRID_SIZE/2]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[0.05, GRID_SIZE]} />
            <meshStandardMaterial 
              color="#00ffff" 
              transparent 
              opacity={0.3}
              emissive="#00ffff"
              emissiveIntensity={0.2}
            />
          </mesh>
        </React.Fragment>
      ))}

      {/* Border walls with neon glow */}
      {/* Top wall */}
      <mesh position={[0, 0.5, -GRID_SIZE/2 - 0.1]}>
        <boxGeometry args={[GRID_SIZE + 0.2, 1, 0.2]} />
        <meshPhysicalMaterial
          color="#ff0080"
          emissive="#ff0080"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Bottom wall */}
      <mesh position={[0, 0.5, GRID_SIZE/2 + 0.1]}>
        <boxGeometry args={[GRID_SIZE + 0.2, 1, 0.2]} />
        <meshPhysicalMaterial
          color="#ff0080"
          emissive="#ff0080"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-GRID_SIZE/2 - 0.1, 0.5, 0]}>
        <boxGeometry args={[0.2, 1, GRID_SIZE]} />
        <meshPhysicalMaterial
          color="#ff0080"
          emissive="#ff0080"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[GRID_SIZE/2 + 0.1, 0.5, 0]}>
        <boxGeometry args={[0.2, 1, GRID_SIZE]} />
        <meshPhysicalMaterial
          color="#ff0080"
          emissive="#ff0080"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Corner accent lights */}
      <pointLight
        position={[-GRID_SIZE/2, 1, -GRID_SIZE/2]}
        color="#00ffff"
        intensity={0.5}
        distance={5}
      />
      <pointLight
        position={[GRID_SIZE/2, 1, -GRID_SIZE/2]}
        color="#00ffff"
        intensity={0.5}
        distance={5}
      />
      <pointLight
        position={[-GRID_SIZE/2, 1, GRID_SIZE/2]}
        color="#00ffff"
        intensity={0.5}
        distance={5}
      />
      <pointLight
        position={[GRID_SIZE/2, 1, GRID_SIZE/2]}
        color="#00ffff"
        intensity={0.5}
        distance={5}
      />

      {/* Atmospheric effects */}
      <fog attach="fog" args={['#0a0a1a', 20, 60]} />
    </>
  );
};
