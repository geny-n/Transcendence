import { Server, Socket } from "socket.io";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../utils/helpers.js";
import { calculateLevel, getXPGain, MAX_LEVEL } from "../utils/xpSystem.js";

// ─── Game Constants ───────────────────────────────────────────────────────────
const CANVAS_W             = 800;
const CANVAS_H             = 600;
const PADDLE_W             = 15;
const PADDLE_H             = 100;
const BALL_RADIUS          = 10;
const INITIAL_SPEED        = 5;
const MAX_SPEED            = 20;
const PADDLE_SPEED         = 7;
const WIN_SCORE            = 5;
const TICK_MS              = Math.floor(1000 / 60); // ~60 fps
const RECONNECT_TIMEOUT_AUTH  = 60; // secondes pour attendre reconnexion
const QUIT_AVAILABLE_AFTER_MS = 30 * 1000; // 30 secondes avant qu'on peut quitter
const RECONNECT_COUNTDOWN     = 5; // secondes de countdown après reconnexion

// ─── Timer Constants ──────────────────────────────────────────────────────────
const GAME_DURATION_MS  = 5 * 60 * 1000;   // 5 min
const OVERTIME_PAUSE_MS = 3 * 1000;         // 3s pause avant overtime
const OVERTIME_MS       = 2 * 60 * 1000;   // +2 min en overtime

// Paddle X positions (fixed)
const P1X = 30;
const P2X = CANVAS_W - 30 - PADDLE_W;

// ─── Types ─────────────────────────────────────────────────────────────────────────────
interface Ball   { x: number; y: number; vx: number; vy: number }
interface Paddle { y: number; dir: number } // dir: -1 | 0 | 1

interface GameState {
	ball:    Ball;
	paddle1: Paddle;
	paddle2: Paddle;
	score:   { p1: number; p2: number };
	status:  "countdown" | "playing" | "paused" | "ended";
	winner?: 1 | 2;
}

interface DisconnectTimer {
	timer:        ReturnType<typeof setTimeout>;
	remaining:    number; // secondes restantes
	tickInterval: ReturnType<typeof setInterval>;
	startedAt:    number; // timestamp when disconnect started
}

interface Room {
	id:               string;
	player1SocketId:  string;
	player2SocketId:  string;
	// userId stables pour la reconnexion (socket.id change à chaque reconnexion)
	player1UserId:    string;
	player2UserId:    string;
	player1IsGuest:   boolean;
	player2IsGuest:   boolean;
	player1Label:     string; // pseudo affiché (username ou "InviteXXX")
	player2Label:     string;
	state:            GameState;
	interval:         ReturnType<typeof setInterval> | null;
	countdownTimer:   ReturnType<typeof setInterval> | null;
	disconnectTimers: Map<1 | 2, DisconnectTimer>;
	endgameCalled:    boolean; // Guard to prevent multiple endGame calls
	firstPlayerDisconnected: 1 | 2 | undefined; // qui s'est déconnecté en premier (tracker pour la forfeit)

	// ── Timer de partie ───────────────────────────────────────────────────────
	startedAt:         Date | null;          // timestamp de début de la vraie partie
	gameTimerMs:       number;               // millisecondes restantes quand le timer a été pausé
	gameTimerStartMs:  number | null;        // Date.now() quand startGameTimer a été appelé
	gameTimer:         ReturnType<typeof setTimeout>  | null;
	timerTickInterval: ReturnType<typeof setInterval> | null;
	isOvertime:        boolean;
}

// ─── In-memory state ────────────────────────────────────────────────────────────────────
const queue:       Array<{ socketId: string; userId: string; isGuest: boolean; label: string }> = [];
const rooms        = new Map<string, Room>();
const socketToRoom = new Map<string, string>();  // socketId  → roomId
const userToRoom   = new Map<string, string>();  // userId    → roomId (pour reconnexion)

// ─── Rematch state ───────────────────────────────────────────────────────────────────────
interface LastOpponentInfo {
	opponentUserId:   string;
	opponentSocketId: string;
	opponentLabel:    string;
	opponentIsGuest:  boolean;
}
interface PendingRematch {
	toUserId:    string;
	toSocketId:  string;
	fromSocketId: string;
	fromIsGuest: boolean;
	fromLabel:   string;
	sentAt:      number;
}
// Dernier adversaire par userId (remis à jour à chaque fin de partie)
const lastOpponent      = new Map<string, LastOpponentInfo>();
// Demandes de revanche en attente : fromUserId → info
const pendingRematch    = new Map<string, PendingRematch>();
// Cooldown serveur : dernière demande envoyée par userId (timestamp)
const rematchLastSentAt = new Map<string, number>();
const REMATCH_COOLDOWN_MS = 20_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────────────────
function randomId(): string {
	return Math.random().toString(36).slice(2, 10);
}

function newBall(towardPlayer: 1 | 2 | null = null): Ball {
	const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
	let dir = Math.random() < 0.5 ? 1 : -1;
	if (towardPlayer === 1) dir =  1;
	if (towardPlayer === 2) dir = -1;
	return {
		x:  CANVAS_W / 2,
		y:  CANVAS_H / 2,
		vx: Math.cos(angle) * INITIAL_SPEED * dir,
		vy: Math.sin(angle) * INITIAL_SPEED,
	};
}

function createRoom(
	p1Id: string, p1UserId: string, p1IsGuest: boolean, p1Label: string,
	p2Id: string, p2UserId: string, p2IsGuest: boolean, p2Label: string
): Room {
	return {
		id:              randomId(),
		player1SocketId: p1Id,
		player2SocketId: p2Id,
		player1UserId:   p1UserId,
		player2UserId:   p2UserId,
		player1IsGuest:  p1IsGuest,
		player2IsGuest:  p2IsGuest,
		player1Label:    p1Label,
		player2Label:    p2Label,
		state: {
			ball:    newBall(),
			paddle1: { y: CANVAS_H / 2 - PADDLE_H / 2, dir: 0 },
			paddle2: { y: CANVAS_H / 2 - PADDLE_H / 2, dir: 0 },
			score:   { p1: 0, p2: 0 },
			status:  "countdown",
		},
		interval:          null,
		countdownTimer:    null,
		disconnectTimers:  new Map(),
		endgameCalled:     false,
		firstPlayerDisconnected: undefined,
		startedAt:         null,
		gameTimerMs:       GAME_DURATION_MS,
		gameTimerStartMs:  null,
		gameTimer:         null,
		timerTickInterval: null,
		isOvertime:        false,
	};
}

