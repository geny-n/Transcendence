import React, { useEffect, useCallback } from 'react';
import { usePongSocket } from '../hooks/usePongSocket';
import { Matchmaking } from '../Components/PongMulti/Matchmaking';
import { GameCanvas } from '../Components/PongMulti/GameCanvas';
import { Score } from '../Components/PongMulti/Score';
import './style/PongMulti.css';

/**
 * Page principale du jeu Pong Multijoueur
 * 
 * Orchestration des composants :
 * - Matchmaking : File d'attente et recherche d'adversaire
 * - GameCanvas : Affichage du jeu
 * - Score : Affichage des scores
 * - Gestion des inputs clavier
 * 
 * TODO BACKEND:
 * - Remplacer 'http://localhost:3000' par l'URL réelle du serveur backend
 * - Vérifier que Socket.io est installé : npm install socket.io-client
 */

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const PongMulti: React.FC = () => {
  const {
    gameState,
    playerSide,
    isConnected,
    isInQueue,
    sendInput,
    joinQueue,
    leaveQueue,
  } = usePongSocket('http://localhost:3100'); // URL du serveur backend

  // Gestion des inputs clavier
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!gameState || gameState.status !== 'playing') return;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        sendInput('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        sendInput('down');
        break;
    }
  }, [gameState, sendInput]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!gameState || gameState.status !== 'playing') return;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        sendInput('stop');
        break;
    }
  }, [gameState, sendInput]);

  // Attacher les event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Retour au matchmaking si la partie est terminée
  const handleBackToMenu = () => {
    leaveQueue();
    window.location.reload(); // Simple reload pour réinitialiser
  };

  return (
    <div className="pong-multi-page">
      {!gameState || gameState.status === 'waiting' ? (
        // Écran de matchmaking
        <Matchmaking
          isInQueue={isInQueue}
          isConnected={isConnected}
          onJoinQueue={joinQueue}
          onLeaveQueue={leaveQueue}
        />
      ) : (
        // Écran de jeu
        <div className="game-screen">
          <Score
            leftScore={gameState.scores.left}
            rightScore={gameState.scores.right}
            maxScore={5}
          />
          
          <div className="game-area">
            <GameCanvas
              gameState={gameState}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              playerSide={playerSide}
            />
          </div>

          {gameState.status === 'finished' && (
            <div className="game-over-overlay">
              <div className="game-over-modal">
                <h2 className="game-over-title">Partie terminée !</h2>
                <p className="game-over-result">
                  {gameState.winner === playerSide 
                    ? '🎉 Vous avez gagné !' 
                    : '😔 Vous avez perdu'}
                </p>
                <div className="final-score">
                  Score final : {gameState.scores.left} - {gameState.scores.right}
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleBackToMenu}
                >
                  Retour au menu
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PongMulti;
