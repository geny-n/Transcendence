import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePongSocket } from "../Components/Pong/usePongSocket";
import { useAuth } from "../main";
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
	const { t } = useTranslation();
	const { accessToken } = useAuth();
	
	// CRITICAL: Persist guestName in sessionStorage to survive component unmount
	// This prevents phantom queue issues when user quit+rejoin multiple times
	const [guestName, setGuestName] = useState<string | undefined>(() => {
		return sessionStorage.getItem('pong_guest_name') || undefined;
	});

	// Track if we should navigate away after cleanup completes
	const [shouldNavigateAfterCleanup, setShouldNavigateAfterCleanup] = useState(false);

	const {
		state,
		joinQueue,
		leaveQueue,
		sendInput,
		leaveGame,
		requestRematch,
		respondRematch,
		quitWaiting,
		socketCreatedTime,
	} = usePongSocket(guestName, accessToken);

	const handlePlayAsGuest = useCallback(() => {
		// If already set, don't generate a new one - keeps session consistency
		// This prevents phantom queue issues when user quit+rejoin multiple times
		if (!guestName) {
			const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
			const newGuestName = `${t('matchmaking.guestPrefix')}_${suffix}`;
			sessionStorage.setItem('pong_guest_name', newGuestName);
			setGuestName(newGuestName);
		}
	}, [guestName, t]);

	const { phase, queuePosition, gameInfo, gameState, countdown, countdownResuming, winner, opponentLeft, opponentReconnecting, timerRemaining, overtimeMessage, rematchStatus, rematchFromLabel, error, isCleaningUp } = state;

	// Readiness: not cleaning up AND socket >= 1s
	const [isReadyForQueue, setIsReadyForQueue] = useState(false);

	useEffect(() => {
		console.log("[Matchmaking] Readiness effect started - socketCreatedTime:", socketCreatedTime?.current, "isCleaningUp:", isCleaningUp);
		
		if (isCleaningUp) {
			console.log("[Matchmaking] Cleanup in progress - blocking readiness");
			setIsReadyForQueue(false);
			return;
		}
		
		// Check readiness immediately
		const checkReady = () => {
			if (!socketCreatedTime?.current) {
				console.log("[Matchmaking] Socket created time not set yet");
				setIsReadyForQueue(false);
				return false;
			}
			
			const elapsed = Date.now() - socketCreatedTime.current;
			const isReady = elapsed >= 1000;
			console.log(`[Matchmaking] Socket age: ${elapsed}ms - Ready: ${isReady}`);
			setIsReadyForQueue(isReady);
			return isReady;
		};
		
		// Check immediately
		checkReady();
		
		// Check every 100ms until ready
		const interval = setInterval(() => {
			if (checkReady()) {
				console.log("[Matchmaking] Socket now ready - stopping checks");
				clearInterval(interval);
			}
		}, 100);
		
		return () => {
			console.log("[Matchmaking] Cleaning up readiness checker");
			clearInterval(interval);
		};
	}, [isCleaningUp, socketCreatedTime]);

	const handleJoinQueue = useCallback(() => {
		console.log(`[Matchmaking] handleJoinQueue called - isReadyForQueue: ${isReadyForQueue}, isCleaningUp: ${isCleaningUp}`);
		if (!isReadyForQueue || isCleaningUp) {
			console.warn("[Matchmaking] ❌ NOT READY: Blocking queue join");
			return;
		}
		console.log("[Matchmaking] ✅ READY: Emitting queue join");
		joinQueue();
	}, [isReadyForQueue, isCleaningUp, joinQueue]);

	useEffect(() => {
		if (shouldNavigateAfterCleanup && !isCleaningUp) {
			navigate("/");
			setShouldNavigateAfterCleanup(false);
		}
	}, [shouldNavigateAfterCleanup, isCleaningUp, navigate]);

	const handleCancelQueue = useCallback(() => {
		leaveQueue();
		navigate("/");
	}, [leaveQueue, navigate]);

	const handleLeaveGame = useCallback(() => {
		leaveGame();
		setShouldNavigateAfterCleanup(true);
	}, [leaveGame]);

	// ── Error ────────────────────────────────────────────────────────────────
	if (error && phase === "connecting") {
		// Connection/auth error
		return (
			<div className="matchmaking-page">
				<div className="matchmaking-box">
					<p className="matchmaking-title">{t('matchmaking.connectionError')}</p>
					<p className="matchmaking-sub">
						{t('matchmaking.notConnected')}
					</p>

					<button className="btn-play" onClick={handlePlayAsGuest}>
						{t('matchmaking.playAsGuest')}
					</button>

					<button className="btn-play btn-play-secondary" onClick={() => navigate("/")}>
						{t('pong.backBtn')}
					</button>
				</div>
			</div>
		);
	}

	// ── Queue Error ──────────────────────────────────────────────────────────
	if (error && phase === "queue") {
		// Queue join error
		return (
			<div className="matchmaking-page">
				<div className="matchmaking-box">
					<p className="matchmaking-title">⚠️ Impossible de rejoindre</p>
					<p className="matchmaking-sub">{error}</p>
					<p className="matchmaking-sub" style={{ fontSize: "0.9em", marginTop: "1rem" }}>
						Attendez quelques secondes avant de réessayer.
					</p>

					<button className="btn-play" onClick={handleCancelQueue} style={{ marginTop: "1rem" }}>
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

	// ── Queue Waiting (not yet joined) ───────────────────────────────────────
	// NO auto-join: user must manually click "Rejoindre la file" button
	if (phase === "queue" && queuePosition === 0) {
		console.log("[Matchmaking] RENDERING 'Prêt à chercher?' - phase:", phase, "queuePos:", queuePosition, "isReady:", isReadyForQueue, "isCleaning:", isCleaningUp);
		return (
			<div className="matchmaking-page">
				<div className="matchmaking-box">
					<p className="matchmaking-title">{t('matchmaking.readyPrompt')}</p>
					<p className="matchmaking-sub" style={{ marginBottom: "2rem" }}>
						{isCleaningUp
							? t('matchmaking.cleaningUp')
							: !isReadyForQueue
								? t('matchmaking.serverPreparing')
								: t('matchmaking.joinClick')}
					</p>

					<button
						className="btn-play"
						onClick={handleJoinQueue}
						disabled={!isReadyForQueue || isCleaningUp}
						style={{
							opacity: isReadyForQueue && !isCleaningUp ? 1 : 0.5,
							cursor: isReadyForQueue && !isCleaningUp ? 'pointer' : 'not-allowed',
						}}
					>
						{isReadyForQueue && !isCleaningUp ? t('matchmaking.joinQueue') : t('matchmaking.preparingQueue')}
					</button>

					<button className="btn-play btn-play-secondary" onClick={() => navigate("/")}>
					{t('pong.backBtn')}
					</button>
				</div>
			</div>
		);
	}

	// ── Queue (searching for opponent) ────────────────────────────────────────
	if (phase === "queue" && queuePosition > 0) {
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

				<p className="matchmaking-title">{t('matchmaking.searching')}</p>
				<p className="matchmaking-sub">
					{t('matchmaking.queuePosition', { position: queuePosition })}
					</p>

					<button className="btn-play" onClick={handleCancelQueue}>
					{t('matchmaking.cancel')}
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
				onQuitWaiting={quitWaiting}
				isCleaningUp={isCleaningUp}
			/>
		);
	}

	// Fallback (should not be reached in normal flow)
	return null;
}
