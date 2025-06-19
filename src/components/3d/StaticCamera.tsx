
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { Position } from '../../store/gameStore';

interface StaticCameraProps {
  snakeHead: Position;
  shake?: boolean;
}

export const StaticCamera: React.FC<StaticCameraProps> = ({ snakeHead, shake = false }) => {
  const { camera } = useThree();
  const shakeOffset = useRef({ x: 0, y: 0, z: 0 });

  useFrame((state, delta) => {
    if (camera instanceof PerspectiveCamera) {
      // Static third-person perspective with slight following
      const targetX = (snakeHead.x - 10) * 0.1; // Subtle follow
      const targetZ = (snakeHead.z - 10) * 0.1;
      
      // Smooth camera following
      camera.position.x += (targetX - camera.position.x) * 0.02;
      camera.position.z += (20 + targetZ - camera.position.z) * 0.02;
      camera.position.y = 25; // Fixed height for consistent view
      
      // Shake effect for collisions
      if (shake) {
        shakeOffset.current.x = (Math.random() - 0.5) * 0.5;
        shakeOffset.current.y = (Math.random() - 0.5) * 0.5;
        shakeOffset.current.z = (Math.random() - 0.5) * 0.5;
      } else {
        // Smoothly return to normal position
        shakeOffset.current.x *= 0.9;
        shakeOffset.current.y *= 0.9;
        shakeOffset.current.z *= 0.9;
      }
      
      // Apply shake
      camera.position.x += shakeOffset.current.x;
      camera.position.y += shakeOffset.current.y;
      camera.position.z += shakeOffset.current.z;
      
      // Always look at the center of the board
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  });

  return null;
};
