/**
 * Types pour le jeu Pong Multijoueur
 */

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

export interface Player {
  id: string;
  side: 'left' | 'right';
  score: number;
}

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

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  paddleSpeed: number;
  ballSpeed: number;
  maxScore: number;
}

export type PlayerInput = 'up' | 'down' | 'stop';

export interface InputEvent {
  roomId: string;
  action: PlayerInput;
}
