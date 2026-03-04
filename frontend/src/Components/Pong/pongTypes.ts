// ─── Shared Pong Types ────────────────────────────────────────────────────────

export interface PongBall {
	x:      number;
	y:      number;
	vx:     number;
	vy:     number;
	radius: number;
}

export interface PongPaddle {
	y:      number;
	width:  number;
	height: number;
}

export interface PongScore {
	p1: number;
	p2: number;
}

export type PongStatus = "countdown" | "playing" | "ended";

/** Full game state sent by the server on every tick */
export interface PongGameState {
	ball:    PongBall;
	paddle1: PongPaddle;
	paddle2: PongPaddle;
	score:   PongScore;
	status:  PongStatus;
	canvasW: number;
	canvasH: number;
	p1x:     number; // left paddle X position
	p2x:     number; // right paddle X position
}

export type PaddleDirection = "up" | "down" | "stop";

/** Sent by the server when a match is found (or when reconnecting / rematch) */
export interface GameFoundPayload {
	roomId:        string;
	playerNumber:  1 | 2;
	reconnected?:  boolean;
	rematch?:      boolean;
}

/** Phase of the matchmaking / game flow */
export type PongPhase =
	| "connecting"   // socket not yet connected
	| "queue"        // waiting in matchmaking queue
	| "countdown"    // game found, countdown before start
	| "playing"      // game in progress
	| "ended";       // game over
