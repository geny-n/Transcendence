import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./style/Leaderboard.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaderboardPlayer {
	rank: number;
	id: string;
	username: string;
	avatarUrl: string;
	level: number;
	experience: number;
}

interface LeaderboardResponse {
	total: number;
	limit: number;
	players: LeaderboardPlayer[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRankMedal(rank: number): string {
	switch (rank) {
		case 1:
			return "🥇";
		case 2:
			return "🥈";
		case 3:
			return "🥉";
		default:
			return `#${rank}`;
	}
}

function getRankClass(rank: number): string {
	switch (rank) {
		case 1:
			return "leaderboard-rank--1st";
		case 2:
			return "leaderboard-rank--2nd";
		case 3:
			return "leaderboard-rank--3rd";
		default:
			return "leaderboard-rank--other";
	}
}

// ─── Player Entry ─────────────────────────────────────────────────────────────
function PlayerEntry({ player }: { player: LeaderboardPlayer }) {
	return (
		<div className="leaderboard-entry">
			{/* Rank */}
			<div className={`leaderboard-rank ${getRankClass(player.rank)}`}>
				{getRankMedal(player.rank)}
			</div>

			{/* Player Info */}
			<div className="leaderboard-player">
				<img
					src={player.avatarUrl || "/avatars/default_avatar.png"}
					alt={player.username}
					className="leaderboard-avatar"
				/>
				<span className="leaderboard-username">{player.username}</span>
			</div>

			{/* Level */}
			<div className="leaderboard-level">
				<div className="leaderboard-level__value">{player.level}</div>
				<div className="leaderboard-level__label">LVL</div>
			</div>

			{/* XP */}
			<div className="leaderboard-xp">
				<div className="leaderboard-xp__value">{player.experience}</div>
				<div className="leaderboard-xp__label">XP</div>
			</div>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Leaderboard() {
	const [data, setData] = useState<LeaderboardResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [liveConnected, setLiveConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	// ── Fetch leaderboard ────────────────────────────────────────────────────
	const fetchLeaderboard = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/leaderboard?limit=100`);
			if (!res.ok) throw new Error(`Erreur ${res.status}`);
			const json: LeaderboardResponse = await res.json();
			setData(json);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Erreur inconnue");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLeaderboard();
	}, [fetchLeaderboard]);

	// ── Live updates via socket /leaderboard namespace ───────────────────────
	useEffect(() => {
		const socket = io(`${window.location.origin}/leaderboard`, {
			transports: ["websocket"],
			path: "/socket.io/",
			reconnection: true,
			withCredentials: false,
		});
		socketRef.current = socket;

		socket.on("connect", () => setLiveConnected(true));
		socket.on("disconnect", () => setLiveConnected(false));

		socket.on("leaderboard:updated", () => {
			// Refresh leaderboard on match end
			fetchLeaderboard();
		});

		return () => {
			socket.disconnect();
		};
	}, [fetchLeaderboard]);

	return (
		<div className="leaderboard-page">
			{/* Title */}
			<h1 className="leaderboard-title">
				Classement
				{liveConnected && <span className="leaderboard-live-dot" />}
			</h1>

			{/* Leaderboard Frame */}
			<div className="leaderboard-frame">
				{/* Header */}
				<div className="leaderboard-header">
					<div className="leaderboard-header__rank">Rang</div>
					<div className="leaderboard-header__name">Joueur</div>
					<div className="leaderboard-header__level">Niveau</div>
					<div className="leaderboard-header__xp">Expérience</div>
				</div>

				{/* List */}
				<div className="leaderboard-list">
					{loading && !data ? (
						<div className="leaderboard-loading">
							<div className="leaderboard-spinner" />
						</div>
					) : error ? (
						<div className="leaderboard-empty">{error}</div>
					) : !data || data.players.length === 0 ? (
						<div className="leaderboard-empty">
							Aucun joueur trouvé
						</div>
					) : (
						data.players.map((player) => (
							<PlayerEntry key={player.id} player={player} />
						))
					)}
				</div>
			</div>

			{/* Info */}
			{data && (
				<p className="mt-4 text-xs text-slate-500">
					Affichage de {data.players.length} / {data.total} joueurs
				</p>
			)}
		</div>
	);
}
