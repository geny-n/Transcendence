import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
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
export interface PongSocketState {
	phase:                 PongPhase;
	queuePosition:         number;
	gameInfo:              GameFoundPayload | null;
	gameState:             PongGameState   | null;
	countdown:             number          | null;
	countdownResuming:     boolean;
	winner:                1 | 2          | null;
	opponentLeft:          boolean;
	opponentReconnecting:  { player: 1 | 2; remaining: number } | null;
	error:                 string          | null;
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
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Creates ONE socket connection per mount (or when guestName changes).
 * Pass `guestName` to connect as a guest (no auth cookie required).
 */
// Nombre d'échecs consécutifs avant d'afficher l'erreur à l'utilisateur.
// Cela laisse le temps au backend de démarrer après un `make re`.
const ERROR_THRESHOLD = 5;

export function usePongSocket(guestName?: string) {
	const socketRef    = useRef<Socket | null>(null);
	const errorCount   = useRef(0);
	const [state, setState] = useState<PongSocketState>(INITIAL_STATE);

	useEffect(() => {
		// Reset state for each new connection attempt
		setState(INITIAL_STATE);
		errorCount.current = 0;

		const guestId = guestName
			? `guest_${Math.random().toString(36).slice(2, 10)}`
			: undefined;

		const socket = io(SOCKET_URL, {
			withCredentials:      !guestName,
			transports:           ["websocket"],
			path:                 "/socket.io/",
			reconnectionDelay:    2000,   // attendre 2 s entre deux tentatives
			reconnectionDelayMax: 6000,   // plafonner à 6 s
			...(guestName ? { auth: { guestId, guestName } } : {}),
		});
		socketRef.current = socket;

		// Timeout de sécurité : si aucune connexion réussie au bout de 12 s,
		// afficher l'erreur quoi qu'il arrive (backend trop long à démarrer ou
		// Socket.io a arrêté de réessayer après un refus d'auth).
		const connectionTimeout = setTimeout(() => {
			if (!socket.connected) {
				setState(s => ({
					...s,
					error: "Connexion impossible : le serveur ne répond pas.",
				}));
			}
		}, 12_000);

		socket.on("connect", () => {
			// Réinitialiser le compteur d'erreurs à chaque connexion réussie
			errorCount.current = 0;
			clearTimeout(connectionTimeout);
			// Si on avait une partie en cours (reconnexion), signaler au serveur
			setState(s => {
				if (s.gameInfo && s.phase !== "ended") {
					socket.emit("pong:reconnect");
					return { ...s, error: null };
				}
				return { ...s, phase: "queue", error: null };
			});
		});

		socket.on("connect_error", (err: Error) => {
			errorCount.current += 1;

			// Erreurs d'authentification (le backend est UP mais l'utilisateur
			// n'est pas connecté ou son token est invalide) → afficher tout de suite.
			const isAuthError = /token|user not found|access denied/i.test(err.message);
			if (isAuthError || errorCount.current >= ERROR_THRESHOLD) {
				setState(s => ({
					...s,
					error: "Connexion impossible : vous n'êtes pas connecté(e) ou votre session a expiré.",
				}));
			}
		});

		socket.on("pong:queue_joined", ({ position }: { position: number }) => {
			setState(s => ({ ...s, queuePosition: position }));
		});

		socket.on("pong:game_found", (data: GameFoundPayload) => {
			setState(s => ({
				...s,
				phase:     "countdown",
				gameInfo:  data,
				countdown: 3,
				countdownResuming: !!data.reconnected,
				opponentReconnecting: null,
			}));
		});

		socket.on("pong:countdown", ({ count, resuming }: { count: number; resuming?: boolean }) => {
			if (count === 0) {
				setState(s => ({ ...s, phase: "playing", countdown: null, countdownResuming: false }));
			} else {
				setState(s => ({ ...s, countdown: count, countdownResuming: !!resuming }));
			}
		});

		socket.on("pong:game_state", (gameState: PongGameState) => {
			setState(s => ({ ...s, gameState }));
		});

		socket.on("pong:game_end", ({ winner }: { winner: 1 | 2 }) => {
			setState(s => ({ ...s, phase: "ended", winner }));
		});

		socket.on("pong:opponent_left", () => {
			setState(s => ({ ...s, phase: "ended", opponentLeft: true }));
		});

		socket.on("pong:opponent_reconnecting", ({ player, remaining }: { player: 1 | 2; remaining: number }) => {
			setState(s => ({ ...s, opponentReconnecting: { player, remaining } }));
		});

		return () => { clearTimeout(connectionTimeout); socket.disconnect(); };
	}, [guestName]);

	// ── Actions ──────────────────────────────────────────────────────────────
	const joinQueue = useCallback(() => {
		socketRef.current?.emit("pong:join_queue");
	}, []);

	const leaveQueue = useCallback(() => {
		socketRef.current?.emit("pong:leave_queue");
	}, []);

	const sendInput = useCallback((direction: PaddleDirection) => {
		socketRef.current?.emit("pong:input", { direction });
	}, []);

	const leaveGame = useCallback(() => {
		socketRef.current?.emit("pong:leave_game");
	}, []);

	/** Reset client state back to queue (does NOT reconnect socket) */
	const resetState = useCallback(() => {
		setState(s => ({
			...s,
			phase:                "queue",
			gameInfo:             null,
			gameState:            null,
			countdown:            null,
			countdownResuming:    false,
			winner:               null,
			opponentLeft:         false,
			opponentReconnecting: null,
		}));
	}, []);

	return { state, joinQueue, leaveQueue, sendInput, leaveGame, resetState };
}
