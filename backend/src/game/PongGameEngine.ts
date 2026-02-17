/**
 * Game Engine pour le Pong Multijoueur
 * Gère la physique du jeu, les collisions et la logique de score
 */

import type { GameRoom, GameState, GameConfig } from '../types/pong.types.js';

export class PongGameEngine {
  private config: GameConfig = {
    canvasWidth: 800,
    canvasHeight: 600,
    ballSpeed: 5,
    paddleSpeed: 8,
    paddleHeight: 100,
    paddleWidth: 10,
    ballRadius: 8,
    maxScore: 5,
    fps: 60,
  };

  constructor(config?: Partial<GameConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialise l'état du jeu pour une nouvelle partie
   */
  initializeGame(roomId: string): GameState {
    return {
      roomId,
      ball: this.resetBall(),
      paddles: {
        left: {
          y: this.config.canvasHeight / 2 - this.config.paddleHeight / 2,
          height: this.config.paddleHeight,
          width: this.config.paddleWidth,
        },
        right: {
          y: this.config.canvasHeight / 2 - this.config.paddleHeight / 2,
          height: this.config.paddleHeight,
          width: this.config.paddleWidth,
        },
      },
      scores: {
        left: 0,
        right: 0,
      },
      status: 'playing',
    };
  }

  /**
   * Réinitialise la balle au centre avec une direction aléatoire
   */
  private resetBall() {
    const angle = (Math.random() - 0.5) * Math.PI / 3; // -30° à +30°
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    return {
      x: this.config.canvasWidth / 2,
      y: this.config.canvasHeight / 2,
      vx: Math.cos(angle) * this.config.ballSpeed * direction,
      vy: Math.sin(angle) * this.config.ballSpeed,
      radius: this.config.ballRadius,
    };
  }

  /**
   * Met à jour l'état du jeu (appelé 60 fois par seconde)
   */
  update(room: GameRoom): GameState {
    const state = room.gameState;

    // Déplacer les raquettes selon les inputs
    this.updatePaddles(room);

    // Déplacer la balle
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    // Gestion des collisions
    this.handleCollisions(state);

    // Vérifier si un point est marqué
    this.checkGoals(state);

    // Vérifier si la partie est terminée
    this.checkGameOver(state);

    return state;
  }

  /**
   * Met à jour la position des raquettes selon les inputs des joueurs
   */
  private updatePaddles(room: GameRoom) {
    const { players } = room;
    const { paddles } = room.gameState;

    // Raquette gauche
    if (players.left) {
      if (players.left.inputState === 'up' && paddles.left.y > 0) {
        paddles.left.y = Math.max(0, paddles.left.y - this.config.paddleSpeed);
      } else if (
        players.left.inputState === 'down' &&
        paddles.left.y < this.config.canvasHeight - this.config.paddleHeight
      ) {
        paddles.left.y = Math.min(
          this.config.canvasHeight - this.config.paddleHeight,
          paddles.left.y + this.config.paddleSpeed
        );
      }
    }

    // Raquette droite
    if (players.right) {
      if (players.right.inputState === 'up' && paddles.right.y > 0) {
        paddles.right.y = Math.max(0, paddles.right.y - this.config.paddleSpeed);
      } else if (
        players.right.inputState === 'down' &&
        paddles.right.y < this.config.canvasHeight - this.config.paddleHeight
      ) {
        paddles.right.y = Math.min(
          this.config.canvasHeight - this.config.paddleHeight,
          paddles.right.y + this.config.paddleSpeed
        );
      }
    }
  }

  /**
   * Gère les collisions de la balle
   */
  private handleCollisions(state: GameState) {
    const { ball, paddles } = state;

    // Collision avec les murs haut/bas
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= this.config.canvasHeight) {
      ball.vy = -ball.vy;
      ball.y = Math.max(ball.radius, Math.min(this.config.canvasHeight - ball.radius, ball.y));
    }

    // Collision avec la raquette gauche
    const leftPaddleX = 20; // Position X de la raquette gauche
    if (
      ball.x - ball.radius <= leftPaddleX + this.config.paddleWidth &&
      ball.x - ball.radius > leftPaddleX &&
      ball.y >= paddles.left.y &&
      ball.y <= paddles.left.y + paddles.left.height
    ) {
      ball.vx = Math.abs(ball.vx) * 1.05; // Légère accélération
      ball.x = leftPaddleX + this.config.paddleWidth + ball.radius;
      
      // Modifier l'angle selon l'endroit de l'impact
      const hitPos = (ball.y - paddles.left.y) / paddles.left.height - 0.5;
      ball.vy += hitPos * 3;
    }

    // Collision avec la raquette droite
    const rightPaddleX = this.config.canvasWidth - 20 - this.config.paddleWidth;
    if (
      ball.x + ball.radius >= rightPaddleX &&
      ball.x + ball.radius < rightPaddleX + this.config.paddleWidth &&
      ball.y >= paddles.right.y &&
      ball.y <= paddles.right.y + paddles.right.height
    ) {
      ball.vx = -Math.abs(ball.vx) * 1.05; // Légère accélération
      ball.x = rightPaddleX - ball.radius;
      
      // Modifier l'angle selon l'endroit de l'impact
      const hitPos = (ball.y - paddles.right.y) / paddles.right.height - 0.5;
      ball.vy += hitPos * 3;
    }

    // Limiter la vitesse verticale
    ball.vy = Math.max(-10, Math.min(10, ball.vy));
  }

  /**
   * Vérifie si un point a été marqué
   */
  private checkGoals(state: GameState) {
    const { ball, scores } = state;

    // But à gauche (point pour le joueur de droite)
    if (ball.x - ball.radius <= 0) {
      scores.right++;
      state.ball = this.resetBall();
    }

    // But à droite (point pour le joueur de gauche)
    if (ball.x + ball.radius >= this.config.canvasWidth) {
      scores.left++;
      state.ball = this.resetBall();
    }
  }

  /**
   * Vérifie si la partie est terminée
   */
  private checkGameOver(state: GameState) {
    if (state.scores.left >= this.config.maxScore) {
      state.status = 'finished';
      state.winner = 'left';
    } else if (state.scores.right >= this.config.maxScore) {
      state.status = 'finished';
      state.winner = 'right';
    }
  }

  getConfig(): GameConfig {
    return this.config;
  }
}
