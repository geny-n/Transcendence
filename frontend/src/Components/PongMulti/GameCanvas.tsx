import React from 'react';
import type { GameState } from '../../types/pong.types';
import { Ball } from './Ball';
import { Paddle } from './Paddle';
import './GameCanvas.css';

interface GameCanvasProps {
  gameState: GameState | null;
  width: number;
  height: number;
  playerSide: 'left' | 'right' | null;
}

/**
 * Composant GameCanvas - Canvas SVG principal du jeu
 * Affiche tous les éléments du jeu : terrain, raquettes, balle
 * Reçoit l'état du jeu depuis le serveur et le render
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  width, 
  height,
  playerSide 
}) => {
  // Position X des raquettes (fixe)
  const paddleMargin = 20;
  const leftPaddleX = paddleMargin;
  const rightPaddleX = width - paddleMargin - (gameState?.paddles.right.width || 10);

  return (
    <div className="game-canvas-container">
      <svg 
        width={width} 
        height={height} 
        className="game-canvas"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Fond du terrain */}
        <rect 
          width={width} 
          height={height} 
          fill="#000000" 
          className="game-field"
        />

        {/* Ligne centrale en pointillés */}
        <line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={height}
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="10,10"
          opacity="0.3"
          className="center-line"
        />

        {/* Cercle central */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={50}
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
          className="center-circle"
        />

        {/* Raquettes */}
        {gameState && (
          <>
            <Paddle 
              paddle={gameState.paddles.left} 
              x={leftPaddleX}
              side="left"
              color={playerSide === 'left' ? '#00FF00' : '#FFFFFF'}
            />
            <Paddle 
              paddle={gameState.paddles.right} 
              x={rightPaddleX}
              side="right"
              color={playerSide === 'right' ? '#00FF00' : '#FFFFFF'}
            />
          </>
        )}

        {/* Balle */}
        {gameState && gameState.status === 'playing' && (
          <Ball ball={gameState.ball} />
        )}
      </svg>

      {/* Indicateur de côté du joueur */}
      {playerSide && (
        <div className={`player-indicator player-indicator-${playerSide}`}>
          Vous êtes à {playerSide === 'left' ? 'gauche' : 'droite'}
        </div>
      )}
    </div>
  );
};