// ─── Broadcast ─────────────────────────────────────────────────────────────────────────
function broadcastState(room: Room, io: Server): void {
	const s = room.state;
	io.to(room.id).emit("pong:game_state", {
		ball:    { ...s.ball, radius: BALL_RADIUS },
		paddle1: { y: s.paddle1.y, width: PADDLE_W, height: PADDLE_H },
		paddle2: { y: s.paddle2.y, width: PADDLE_W, height: PADDLE_H },
		score:   s.score,
		status:  s.status,
		canvasW: CANVAS_W,
		canvasH: CANVAS_H,
		p1x:     P1X,
		p2x:     P2X,
	});
}

// ─── Sauvegarde asynchrone en base ───────────────────────────────────────────────────────
function saveMatch(room: Room, winner: 1 | 2, io: Server): void {
	const endedAt    = new Date();
	const startedAt  = room.startedAt ?? endedAt;
	const durationSec = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

	const winnerId    = winner === 1 ? room.player1UserId : room.player2UserId;
	const loserId     = winner === 1 ? room.player2UserId : room.player1UserId;
	const winnerLabel = winner === 1 ? room.player1Label  : room.player2Label;
	const loserLabel  = winner === 1 ? room.player2Label  : room.player1Label;
	const scoreWinner = winner === 1 ? room.state.score.p1 : room.state.score.p2;
	const scoreLoser  = winner === 1 ? room.state.score.p2 : room.state.score.p1;

	// On ne stocke pas l'userId des invités (socket ids temporaires, pas en DB)
	const winnerIdDb = room[winner === 1 ? "player1IsGuest" : "player2IsGuest"] ? null : winnerId;
	const loserIdDb  = room[winner === 1 ? "player2IsGuest" : "player1IsGuest"] ? null : loserId;

	prisma.match.create({
		data: {
			endedAt,
			durationSec,
			isOvertime:  room.isOvertime,
			winnerId:    winnerIdDb,
			loserId:     loserIdDb,
			winnerLabel,
			loserLabel,
			scoreWinner,
			scoreLoser,
		},
	}).then((match: { id: string; endedAt: Date; durationSec: number; isOvertime: boolean }) => {
		const payload = {
			id:          match.id,
			endedAt:     match.endedAt,
			durationSec: match.durationSec,
			isOvertime:  match.isOvertime,
			winner:      { id: winnerIdDb, label: winnerLabel, score: scoreWinner },
			loser:       { id: loserIdDb,  label: loserLabel,  score: scoreLoser  },
		};
		// Notifier tous les joueurs connectés (socket principal)
		io.emit("pong:match_saved", payload);
		// Notifier les spectateurs du scoreboard (namespace public)
		io.of("/scoreboard").emit("pong:match_saved", payload);

		// ── Update XP and Level for authenticated players ──────────────────────
		updatePlayerXP(winnerIdDb, loserIdDb, io).catch((err: unknown) => {
			console.error("[Pong] Erreur mise à jour XP:", err);
		});
	}).catch((err: unknown) => {
		console.error("[Pong] Erreur sauvegarde match:", err);
	});
}

// ─── Update Player XP and Level ──────────────────────────────────────────────────────────
async function updatePlayerXP(winnerId: string | null, loserId: string | null, io: Server): Promise<void> {
	const updates: Promise<any>[] = [];

	// Update winner (3 XP)
	if (winnerId) {
		updates.push(
			prisma.user.findUnique({ where: { id: winnerId }, select: { experience: true } })
				.then(async (user: { experience: number } | null) => {
					if (!user) return;
					const newXP = user.experience + getXPGain(true);
					const newLevel = calculateLevel(newXP);
					return prisma.user.update({
						where: { id: winnerId },
						data: { experience: newXP, level: newLevel },
					});
				})
		);
	}

	// Update loser (1 XP)
	if (loserId) {
		updates.push(
			prisma.user.findUnique({ where: { id: loserId }, select: { experience: true } })
				.then(async (user: { experience: number } | null) => {
					if (!user) return;
					const newXP = user.experience + getXPGain(false);
					const newLevel = calculateLevel(newXP);
					return prisma.user.update({
						where: { id: loserId },
						data: { experience: newXP, level: newLevel },
					});
				})
		);
	}

	await Promise.all(updates);

	// Emit leaderboard update via /leaderboard namespace
	io.of("/leaderboard").emit("leaderboard:updated", {
		timestamp: new Date(),
		updatedPlayers: [winnerId, loserId].filter((id): id is string => id !== null),
	});
}

// ─── Timer de partie ─────────────────────────────────────────────────────────────────────

/** Lance (ou reprend) le timer de partie en décomptant depuis room.gameTimerMs */
function startGameTimer(room: Room, io: Server): void {
	// Nettoyer les anciens timers si nécessaire (sécurité)
	if (room.gameTimer)         { clearTimeout(room.gameTimer);          room.gameTimer         = null; }
	if (room.timerTickInterval) { clearInterval(room.timerTickInterval); room.timerTickInterval = null; }

	// Mémoriser quand ce segment a commencé (pour que pauseGameTimer puisse calculer l'écoulé)
	room.gameTimerStartMs = Date.now();

	// Émettre immédiatement le premier tick
	io.to(room.id).emit("pong:timer_tick", { remaining: Math.ceil(room.gameTimerMs / 1000) });

	// Ticks chaque seconde pour mettre à jour l'affichage
	room.timerTickInterval = setInterval(() => {
		const elapsed = Date.now() - room.gameTimerStartMs!;
		const remaining = Math.max(0, room.gameTimerMs - elapsed);
		io.to(room.id).emit("pong:timer_tick", { remaining: Math.ceil(remaining / 1000) });
	}, 1000);

	// Timeout réel lorsque le segment atteint zéro
	room.gameTimer = setTimeout(() => {
		if (room.timerTickInterval) { clearInterval(room.timerTickInterval); room.timerTickInterval = null; }
		room.gameTimerMs      = 0;
		room.gameTimerStartMs = null;
		io.to(room.id).emit("pong:timer_tick", { remaining: 0 });
		handleTimeUp(room, io);
	}, room.gameTimerMs);
}

/**
 * Appelé quand le timer atteint zéro.
 * - Egalité → pause 3s, message "Egalité! Overtime!", puis +2 min
 * - Sinon   → endGame avec le joueur en tête
 */
function handleTimeUp(room: Room, io: Server): void {
	// Stopper la physique
	if (room.interval) { clearInterval(room.interval); room.interval = null; }

	const { p1, p2 } = room.state.score;

	if (p1 === p2) {
		// ── Egalité → Overtime ───────────────────────────────────────────────
		room.state.status = "paused";
		io.to(room.id).emit("pong:overtime", { message: "Egalité! Overtime!" });

		setTimeout(() => {
			if (room.state.status === "ended") return; // partie finie entre-temps
			room.isOvertime  = true;
			room.gameTimerMs = OVERTIME_MS;
			// Reprendre depuis un countdown puis relancer le timer
			startCountdown(room, io, true);
		}, OVERTIME_PAUSE_MS);
	} else {
		// ── Fin par le temps ─────────────────────────────────────────────────
		const winner: 1 | 2 = p1 > p2 ? 1 : 2;
		endGame(room, winner, io);
	}
}

