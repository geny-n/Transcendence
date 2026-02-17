/**
 * Gestionnaire de Matchmaking pour le Pong Multijoueur
 * Gère la file d'attente des joueurs et la création des parties
 */

import type { GameRoom, Player, TypedSocket } from '../types/pong.types.js';
import { PongGameEngine } from './PongGameEngine.js';
import { v4 as uuidv4 } from 'uuid';

export class MatchmakingManager {
  private queue: TypedSocket[] = [];
  private activeRooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // socketId -> roomId
  private gameEngine: PongGameEngine;

  constructor() {
    this.gameEngine = new PongGameEngine();
  }

  /**
   * Ajoute un joueur à la file d'attente
   */
  addToQueue(socket: TypedSocket): void {
    // Vérifier si le joueur n'est pas déjà dans une partie
    if (this.playerRooms.has(socket.id)) {
      socket.emit('error', 'Vous êtes déjà dans une partie');
      return;
    }

    // Vérifier si le joueur n'est pas déjà dans la file
    if (this.queue.includes(socket)) {
      return;
    }

    this.queue.push(socket);
    console.log(`Joueur ${socket.id} ajouté à la file d'attente. File: ${this.queue.length}`);

    // Essayer de créer une partie si au moins 2 joueurs
    this.tryCreateGame();
  }

  /**
   * Retire un joueur de la file d'attente
   */
  removeFromQueue(socket: TypedSocket): void {
    const index = this.queue.indexOf(socket);
    if (index > -1) {
      this.queue.splice(index, 1);
      console.log(`Joueur ${socket.id} retiré de la file d'attente`);
    }
  }

  /**
   * Essaye de créer une partie si au moins 2 joueurs sont en attente
   */
  private tryCreateGame(): void {
    if (this.queue.length < 2) {
      return;
    }

    // Prendre les 2 premiers joueurs de la file
    const player1Socket = this.queue.shift()!;
    const player2Socket = this.queue.shift()!;

    // Créer une nouvelle room
    const roomId = uuidv4();
    
    const player1: Player = {
      socket: player1Socket,
      side: 'left',
      id: player1Socket.id,
      inputState: 'stop',
    };

    const player2: Player = {
      socket: player2Socket,
      side: 'right',
      id: player2Socket.id,
      inputState: 'stop',
    };

    const room: GameRoom = {
      id: roomId,
      players: {
        left: player1,
        right: player2,
      },
      gameState: this.gameEngine.initializeGame(roomId),
      gameLoopInterval: null,
      config: this.gameEngine.getConfig(),
    };

    this.activeRooms.set(roomId, room);
    this.playerRooms.set(player1Socket.id, roomId);
    this.playerRooms.set(player2Socket.id, roomId);

    // Notifier les joueurs
    player1Socket.emit('game_start', { roomId, side: 'left' });
    player2Socket.emit('game_start', { roomId, side: 'right' });

    console.log(`Partie créée: ${roomId} avec ${player1Socket.id} vs ${player2Socket.id}`);

    // Démarrer la game loop
    this.startGameLoop(room);
  }

  /**
   * Démarre la boucle de jeu pour une room
   */
  private startGameLoop(room: GameRoom): void {
    const fps = room.config.fps;
    const interval = 1000 / fps;

    room.gameLoopInterval = setInterval(() => {
      // Mettre à jour l'état du jeu
      const updatedState = this.gameEngine.update(room);

      // Envoyer l'état aux deux joueurs
      if (room.players.left) {
        room.players.left.socket.emit('game_state', updatedState);
      }
      if (room.players.right) {
        room.players.right.socket.emit('game_state', updatedState);
      }

      // Vérifier si la partie est terminée
      if (updatedState.status === 'finished') {
        this.endGame(room);
      }
    }, interval);
  }

  /**
   * Termine une partie
   */
  private endGame(room: GameRoom): void {
    // Arrêter la game loop
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval);
      room.gameLoopInterval = null;
    }

    // Notifier les joueurs
    const winner = room.gameState.winner!;
    if (room.players.left) {
      room.players.left.socket.emit('game_over', { winner });
      this.playerRooms.delete(room.players.left.socket.id);
    }
    if (room.players.right) {
      room.players.right.socket.emit('game_over', { winner });
      this.playerRooms.delete(room.players.right.socket.id);
    }

    // Supprimer la room
    this.activeRooms.delete(room.id);
    console.log(`Partie terminée: ${room.id}. Gagnant: ${winner}`);
  }

  /**
   * Gère l'input d'un joueur
   */
  handlePlayerInput(socket: TypedSocket, roomId: string, action: 'up' | 'down' | 'stop'): void {
    const room = this.activeRooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Partie introuvable');
      return;
    }

    // Trouver le joueur et mettre à jour son input
    if (room.players.left?.socket.id === socket.id) {
      room.players.left.inputState = action;
    } else if (room.players.right?.socket.id === socket.id) {
      room.players.right.inputState = action;
    }
  }

  /**
   * Gère la déconnexion d'un joueur
   */
  handlePlayerDisconnect(socket: TypedSocket): void {
    // Retirer de la file d'attente
    this.removeFromQueue(socket);

    // Vérifier si le joueur était dans une partie
    const roomId = this.playerRooms.get(socket.id);
    if (roomId) {
      const room = this.activeRooms.get(roomId);
      if (room) {
        // Notifier l'adversaire
        const opponent = room.players.left?.socket.id === socket.id 
          ? room.players.right 
          : room.players.left;

        if (opponent) {
          opponent.socket.emit('opponent_disconnect');
          this.playerRooms.delete(opponent.socket.id);
        }

        // Arrêter la partie
        if (room.gameLoopInterval) {
          clearInterval(room.gameLoopInterval);
        }
        this.activeRooms.delete(roomId);
        console.log(`Partie ${roomId} terminée suite à déconnexion de ${socket.id}`);
      }

      this.playerRooms.delete(socket.id);
    }
  }

  /**
   * Obtient les statistiques du serveur
   */
  getStats() {
    return {
      playersInQueue: this.queue.length,
      activeGames: this.activeRooms.size,
      totalPlayers: this.playerRooms.size,
    };
  }
}
