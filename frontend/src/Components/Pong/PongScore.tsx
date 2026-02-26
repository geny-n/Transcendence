import type { PongScore } from "./pongTypes";

interface Props {
	score:        PongScore;
	playerNumber: 1 | 2;
}

/**
 * Displays the current score.
 * The local player's side is highlighted in blue.
 */
export default function PongScoreDisplay({ score, playerNumber }: Props) {
	return (
		<div className="pong-score">
			{/* Left side — Player 1 */}
			<div className={`pong-score-side ${playerNumber === 1 ? "pong-score-mine" : ""}`}>
				<span className="pong-score-label">P1</span>
				<span className="pong-score-num">{score.p1}</span>
			</div>

			<span className="pong-score-sep">:</span>

			{/* Right side — Player 2 */}
			<div className={`pong-score-side pong-score-right ${playerNumber === 2 ? "pong-score-mine" : ""}`}>
				<span className="pong-score-num">{score.p2}</span>
				<span className="pong-score-label">P2</span>
			</div>
		</div>
	);
}
