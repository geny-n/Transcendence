import React from 'react';
import type { Paddle as PaddleType } from '../../types/pong.types';

interface PaddleProps {
  paddle: PaddleType;
  x: number;
  side: 'left' | 'right';
  color?: string;
}

/**
 * Composant Paddle - Affiche une raquette du jeu Pong
 * Reçoit la position Y depuis le serveur
 * Le X est fixe selon le côté (gauche ou droite)
 */
export const Paddle: React.FC<PaddleProps> = ({ 
  paddle, 
  x, 
  side,
  color = '#FFFFFF' 
}) => {
  return (
    <rect
      x={x}
      y={paddle.y}
      width={paddle.width}
      height={paddle.height}
      fill={color}
      className={`paddle paddle-${side}`}
      rx={2} // Coins légèrement arrondis
    />
  );
};
