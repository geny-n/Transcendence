import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types/pong.types';

/**
 * Hook personnalisé pour gérer la connexion Socket.io avec le backend
 * 
 * TODO BACKEND:
 * - Implémenter les événements Socket.io côté serveur :
 *   * 'join_queue' : Ajouter le joueur à la file d'attente
 *   * 'player_input' : Recevoir les inputs clavier du joueur
 *   * 'game_state' : Envoyer l'état du jeu aux clients (60 FPS)
 *   * 'game_start' : Notifier le début de la partie
 *   * 'game_over' : Notifier la fin de la partie
 *   * 'opponent_disconnect' : Gérer la déconnexion de l'adversaire
 * 
 * - Créer le game engine serveur avec :
 *   * Game loop à 60 FPS
 *   * Physique de la balle (mouvement, collisions)
 *   * Logique de score
 *   * Gestion des rooms/matchs
 */

interface UsePongSocketReturn {
  gameState: GameState | null;
  playerSide: 'left' | 'right' | null;
  isConnected: boolean;
  isInQueue: boolean;
  sendInput: (action: 'up' | 'down' | 'stop') => void;
  joinQueue: () => void;
  leaveQueue: () => void;
}

export const usePongSocket = (serverUrl: string): UsePongSocketReturn => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerSide, setPlayerSide] = useState<'left' | 'right' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  
  // socketRef pour maintenir la connexion
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connexion au serveur Socket.io sur le namespace /pong
    socketRef.current = io(`${serverUrl}/pong`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    // Événement: Connexion établie
    socket.on('connect', () => {
      console.log('Connecté au serveur Socket.io');
      setIsConnected(true);
    });

    // Événement: Déconnexion
    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur');
      setIsConnected(false);
      setIsInQueue(false);
    });

    // Événement: Partie trouvée, attribution du côté
    socket.on('game_start', (data: { roomId: string; side: 'left' | 'right' }) => {
      console.log('Partie démarrée!', data);
      setPlayerSide(data.side);
      setIsInQueue(false);
    });

    // Événement: Mise à jour de l'état du jeu
    socket.on('game_state', (state: GameState) => {
      setGameState(state);
    });

    // Événement: Fin de partie
    socket.on('game_over', (data: { winner: 'left' | 'right' }) => {
      console.log('Partie terminée! Gagnant:', data.winner);
      setGameState(prev => prev ? { ...prev, status: 'finished', winner: data.winner } : null);
    });

    // Événement: Adversaire déconnecté
    socket.on('opponent_disconnect', () => {
      console.log('Adversaire déconnecté');
      // Retour au menu
      setGameState(null);
      setPlayerSide(null);
      setIsInQueue(false);
    });

    // Nettoyage à la déconnexion du composant
    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  // Rejoindre la file d'attente
  const joinQueue = () => {
    socketRef.current?.emit('join_queue');
    console.log('Rejoindre la file d\'attente');
    setIsInQueue(true);
  };

  // Quitter la file d'attente
  const leaveQueue = () => {
    socketRef.current?.emit('leave_queue');
    console.log('Quitter la file d\'attente');
    setIsInQueue(false);
  };

  // Envoyer un input au serveur
  const sendInput = (action: 'up' | 'down' | 'stop') => {
    if (!gameState) return;
    
    socketRef.current?.emit('player_input', {
      roomId: gameState.roomId,
      action,
    });
  };

  return {
    gameState,
    playerSide,
    isConnected,
    isInQueue,
    sendInput,
    joinQueue,
    leaveQueue,
  };
};
