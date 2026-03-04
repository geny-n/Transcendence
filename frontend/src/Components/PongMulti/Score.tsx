import React from 'react';
import './Score.css';

interface ScoreProps {
  leftScore: number;
  rightScore: number;
  maxScore?: number;
}

/**
 * Composant Score - Affiche les scores des deux joueurs
 * Format: "Score Gauche - Score Droite"
 */
export const Score: React.FC<ScoreProps> = ({ 
  leftScore, 
  rightScore,
  maxScore = 5 
}) => {
  return (
    <div className="score-container">
      <div className="score-display">
        <span className="score-left">{leftScore}</span>
        <span className="score-separator">-</span>
        <span className="score-right">{rightScore}</span>
      </div>
      <div className="score-info">
        Premier à {maxScore} points
      </div>
    </div>
  );
};
