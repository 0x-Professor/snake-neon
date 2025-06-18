
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, PerspectiveCamera } from 'three';
import { Position } from '../../store/gameStore';

interface CinematicCameraProps {
  snakeHead: Position;
  direction: string;
  gameState: string;
  shake: boolean;
}

export const CinematicCamera: React.FC<CinematicCameraProps> = ({ 
  snakeHead, 
  direction, 
  gameState,
  shake 
}) => {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());
  const shakeOffset = useRef(new Vector3());

  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    // Calculate target camera position based on snake head and direction
    const headPos = new Vector3(snakeHead.x - 10, 2, snakeHead.z - 10);
    
    // Offset camera behind the snake based on direction
    const directionOffset = new Vector3();
    switch (direction) {
      case 'up':
        directionOffset.set(0, 3, 5);
        break;
      case 'down':
        directionOffset.set(0, 3, -5);
        break;
      case 'left':
        directionOffset.set(5, 3, 0);
        break;
      case 'right':
        directionOffset.set(-5, 3, 0);
        break;
      default:
        directionOffset.set(-5, 3, 0);
    }

    targetPosition.current.copy(headPos).add(directionOffset);

    // Smooth camera movement
    currentPosition.current.lerp(targetPosition.current, delta * 3);

    // Camera shake effect
    if (shake) {
      shakeOffset.current.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
    } else {
      shakeOffset.current.lerp(new Vector3(0, 0, 0), delta * 10);
    }

    // Apply position with shake
    camera.position.copy(currentPosition.current).add(shakeOffset.current);
    
    // Look at the snake head
    camera.lookAt(headPos);
  });

  return null;
};