/**
 * Pause le timer de partie.
 * Calcule le temps écoulé depuis le dernier startGameTimer et le soustrait
 * de gameTimerMs, de sorte que le prochain startGameTimer reprenne exactement
 * là où on en était.
 */
function pauseGameTimer(room: Room): void {
	if (room.gameTimer)         { clearTimeout(room.gameTimer);          room.gameTimer         = null; }
	if (room.timerTickInterval) { clearInterval(room.timerTickInterval); room.timerTickInterval = null; }
	// Soustraire le temps déjà écoulé pendant ce segment
	if (room.gameTimerStartMs !== null) {
		const elapsed = Date.now() - room.gameTimerStartMs;
		room.gameTimerMs      = Math.max(0, room.gameTimerMs - elapsed);
		room.gameTimerStartMs = null;
	}
}

// ─── End game ─────────────────────────────────────────────────────────────────────────────
function endGame(room: Room, winner: 1 | 2, io: Server): void {
	if (room.endgameCalled) {
		console.log(`[endGame] GUARD: endGame already called for room ${room.id}, skipping`);
		return;
	}
	room.endgameCalled = true;
	console.log(`[endGame] Room ${room.id}: ${room.player1Label} vs ${room.player2Label}, winner: ${winner === 1 ? room.player1Label : room.player2Label}`);
	console.log(`[DEBUG endGame] userToRoom.size BEFORE cleanup: ${userToRoom.size}`);
	
	room.state.status = "ended";
	room.state.winner = winner;
	if (room.interval)         { clearInterval(room.interval);          room.interval          = null; }
	pauseGameTimer(room);

	// Mémoriser le dernier adversaire de chaque joueur (pour la revanche)
	lastOpponent.set(room.player1UserId, {
		opponentUserId:   room.player2UserId,
		opponentSocketId: room.player2SocketId,
		opponentLabel:    room.player2Label,
		opponentIsGuest:  room.player2IsGuest,
	});
	lastOpponent.set(room.player2UserId, {
		opponentUserId:   room.player1UserId,
		opponentSocketId: room.player1SocketId,
		opponentLabel:    room.player1Label,
		opponentIsGuest:  room.player1IsGuest,
	});

	// Sauvegarder le résultat en base (fire-and-forget, émet pong:match_saved)
	saveMatch(room, winner, io);
	io.to(room.id).emit("pong:game_end", { winner, score: room.state.score });
	// Nettoyer immédiatement pour que les joueurs puissent re-rejoindre la file
	cleanupRoom(room);
}

// ─── Game Loop ──────────────────────────────────────────────────────────────────────────────
function tick(room: Room, io: Server): void {
	const s = room.state;
	if (s.status !== "playing") return;

	// Move paddles
	const clampY = (y: number) => Math.max(0, Math.min(CANVAS_H - PADDLE_H, y));
	s.paddle1.y = clampY(s.paddle1.y + s.paddle1.dir * PADDLE_SPEED);
	s.paddle2.y = clampY(s.paddle2.y + s.paddle2.dir * PADDLE_SPEED);

	// Move ball
	s.ball.x += s.ball.vx;
	s.ball.y += s.ball.vy;

	// Top / bottom walls
	if (s.ball.y - BALL_RADIUS <= 0) {
		s.ball.y  = BALL_RADIUS;
		s.ball.vy = Math.abs(s.ball.vy);
	}
	if (s.ball.y + BALL_RADIUS >= CANVAS_H) {
		s.ball.y  = CANVAS_H - BALL_RADIUS;
		s.ball.vy = -Math.abs(s.ball.vy);
	}

	// Paddle 1 collision (left)
	if (
		s.ball.vx < 0 &&
		s.ball.x - BALL_RADIUS <= P1X + PADDLE_W &&
		s.ball.x - BALL_RADIUS >= P1X - BALL_RADIUS &&
		s.ball.y + BALL_RADIUS >= s.paddle1.y &&
		s.ball.y - BALL_RADIUS <= s.paddle1.y + PADDLE_H
	) {
		s.ball.x = P1X + PADDLE_W + BALL_RADIUS;
		const relHit    = (s.ball.y - (s.paddle1.y + PADDLE_H / 2)) / (PADDLE_H / 2);
		const bounceAng = relHit * (Math.PI / 3);
		const speed     = Math.min(Math.hypot(s.ball.vx, s.ball.vy) * 1.05, MAX_SPEED);
		s.ball.vx =  Math.cos(bounceAng) * speed;
		s.ball.vy =  Math.sin(bounceAng) * speed;
	}

	// Paddle 2 collision (right)
	if (
		s.ball.vx > 0 &&
		s.ball.x + BALL_RADIUS >= P2X &&
		s.ball.x + BALL_RADIUS <= P2X + PADDLE_W + BALL_RADIUS &&
		s.ball.y + BALL_RADIUS >= s.paddle2.y &&
		s.ball.y - BALL_RADIUS <= s.paddle2.y + PADDLE_H
	) {
		s.ball.x = P2X - BALL_RADIUS;
		const relHit    = (s.ball.y - (s.paddle2.y + PADDLE_H / 2)) / (PADDLE_H / 2);
		const bounceAng = relHit * (Math.PI / 3);
		const speed     = Math.min(Math.hypot(s.ball.vx, s.ball.vy) * 1.05, MAX_SPEED);
		s.ball.vx = -Math.cos(bounceAng) * speed;
		s.ball.vy =  Math.sin(bounceAng) * speed;
	}

	// Ball exits left → player 2 scores
	if (s.ball.x + BALL_RADIUS < 0) {
		s.score.p2++;
		broadcastState(room, io);
		if (s.score.p2 >= WIN_SCORE) { endGame(room, 2, io); return; }
		Object.assign(s.ball, newBall(2));
		s.paddle1.y = s.paddle2.y = CANVAS_H / 2 - PADDLE_H / 2;
		startScoreCountdown(room, io);
		return;
	}

	// Ball exits right → player 1 scores
	if (s.ball.x - BALL_RADIUS > CANVAS_W) {
		s.score.p1++;
		broadcastState(room, io);
		if (s.score.p1 >= WIN_SCORE) { endGame(room, 1, io); return; }
		Object.assign(s.ball, newBall(1));
		s.paddle1.y = s.paddle2.y = CANVAS_H / 2 - PADDLE_H / 2;
		startScoreCountdown(room, io);
		return;
	}

	broadcastState(room, io);
}

