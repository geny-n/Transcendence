import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../main";
import type {
	GameFoundPayload,
	PaddleDirection,
	PongGameState,
	PongPhase,
} from "./pongTypes";

// Connects through Nginx which proxies /socket.io/ → backend:3100
// window.location.origin = protocole + hôte + port du serveur qui a servi la page
// → fonctionne que ce soit localhost, une IP locale, ou un domaine distant.
const SOCKET_URL = window.location.origin;

// ─── State shape ─────────────────────────────────────────────────────────────
export type RematchStatus = 'idle' | 'pending' | 'incoming' | 'declined';

export interface PongSocketState {
	phase:                 PongPhase;
	queuePosition:         number;
	gameInfo:              GameFoundPayload | null;
	gameState:             PongGameState   | null;
	countdown:             number          | null;
	countdownResuming:     boolean;
	winner:                1 | 2          | null;
	opponentLeft:          boolean;
	opponentReconnecting:  { player: 1 | 2; remaining: number; canQuitAfter: number } | null;
	error:                 string          | null;
	// Timer de partie
	timerRemaining:        number | null;
	overtimeMessage:       string | null;
	// Revanche
	rematchStatus:         RematchStatus;
	rematchFromLabel:      string | null;
	// Cleanup tracking - button disabled until backend cleanup complete
	isCleaningUp:          boolean;
}

