
import React from 'react';
import { useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

const GRID_SIZE = 20;

export const ProfessionalEnvironment: React.FC = () => {
  const { scene } = useThree();

  // Create gradient skybox
  React.useEffect(() => {
    const geometry = new THREE.SphereGeometry(100, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077be) },
        bottomColor: { value: new THREE.Color(0x000033) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    
    const skybox = new THREE.Mesh(geometry, material);
    scene.add(skybox);
    
    return () => {
      scene.remove(skybox);
    };
  }, [scene]);

  return (
    <>
      {/* HDRI Environment lighting */}
      <Environment preset="city" />
      
      {/* Clean game board without grid lines */}
      <mesh receiveShadow position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GRID_SIZE + 2, GRID_SIZE + 2]} />
        <meshPhysicalMaterial
          color="#001122"
          roughness={0.2}
          metalness={0.8}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          emissive="#000a1a"
          emissiveIntensity={0.3}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Minimal boundary walls - only outer perimeter */}
      {[
        { pos: [0, 0.5, -GRID_SIZE/2 - 0.5] as [number, number, number], size: [GRID_SIZE + 1, 1, 0.2] as [number, number, number] },
        { pos: [0, 0.5, GRID_SIZE/2 + 0.5] as [number, number, number], size: [GRID_SIZE + 1, 1, 0.2] as [number, number, number] },
        { pos: [-GRID_SIZE/2 - 0.5, 0.5, 0] as [number, number, number], size: [0.2, 1, GRID_SIZE] as [number, number, number] },
        { pos: [GRID_SIZE/2 + 0.5, 0.5, 0] as [number, number, number], size: [0.2, 1, GRID_SIZE] as [number, number, number] }
      ].map((wall, index) => (
        <group key={`wall-${index}`}>
          <mesh position={wall.pos} castShadow>
            <boxGeometry args={wall.size} />
            <meshPhysicalMaterial
              color="#ff00aa"
              emissive="#ff00aa"
              emissiveIntensity={0.6}
              transparent
              opacity={0.8}
              roughness={0.1}
              metalness={0.9}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
            />
          </mesh>
          {/* Subtle glow effect */}
          <pointLight
            position={wall.pos}
            color="#ff00aa"
            intensity={0.8}
            distance={6}
            decay={2}
          />
        </group>
      ))}

      {/* Enhanced atmospheric lighting */}
      <directionalLight
        position={[20, 30, 20]}
        intensity={2.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />
      
      <ambientLight intensity={0.4} color="#4080ff" />
      
      {/* Corner accent lights for depth */}
      {[
        [-GRID_SIZE/2, 2, -GRID_SIZE/2] as [number, number, number],
        [GRID_SIZE/2, 2, -GRID_SIZE/2] as [number, number, number],
        [-GRID_SIZE/2, 2, GRID_SIZE/2] as [number, number, number],
        [GRID_SIZE/2, 2, GRID_SIZE/2] as [number, number, number]
      ].map((pos, i) => (
        <pointLight
          key={`corner-${i}`}
          position={pos}
          color={['#00ffff', '#ff0080', '#8000ff', '#ff8000'][i]}
          intensity={0.5}
          distance={10}
          decay={2}
        />
      ))}

      {/* Atmospheric fog */}
      <fog attach="fog" args={['#001122', 25, 70]} />
    </>
  );
};