// ─── Countdown then start ─────────────────────────────────────────────────────────────────────────
function startCountdown(room: Room, io: Server, resuming = false, seconds = 3): void {
	if (room.interval) { clearInterval(room.interval); room.interval = null; }

	room.state.status = "countdown";
	let count = seconds;
	io.to(room.id).emit("pong:countdown", { count, resuming });

	room.countdownTimer = setInterval(() => {
		count--;
		if (count > 0) {
			io.to(room.id).emit("pong:countdown", { count, resuming });
		} else {
			clearInterval(room.countdownTimer!);
			room.countdownTimer  = null;
			room.state.status    = "playing";

			// Marquer l'heure de début de la vraie partie (seulement la 1ère fois)
			if (!room.startedAt) room.startedAt = new Date();

			io.to(room.id).emit("pong:countdown", { count: 0, resuming });
			room.interval = setInterval(() => tick(room, io), TICK_MS);

			// Lancer le timer de partie (ou le reprendre après disconnect)
			startGameTimer(room, io);
		}
	}, 1000);
}

// ─── Short countdown after scoring ───────────────────────────────────────────────────────────────
function startScoreCountdown(room: Room, io: Server): void {
	if (room.interval) { clearInterval(room.interval); room.interval = null; }

	// Mettre en pause le timer de partie pendant le mini-countdown
	pauseGameTimer(room);

	room.state.status = "countdown";
	let count = 2;
	io.to(room.id).emit("pong:countdown", { count, resuming: true });

	room.countdownTimer = setInterval(() => {
		count--;
		if (count > 0) {
			io.to(room.id).emit("pong:countdown", { count, resuming: true });
		} else {
			clearInterval(room.countdownTimer!);
			room.countdownTimer = null;
			room.state.status   = "playing";
			io.to(room.id).emit("pong:countdown", { count: 0, resuming: true });
			room.interval = setInterval(() => tick(room, io), TICK_MS);

			// Reprendre le timer de partie là où il s'était arrêté
			startGameTimer(room, io);
		}
	}, 1000);
}

// ─── Disconnect timer (attente de reconnexion) ───────────────────────────────────────────
function startDisconnectTimer(
	room:    Room,
	player:  1 | 2,
	isGuest: boolean,
	io:      Server
): void {
	// CRITICAL: Guests are not allowed to reconnect - they lose immediately
	if (isGuest) {
		const winner: 1 | 2 = player === 1 ? 2 : 1;
		console.log(`[startDisconnectTimer] Guest player ${player} disconnected, ${player === 1 ? 'player 2' : 'player 1'} wins immediately`);
		endGame(room, winner, io);
		return;
	}

	// Track the first player to disconnect (for forfeit logic)
	if (!room.firstPlayerDisconnected) {
		room.firstPlayerDisconnected = player;
		console.log(`[startDisconnectTimer] Player ${player} marked as first disconnected`);
	} else {
		// Deuxième joueur à se déconnecter → le premier qui s'est déconnecté perd
		const winner: 1 | 2 = room.firstPlayerDisconnected === 1 ? 2 : 1;
		console.log(`[startDisconnectTimer] Both players disconnected! firstPlayerDisconnected=${room.firstPlayerDisconnected}, winner=${winner}`);
		cleanupUserToRoom(room);
		endGame(room, winner, io);
		return;
	}

	if (room.interval)       { clearInterval(room.interval);       room.interval       = null; }
	if (room.countdownTimer) { clearInterval(room.countdownTimer); room.countdownTimer = null; }
	room.state.status = "paused";

	// Pauser le timer de partie pendant l'attente
	pauseGameTimer(room);

	const seconds = 60; // RECONNECT_TIMEOUT_AUTH = 60 secondes max
	let remaining = seconds;

	// Emit initial event with full details
	io.to(room.id).emit("pong:opponent_reconnecting", { 
		player, 
		remaining,
		canQuitAfter: 30 // le bouton quitter devient actif après 30s
	});

	const tickInterval = setInterval(() => {
		remaining--;
		io.to(room.id).emit("pong:opponent_reconnecting", { 
			player, 
			remaining,
			canQuitAfter: 30
		});
	}, 1000);

	const timer = setTimeout(() => {
		clearInterval(tickInterval);
		room.disconnectTimers.delete(player);
		// Le premier joueur à se déconnecter perd
		const winner: 1 | 2 = room.firstPlayerDisconnected === 1 ? 2 : 1;
		console.log(`[startDisconnectTimer] Timeout: firstPlayerDisconnected=${room.firstPlayerDisconnected}, winner=${winner}`);
		cleanupUserToRoom(room);
		endGame(room, winner, io);
	}, seconds * 1000);

	room.disconnectTimers.set(player, { timer, remaining, tickInterval, startedAt: Date.now() });
}

