/**
 * Types pour le système de Pong Multijoueur côté Backend
 */

import { Socket } from 'socket.io';

// État du jeu (partagé avec le frontend)
export interface GameState {
  roomId: string;
  ball: Ball;
  paddles: {
    left: Paddle;
    right: Paddle;
  };
  scores: {
    left: number;
    right: number;
  };
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  winner?: 'left' | 'right';
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Paddle {
  y: number;
  height: number;
  width: number;
}

// Configuration du jeu
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  ballSpeed: number;
  paddleSpeed: number;
  paddleHeight: number;
  paddleWidth: number;
  ballRadius: number;
  maxScore: number;
  fps: number;
}

// Joueur dans une partie
export interface Player {
  socket: Socket;
  side: 'left' | 'right';
  id: string;
  inputState: 'up' | 'down' | 'stop';
}

// Room de jeu
export interface GameRoom {
  id: string;
  players: {
    left: Player | null;
    right: Player | null;
  };
  gameState: GameState;
  gameLoopInterval: NodeJS.Timeout | null;
  config: GameConfig;
}

// Événements Socket.io (Client → Serveur)
export interface ClientToServerEvents {
  join_queue: () => void;
  leave_queue: () => void;
  player_input: (data: { roomId: string; action: 'up' | 'down' | 'stop' }) => void;
  disconnect: () => void;
}

// Événements Socket.io (Serveur → Client)
export interface ServerToClientEvents {
  game_start: (data: { roomId: string; side: 'left' | 'right' }) => void;
  game_state: (state: GameState) => void;
  game_over: (data: { winner: 'left' | 'right' }) => void;
  opponent_disconnect: () => void;
  error: (message: string) => void;
}

// Type du Socket avec événements typés
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
