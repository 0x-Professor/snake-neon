
import React from 'react';
import { useThree } from '@react-three/fiber';
import { Position } from '../../store/gameStore';

interface StaticCameraProps {
  snakeHead: Position;
  shake?: boolean;
}

export const StaticCamera: React.FC<StaticCameraProps> = ({ snakeHead, shake = false }) => {
  const { camera } = useThree();
  
  React.useEffect(() => {
    // Set static camera position - elegant isometric view
    camera.position.set(0, 25, 15);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
};
