/**
 * Handlers Socket.io pour le Pong Multijoueur
 * Connecte les événements Socket.io avec le système de matchmaking
 */

import { Server } from 'socket.io';
import { MatchmakingManager } from '../game/MatchmakingManager.js';
import type { ClientToServerEvents, ServerToClientEvents, TypedSocket } from '../types/pong.types.js';

export class PongSocketHandlers {
  private matchmaking: MatchmakingManager;

  constructor() {
    this.matchmaking = new MatchmakingManager();
  }

  /**
   * Initialise les handlers Socket.io
   */
  setupHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
    io.on('connection', (socket: TypedSocket) => {
      console.log(`Nouvelle connexion: ${socket.id}`);

      // Événement: Rejoindre la file d'attente
      socket.on('join_queue', () => {
        console.log(`${socket.id} rejoint la file d'attente`);
        this.matchmaking.addToQueue(socket);
      });

      // Événement: Quitter la file d'attente
      socket.on('leave_queue', () => {
        console.log(`${socket.id} quitte la file d'attente`);
        this.matchmaking.removeFromQueue(socket);
      });

      // Événement: Input du joueur
      socket.on('player_input', (data: { roomId: string; action: 'up' | 'down' | 'stop' }) => {
        this.matchmaking.handlePlayerInput(socket, data.roomId, data.action);
      });

      // Événement: Déconnexion
      socket.on('disconnect', () => {
        console.log(`Déconnexion: ${socket.id}`);
        this.matchmaking.handlePlayerDisconnect(socket);
      });
    });

    // Log des statistiques toutes les 30 secondes
    setInterval(() => {
      const stats = this.matchmaking.getStats();
      console.log('[Pong Stats]', stats);
    }, 30000);
  }

  /**
   * Obtient les statistiques actuelles
   */
  getStats() {
    return this.matchmaking.getStats();
  }
}
