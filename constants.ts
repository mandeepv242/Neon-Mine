
import { Difficulty, GameConfig } from './types';

export const DIFFICULTIES: Record<Difficulty, GameConfig> = {
  [Difficulty.EASY]: { rows: 3, cols: 3, mines: 2, lives: 1 },
  [Difficulty.MEDIUM]: { rows: 6, cols: 6, mines: 7, lives: 3 },
  [Difficulty.HARD]: { rows: 10, cols: 10, mines: 20, lives: 5 },
};

export const SCORES = {
  REVEAL_SAFE: 10,
  CORRECT_PROBABILITY_BONUS: 50,
  WRONG_FLAG_PENALTY: 20,
  NO_POWERUP_BONUS: 200,
  WIN_BONUS: 500,
};

export const STORAGE_KEY = 'neon-mines-leaderboard';
export const MAX_LEADERBOARD_ENTRIES = 10;
export const TOTAL_LIVES = 3; // Default fallback, overwritten by config
export const COLORS = {
  1: 'text-blue-400',
  2: 'text-green-400',
  3: 'text-red-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-teal-400',
  7: 'text-white',
  8: 'text-gray-400',
};
