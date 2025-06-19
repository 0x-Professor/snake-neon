
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { Position } from '../../store/gameStore';

interface CameraControllerProps {
  snakeHead: Position;
  mode: 'third-person' | 'first-person';
  shake?: boolean;
  zoom: number;
}

export const CameraController: React.FC<CameraControllerProps> = ({ 
  snakeHead, 
  mode, 
  shake = false, 
  zoom 
}) => {
  const { camera } = useThree();
  const shakeOffset = useRef({ x: 0, y: 0, z: 0 });
  const currentPosition = useRef(new Vector3());
  const targetPosition = useRef(new Vector3());
  const transitionSpeed = 0.05;

  useFrame((state, delta) => {
    if (camera instanceof PerspectiveCamera) {
      const headWorldPos = new Vector3(snakeHead.x - 10, 0, snakeHead.z - 10);
      
      // Define target positions for different camera modes
      if (mode === 'first-person') {
        // First-person: camera positioned slightly above and behind snake head
        targetPosition.current.set(
          headWorldPos.x,
          2 + zoom * 0.5,
          headWorldPos.z + 1
        );
        // Look slightly ahead
        const lookTarget = new Vector3(headWorldPos.x, 0, headWorldPos.z - 2);
        camera.lookAt(lookTarget);
      } else {
        // Third-person: elevated position with overview
        const distance = 15 + zoom * 2;
        const height = 12 + zoom * 1.5;
        targetPosition.current.set(
          headWorldPos.x * 0.3,
          height,
          headWorldPos.z * 0.3 + distance
        );
        // Look at game center
        camera.lookAt(0, 0, 0);
      }

      // Smooth camera transition
      currentPosition.current.lerp(targetPosition.current, transitionSpeed);
      
      // Apply shake effect for collisions
      if (shake) {
        shakeOffset.current.x = (Math.random() - 0.5) * 0.8;
        shakeOffset.current.y = (Math.random() - 0.5) * 0.8;
        shakeOffset.current.z = (Math.random() - 0.5) * 0.8;
      } else {
        shakeOffset.current.x *= 0.9;
        shakeOffset.current.y *= 0.9;
        shakeOffset.current.z *= 0.9;
      }
      
      // Apply final position with shake
      camera.position.copy(currentPosition.current);
      camera.position.add(new Vector3().copy(shakeOffset.current));
      
      camera.updateProjectionMatrix();
    }
  });

  return null;
};
