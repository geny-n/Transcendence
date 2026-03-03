import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./style/ScoreBoard.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlayerInfo {
	id:     string | null;
	label:  string;
	score:  number;
	wins:   number | null;
	losses: number | null;
}

interface MatchEntry {
	id:          string;
	startedAt:   string;
	endedAt:     string;
	durationSec: number;
	isOvertime:  boolean;
	winner:      PlayerInfo;
	loser:       PlayerInfo;
}

interface ScoreboardResponse {
	total:      number;
	page:       number;
	limit:      number;
	totalPages: number;
	matches:    MatchEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(sec: number): string {
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	if (m === 0) return `${s}s`;
	return `${m}min ${String(s).padStart(2, "0")}s`;
}

function isGuest(label: string): boolean {
	return /^Invite\d{3}$/.test(label);
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match }: { match: MatchEntry }) {
	const { winner, loser } = match;

	return (
		<div className="match-card">
			{/* ── Left: winner ───────────────────────────────────── */}
			<div className="match-player match-player--left">
				<span className="match-player__name">
					<span className="badge-winner">🏆</span>
					<strong>{winner.label}</strong>
					{isGuest(winner.label) && (
						<span className="badge-guest">invité</span>
					)}
				</span>
				{winner.wins !== null ? (
					<span className="match-player__stats">
						V&nbsp;<span>{winner.wins}</span>&nbsp;/
						D&nbsp;<span>{winner.losses ?? 0}</span>
					</span>
				) : (
					<span className="match-player__stats">—</span>
				)}
			</div>

			{/* ── Center: scores + meta ──────────────────────────── */}
			<div className="match-center">
				<span className="match-score">
					<span style={{ color: "#fbbf24" }}>{winner.score}</span>
					<span className="match-score__sep">—</span>
					<span style={{ color: "#94a3b8" }}>{loser.score}</span>
				</span>
				<span className="match-duration">{formatDuration(match.durationSec)}</span>
				{match.isOvertime && (
					<span className="match-overtime-badge">Overtime</span>
				)}
			</div>

			{/* ── Right: loser ───────────────────────────────────── */}
			<div className="match-player match-player--right">
				<span className="match-player__name">
					{isGuest(loser.label) && (
						<span className="badge-guest">invité</span>
					)}
					<strong>{loser.label}</strong>
					<span className="badge-loser">💀</span>
				</span>
				{loser.wins !== null ? (
					<span className="match-player__stats">
						V&nbsp;<span>{loser.wins}</span>&nbsp;/
						D&nbsp;<span>{loser.losses ?? 0}</span>
					</span>
				) : (
					<span className="match-player__stats">—</span>
				)}
			</div>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const LIMIT = 10; // matches par page

export default function ScoreBoard() {
	const [data,        setData]        = useState<ScoreboardResponse | null>(null);
	const [page,        setPage]        = useState(1);
	const [loading,     setLoading]     = useState(false);
	const [error,       setError]       = useState<string | null>(null);
	const [liveConnected, setLiveConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	// ── Fetch scoreboard ────────────────────────────────────────────────────
	const fetchPage = useCallback(async (p: number) => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/scoreboard?page=${p}&limit=${LIMIT}`);
			if (!res.ok) throw new Error(`Erreur ${res.status}`);
			const json: ScoreboardResponse = await res.json();
			setData(json);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erreur inconnue");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { fetchPage(page); }, [page, fetchPage]);

	// ── Live updates via socket /scoreboard namespace ───────────────────────
	useEffect(() => {
		const socket = io(`${window.location.origin}/scoreboard`, {
			transports:    ["websocket"],
			path:          "/socket.io/",
			reconnection:  true,
			withCredentials: false,
		});
		socketRef.current = socket;

		socket.on("connect", () => setLiveConnected(true));
		socket.on("disconnect", () => setLiveConnected(false));

		socket.on("pong:match_saved", () => {
			// Rafraîchir la page courante (ou revenir à la page 1 pour voir la dernière partie)
			setPage(prev => {
				// Si on est sur la page 1, refetch directement
				if (prev === 1) {
					fetchPage(1);
					return 1;
				}
				// Sinon revenir à la page 1 pour montrer la dernière partie
				return 1;
			});
		});

		return () => { socket.disconnect(); };
	}, [fetchPage]);

	// ── Mouse-wheel scrolling on the list ──────────────────────────────────
	const listRef = useRef<HTMLDivElement>(null);

	// ── Render ──────────────────────────────────────────────────────────────
	const totalPages = data?.totalPages ?? 1;

	return (
		<div className="scoreboard-page">
			<h1 className="scoreboard-title">
				Scoreboard
				{liveConnected && <span className="scoreboard-live-dot" title="Mise à jour en temps réel" />}
			</h1>

			<div className="scoreboard-frame">
				{/* ── List ───────────────────────────────────────────────── */}
				<div className="scoreboard-list" ref={listRef}>
					{loading && (
						<div className="scoreboard-state">Chargement…</div>
					)}
					{!loading && error && (
						<div className="scoreboard-state">❌ {error}</div>
					)}
					{!loading && !error && data && data.matches.length === 0 && (
						<div className="scoreboard-state">
							Aucune partie jouée pour l'instant.
						</div>
					)}
					{!loading && !error && data && data.matches.map(m => (
						<MatchCard key={m.id} match={m} />
					))}
				</div>

				{/* ── Pagination ─────────────────────────────────────────── */}
				<div className="scoreboard-pager">
					<button
						className="pager-btn"
						onClick={() => setPage(1)}
						disabled={page === 1 || loading}
					>
						«
					</button>
					<button
						className="pager-btn"
						onClick={() => setPage(p => Math.max(1, p - 1))}
						disabled={page === 1 || loading}
					>
						‹ Précédent
					</button>

					<span className="pager-info">
						{data ? `${page} / ${totalPages} (${data.total} parties)` : "—"}
					</span>

					<button
						className="pager-btn"
						onClick={() => setPage(p => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages || loading}
					>
						Suivant ›
					</button>
					<button
						className="pager-btn"
						onClick={() => setPage(totalPages)}
						disabled={page >= totalPages || loading}
					>
						»
					</button>
				</div>
			</div>
		</div>
	);
}
