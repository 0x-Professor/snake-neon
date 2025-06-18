
import React from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, RepeatWrapping } from 'three';

const GRID_SIZE = 20;

export const RealisticEnvironment: React.FC = () => {
  return (
    <>
      {/* Ground plane with realistic materials */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshPhysicalMaterial
          color="#2a4a2a"
          roughness={0.8}
          metalness={0.1}
          clearcoat={0.1}
        />
      </mesh>

      {/* Subtle grid lines */}
      {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
        <React.Fragment key={`grid-${i}`}>
          <mesh position={[i - GRID_SIZE/2, 0.01, 0]}>
            <planeGeometry args={[0.02, GRID_SIZE]} />
            <meshBasicMaterial color="#3a5a3a" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, 0.01, i - GRID_SIZE/2]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[0.02, GRID_SIZE]} />
            <meshBasicMaterial color="#3a5a3a" transparent opacity={0.3} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Atmospheric fog effect */}
      <fog attach="fog" args={['#1a2a3a', 10, 50]} />
    </>
  );
};