const INITIAL_STATE: PongSocketState = {
	phase:                "connecting",
	queuePosition:        0,
	gameInfo:             null,
	gameState:            null,
	countdown:            null,
	countdownResuming:    false,
	winner:               null,
	opponentLeft:         false,
	opponentReconnecting: null,
	error:                null,
	timerRemaining:       null,
	overtimeMessage:      null,
	rematchStatus:        'idle',
	rematchFromLabel:     null,
	isCleaningUp:         false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Creates ONE socket connection per mount (or when guestName changes).
 * Pass `guestName` to connect as a guest (no auth cookie required).
 * Pass `accessToken` for authenticated users to include in Socket.io handshake.
 */
// Nombre d'échecs consécutifs avant d'afficher l'erreur à l'utilisateur.
// Cela laisse le temps au backend de démarrer après un `make re`.
const ERROR_THRESHOLD = 5;

/**
 * Generate or retrieve persistent guestId for a guest session.
 * Guests must use the SAME guestId for reconnections to be recognized.
 */
function getOrCreateGuestId(guestName: string | undefined): string | undefined {
	if (!guestName) return undefined;
	
	// Try to get from sessionStorage (per browser session)
	let guestId = sessionStorage.getItem('pong_guest_id');
	if (guestId) {
		console.log(`[usePongSocket] Reusing existing guestId: ${guestId}`);
		return guestId;
	}
	
	// Create new guestId and store it
	guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
	sessionStorage.setItem('pong_guest_id', guestId);
	console.log(`[usePongSocket] Created new guestId: ${guestId}`);
	return guestId;
}

export function usePongSocket(guestName?: string, accessToken?: string | null) {
	const socketRef    = useRef<Socket | null>(null);
	const errorCount   = useRef(0);
	const lastLeaveGameTime = useRef<number>(0);  // Track when leaveGame was called
	const socketCreatedTime = useRef<number>(0);  // Track when socket was created
	const [state, setState] = useState<PongSocketState>(INITIAL_STATE);

	useEffect(() => {
		// Reset state for each new connection attempt
		setState(INITIAL_STATE);
		errorCount.current = 0;

		const connectSocket = () => {
			// Get persistent guestId for guest sessions
			const guestId = getOrCreateGuestId(guestName);

			console.log(`[usePongSocket] Connecting with: guestName=${guestName}, guestId=${guestId}, hasToken=${!!accessToken}`);

			// Construire les options d'authentification Socket.io
			let socketAuth: any = {};
			if (guestName && guestId) {
				socketAuth = { guestId, guestName };
			} else if (accessToken) {
				socketAuth = { token: accessToken };
				console.log("[usePongSocket] Using accessToken for Socket.io authentication");
			}

			const socket = io(SOCKET_URL, {
				withCredentials:      !guestName,
				transports:           ["websocket"],
				path:                 "/socket.io/",
				reconnectionDelay:    2000,
				reconnectionDelayMax: 6000,
				auth: socketAuth,
			});
			socketRef.current = socket;
			socketCreatedTime.current = Date.now();  // Track when socket was created
			console.log("[usePongSocket] Socket created - will wait 1s before allowing queue join to ensure old socket cleanup");

			// Timeout de sécurité : si aucune connexion réussie au bout de 12 s,
			// afficher l'erreur quoi qu'il arrive (backend trop long à démarrer ou
			// Socket.io a arrêté de réessayer après un refus d'auth).
			const connectionTimeout = setTimeout(() => {
				if (!socket.connected) {
					setState((s: PongSocketState) => ({
						...s,
						error: "Connexion impossible : le serveur ne répond pas.",
					}));
				}
			}, 12_000);

			socket.on("connect", () => {
				// Réinitialiser le compteur d'erreurs à chaque connexion réussie
				console.log("[usePongSocket] Connected to socket server");
				errorCount.current = 0;
				clearTimeout(connectionTimeout);
				// Si on avait une partie en cours (reconnexion), signaler au serveur
				setState((s: PongSocketState) => {
					if (s.gameInfo && s.phase !== "ended") {
						console.log("[usePongSocket] Reconnecting to ongoing game...");
						socket.emit("pong:reconnect");
						return { ...s, error: null };
					}
					// CRITICAL: Only reset to queue if we were NOT already in a queue/game state
					// This prevents re-joining queue on every reconnect
					if (s.phase === "connecting") {
						return { ...s, phase: "queue", error: null };
					}
					return { ...s, error: null };
				});
			});

			socket.on("connect_error", (err: Error) => {
				console.log("[usePongSocket] connect_error:", err.message);
				errorCount.current += 1;

				// Erreurs d'authentification (le backend est UP mais l'utilisateur
				// n'est pas connecté ou son token est invalide) → afficher tout de suite.
				const isAuthError = /token|user not found|access denied/i.test(err.message);
				if (isAuthError || errorCount.current >= ERROR_THRESHOLD) {
					setState((s: PongSocketState) => ({
						...s,
						error: "Connexion impossible : vous n'êtes pas connecté(e) ou votre session a expiré.",
					}));
				}
			});

			// ── Auto-reconnect to unfinished game on login ────────────────────────
			socket.on("pong:unfinished_game", ({ hasUnfinishedGame }: { hasUnfinishedGame: boolean }) => {
				if (hasUnfinishedGame) {
					console.log("[usePongSocket] Detected unfinished game, auto-reconnecting...");
					socket.emit("pong:reconnect");
				}
			});

			socket.on("pong:queue_joined", ({ position }: { position: number }) => {
				setState((s: PongSocketState) => ({ ...s, queuePosition: position, error: null }));
			});

			socket.on("pong:queue_error", ({ message }: { message: string }) => {
				console.log("[usePongSocket] queue_error:", message);
				setState((s: PongSocketState) => ({
					...s,
					queuePosition: 0,
					error: message,
				}));
			});

			socket.on("pong:game_found", (data: GameFoundPayload) => {
				setState((s: PongSocketState) => ({
					...s,
					phase:            "countdown",
					gameInfo:         data,
					countdown:        3,
					countdownResuming: !!data.reconnected,
					opponentReconnecting: null,
					// Réinitialiser les états de fin de partie / revanche
					winner:           null,
					opponentLeft:     false,
					timerRemaining:   null,
					overtimeMessage:  null,
					rematchStatus:    'idle',
					rematchFromLabel: null,
				}));
			});

			socket.on("pong:countdown", ({ count, resuming }: { count: number; resuming?: boolean }) => {
				if (count === 0) {
					setState((s: PongSocketState) => ({ 
						...s, 
						phase: "playing", 
						countdown: null, 
						countdownResuming: false,
						opponentReconnecting: null  // Clear waiting message when opponent reconnects
					}));
				} else {
					setState((s: PongSocketState) => ({ 
						...s, 
						countdown: count, 
						countdownResuming: !!resuming,
						opponentReconnecting: null  // Clear waiting message when countdown starts
					}));
				}
			});

			socket.on("pong:game_state", (gameState: PongGameState) => {
				setState((s: PongSocketState) => ({ ...s, gameState }));
			});

			socket.on("pong:game_end", ({ winner }: { winner: 1 | 2 }) => {
				setState((s: PongSocketState) => ({ ...s, phase: "ended", winner }));
			});

			socket.on("pong:opponent_left", () => {
				setState((s: PongSocketState) => ({ ...s, phase: "ended", opponentLeft: true }));
			});

			socket.on("pong:opponent_reconnecting", ({ player, remaining, canQuitAfter }: { player: 1 | 2; remaining: number; canQuitAfter: number }) => {
				setState((s: PongSocketState) => ({ ...s, opponentReconnecting: { player, remaining, canQuitAfter } }));
			});

			// Timer de partie (tick chaque seconde envoyé par le serveur)
			socket.on("pong:timer_tick", ({ remaining }: { remaining: number }) => {
				setState((s: PongSocketState) => ({ ...s, timerRemaining: remaining }));
			});

			// Message d'overtime (pause 3s avant reprise)
			socket.on("pong:overtime", ({ message }: { message: string }) => {
				setState((s: PongSocketState) => ({ ...s, overtimeMessage: message }));
				// Effacer le message après 3s (durée de la pause overtime)
				setTimeout(() => setState((s: PongSocketState) => ({ ...s, overtimeMessage: null })), 3000);
			});

			// ── Revanche ─────────────────────────────────────────────────────────
			// Demande envoyée avec succès → passer en état "pending"
			socket.on("pong:rematch_sent", () => {
				setState((s: PongSocketState) => ({ ...s, rematchStatus: 'pending' }));
			});

			// L'adversaire veut une revanche → afficher la notification
			socket.on("pong:rematch_incoming", ({ fromLabel }: { fromLabel: string }) => {
				setState((s: PongSocketState) => ({ ...s, rematchStatus: 'incoming', rematchFromLabel: fromLabel }));
			});

			// L'adversaire a refusé → afficher brièvement "Revanche refusée" puis reset
			socket.on("pong:rematch_declined", () => {
				setState((s: PongSocketState) => ({ ...s, rematchStatus: 'declined' }));
				setTimeout(() => setState((s: PongSocketState) => ({ ...s, rematchStatus: 'idle' })), 3000);
			});

			// La demande a été annulée par l'adversaire (il a quitté, etc.)
			socket.on("pong:rematch_cancelled", () => {
				setState((s: PongSocketState) => ({ ...s, rematchStatus: 'idle', rematchFromLabel: null }));
			});

			// L'adversaire n'est plus disponible (déconnecté)
			socket.on("pong:rematch_unavailable", () => {
				setState((s: PongSocketState) => ({ ...s, rematchStatus: 'idle', rematchFromLabel: null }));
			});

			// Backend cleanup complete - button can be re-enabled
			socket.on("pong:cleanup_complete", () => {
				console.log("[usePongSocket] ✅ RECEIVED cleanup_complete signal - disabling isCleaningUp flag");
				setState((s: PongSocketState) => {
					console.log("[usePongSocket] State updated: isCleaningUp = false");
					return { ...s, isCleaningUp: false };
				});
			});
			
			// Safety: If socket disconnects while still cleaning up, disable the flag anyway
			socket.on("disconnect", () => {
				console.log("[usePongSocket] Socket disconnected");
				setState((s: PongSocketState) => {
					if (s.isCleaningUp) {
						console.log("[usePongSocket] Socket disconnected while cleaning up - forcing isCleaningUp=false");
						return { ...s, isCleaningUp: false };
					}
					return s;
				});
			});

			return () => { clearTimeout(connectionTimeout); socket.disconnect(); };
		};

		connectSocket();
	}, [guestName, accessToken]);

	// ── Token refresh interval (keep authenticated users logged in during long matches) ────
	const { setAccessToken } = useAuth();
	
	useEffect(() => {
		// Only for authenticated users (not guests)
		if (guestName || !accessToken) return;

		// Refresh token every 10 minutes (600 seconds)
		const refreshInterval = setInterval(async () => {
			try {
				const response = await fetch('/api/refresh', {
					method: 'GET',
					credentials: 'include',
				});
				if (response.ok) {
					const data = await response.json();
					if (data.accessToken) {
						setAccessToken(data.accessToken);
						// Send new token to socket.io without reconnecting
						if (socketRef.current?.connected) {
							socketRef.current.emit("pong:update_token", { token: data.accessToken });
							console.log("[usePongSocket] Token refreshed and sent to socket");
						} else {
							console.log("[usePongSocket] Socket not connected, token will be used on next reconnect");
						}
					}
				} else {
					console.error("[usePongSocket] Token refresh failed:", response.status);
				}
			} catch (err) {
				console.error("[usePongSocket] Token refresh error:", err);
			}
		}, 10 * 60 * 1000); // 10 minutes

		return () => clearInterval(refreshInterval);
	}, [guestName, accessToken, setAccessToken]);

	// ── Actions ──────────────────────────────────────────────────────────────
	const joinQueue = useCallback(() => {
		// CRITICAL: Don't allow joining while backend cleanup is in progress
		// Also don't join if socket was just created (prevents phantom queue from new socket joining before old disconnects)
		const timeSinceSocketCreated = Date.now() - socketCreatedTime.current;
		const MIN_TIME_AFTER_SOCKET_CREATE = 1000;  // Wait 1s after socket creation before joining queue
		
		if (timeSinceSocketCreated < MIN_TIME_AFTER_SOCKET_CREATE) {
			const waitTime = MIN_TIME_AFTER_SOCKET_CREATE - timeSinceSocketCreated;
			console.log(`[usePongSocket] joinQueue DELAYED: Wait ${waitTime}ms after socket creation (cleanup safety)`);
			setTimeout(() => {
				console.log("[usePongSocket] joinQueue delayed call - emitting now");
				socketRef.current?.emit("pong:join_queue");
			}, waitTime);
			return;
		}
		
		if (socketRef.current) {
			console.log("[usePongSocket] joinQueue emitted");
			socketRef.current.emit("pong:join_queue");
		}
	}, []);

	const leaveQueue = useCallback(() => {
		socketRef.current?.emit("pong:leave_queue");
	}, []);

	const sendInput = useCallback((direction: PaddleDirection) => {
		socketRef.current?.emit("pong:input", { direction });
	}, []);

	const leaveGame = useCallback(() => {
		console.log("[usePongSocket] leaveGame called - emitting pong:leave_game");
		lastLeaveGameTime.current = Date.now();  // Record when we left
		socketRef.current?.emit("pong:leave_game");
		
		// CRITICAL: Set isCleaningUp=true to disable Play button until backend confirms cleanup complete
		// Backend will emit pong:cleanup_complete when all game cleanup is done
		setState((s: PongSocketState) => {
			console.log("[usePongSocket] Leaving game - button disabled until cleanup completes...");
			return {
				...s,
				isCleaningUp:         true,  // 🔒 Disable Play button
				phase:                "connecting",
				queuePosition:        0,
				gameInfo:             null,
				gameState:            null,
				countdown:            null,
				countdownResuming:    false,
				winner:               null,
				opponentLeft:         false,
				opponentReconnecting: null,
				timerRemaining:       null,
				overtimeMessage:      null,
				rematchStatus:        'idle',
				rematchFromLabel:     null,
				error:                null,
			};
		});
	}, []);

	/** Reset client state back to queue (does NOT reconnect socket) */
	const resetState = useCallback(() => {
		setState((s: PongSocketState) => ({
			...s,
			phase:                "queue",
			gameInfo:             null,
			gameState:            null,
			countdown:            null,
			countdownResuming:    false,
			winner:               null,
			opponentLeft:         false,
			opponentReconnecting: null,
			timerRemaining:       null,
			overtimeMessage:      null,
			rematchStatus:        'idle',
			rematchFromLabel:     null,
		}));
	}, []);

	const requestRematch = useCallback(() => {
		setState((s: PongSocketState) => ({ ...s, rematchStatus: 'pending' }));
		socketRef.current?.emit("pong:rematch_request");
	}, []);

	const respondRematch = useCallback((accept: boolean) => {
		socketRef.current?.emit("pong:rematch_response", { accept });
		if (!accept) setState((s: PongSocketState) => ({ ...s, rematchStatus: 'idle', rematchFromLabel: null }));
	}, []);

	const quitWaiting = useCallback(() => {
		if (!socketRef.current?.connected) {
			console.warn("[usePongSocket] Socket not connected, cannot quit waiting");
			return;
		}
		console.log("[usePongSocket] Sending pong:quit_waiting");
		socketRef.current.emit("pong:quit_waiting");
	}, []);

	return { state, joinQueue, leaveQueue, sendInput, leaveGame, resetState, requestRematch, respondRematch, quitWaiting, socketCreatedTime };
}
