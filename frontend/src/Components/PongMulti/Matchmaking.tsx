import React from 'react';
import './Matchmaking.css';

interface MatchmakingProps {
  isInQueue: boolean;
  isConnected: boolean;
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
}

/**
 * Composant Matchmaking - Interface de recherche de partie
 * Permet au joueur de rejoindre la file d'attente pour trouver un adversaire
 */
export const Matchmaking: React.FC<MatchmakingProps> = ({
  isInQueue,
  isConnected,
  onJoinQueue,
  onLeaveQueue,
}) => {
  return (
    <div className="matchmaking-container">
      <div className="matchmaking-card">
        <h2 className="matchmaking-title">Pong Multijoueur</h2>
        
        {!isConnected ? (
          <div className="matchmaking-status">
            <div className="status-icon status-error">⚠</div>
            <p>Connexion au serveur...</p>
          </div>
        ) : isInQueue ? (
          <div className="matchmaking-status">
            <div className="status-icon status-searching">
              <div className="spinner"></div>
            </div>
            <p className="status-text">Recherche d'un adversaire...</p>
            <button 
              className="btn btn-secondary"
              onClick={onLeaveQueue}
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="matchmaking-status">
            <div className="status-icon status-ready">✓</div>
            <p className="status-text">Prêt à jouer</p>
            <button 
              className="btn btn-primary"
              onClick={onJoinQueue}
            >
              Trouver une partie
            </button>
          </div>
        )}

        <div className="matchmaking-info">
          <h3>Comment jouer ?</h3>
          <ul>
            <li>Utilisez les flèches <kbd>↑</kbd> et <kbd>↓</kbd> pour déplacer votre raquette</li>
            <li>Ou utilisez les touches <kbd>W</kbd> et <kbd>S</kbd></li>
            <li>Premier à 5 points gagne la partie</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
