export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
  probability?: number; // For the visual aid feature
}

export interface ScoreEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  date: string;
}

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
  lives: number;
}

export interface AudioContextType {
  playClick: () => void;
  playFlag: () => void;
  playExplode: () => void;
  playWin: () => void;
  playPowerup: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}