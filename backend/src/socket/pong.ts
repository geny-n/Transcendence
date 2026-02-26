import { Server, Socket } from "socket.io";

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
const RECONNECT_TIMEOUT_GUEST = 15; // secondes
const RECONNECT_TIMEOUT_AUTH  = 30; // secondes

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
	timer:       ReturnType<typeof setInterval>;
	remaining:   number; // secondes restantes
	tickInterval: ReturnType<typeof setInterval>;
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
	state:            GameState;
	interval:         ReturnType<typeof setInterval> | null;
	countdownTimer:   ReturnType<typeof setInterval> | null;
	disconnectTimers: Map<1 | 2, DisconnectTimer>; // joueur en attente de reconnexion
}

// ─── In-memory state ────────────────────────────────────────────────────────────────────
const queue:        Array<{ socketId: string; userId: string; isGuest: boolean }> = [];
const rooms         = new Map<string, Room>();
const socketToRoom  = new Map<string, string>();  // socketId  → roomId
const userToRoom    = new Map<string, string>();  // userId    → roomId (pour reconnexion)

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
	p1Id: string, p1UserId: string, p1IsGuest: boolean,
	p2Id: string, p2UserId: string, p2IsGuest: boolean
): Room {
	return {
		id:              randomId(),
		player1SocketId: p1Id,
		player2SocketId: p2Id,
		player1UserId:   p1UserId,
		player2UserId:   p2UserId,
		player1IsGuest:  p1IsGuest,
		player2IsGuest:  p2IsGuest,
		state: {
			ball:    newBall(),
			paddle1: { y: CANVAS_H / 2 - PADDLE_H / 2, dir: 0 },
			paddle2: { y: CANVAS_H / 2 - PADDLE_H / 2, dir: 0 },
			score:   { p1: 0, p2: 0 },
			status:  "countdown",
		},
		interval:         null,
		countdownTimer:   null,
		disconnectTimers: new Map(),
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

// ─── End game ─────────────────────────────────────────────────────────────────────────────
function endGame(room: Room, winner: 1 | 2, io: Server): void {
	room.state.status = "ended";
	room.state.winner = winner;
	if (room.interval) { clearInterval(room.interval); room.interval = null; }
	io.to(room.id).emit("pong:game_end", { winner, score: room.state.score });
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
		const relHit     = (s.ball.y - (s.paddle1.y + PADDLE_H / 2)) / (PADDLE_H / 2);
		const bounceAng  = relHit * (Math.PI / 3);
		const speed      = Math.min(Math.hypot(s.ball.vx, s.ball.vy) * 1.05, MAX_SPEED);
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
		const relHit     = (s.ball.y - (s.paddle2.y + PADDLE_H / 2)) / (PADDLE_H / 2);
		const bounceAng  = relHit * (Math.PI / 3);
		const speed      = Math.min(Math.hypot(s.ball.vx, s.ball.vy) * 1.05, MAX_SPEED);
		s.ball.vx = -Math.cos(bounceAng) * speed;
		s.ball.vy =  Math.sin(bounceAng) * speed;
	}

	// Ball exits left → player 2 scores
	if (s.ball.x + BALL_RADIUS < 0) {
		s.score.p2++;
		broadcastState(room, io); // Broadcast the new score immediately
		if (s.score.p2 >= WIN_SCORE) { endGame(room, 2, io); return; }
		// Reset positions and start 2-second countdown
		Object.assign(s.ball, newBall(2));
		s.paddle1.y = s.paddle2.y = CANVAS_H / 2 - PADDLE_H / 2;
		startScoreCountdown(room, io);
		return;
	}

	// Ball exits right → player 1 scores
	if (s.ball.x - BALL_RADIUS > CANVAS_W) {
		s.score.p1++;
		broadcastState(room, io); // Broadcast the new score immediately
		if (s.score.p1 >= WIN_SCORE) { endGame(room, 1, io); return; }
		// Reset positions and start 2-second countdown
		Object.assign(s.ball, newBall(1));
		s.paddle1.y = s.paddle2.y = CANVAS_H / 2 - PADDLE_H / 2;
		startScoreCountdown(room, io);
		return;
	}

	broadcastState(room, io);
}

// ─── Countdown then start ────────────────────────────────────────────────────────────────────────────
function startCountdown(room: Room, io: Server, resuming = false): void {
	// Pause la physique pendant le countdown
	if (room.interval) { clearInterval(room.interval); room.interval = null; }

	room.state.status = "countdown";
	let count = 3;
	io.to(room.id).emit("pong:countdown", { count, resuming });

	room.countdownTimer = setInterval(() => {
		count--;
		if (count > 0) {
			io.to(room.id).emit("pong:countdown", { count, resuming });
		} else {
			clearInterval(room.countdownTimer!);
			room.countdownTimer = null;
			room.state.status = "playing";
			io.to(room.id).emit("pong:countdown", { count: 0, resuming });
			room.interval = setInterval(() => tick(room, io), TICK_MS);
		}
	}, 1000);
}

// ─── Short countdown after scoring ─────────────────────────────────────────────────────────────────
function startScoreCountdown(room: Room, io: Server): void {
	// Pause la physique pendant le countdown
	if (room.interval) { clearInterval(room.interval); room.interval = null; }

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
			room.state.status = "playing";
			io.to(room.id).emit("pong:countdown", { count: 0, resuming: true });
			room.interval = setInterval(() => tick(room, io), TICK_MS);
		}
	}, 1000);
}

