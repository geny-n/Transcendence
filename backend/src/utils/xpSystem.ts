/**
 * Experience and Level System
 * 
 * Thresholds to reach each level:
 * Level 1: 0 XP (start)
 * Level 2: 2 XP
 * Level 3: 3 XP
 * Level 4: 5 XP
 * Level 5: 8 XP
 * Level 6: 13 XP
 * Level 7: 21 XP
 * Level 8: 34 XP
 * Level 9: 55 XP
 * Level 10: 89 XP
 * Level 11: 144 XP
 * Level 12: 233 XP (max level)
 */

export const XP_THRESHOLDS = [
	0,    // Level 1
	2,    // Level 2
	3,    // Level 3
	5,    // Level 4
	8,    // Level 5
	13,   // Level 6
	21,   // Level 7
	34,   // Level 8
	55,   // Level 9
	89,   // Level 10
	144,  // Level 11
	233,  // Level 12 (max)
];

export const MAX_LEVEL = 12;

/**
 * Calculate level based on total experience points
 * @param totalXP Total experience points accumulated
 * @returns Level (1-12)
 */
export function calculateLevel(totalXP: number): number {
	let level = 1;
	for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
		const threshold = XP_THRESHOLDS[i];
		if (threshold !== undefined && totalXP >= threshold) {
			level = i + 1;
			break;
		}
	}
	return Math.min(level, MAX_LEVEL);
}

/**
 * Get XP gained from a match outcome
 * @param isWinner Whether the player won/survived
 * @returns XP gained (1 for loss, 3 for win)
 */
export function getXPGain(isWinner: boolean): number {
	return isWinner ? 3 : 1;
}

/**
 * Get the XP threshold needed to reach a specific level
 * @param level Target level (1-12)
 * @returns XP threshold for that level
 */
export function getLevelThreshold(level: number): number {
	if (level < 1 || level > MAX_LEVEL) {
		throw new Error(`Invalid level: ${level}`);
	}
	const threshold = XP_THRESHOLDS[level - 1];
	if (threshold === undefined) {
		throw new Error(`Threshold not found for level: ${level}`);
	}
	return threshold;
}

/**
 * Get the XP needed to reach the next level
 * @param currentLevel Current level
 * @param currentXP Current total XP
 * @returns XP remaining to reach next level, or 0 if at max level
 */
export function getXPToNextLevel(currentLevel: number, currentXP: number): number {
	if (currentLevel >= MAX_LEVEL) {
		return 0;
	}
	const nextLevelThreshold = XP_THRESHOLDS[currentLevel];
	if (nextLevelThreshold === undefined) {
		throw new Error(`Threshold not found for level: ${currentLevel}`);
	}
	return Math.max(0, nextLevelThreshold - currentXP);
}
