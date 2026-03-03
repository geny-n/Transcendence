import { Router } from "express";
import type { Request, Response } from "express";
import type { Match } from "../../generated/prisma/client.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/scoreboard?page=1&limit=10
// Route publique — accessible sans authentification
router.get("/scoreboard", async (req: Request, res: Response) => {
	const page  = Math.max(1, parseInt(req.query["page"]  as string) || 1);
	const limit = Math.min(50, Math.max(5, parseInt(req.query["limit"] as string) || 10));
	const skip  = (page - 1) * limit;

	const [total, matches] = await Promise.all([
		prisma.match.count(),
		prisma.match.findMany({
			orderBy: { endedAt: "desc" },
			skip,
			take: limit,
		}),
	]);

	// Récupérer les stats wins/losses de tous les joueurs enregistrés présents
	const userIds = [
		...new Set(
			matches.flatMap((m: Match) => [m.winnerId, m.loserId].filter((id): id is string => id !== null))
		),
	];

	let winsMap:  Record<string, number> = {};
	let lossMap:  Record<string, number> = {};

	if (userIds.length > 0) {
		const [winCounts, lossCounts] = await Promise.all([
			prisma.match.groupBy({
				by: ["winnerId"],
				where: { winnerId: { in: userIds } },
				_count: { winnerId: true },
			}),
			prisma.match.groupBy({
				by: ["loserId"],
				where: { loserId: { in: userIds } },
				_count: { loserId: true },
			}),
		]);

		winsMap = Object.fromEntries(
			winCounts.map((r: { winnerId: string | null; _count: { winnerId: number } }) => [r.winnerId as string, r._count.winnerId])
		);
		lossMap = Object.fromEntries(
			lossCounts.map((r: { loserId: string | null; _count: { loserId: number } }) => [r.loserId as string, r._count.loserId])
		);
	}

	const result = matches.map((m: Match) => ({
		id:          m.id,
		startedAt:   m.startedAt,
		endedAt:     m.endedAt,
		durationSec: m.durationSec,
		isOvertime:  m.isOvertime,
		winner: {
			id:     m.winnerId,
			label:  m.winnerLabel,
			score:  m.scoreWinner,
			wins:   m.winnerId ? (winsMap[m.winnerId] ?? 0) : null,
			losses: m.winnerId ? (lossMap[m.winnerId] ?? 0)  : null,
		},
		loser: {
			id:     m.loserId,
			label:  m.loserLabel,
			score:  m.scoreLoser,
			wins:   m.loserId ? (winsMap[m.loserId]  ?? 0) : null,
			losses: m.loserId ? (lossMap[m.loserId]  ?? 0)  : null,
		},
	}));

	res.json({ total, page, limit, totalPages: Math.ceil(total / limit), matches: result });
});

export default router;
