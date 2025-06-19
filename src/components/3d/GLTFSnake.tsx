
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { 
  Group, 
  AnimationMixer, 
  AnimationAction, 
  CatmullRomCurve3, 
  Vector3,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
  AnimationClip,
  Quaternion,
  Euler
} from 'three';
import { Position, Direction } from '../../store/gameStore';

interface GLTFSnakeProps {
  segments: Position[];
  isAlive: boolean;
  direction: Direction;
}

export const GLTFSnake: React.FC<GLTFSnakeProps> = ({ segments, isAlive, direction }) => {
  const groupRef = useRef<Group>(null);
  const mixerRef = useRef<AnimationMixer>();
  const actionRef = useRef<AnimationAction>();
  const [gltf, setGltf] = useState<any>(null);
  const animationTime = useRef(0);

  // Create fallback snake geometry if GLTF fails to load
  const fallbackSnake = useMemo(() => {
    if (segments.length === 0) return null;
    
    const points = segments.map((segment, index) => {
      const baseY = 0.2;
      const waveY = Math.sin(index * 0.3) * 0.05;
      return new Vector3(segment.x - 10, baseY + waveY, segment.z - 10);
    });

    if (points.length >= 2) {
      return new CatmullRomCurve3(points, false, 'catmullrom', 0.3);
    }
    return null;
  }, [segments]);

  // Try to load GLTF model with fallback
  useEffect(() => {
    const loader = new GLTFLoader();
    
    // Try multiple potential snake model URLs
    const modelUrls = [
      '/models/snake.glb',
      '/models/snake.gltf',
      'https://threejs.org/examples/models/gltf/Horse.glb', // Fallback animal model
    ];

    const tryLoadModel = async (urls: string[], index = 0): Promise<void> => {
      if (index >= urls.length) {
        console.warn('No GLTF models could be loaded, using procedural snake');
        return;
      }

      try {
        const gltfModel = await new Promise((resolve, reject) => {
          loader.load(urls[index], resolve, undefined, reject);
        });
        
        console.log('GLTF model loaded successfully:', urls[index]);
        setGltf(gltfModel);
        
        // Setup animation mixer
        if (gltfModel.animations.length > 0) {
          const mixer = new AnimationMixer(gltfModel.scene);
          mixerRef.current = mixer;
          
          // Play the first animation (idle/movement)
          const action = mixer.clipAction(gltfModel.animations[0]);
          action.play();
          actionRef.current = action;
        }
      } catch (error) {
        console.warn(`Failed to load model ${urls[index]}:`, error);
        tryLoadModel(urls, index + 1);
      }
    };

    tryLoadModel(modelUrls);
  }, []);

  // Animate the snake
  useFrame((state, delta) => {
    animationTime.current += delta;

    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (groupRef.current && segments.length > 0) {
      const headPos = segments[0];
      const worldHeadPos = new Vector3(headPos.x - 10, 0.2, headPos.z - 10);
      
      // Position the main group at the head
      groupRef.current.position.copy(worldHeadPos);
      
      // Rotate based on direction
      const rotationMap: Record<Direction, number> = {
        right: 0,
        down: Math.PI / 2,
        left: Math.PI,
        up: -Math.PI / 2
      };
      
      groupRef.current.rotation.y = rotationMap[direction];
      
      // Add subtle animations
      if (isAlive) {
        groupRef.current.position.y += Math.sin(animationTime.current * 4) * 0.02;
        groupRef.current.rotation.z = Math.sin(animationTime.current * 2) * 0.05;
      }
    }
  });

  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* GLTF Model */}
      {gltf && (
        <primitive 
          object={gltf.scene.clone()} 
          scale={isAlive ? [0.3, 0.3, 0.3] : [0.25, 0.25, 0.25]}
          rotation={[0, 0, 0]}
        />
      )}
      
      {/* Fallback procedural snake if GLTF fails */}
      {!gltf && fallbackSnake && (
        <>
          {/* Snake Head */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshPhysicalMaterial
              color={isAlive ? '#2A5A2A' : '#555555'}
              emissive={isAlive ? '#0A2A0A' : '#222222'}
              emissiveIntensity={0.2}
              metalness={0.1}
              roughness={0.3}
            />
          </mesh>
          
          {/* Snake Body Segments */}
          {segments.slice(1).map((segment, index) => (
            <mesh
              key={`segment-${index}`}
              position={[segment.x - 10, 0.15, segment.z - 10]}
            >
              <sphereGeometry args={[0.2 - index * 0.01, 12, 12]} />
              <meshPhysicalMaterial
                color={isAlive ? '#1A4A1A' : '#444444'}
                emissive={isAlive ? '#0A1A0A' : '#111111'}
                emissiveIntensity={0.1}
                metalness={0.1}
                roughness={0.4}
              />
            </mesh>
          ))}
          
          {/* Eyes */}
          <mesh position={[0.15, 0.1, 0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial 
              color="#000000" 
              emissive={isAlive ? "#FF0000" : "#440000"} 
              emissiveIntensity={0.5} 
            />
          </mesh>
          <mesh position={[0.15, 0.1, -0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial 
              color="#000000" 
              emissive={isAlive ? "#FF0000" : "#440000"} 
              emissiveIntensity={0.5} 
            />
          </mesh>
          
          {/* Animated Tongue */}
          {isAlive && (
            <mesh 
              position={[0.25, 0, 0]} 
              rotation={[0, 0, Math.sin(animationTime.current * 8) * 0.2]}
            >
              <cylinderGeometry args={[0.005, 0.005, 0.15, 6]} />
              <meshStandardMaterial 
                color="#FF2020" 
                emissive="#FF2020" 
                emissiveIntensity={0.3} 
              />
            </mesh>
          )}
        </>
      )}
      
      {/* Particle effects */}
      {isAlive && (
        <pointLight
          position={[0, 0.2, 0]}
          color="#00FF00"
          intensity={0.3}
          distance={2}
        />
      )}
    </group>
  );
};