// ─── Disconnect timer (attente de reconnexion) ───────────────────────────────────────────
function startDisconnectTimer(
	room:        Room,
	player:      1 | 2,
	isGuest:     boolean,
	io:          Server
): void {
	// Stopper le jeu pendant l'attente
	if (room.interval) { clearInterval(room.interval); room.interval = null; }
	if (room.countdownTimer) { clearInterval(room.countdownTimer); room.countdownTimer = null; }
	room.state.status = "paused";

	const seconds = isGuest ? RECONNECT_TIMEOUT_GUEST : RECONNECT_TIMEOUT_AUTH;
	let remaining = seconds;

	// Émettre immédiatement le premier tick
	io.to(room.id).emit("pong:opponent_reconnecting", { player, remaining });

	const tickInterval = setInterval(() => {
		remaining--;
		io.to(room.id).emit("pong:opponent_reconnecting", { player, remaining });
	}, 1000);

	const timer = setTimeout(() => {
		clearInterval(tickInterval);
		room.disconnectTimers.delete(player);
		// Timeout → le joueur absent perd
		const winner: 1 | 2 = player === 1 ? 2 : 1;
		cleanupUserToRoom(room);
		endGame(room, winner, io);
	}, seconds * 1000);

	room.disconnectTimers.set(player, { timer, remaining, tickInterval });
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
	userToRoom.delete(room.player1UserId);
	userToRoom.delete(room.player2UserId);
}

function cleanupRoom(room: Room): void {
	if (room.interval)       { clearInterval(room.interval);       room.interval       = null; }
	if (room.countdownTimer) { clearInterval(room.countdownTimer); room.countdownTimer = null; }
	room.disconnectTimers.forEach(dt => {
		clearTimeout(dt.timer);
		clearInterval(dt.tickInterval);
	});
	room.disconnectTimers.clear();
	socketToRoom.delete(room.player1SocketId);
	socketToRoom.delete(room.player2SocketId);
	cleanupUserToRoom(room);
	rooms.delete(room.id);
}

// Quitter EXPLICITEMENT → fin immédiate, pas de timer
function handlePlayerLeave(socket: Socket, io: Server): void {
	const roomId = socketToRoom.get(socket.id);
	if (!roomId) return;
	const room = rooms.get(roomId);
	if (!room) return;

	if (room.state.status !== "ended") {
		// Annuler tout timer de reconnexion en cours
		cancelDisconnectTimer(room, 1);
		cancelDisconnectTimer(room, 2);
		const loser: 1 | 2  = socket.id === room.player1SocketId ? 1 : 2;
		const winner: 1 | 2 = loser === 1 ? 2 : 1;
		endGame(room, winner, io);
	}
	cleanupRoom(room);
}

// Déconnexion réseau → timer d'attente
function handlePlayerDisconnect(socket: Socket, io: Server): void {
	const roomId = socketToRoom.get(socket.id);
	if (!roomId) return;
	const room = rooms.get(roomId);
	if (!room) return;
	// Ne pas lancer de timer si la partie est déjà terminée
	if (room.state.status === "ended") { cleanupRoom(room); return; }

	const player: 1 | 2    = socket.id === room.player1SocketId ? 1 : 2;
	const isGuest: boolean = player === 1 ? room.player1IsGuest : room.player2IsGuest;

	// Retirer le socket parti de la room sans supprimer le mapping userId
	socketToRoom.delete(socket.id);

	startDisconnectTimer(room, player, isGuest, io);
}

// ─── Public export ───────────────────────────────────────────────────────────────────────────────
export function initPong(io: Server, socket: Socket): void {
	const userId  = socket.user?.id ?? socket.id;
	const isGuest = socket.isGuest ?? false;

	// ── Reconnexion en cours de partie ───────────────────────────────────────────
	socket.on("pong:reconnect", () => {
		const roomId = userToRoom.get(userId);
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room || room.state.status === "ended") return;

		const player: 1 | 2 =
			room.player1UserId === userId ? 1 : 2;

		// Annuler le timer de déconnexion
		cancelDisconnectTimer(room, player);

		// Mettre à jour le socketId du joueur reconnecté
		if (player === 1) {
			socketToRoom.delete(room.player1SocketId);
			room.player1SocketId = socket.id;
		} else {
			socketToRoom.delete(room.player2SocketId);
			room.player2SocketId = socket.id;
		}
		socketToRoom.set(socket.id, roomId);
		socket.join(roomId);

		// Informer le joueur reconnecté de sa room + numéro
		socket.emit("pong:game_found", {
			roomId,
			playerNumber: player,
			reconnected:  true,
		});

		// Reprendre avec un countdown
		startCountdown(room, io, true);
	});

	// ── Join queue ─────────────────────────────────────────────────────────────────────
	socket.on("pong:join_queue", () => {
		if (queue.some(q => q.socketId === socket.id)) return;
		if (socketToRoom.has(socket.id)) return;

		queue.push({ socketId: socket.id, userId, isGuest });
		socket.emit("pong:queue_joined", { position: queue.length });

		// Matcher deux joueurs
		if (queue.length >= 2) {
			const p1 = queue[0];
			const p2 = queue[1];
			queue.splice(0, 2);
			if (!p1 || !p2) return;

			const room = createRoom(
				p1.socketId, p1.userId, p1.isGuest,
				p2.socketId, p2.userId, p2.isGuest
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

			s1?.emit("pong:game_found", { roomId: room.id, playerNumber: 1 });
			s2?.emit("pong:game_found", { roomId: room.id, playerNumber: 2 });
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
	socket.on("pong:leave_game", () => handlePlayerLeave(socket, io));

	// ── Disconnect réseau ──────────────────────────────────────────────────────────────────
	socket.on("disconnect", () => {
		// Retirer de la file d'attente si présent
		const idx = queue.findIndex(q => q.socketId === socket.id);
		if (idx !== -1) queue.splice(idx, 1);
		// Lancer le timer de reconnexion si en partie
		handlePlayerDisconnect(socket, io);
	});
}

