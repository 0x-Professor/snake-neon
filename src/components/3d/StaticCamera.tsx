
import React, { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Position } from '../../store/gameStore';

interface StaticCameraProps {
  snakeHead: Position;
  shake?: boolean;
}

export const StaticCamera: React.FC<StaticCameraProps> = ({ snakeHead, shake = false }) => {
  const { camera } = useThree();
  const isInitialized = useRef(false);
  
  React.useEffect(() => {
    // Only set camera position once on mount
    if (!isInitialized.current) {
      camera.position.set(0, 25, 15);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      isInitialized.current = true;
    }
  }, []); // Empty dependency array - only run once

  return null;
};