function cancelDisconnectTimer(room: Room, player: 1 | 2): void {
	const dt = room.disconnectTimers.get(player);
	if (!dt) return;
	clearTimeout(dt.timer);
	clearInterval(dt.tickInterval);
	room.disconnectTimers.delete(player);
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────────────────────
function cleanupUserToRoom(room: Room): void {
	console.log(`[DEBUG cleanupUserToRoom] Removing: player1UserId=${room.player1UserId}, player2UserId=${room.player2UserId}`);
	userToRoom.delete(room.player1UserId);
	userToRoom.delete(room.player2UserId);
	console.log(`[DEBUG cleanupUserToRoom] After delete: size=${userToRoom.size}`);
}

function cleanupRoom(room: Room): void {
	console.log(`[cleanupRoom] Cleaning room ${room.id}: ${room.player1Label} vs ${room.player2Label}`);
	console.log(`[cleanupRoom] Before: socketToRoom.size=${socketToRoom.size}, userToRoom.size=${userToRoom.size}, queue.length=${queue.length}`);

	if (room.interval)       { clearInterval(room.interval);       room.interval       = null; }
	if (room.countdownTimer) { clearInterval(room.countdownTimer); room.countdownTimer = null; }
	pauseGameTimer(room);
	room.disconnectTimers.forEach(dt => {
		clearTimeout(dt.timer);
		clearInterval(dt.tickInterval);
	});
	room.disconnectTimers.clear();
	socketToRoom.delete(room.player1SocketId);
	socketToRoom.delete(room.player2SocketId);
	cleanupUserToRoom(room);
	
	// Remove players from queue if they're still there (e.g., if they joined queue during countdown)
	// Use splice with reverse loop to safely remove multiple items
	const beforeLen = queue.length;
	for (let i = queue.length - 1; i >= 0; i--) {
		const entry = queue[i];
		if (entry && (entry.socketId === room.player1SocketId || entry.socketId === room.player2SocketId)) {
			console.log(`[cleanupRoom] Removing from queue: ${entry.label} (socketId: ${entry.socketId.substring(0, 6)})`);
			queue.splice(i, 1);
		}
	}
	if (queue.length < beforeLen) {
		console.log(`[cleanupRoom] Queue length before cleanup: ${beforeLen}, after: ${queue.length}`);
	}
	
	console.log(`[cleanupRoom] DELETED room ${room.id} from rooms map, rooms.size was ${rooms.size}`);
	rooms.delete(room.id);
	console.log(`[cleanupRoom] DELETED room ${room.id}, rooms.size now ${rooms.size}`);

	console.log(`[cleanupRoom] After: socketToRoom.size=${socketToRoom.size}, userToRoom.size=${userToRoom.size}, queue.length=${queue.length}`);
}

// Quitter EXPLICITEMENT → fin immédiate, pas de timer
function handlePlayerLeave(socket: Socket, io: Server): void {
	const roomId = socketToRoom.get(socket.id);
	console.log(`[handlePlayerLeave] 🚪 CALLED: socketId=${socket.id.substring(0,8)}, found in socketToRoom: ${!!roomId}`);
	if (!roomId) {
		console.log(`[handlePlayerLeave] ❌ Socket NOT in any room, nothing to do`);
		return;
	}

	const room = rooms.get(roomId);
	if (!room) {
		console.log(`[handlePlayerLeave] ❌ Room not found (roomId: ${roomId})`);
		socketToRoom.delete(socket.id);
		return;
	}

	console.log(`[handlePlayerLeave] Player leaving room ${room.id}: ${room.player1Label} vs ${room.player2Label}`);
	console.log(`[DEBUG handlePlayerLeave] Before: player1UserId=${room.player1UserId}, player2UserId=${room.player2UserId}`);

	// CRITICAL: Mark room as "ended" IMMEDIATELY FIRST
	// This ensures that even if opponent tries to join_queue during this function,
	// the room will be detected as "ended" and properly cleaned up
	// This prevents the race condition where opponent gets "Game still in progress" error
	const wasAlreadyEnded = room.state.status === "ended";
	room.state.status = "ended";
	console.log(`[handlePlayerLeave] 🚪 PLAYER LEAVING: socketId=${socket.id.substring(0,8)}, roomId=${room.id}`);
	console.log(`[handlePlayerLeave] Player1: userId=${room.player1UserId.substring(0,8)}, socketId=${room.player1SocketId.substring(0,8)}`);
	console.log(`[handlePlayerLeave] Player2: userId=${room.player2UserId.substring(0,8)}, socketId=${room.player2SocketId.substring(0,8)}`);
	console.log(`[handlePlayerLeave] Room marked as "ended" (was already ended: ${wasAlreadyEnded})`);

	// THEN remove BOTH players from maps IMMEDIATELY
	// This prevents any race condition where either player tries to rejoin before cleanup
	socketToRoom.delete(room.player1SocketId);
	socketToRoom.delete(room.player2SocketId);
	userToRoom.delete(room.player1UserId);
	userToRoom.delete(room.player2UserId);
	console.log(`[handlePlayerLeave] ✅ CLEANED: deleted both players from userToRoom and socketToRoom`);
	console.log(`[handlePlayerLeave] userToRoom after clean: size=${userToRoom.size}, p1InMap=${userToRoom.has(room.player1UserId)}, p2InMap=${userToRoom.has(room.player2UserId)}`);

	if (!wasAlreadyEnded) {
		// Game still in progress - notify opponent and end game
		cancelDisconnectTimer(room, 1);
		cancelDisconnectTimer(room, 2);
		const loser: 1 | 2  = socket.id === room.player1SocketId ? 1 : 2;
		const winner: 1 | 2 = loser === 1 ? 2 : 1;
		const opponentSocketId = loser === 1 ? room.player2SocketId : room.player1SocketId;
		
		// Notify opponent and immediately end game + cleanup
		// Do NOT use setImmediate - this causes race condition where player tries to rejoin
		// before prev room is cleaned up, resulting in "You are still in match" error.
		// Socket.io buffers the message until opponent is ready.
		io.to(opponentSocketId).emit("pong:opponent_left");
		console.log(`[handlePlayerLeave] Opponent notification sent to ${opponentSocketId.substring(0, 6)}`);
		
		// End game immediately - cleans up room maps so player can rejoin
		endGame(room, winner, io);
	} else {
		// Game already ended - just cleanup
		console.log(`[handlePlayerLeave] Game already ended, cleaning up room ${room.id}`);
		cleanupRoom(room);
	}
}

// Déconnexion réseau → timer d'attente (seulement pour utilisateurs authentifiés)
function handlePlayerDisconnect(socket: Socket, io: Server): void {
	const roomId = socketToRoom.get(socket.id);
	if (!roomId) return;
	const room = rooms.get(roomId);
	if (!room) return;
	if (room.state.status === "ended") { cleanupRoom(room); return; }

	const player: 1 | 2   = socket.id === room.player1SocketId ? 1 : 2;
	const isGuest: boolean = player === 1 ? room.player1IsGuest : room.player2IsGuest;
	const userId: string = player === 1 ? room.player1UserId : room.player2UserId;

	// CRITICAL: Remove from socketToRoom ONLY
	// Keep userToRoom so player can reconnect and find their room
	socketToRoom.delete(socket.id);
	console.log(`[handlePlayerDisconnect] Removed socket ${socket.id.substring(0,8)} from socketToRoom, but kept userToRoom entry for player ${userId.substring(0,8)}`);
	
	startDisconnectTimer(room, player, isGuest, io);
}

// ─── Public export ───────────────────────────────────────────────────────────────────────────────
export function initPong(io: Server, socket: Socket): void {
	const userId  = socket.user?.id ?? socket.id;
	const isGuest = socket.isGuest ?? false;
	const label   = socket.user?.username ?? "Invite";
	
	// Flag to prevent join_queue calls after leave_game
	let isQuitting = false;

	// ── Check for unfinished game on connection ──────────────────────────────────
	if (!isGuest && userId) {
		const roomId = userToRoom.get(userId);
		if (roomId) {
			const room = rooms.get(roomId);
			if (room && room.state.status !== "ended") {
				console.log(`[initPong] User ${label} has unfinished game in room ${roomId}, notifying client to auto-reconnect`);
				socket.emit("pong:unfinished_game", { 
					roomId,
					hasUnfinishedGame: true
				});
			}
		}
	}

	// ── Reconnexion en cours de partie ───────────────────────────────────────────
	socket.on("pong:reconnect", () => {
		const roomId = userToRoom.get(userId);
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room || room.state.status === "ended") return;

		const player: 1 | 2 = room.player1UserId === userId ? 1 : 2;

		cancelDisconnectTimer(room, player);
		// Reset disconnect tracking so if this player disconnects again, it's a fresh state
		room.firstPlayerDisconnected = undefined;

		if (player === 1) {
			socketToRoom.delete(room.player1SocketId);
			room.player1SocketId = socket.id;
		} else {
			socketToRoom.delete(room.player2SocketId);
			room.player2SocketId = socket.id;
		}
		socketToRoom.set(socket.id, roomId);
		socket.join(roomId);

		socket.emit("pong:game_found", {
			roomId,
			playerNumber: player,
			reconnected:  true,
			player1Label: room.player1Label,
			player2Label: room.player2Label,
		});

		// Reprendre avec countdown de 5 secondes → startCountdown relancera le gameTimer
		startCountdown(room, io, true, RECONNECT_COUNTDOWN);
	});

	// ── Token refresh (keep authenticated users logged in) ───────────────────────
	socket.on("pong:update_token", async (data: { token: string }) => {
		// Only process for authenticated users (not guests)
		if (isGuest) {
			console.log("[pong:update_token] Ignored for guest connection");
			return;
		}

		const { token } = data;
		if (!token) {
			console.log("[pong:update_token] No token provided");
			return;
		}

		const decoded = verifyToken(token);
		if (!decoded) {
			console.log("[pong:update_token] Invalid or expired token");
			socket.emit("pong:token_invalid");
			return;
		}

		try {
			// Verify user still exists
			const user = await prisma.user.findFirst({
				where: { id: decoded.userId }
			});

			if (!user) {
				console.log("[pong:update_token] User not found");
				socket.emit("pong:token_invalid");
				return;
			}

			// Update socket.user with latest user info
			socket.user = user;
			console.log(`[pong:update_token] Token updated for user ${user.username}`);
		} catch (error) {
			console.error("[pong:update_token] Error updating token:", error);
			socket.emit("pong:token_invalid");
		}
	});

	// ── Join queue ─────────────────────────────────────────────────────────────────────
	socket.on("pong:join_queue", () => {
		// CRITICAL: Reject if socket is in quit process
		if (isQuitting) {
			console.log(`[pong:join_queue] ❌ IGNORED: Socket is quitting (disconnect pending)`);
			return;
		}
		
		console.log(`[pong:join_queue] 📋 ENTRY: userId=${userId.substring(0,8)}, socketId=${socket.id.substring(0,8)}, label=${label}, isGuest=${isGuest}`);
		console.log(`[pong:join_queue] Initial state: socketToRoom.size=${socketToRoom.size}, userToRoom.size=${userToRoom.size}, queue.length=${queue.length}`);
		console.log(`[pong:join_queue] Socket check: socketToRoom.has(socket)=${socketToRoom.has(socket.id)}, userToRoom.has(userId)=${userToRoom.has(userId)}`);
		
		// NUCLEAR: Clean up ANY other sockets from this same user already in queue
		// This prevents duplicate queue entries when user rapidly rejoins
		console.log(`[pong:join_queue] 🧹 Removing any other sockets from user ${userId.substring(0,8)} already in queue`);
		const beforeClean = queue.length;
		for (let i = queue.length - 1; i >= 0; i--) {
			const entry = queue[i];
			if (entry && entry.userId === userId && entry.socketId !== socket.id) {
				console.log(`[pong:join_queue]    Removed stale socket from queue: ${entry.socketId.substring(0,8)}`);
				queue.splice(i, 1);
			}
		}
		if (queue.length < beforeClean) {
			console.log(`[pong:join_queue] Cleaned ${beforeClean - queue.length} stale sockets, queue.length now ${queue.length}`);
		}
		
		if (userToRoom.has(userId)) {
			const stalRoomId = userToRoom.get(userId);
			const staleRoom = rooms.get(stalRoomId!);
			console.log(`[DEBUG join_queue] userToRoom FOUND: userId=${userId}, roomId=${stalRoomId}, room exists: ${!!staleRoom}, room status: ${staleRoom?.state.status}`);
			console.log(`[DEBUG join_queue] rooms.size=${rooms.size}, All room IDs: ${Array.from(rooms.keys()).join(", ")}`);
		}

		// Already in queue - remove stale entry and re-add to reset position
		if (queue.some(q => q.socketId === socket.id)) {
			console.log(`[pong:join_queue] STALE: Already in queue, removing stale entry to reset`);
			// Remove the stale queue entry
			for (let i = queue.length - 1; i >= 0; i--) {
				const entry = queue[i];
				if (entry && entry.socketId === socket.id) {
					console.log(`[pong:join_queue] Removed stale queue entry at index ${i}`);
					queue.splice(i, 1);
				}
			}
			// Continue to re-add below instead of rejecting
		}

		// Socket is locked in a room - cannot rejoin queue yet
		if (socketToRoom.has(socket.id)) {
			// This might be a ghost connection from a previous cleanup failure
			// Log detailed info for debugging
			const roomId = socketToRoom.get(socket.id);
			const room = rooms.get(roomId!);
			console.log(`[pong:join_queue] socket in room check: roomId: ${roomId}, room exists: ${!!room}, room status: ${room?.state.status}`);
			
			// If room doesn't exist but socketToRoom entry remains, force cleanup
			if (!room) {
				console.log(`[pong:join_queue] Force cleaning zombie socketToRoom entry`);
				socketToRoom.delete(socket.id);
				userToRoom.delete(userId);
				// Try again
				queue.push({ socketId: socket.id, userId, isGuest, label });
				socket.emit("pong:queue_joined", { position: queue.length });
				console.log(`[pong:join_queue] ACCEPTED (zombie cleanup). Queue length after: ${queue.length}`);
				return;
			}
			
			// Room exists - check if it's already ended
			if (room.state.status === "ended") {
				console.log(`[pong:join_queue] Room is ended but still in map, force cleanup and rejoin`);
				cleanupRoom(room);  // Force cleanup to remove all references
				queue.push({ socketId: socket.id, userId, isGuest, label });
				socket.emit("pong:queue_joined", { position: queue.length });
				console.log(`[pong:join_queue] ACCEPTED (ended room cleanup). Queue length after: ${queue.length}`);
				return;
			}
			
			// Game still in progress - reject
			console.log(`[pong:join_queue] REJECTED: Game in progress`);
			socket.emit("pong:queue_error", { message: "Vous êtes toujours en partie. Terminez d'abord la partie active." });
			return;
		}

		// User is locked in a room - cannot rejoin queue yet
		// === CHECK 1: User already in userToRoom map ===
		if (userToRoom.has(userId)) {
			const roomId = userToRoom.get(userId);
			const room = rooms.get(roomId!);
			console.log(`[pong:join_queue] 📎 userId ${userId} found in userToRoom`);
			console.log(`[pong:join_queue]    RoomId: ${roomId}, Room exists: ${!!room}, Status: ${room?.state.status}`);
			
			// Check 1a: Room doesn't exist (stale entry)
			if (!room) {
				console.log(`[pong:join_queue] ⚠️ Stale userToRoom entry (room doesn't exist) - cleaning`);
				userToRoom.delete(userId);
				queue.push({ socketId: socket.id, userId, isGuest, label });
				socket.emit("pong:queue_joined", { position: queue.length });
				return;
			}
			
			// Check 1b: Room is ended (stale but marked)
			if (room.state.status === "ended") {
				console.log(`[pong:join_queue] ⏰ Room is ended - cleaning and rejoin`);
				userToRoom.delete(userId);
				cleanupRoom(room);
				queue.push({ socketId: socket.id, userId, isGuest, label });
				socket.emit("pong:queue_joined", { position: queue.length });
				return;
			}
			
			// Check 1c: Room still active - user still in game
			// This should NOT happen if handlePlayerLeave properly cleanedups
			// But if it does, reject - don't try to "reconnect" as that causes split-brain
			console.log(`[pong:join_queue] ❌ REJECTED: User still in active game (status=${room.state.status})`);
			socket.emit("pong:queue_error", { message: "Vous êtes toujours en partie. Attendez que la partie se termine." });
			return;
		}

		// === CHECK 2: User NOT in any room - add to queue ===
		console.log(`[pong:join_queue] ✅ User NOT in userToRoom - adding to queue...`);
		queue.push({ socketId: socket.id, userId, isGuest, label });
		socket.emit("pong:queue_joined", { position: queue.length });
		console.log(`[pong:join_queue] ✅ ACCEPTED. Queue length after: ${queue.length}`);

		if (queue.length >= 2) {
			const p1 = queue[0];
			const p2 = queue[1];
			
			// CRITICAL: Validate both players exist before using them
			if (!p1 || !p2) {
				console.log(`[pong:join_queue] ERROR: queue has ${queue.length} items but p1 or p2 is undefined`);
				return;
			}
			
			console.log(`[pong:join_queue] About to splice: queue.length=${queue.length}, removing socketIds: ${p1.socketId.substring(0,6)} and ${p2.socketId.substring(0,6)}`);
			
			// CRITICAL: Before match-making, verify both players are valid and different
			if (p1.userId === p2.userId) {
				console.log(`[pong:join_queue] ⚠️ SAME USER in queue twice! p1=${p1.socketId.substring(0,6)}, p2=${p2.socketId.substring(0,6)}`);
				console.log(`[pong:join_queue] Removing p2 (stale socket) and trying again`);
				queue.splice(1, 1);
				return;
			}
			
			queue.splice(0, 2);
			console.log(`[pong:join_queue] After splice: queue.length=${queue.length}`);

			console.log(`[pong:join_queue] MATCH FOUND: ${p1.label} vs ${p2.label}`);

			// NUCLEAR CLEANUP: Before creating room, FORCE clean any stale mappings
			// This prevents phantom room connections if a player had a previous stale room entry
			if (socketToRoom.has(p1.socketId)) {
				const staleRoom1 = rooms.get(socketToRoom.get(p1.socketId)!);
				if (staleRoom1) {
					console.log(`[pong:join_queue] WARNING: p1 had stale socketToRoom entry, cleaning stale room: ${socketToRoom.get(p1.socketId)}`);
					cleanupRoom(staleRoom1);
				}
				socketToRoom.delete(p1.socketId);
			}
			if (socketToRoom.has(p2.socketId)) {
				const staleRoom2 = rooms.get(socketToRoom.get(p2.socketId)!);
				if (staleRoom2) {
					console.log(`[pong:join_queue] WARNING: p2 had stale socketToRoom entry, cleaning stale room: ${socketToRoom.get(p2.socketId)}`);
					cleanupRoom(staleRoom2);
				}
				socketToRoom.delete(p2.socketId);
			}
			userToRoom.delete(p1.userId);
			userToRoom.delete(p2.userId);

			const room = createRoom(
				p1.socketId, p1.userId, p1.isGuest, p1.label,
				p2.socketId, p2.userId, p2.isGuest, p2.label
			);
			rooms.set(room.id, room);
			socketToRoom.set(p1.socketId, room.id);
			socketToRoom.set(p2.socketId, room.id);
			userToRoom.set(p1.userId, room.id);
			userToRoom.set(p2.userId, room.id);

			const s1 = io.sockets.sockets.get(p1.socketId);
			const s2 = io.sockets.sockets.get(p2.socketId);
			s1?.join(room.id);
			s2?.join(room.id);

			s1?.emit("pong:game_found", { roomId: room.id, playerNumber: 1, player1Label: room.player1Label, player2Label: room.player2Label });
			s2?.emit("pong:game_found", { roomId: room.id, playerNumber: 2, player1Label: room.player1Label, player2Label: room.player2Label });
			startCountdown(room, io);
		}
	});

	// ── Leave queue ─────────────────────────────────────────────────────────────────────
	socket.on("pong:leave_queue", () => {
		const idx = queue.findIndex(q => q.socketId === socket.id);
		if (idx !== -1) queue.splice(idx, 1);
	});

	// ── Paddle input ─────────────────────────────────────────────────────────────────────
	socket.on("pong:input", (data: { direction: "up" | "down" | "stop" }) => {
		const roomId = socketToRoom.get(socket.id);
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room || room.state.status !== "playing") return;

		const dir = data.direction === "up" ? -1 : data.direction === "down" ? 1 : 0;
		if (socket.id === room.player1SocketId)      room.state.paddle1.dir = dir;
		else if (socket.id === room.player2SocketId) room.state.paddle2.dir = dir;
	});

	// ── Leave game (explicite) ───────────────────────────────────────────────────────────
	socket.on("pong:leave_game", () => {
		console.log(`[pong:leave_game] 🚪 Player requesting leave_game`);
		isQuitting = true;  // Prevent further join_queue calls
		handlePlayerLeave(socket, io);
		
		// Notify frontend that cleanup is complete - button can now be re-enabled
		// CRITICAL: Must emit BEFORE disconnect and give Socket.io time to send it
		socket.emit("pong:cleanup_complete");
		console.log(`[pong:leave_game] 📤 Sent cleanup_complete signal to frontend (id: ${socket.id.substring(0,8)})`);
		
		// Wait longer to ensure:
		// 1. Socket.io fully sends the cleanup_complete message
		// 2. Frontend receives and processes it
		// 3. Socket.io on frontend has time to acknowledge
		setTimeout(() => {
			console.log(`[pong:leave_game] 🔌 Now disconnecting socket: ${socket.id.substring(0,8)}`);
			socket.disconnect(true);  // immediate=true forces disconnect NOW
		}, 500);  // 500ms to ensure complete cleanup before disconnect
	});

	// ── Quit while waiting for opponent to reconnect ────────────────────────────────────
	socket.on("pong:quit_waiting", () => {
		const roomId = socketToRoom.get(socket.id);
		if (!roomId) {
			console.log(`[pong:quit_waiting] Socket not in any room`);
			return;
		}

		const room = rooms.get(roomId);
		if (!room) {
			console.log(`[pong:quit_waiting] Room not found`);
			return;
		}

		if (room.state.status !== "paused") {
			console.log(`[pong:quit_waiting] Game is not paused, cannot quit waiting`);
			return;
		}

		// Find which player is currently waiting (still connected)
		// and which is disconnected
		const player: 1 | 2 = socket.id === room.player1SocketId ? 1 : 2;
		const disconnectedPlayer: 1 | 2 = player === 1 ? 2 : 1;

		// Verify opponent is actually disconnected
		const dt = room.disconnectTimers.get(disconnectedPlayer);
		if (!dt) {
			console.log(`[pong:quit_waiting] No disconnect timer for player ${disconnectedPlayer}`);
			return;
		}

		// Check if at least 30 seconds have passed since disconnect started
		const elapsedMs = Date.now() - dt.startedAt;
		if (elapsedMs < QUIT_AVAILABLE_AFTER_MS) {
			console.log(`[pong:quit_waiting] Only ${Math.floor(elapsedMs / 1000)}s passed, need 30s`);
			socket.emit("pong:quit_waiting_rejected", { 
				reason: "wait_more",
				secondsRemaining: Math.ceil((QUIT_AVAILABLE_AFTER_MS - elapsedMs) / 1000)
			});
			return;
		}

		console.log(`[pong:quit_waiting] Player ${player} quitting after ${Math.floor(elapsedMs / 1000)}s of waiting`);

		// Player who quit waiting loses (they didn't wait for opponent)
		// So the opponent (the one who was disconnected) wins!
		const winner: 1 | 2 = disconnectedPlayer;
		cancelDisconnectTimer(room, disconnectedPlayer);
		cleanupUserToRoom(room);
		endGame(room, winner, io);
	});

	// ── Revanche : envoi de la demande ───────────────────────────────────────────────────
	socket.on("pong:rematch_request", () => {
		const opp = lastOpponent.get(userId);
		if (!opp) { socket.emit("pong:rematch_unavailable"); return; }

		// Cooldown serveur : 20 s entre deux demandes
		const lastSent = rematchLastSentAt.get(userId) ?? 0;
		if (Date.now() - lastSent < REMATCH_COOLDOWN_MS) return;
		rematchLastSentAt.set(userId, Date.now());

		// Vérifier que l'adversaire est toujours connecté
		const oppSocket = io.sockets.sockets.get(opp.opponentSocketId);
		if (!oppSocket) { socket.emit("pong:rematch_unavailable"); return; }

		// Annuler une éventuelle demande précédente encore en attente
		const existing = pendingRematch.get(userId);
		if (existing) {
			io.sockets.sockets.get(existing.toSocketId)?.emit("pong:rematch_cancelled");
			pendingRematch.delete(userId);
		}

		pendingRematch.set(userId, {
			toUserId:    opp.opponentUserId,
			toSocketId:  opp.opponentSocketId,
			fromSocketId: socket.id,
			fromIsGuest: isGuest,
			fromLabel:   label,
			sentAt:      Date.now(),
		});

		// Informer l'adversaire
		oppSocket.emit("pong:rematch_incoming", { fromLabel: label });
		// Confirmer l'envoi au demandeur
		socket.emit("pong:rematch_sent");
	});

	// ── Revanche : réponse (accepter / refuser) ───────────────────────────────────────────
	socket.on("pong:rematch_response", ({ accept }: { accept: boolean }) => {
		// Trouver la demande qui cible cet utilisateur
		let requesterId: string | null = null;
		let pending: PendingRematch | undefined;
		for (const [fromId, p] of pendingRematch.entries()) {
			if (p.toUserId === userId) { requesterId = fromId; pending = p; break; }
		}
		if (!requesterId || !pending) return;
		pendingRematch.delete(requesterId);

		const requesterSocket = io.sockets.sockets.get(pending.fromSocketId);

		if (!accept) {
			// Refus : juste notifier le demandeur
			requesterSocket?.emit("pong:rematch_declined");
			return;
		}

		// Accepté : créer directement une nouvelle room entre les deux joueurs
		if (!requesterSocket) { socket.emit("pong:rematch_unavailable"); return; }

		// Invalider les derniers adversaires pour éviter une boucle infinie de revanches
		lastOpponent.delete(userId);
		lastOpponent.delete(requesterId);

		const room = createRoom(
			pending.fromSocketId, requesterId, pending.fromIsGuest, pending.fromLabel,
			socket.id,            userId,       isGuest,             label
		);
		rooms.set(room.id, room);
		socketToRoom.set(pending.fromSocketId, room.id);
		socketToRoom.set(socket.id, room.id);
		userToRoom.set(requesterId, room.id);
		userToRoom.set(userId, room.id);

		requesterSocket.join(room.id);
		socket.join(room.id);

		requesterSocket.emit("pong:game_found", { roomId: room.id, playerNumber: 1, rematch: true, player1Label: room.player1Label, player2Label: room.player2Label });
		socket.emit("pong:game_found",          { roomId: room.id, playerNumber: 2, rematch: true, player1Label: room.player1Label, player2Label: room.player2Label });
		startCountdown(room, io);
	});

	// ── Disconnect réseau ──────────────────────────────────────────────────────────────────
	socket.on("disconnect", () => {
		const idx = queue.findIndex(q => q.socketId === socket.id);
		if (idx !== -1) queue.splice(idx, 1);

		// Annuler toute demande de revanche envoyée par cet utilisateur
		const sent = pendingRematch.get(userId);
		if (sent) {
			io.sockets.sockets.get(sent.toSocketId)?.emit("pong:rematch_cancelled");
			pendingRematch.delete(userId);
		}
		// Annuler toute demande de revanche reçue par cet utilisateur (informer le demandeur)
		for (const [fromId, p] of pendingRematch.entries()) {
			if (p.toUserId === userId) {
				io.sockets.sockets.get(p.fromSocketId)?.emit("pong:rematch_unavailable");
				pendingRematch.delete(fromId);
				break;
			}
		}
		lastOpponent.delete(userId);

		handlePlayerDisconnect(socket, io);
	});
}
