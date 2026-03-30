import { useEffect } from "react";
import type { GameFoundPayload, PaddleDirection, PongGameState } from "./pongTypes";
import type { RematchStatus } from "./usePongSocket";
import PongCanvas    from "./PongCanvas";
import PongScoreDisplay from "./PongScore";
import PongOverlay   from "./PongOverlay";
import "./pong.css";

interface Props {
	gameState:            PongGameState   | null;
	gameInfo:             GameFoundPayload;
	countdown:            number          | null;
	countdownResuming:    boolean;
	winner:               1 | 2          | null;
	opponentLeft:         boolean;
	opponentReconnecting: { player: 1 | 2; remaining: number } | null;
	timerRemaining:       number | null;
	overtimeMessage:      string | null;
	rematchStatus:        RematchStatus;
	rematchFromLabel:     string | null;
	sendInput:            (dir: PaddleDirection) => void;
	onLeave:              () => void;
	onRematch:            () => void;
	onRematchRespond:     (accept: boolean) => void;
	isCleaningUp:         boolean;
}

/**
 * Main game view.
 * Purely presentational: receives all state as props from Matchmaking.tsx.
 * Handles keyboard (↑ ↓ / W S) and touch controls locally.
 */
export default function PongGame({
	gameState,
	gameInfo,
	countdown,
	countdownResuming,
	winner,
	opponentLeft,
	opponentReconnecting,
	timerRemaining,
	overtimeMessage,
	rematchStatus,
	rematchFromLabel,
	sendInput,
	onLeave,
	onRematch,
	onRematchRespond,
	isCleaningUp,
}: Props) {
	const { playerNumber } = gameInfo;

	// ── Keyboard controls ────────────────────────────────────────────────────
	useEffect(() => {
		if (winner !== null || opponentLeft) return; // game already ended

		const held = new Set<string>();
		let lastDir: PaddleDirection = "stop";

		const resolveDir = (): PaddleDirection => {
			if (held.has("ArrowUp")   || held.has("w") || held.has("W")) return "up";
			if (held.has("ArrowDown") || held.has("s") || held.has("S")) return "down";
			return "stop";
		};

		const onKeyDown = (e: KeyboardEvent) => {
			const tracked = ["ArrowUp", "ArrowDown", "w", "W", "s", "S"];
			if (!tracked.includes(e.key)) return;
			e.preventDefault();
			held.add(e.key);
			const dir = resolveDir();
			if (dir !== lastDir) { sendInput(dir); lastDir = dir; }
		};

		const onKeyUp = (e: KeyboardEvent) => {
			held.delete(e.key);
			const dir = resolveDir();
			if (dir !== lastDir) { sendInput(dir); lastDir = dir; }
		};

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup",   onKeyUp);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup",   onKeyUp);
			// Stop paddle when leaving
			sendInput("stop");
		};
	}, [sendInput, winner, opponentLeft]);

	const showOverlay =
		(countdown !== null && countdown > 0) ||
		winner !== null ||
		opponentLeft ||
		overtimeMessage !== null;

	return (
		<div className="pong-game-wrapper">

			{/* ── Banniere reconnexion adversaire ─────────────────────────── */}
			{opponentReconnecting && (
				<div className="pong-reconnect-banner">
					⏳ Adversaire déconnecté — attente&nbsp;
					<strong>{opponentReconnecting.remaining}s</strong>
				</div>
			)}
			{/* ── Timer de partie ──────────────────────────────────────── */}
			{timerRemaining !== null && winner === null && !opponentLeft && (
				<div className={`pong-timer-banner${
					timerRemaining <= 30 ? " pong-timer-urgent" : ""
				}`}>
					⏱&nbsp;
					{String(Math.floor(timerRemaining / 60)).padStart(2, "0")}
					:{String(timerRemaining % 60).padStart(2, "0")}
				</div>
			)}
			{/* ── Canvas + overlays ──────────────────────────────────────── */}
			<div className="pong-canvas-container">
				{gameState ? (
					<PongCanvas gameState={gameState} playerNumber={playerNumber} />
				) : (
					<div className="pong-canvas-placeholder">
						<div className="pong-spinner" />
						<p>Connexion au serveur…</p>
					</div>
				)}

				{/* Overlays sit on top of the canvas */}
				{showOverlay && (
					<PongOverlay
						countdown={countdown}
						countdownResuming={countdownResuming}
						winner={winner}
						playerNumber={playerNumber}
						opponentLeft={opponentLeft}
						overtimeMessage={overtimeMessage}
						rematchStatus={rematchStatus}
						rematchFromLabel={rematchFromLabel}
						onLeave={onLeave}
						onRematch={onRematch}
						onRematchRespond={onRematchRespond}					isCleaningUp={isCleaningUp}					/>
				)}
			</div>

			{/* ── Score ───────────────────────────────────────────────────── */}
			{gameState && (
				<PongScoreDisplay score={gameState.score} playerNumber={playerNumber} />
			)}

			{/* ── Player indicator + keyboard hint ──────────────────────── */}
			<p className="pong-controls-hint">
				Vous êtes&nbsp;
				<strong>
					{playerNumber === 1 ? "le joueur gauche 🔵" : "le joueur droite 🟣"}
				</strong>
				&nbsp;—&nbsp;↑&nbsp;↓&nbsp;ou&nbsp;W&nbsp;S&nbsp;pour déplacer votre raquette
			</p>

			{/* ── Touch controls (mobile) ───────────────────────────────── */}
			{!showOverlay && (
				<div className="pong-touch-controls">
					<button
						className="pong-touch-btn"
						onPointerDown={() => sendInput("up")}
						onPointerUp={()   => sendInput("stop")}
						onPointerLeave={() => sendInput("stop")}
					>
						▲
					</button>
					<button
						className="pong-touch-btn"
						onPointerDown={() => sendInput("down")}
						onPointerUp={()   => sendInput("stop")}
						onPointerLeave={() => sendInput("stop")}
					>
						▼
					</button>
				</div>
			)}

			{/* ── Quit button ───────────────────────────────────────────── */}
			{!showOverlay && (
				<button className="pong-btn-quit" onClick={onLeave}>
					Quitter
				</button>
			)}
		</div>
	);
}
