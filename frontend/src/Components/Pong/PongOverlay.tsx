import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RematchStatus } from "./usePongSocket";

interface Props {
	countdown:         number | null;
	countdownResuming: boolean;
	winner:            1 | 2  | null;
	playerNumber:      1 | 2;
	opponentLeft:      boolean;
	overtimeMessage:   string | null;
	rematchStatus:     RematchStatus;
	rematchFromLabel:  string | null;
	onLeave:           () => void;
	onRematch:         () => void;
	onRematchRespond:  (accept: boolean) => void;
	isCleaningUp:      boolean;
}

const REMATCH_COOLDOWN_S = 20;

/**
 * Full-screen overlay rendered on top of the canvas for:
 *   • Countdown before the game starts (or resumes after reconnection)
 *   • "Egalité! Overtime!" pause between normal time and overtime
 *   • Game over (win / loss) — with rematch system
 *   • Opponent disconnected
 */
export default function PongOverlay({
	countdown,
	countdownResuming,
	winner,
	playerNumber,
	opponentLeft,
	overtimeMessage,
	rematchStatus,
	rematchFromLabel,
	onLeave,
	onRematch,
	onRematchRespond,
	isCleaningUp,
}: Props) {
	const { t } = useTranslation();

	// ── Local 20s cooldown for the "Revanche?" button ─────────────────────────
	const [cooldown, setCooldown] = useState(0);
	const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Reset cooldown if the status goes back to idle (e.g., opponent left)
	useEffect(() => {
		if (rematchStatus === 'idle') {
			setCooldown(0);
			if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
		}
	}, [rematchStatus]);

	useEffect(() => () => {
		if (cooldownRef.current) clearInterval(cooldownRef.current);
	}, []);

	const handleRematch = () => {
		if (cooldown > 0 || rematchStatus !== 'idle') return;
		onRematch();
		setCooldown(REMATCH_COOLDOWN_S);
		cooldownRef.current = setInterval(() => {
			setCooldown((c: number) => {
				if (c <= 1) {
					clearInterval(cooldownRef.current!);
					cooldownRef.current = null;
					return 0;
				}
				return c - 1;
			});
		}, 1000);
	};

	// ── Overtime pause ────────────────────────────────────────────────────────
	if (overtimeMessage) {
		return (
			<div className="pong-overlay">
				<div className="pong-overlay-box">
					<p className="pong-overlay-title" style={{ color: "#f59e0b" }}>
						{overtimeMessage}
					</p>
					<p className="pong-overlay-sub">+2 minutes !</p>
				</div>
			</div>
		);
	}

	// ── Countdown ─────────────────────────────────────────────────────────────
	if (countdown !== null && countdown > 0) {
		return (
			<div className="pong-overlay">
				<div className="pong-overlay-box">
					<p className="pong-overlay-title">
						{countdownResuming ? t('pong.overlay.resuming') : t('pong.overlay.ready')}
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
					<p className="pong-overlay-title">{t('pong.overlay.opponentLeft')}</p>
					<p className="pong-overlay-sub">{t('pong.overlay.defaultVictory')}</p>
					<button className="btn-play" onClick={onLeave} disabled={isCleaningUp}>
						{isCleaningUp ? t('pong.overlay.closing') : t('pong.overlay.backToMenu')}
					</button>
				</div>
			</div>
		);
	}

	// ── Game over ─────────────────────────────────────────────────────────────
	if (winner !== null) {
		const won = winner === playerNumber;

		const rematchBtn = () => {
			if (rematchStatus === 'pending') {
				return (
					<button className="btn-rematch btn-rematch--pending" disabled>
						<span className="rematch-spinner" />
					{t('pong.overlay.rematchRequested')}
					</button>
				);
			}
			if (rematchStatus === 'declined') {
				return (
					<button className="btn-rematch btn-rematch--declined" disabled>
					{t('pong.overlay.rematchRejected')}
					</button>
				);
			}
			const disabled = cooldown > 0;
			return (
				<button
					className={`btn-rematch${disabled ? " btn-rematch--cooldown" : ""}`}
					onClick={handleRematch}
					disabled={disabled}
				>
					{disabled ? `${t('pong.overlay.rematch')} (${cooldown}s)` : t('pong.overlay.rematch')}
				</button>
			);
		};

		return (
			<div className="pong-overlay">
				<div className="pong-overlay-box">
					<p className="pong-overlay-title">{won ? t('pong.overlay.victory') : t('pong.overlay.defeat')}</p>
					<p className="pong-overlay-sub">
					{won ? t('pong.overlay.wellPlayed') : t('pong.overlay.nextTime')}
				</p>

					<button className="btn-play" onClick={onLeave} disabled={isCleaningUp}>
					{isCleaningUp ? t('pong.overlay.closing') : t('pong.overlay.backToMenu')}
				</button>

				{/* Rematch button — never shown for "opponent left" */}
				{rematchBtn()}

					{/* Incoming rematch notification */}
					{rematchStatus === 'incoming' && rematchFromLabel && (
						<div className="rematch-incoming">
							<p className="rematch-incoming__text">
							{t('pong.overlay.rematchChallenge', { player: rematchFromLabel })}
							</p>
							<div className="rematch-incoming__actions">
								<button
									className="rematch-incoming__btn rematch-incoming__btn--accept"
									onClick={() => onRematchRespond(true)}
								>
									{t('pong.overlay.accept')}
								</button>
								<button
									className="rematch-incoming__btn rematch-incoming__btn--decline"
									onClick={() => onRematchRespond(false)}
								>
									{t('pong.overlay.decline')}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return null;
}
