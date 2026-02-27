interface Props {
	countdown:         number | null;
	countdownResuming: boolean;
	winner:            1 | 2  | null;
	playerNumber:      1 | 2;
	opponentLeft:      boolean;
	onLeave:           () => void;
}

/**
 * Full-screen overlay rendered on top of the canvas for:
 *   • Countdown before the game starts (or resumes after reconnection)
 *   • Game over (win / loss)
 *   • Opponent disconnected
 */
export default function PongOverlay({
	countdown,
	countdownResuming,
	winner,
	playerNumber,
	opponentLeft,
	onLeave,
}: Props) {

	// ── Countdown ─────────────────────────────────────────────────────────────
	if (countdown !== null && countdown > 0) {
		return (
			<div className="pong-overlay">
				<div className="pong-overlay-box">
					<p className="pong-overlay-title">
						{countdownResuming ? "Reprise !" : "Prêt ?"}
					</p>
					<p className="pong-overlay-countdown">{countdown}</p>
				</div>
			</div>
		);
	}

	// ── Opponent disconnected ─────────────────────────────────────────────────
	if (opponentLeft) {
		return (
			<div className="pong-overlay">
				<div className="pong-overlay-box">
					<p className="pong-overlay-title">🏳️ Adversaire parti</p>
					<p className="pong-overlay-sub">Victoire par forfait !</p>
					<button className="btn-play" onClick={onLeave}>
						Retour au menu
					</button>
				</div>
			</div>
		);
	}

	// ── Game over ─────────────────────────────────────────────────────────────
	if (winner !== null) {
		const won = winner === playerNumber;
		return (
			<div className="pong-overlay">
				<div className="pong-overlay-box">
					<p className="pong-overlay-title">{won ? "🏆 Victoire !" : "💀 Défaite"}</p>
					<p className="pong-overlay-sub">
						{won
							? "Bien joué !"
							: "On l'aura la prochaine fois."}
					</p>
					<button className="btn-play" onClick={onLeave}>
						Retour au menu
					</button>
				</div>
			</div>
		);
	}

	return null;
}
