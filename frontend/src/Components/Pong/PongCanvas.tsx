import { useEffect, useRef } from "react";
import type { PongGameState } from "./pongTypes";

interface Props {
	gameState:    PongGameState;
	playerNumber: 1 | 2;
}

/**
 * Renders the Pong game using an HTML canvas + requestAnimationFrame.
 * Reads the latest game state from a ref so the draw loop always has
 * up-to-date data without re-starting rAF on every state change.
 */
export default function PongCanvas({ gameState, playerNumber }: Props) {
	const canvasRef   = useRef<HTMLCanvasElement>(null);
	const stateRef    = useRef(gameState);
	const playerRef   = useRef(playerNumber);

	// Keep refs in sync with props on every render
	stateRef.current  = gameState;
	playerRef.current = playerNumber;

	// Start the draw loop once on mount, cancel on unmount
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animId: number;

		const draw = () => {
			const s   = stateRef.current;
			const me  = playerRef.current;
			const { canvasW, canvasH, ball, paddle1, paddle2, p1x, p2x } = s;

			// ── Background ──────────────────────────────────────────────────
			ctx.fillStyle = "#0a0a1a";
			ctx.fillRect(0, 0, canvasW, canvasH);

			// ── Center dashed line ───────────────────────────────────────────
			ctx.save();
			ctx.setLineDash([10, 16]);
			ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
			ctx.lineWidth   = 2;
			ctx.beginPath();
			ctx.moveTo(canvasW / 2, 0);
			ctx.lineTo(canvasW / 2, canvasH);
			ctx.stroke();
			ctx.restore();

			// ── Colours: my paddle = blue, opponent = purple ─────────────────
			const myColor  = "#60a5fa";
			const oppColor = "#c084fc";
			const p1Color  = me === 1 ? myColor : oppColor;
			const p2Color  = me === 2 ? myColor : oppColor;

			// ── Paddle 1 (left) ──────────────────────────────────────────────
			ctx.save();
			ctx.shadowBlur  = 18;
			ctx.shadowColor = p1Color;
			ctx.fillStyle   = p1Color;
			ctx.beginPath();
			(ctx as CanvasRenderingContext2D).roundRect(
				p1x, paddle1.y, paddle1.width, paddle1.height, 4
			);
			ctx.fill();
			ctx.restore();

			// ── Paddle 2 (right) ─────────────────────────────────────────────
			ctx.save();
			ctx.shadowBlur  = 18;
			ctx.shadowColor = p2Color;
			ctx.fillStyle   = p2Color;
			ctx.beginPath();
			(ctx as CanvasRenderingContext2D).roundRect(
				p2x, paddle2.y, paddle2.width, paddle2.height, 4
			);
			ctx.fill();
			ctx.restore();

			// ── Ball ─────────────────────────────────────────────────────────
			ctx.save();
			ctx.shadowBlur  = 25;
			ctx.shadowColor = "#ffffff";
			ctx.fillStyle   = "#ffffff";
			ctx.beginPath();
			ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();

			animId = requestAnimationFrame(draw);
		};

		animId = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(animId);
	}, []); // intentionally empty — reads from refs

	const { canvasW, canvasH } = gameState;
	return (
		<canvas
			ref={canvasRef}
			width={canvasW}
			height={canvasH}
			className="pong-canvas"
		/>
	);
}
