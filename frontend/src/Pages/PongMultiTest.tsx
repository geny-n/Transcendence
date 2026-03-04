import React, { useEffect, useState } from 'react';
import { GameCanvas } from '../Components/PongMulti/GameCanvas';
import { Score } from '../Components/PongMulti/Score';
import { Matchmaking } from '../Components/PongMulti/Matchmaking';
import type { GameState } from '../types/pong.types';
import './style/PongMulti.css';

/**
 * Page de test pour le Pong Multijoueur
 * Simule le jeu avec des données mockées pour tester l'UI sans backend
 * 
 * Utilisez cette page pour :
 * - Tester l'apparence des composants
 * - Vérifier les animations
 * - Simuler différents états du jeu
 */

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const PongMultiTest: React.FC = () => {
  const [currentView, setCurrentView] = useState<'matchmaking' | 'playing' | 'finished'>('matchmaking');
  const [isInQueue, setIsInQueue] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Données mockées pour le test
  const mockGameState: GameState = {
    roomId: 'test-room-123',
    ball: {
      x: 400,
      y: 300,
      vx: 5,
      vy: 3,
      radius: 8,
    },
    paddles: {
      left: {
        y: 250,
        height: 100,
        width: 10,
      },
      right: {
        y: 250,
        height: 100,
        width: 10,
      },
    },
    scores: {
      left: 3,
      right: 2,
    },
    status: 'playing',
  };

  // Simuler l'animation de la balle et des raquettes
  useEffect(() => {
    if (currentView !== 'playing' || !gameState) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;

        // Nouvelle position de la balle
        let newBallX = prev.ball.x + prev.ball.vx;
        let newBallY = prev.ball.y + prev.ball.vy;
        let newVx = prev.ball.vx;
        let newVy = prev.ball.vy;

        // Collision haut/bas
        if (newBallY - prev.ball.radius <= 0 || newBallY + prev.ball.radius >= CANVAS_HEIGHT) {
          newVy = -newVy;
        }

        // Collision raquette gauche
        if (newBallX - prev.ball.radius <= 30 &&
            newBallY >= prev.paddles.left.y &&
            newBallY <= prev.paddles.left.y + prev.paddles.left.height) {
          newVx = Math.abs(newVx);
        }

        // Collision raquette droite
        if (newBallX + prev.ball.radius >= 770 &&
            newBallY >= prev.paddles.right.y &&
            newBallY <= prev.paddles.right.y + prev.paddles.right.height) {
          newVx = -Math.abs(newVx);
        }

        // IA simple pour la raquette droite
        const paddleCenter = prev.paddles.right.y + prev.paddles.right.height / 2;
        let newRightY = prev.paddles.right.y;
        if (newBallY > paddleCenter + 10 && newRightY < CANVAS_HEIGHT - prev.paddles.right.height) {
          newRightY += 3;
        } else if (newBallY < paddleCenter - 10 && newRightY > 0) {
          newRightY -= 3;
        }

        // Réinitialiser si sort du terrain
        if (newBallX < 0 || newBallX > CANVAS_WIDTH) {
          newBallX = CANVAS_WIDTH / 2;
          newBallY = CANVAS_HEIGHT / 2;
          newVx = (Math.random() > 0.5 ? 1 : -1) * 5;
          newVy = (Math.random() - 0.5) * 6;
        }

        return {
          ...prev,
          ball: {
            ...prev.ball,
            x: newBallX,
            y: newBallY,
            vx: newVx,
            vy: newVy,
          },
          paddles: {
            ...prev.paddles,
            right: {
              ...prev.paddles.right,
              y: newRightY,
            },
          },
        };
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [currentView, gameState]);

  // Gérer les inputs clavier pour la raquette gauche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentView !== 'playing' || !gameState) return;

      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && gameState.paddles.left.y > 0) {
        e.preventDefault();
        setGameState(prev => prev ? {
          ...prev,
          paddles: {
            ...prev.paddles,
            left: {
              ...prev.paddles.left,
              y: Math.max(0, prev.paddles.left.y - 15),
            },
          },
        } : prev);
      }

      if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && 
          gameState.paddles.left.y < CANVAS_HEIGHT - gameState.paddles.left.height) {
        e.preventDefault();
        setGameState(prev => prev ? {
          ...prev,
          paddles: {
            ...prev.paddles,
            left: {
              ...prev.paddles.left,
              y: Math.min(CANVAS_HEIGHT - prev.paddles.left.height, prev.paddles.left.y + 15),
            },
          },
        } : prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, gameState]);

  const handleJoinQueue = () => {
    setIsInQueue(true);
    // Simuler la recherche d'un adversaire
    setTimeout(() => {
      setIsInQueue(false);
      setGameState(mockGameState);
      setCurrentView('playing');
    }, 2000);
  };

  const handleLeaveQueue = () => {
    setIsInQueue(false);
  };

  const handleBackToMenu = () => {
    setCurrentView('matchmaking');
    setGameState(null);
    setIsInQueue(false);
  };

  const handleTestGameOver = () => {
    setGameState(prev => prev ? { ...prev, status: 'finished', winner: 'left' } : prev);
  };

  return (
    <div className="pong-multi-page">
      {/* Bannière de mode test */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 193, 7, 0.9)',
        color: '#000',
        padding: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        zIndex: 1000,
      }}>
        ⚠️ MODE TEST - Données simulées (sans backend)
      </div>

      <div style={{ marginTop: '50px' }}>
        {currentView === 'matchmaking' ? (
          <Matchmaking
            isInQueue={isInQueue}
            isConnected={true}
            onJoinQueue={handleJoinQueue}
            onLeaveQueue={handleLeaveQueue}
          />
        ) : (
          <div className="game-screen">
            <Score
              leftScore={gameState?.scores.left || 0}
              rightScore={gameState?.scores.right || 0}
              maxScore={5}
            />
            
            <div className="game-area">
              <GameCanvas
                gameState={gameState}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                playerSide="left"
              />
            </div>

            {/* Boutons de test */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={handleBackToMenu}
                style={{
                  margin: '5px',
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ← Retour au menu
              </button>
              <button 
                onClick={handleTestGameOver}
                style={{
                  margin: '5px',
                  padding: '10px 20px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Tester Game Over
              </button>
            </div>

            {gameState?.status === 'finished' && (
              <div className="game-over-overlay">
                <div className="game-over-modal">
                  <h2 className="game-over-title">Partie terminée !</h2>
                  <p className="game-over-result">
                    {gameState.winner === 'left' ? '🎉 Vous avez gagné !' : '😔 Vous avez perdu'}
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
    </div>
  );
};

export default PongMultiTest;
