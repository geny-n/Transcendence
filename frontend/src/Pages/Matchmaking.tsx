import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePongSocket } from "../Components/Pong/usePongSocket";
import PongGame from "../Components/Pong/PongGame";
import "../Components/Pong/pong.css";

/**
 * Matchmaking page — manages the full flow:
 *   connecting → queue → countdown → playing → ended
 *
 * Supporte le mode invité : guestName génère une identité jetable
 * et se connecte sans cookie d'authentification.
 */
export default function Matchmaking() {
	const navigate = useNavigate();
	const [guestName, setGuestName] = useState<string | undefined>();

	const {
		state,
		joinQueue,
		leaveQueue,
		sendInput,
		leaveGame,
		requestRematch,
		respondRematch,
	} = usePongSocket(guestName);

	const handlePlayAsGuest = useCallback(() => {
		const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
		setGuestName(`Invité_${suffix}`);
	}, []);

	const { phase, queuePosition, gameInfo, gameState, countdown, countdownResuming, winner, opponentLeft, opponentReconnecting, timerRemaining, overtimeMessage, rematchStatus, rematchFromLabel, error } = state;

	// Auto-join the queue as soon as the socket connects
	useEffect(() => {
		if (phase === "queue") {
			joinQueue();
		}
	}, [phase, joinQueue]);

	const handleCancelQueue = useCallback(() => {
		leaveQueue();
		navigate("/pong");
	}, [leaveQueue, navigate]);

	const handleLeaveGame = useCallback(() => {
		leaveGame();
		navigate("/pong");
	}, [leaveGame, navigate]);

	// ── Error ────────────────────────────────────────────────────────────────
	if (error) {
		return (
			<div className="matchmaking-page">
				<div className="matchmaking-box">
					<p className="matchmaking-title">❌ Connexion impossible</p>
					<p className="matchmaking-sub">
						Vous n'êtes pas connecté(e) ou votre session a expiré.
					</p>

					<button className="btn-play" onClick={handlePlayAsGuest}>
						Jouer en tant qu'invité
					</button>

					<button className="btn-play btn-play-secondary" onClick={() => navigate("/pong")}>
						Retour
					</button>
				</div>
			</div>
		);
	}

	// ── Connecting ───────────────────────────────────────────────────────────
	if (phase === "connecting") {
		return (
			<div className="matchmaking-page">
				<div className="matchmaking-box">
					<div className="matchmaking-spinner" />
					<p className="matchmaking-title">Connexion…</p>
				</div>
			</div>
		);
	}

	// ── Queue (waiting for opponent) ─────────────────────────────────────────
	if (phase === "queue") {
		return (
			<div className="matchmaking-page">
				<div className="matchmaking-box">
					{/* Radar animation */}
					<div className="matchmaking-radar">
						<div className="matchmaking-radar-ring" />
						<div
							className="matchmaking-radar-ring"
							style={{ animationDelay: "0.65s" }}
						/>
						<div
							className="matchmaking-radar-ring"
							style={{ animationDelay: "1.3s" }}
						/>
						<div className="matchmaking-radar-dot" />
					</div>

					<p className="matchmaking-title">Recherche d'adversaire…</p>
					<p className="matchmaking-sub">
						{queuePosition > 0
							? `Position dans la file : ${queuePosition}`
							: "Connexion à la file…"}
					</p>

					<button className="btn-play" onClick={handleCancelQueue}>
						Annuler
					</button>
				</div>
			</div>
		);
	}

	// ── Countdown / Playing / Ended — render the game view ──────────────────
	if (gameInfo && (phase === "countdown" || phase === "playing" || phase === "ended")) {
		return (
			<PongGame
				gameState={gameState}
				gameInfo={gameInfo}
				countdown={countdown}
				countdownResuming={countdownResuming}
				winner={winner}
				opponentLeft={opponentLeft}
				opponentReconnecting={opponentReconnecting}
				timerRemaining={timerRemaining}
				overtimeMessage={overtimeMessage}
				rematchStatus={rematchStatus}
				rematchFromLabel={rematchFromLabel}
				sendInput={sendInput}
				onLeave={handleLeaveGame}
				onRematch={requestRematch}
				onRematchRespond={respondRematch}
			/>
		);
	}

	// Fallback (should not be reached in normal flow)
	return null;
}
