import React from 'react';
import type { Ball as BallType } from '../../types/pong.types';

interface BallProps {
  ball: BallType;
  color?: string;
}

/**
 * Composant Ball - Affiche la balle du jeu Pong
 * Reçoit la position depuis le serveur et l'affiche
 */
export const Ball: React.FC<BallProps> = ({ ball, color = '#FFFFFF' }) => {
  return (
    <circle
      cx={ball.x}
      cy={ball.y}
      r={ball.radius}
      fill={color}
      className="ball"
    />
  );
};
