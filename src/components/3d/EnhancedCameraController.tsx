
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { Position, Direction } from '../../store/gameStore';

interface EnhancedCameraControllerProps {
  snakeHead: Position;
  direction: Direction;
  gameState: string;
  shake: boolean;
  mode?: 'follow' | 'overview' | 'cinematic';
}

export const EnhancedCameraController: React.FC<EnhancedCameraControllerProps> = ({ 
  snakeHead, 
  direction, 
  gameState,
  shake,
  mode = 'follow'
}) => {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());
  const lookAtTarget = useRef(new Vector3());
  const shakeOffset = useRef(new Vector3());
  const smoothingFactor = useRef(0.05);

  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    const headWorldPos = new Vector3(snakeHead.x - 10, 0.5, snakeHead.z - 10);
    
    // Calculate camera position based on mode
    switch (mode) {
      case 'follow':
        // Third-person follow camera
        const followDistance = 8;
        const height = 6;
        
        const directionOffset = new Vector3();
        switch (direction) {
          case 'up':
            directionOffset.set(0, height, followDistance);
            break;
          case 'down':
            directionOffset.set(0, height, -followDistance);
            break;
          case 'left':
            directionOffset.set(followDistance, height, 0);
            break;
          case 'right':
            directionOffset.set(-followDistance, height, 0);
            break;
        }
        
        targetPosition.current.copy(headWorldPos).add(directionOffset);
        lookAtTarget.current.copy(headWorldPos);
        smoothingFactor.current = 0.08;
        break;
        
      case 'cinematic':
        // Dynamic cinematic camera
        const cinematicRadius = 12;
        const cinematicHeight = 8;
        const angle = state.clock.elapsedTime * 0.3;
        
        targetPosition.current.set(
          headWorldPos.x + Math.cos(angle) * cinematicRadius,
          cinematicHeight,
          headWorldPos.z + Math.sin(angle) * cinematicRadius
        );
        lookAtTarget.current.copy(headWorldPos);
        smoothingFactor.current = 0.03;
        break;
        
      case 'overview':
      default:
        // Top-down overview
        targetPosition.current.set(headWorldPos.x, 15, headWorldPos.z + 5);
        lookAtTarget.current.copy(headWorldPos);
        smoothingFactor.current = 0.05;
        break;
    }

    // Smooth camera movement
    currentPosition.current.lerp(targetPosition.current, smoothingFactor.current);

    // Camera shake effect
    if (shake) {
      shakeOffset.current.set(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      );
    } else {
      shakeOffset.current.lerp(new Vector3(0, 0, 0), delta * 8);
    }

    // Apply position and look-at
    camera.position.copy(currentPosition.current).add(shakeOffset.current);
    camera.lookAt(lookAtTarget.current);
    
    // Ensure camera is always slightly above ground
    if (camera.position.y < 1) {
      camera.position.y = 1;
    }
  });

  return null;
};
