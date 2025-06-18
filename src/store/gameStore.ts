
import { create } from 'zustand';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';
export type GameMode = 'classic' | 'survival' | 'multiplayer';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type PowerUpType = 'speed' | 'shrink' | 'magnet';

export interface Position {
  x: number;
  z: number;
}

export interface Food extends Position {
  type: 'normal' | 'power';
}

export interface PowerUp extends Position {
  type: PowerUpType;
}

export interface ActivePowerUp {
  type: PowerUpType;
  timeLeft: number;
}

export interface LeaderboardEntry {
  id: string;
  score: number;
  playerName: string;
  gameMode: GameMode;
  date: number;
}

export interface Settings {
  volume: number;
  gameSpeed: number;
  theme: 'dark' | 'light';
  keyMapping: {
    up: string;
    down: string;
    left: string;
    right: string;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
  };
}

interface GameStore {
  // Game state
  gameState: GameState;
  gameMode: GameMode;
  snake: Position[];
  food: Food[];
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  direction: Direction;
  score: number;
  level: number;
  lives: number;
  highScore: number;
  
  // UI state
  showSettings: boolean;
  showLeaderboard: boolean;
  
  // Persistent data
  leaderboard: LeaderboardEntry[];
  settings: Settings;
  
  // Actions
  startGame: (mode: GameMode) => void;
  pauseGame: () => void;
  resetGame: () => void;
  moveSnake: (direction: Direction) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  toggleSettings: () => void;
  toggleLeaderboard: () => void;
  addToLeaderboard: (entry: Omit<LeaderboardEntry, 'id'>) => void;
}

const GRID_SIZE = 20;

const defaultSettings: Settings = {
  volume: 0.7,
  gameSpeed: 5,
  theme: 'dark',
  keyMapping: {
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
  },
};

const generateFood = (): Food => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  z: Math.floor(Math.random() * GRID_SIZE),
  type: Math.random() < 0.1 ? 'power' : 'normal',
});

const generatePowerUp = (): PowerUp => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  z: Math.floor(Math.random() * GRID_SIZE),
  type: ['speed', 'shrink', 'magnet'][Math.floor(Math.random() * 3)] as PowerUpType,
});

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: 'menu',
  gameMode: 'classic',
  snake: [{ x: 10, z: 10 }],
  food: [generateFood()],
  powerUps: [],
  activePowerUps: [],
  direction: 'right',
  score: 0,
  level: 1,
  lives: 3,
  highScore: parseInt(localStorage.getItem('neon-snake-highscore') || '0'),
  
  // UI state
  showSettings: false,
  showLeaderboard: false,
  
  // Persistent data
  leaderboard: JSON.parse(localStorage.getItem('neon-snake-leaderboard') || '[]'),
  settings: {
    ...defaultSettings,
    ...JSON.parse(localStorage.getItem('neon-snake-settings') || '{}'),
  },
  
  // Actions
  startGame: (mode: GameMode) => {
    set({
      gameState: 'playing',
      gameMode: mode,
      snake: [{ x: 10, z: 10 }],
      food: [generateFood()],
      powerUps: [],
      activePowerUps: [],
      direction: 'right',
      score: 0,
      level: 1,
      lives: mode === 'survival' ? 3 : 1,
      showSettings: false,
      showLeaderboard: false,
    });
  },

  pauseGame: () => {
    const { gameState } = get();
    if (gameState === 'playing') {
      set({ gameState: 'paused' });
    } else if (gameState === 'paused') {
      set({ gameState: 'playing' });
    }
  },

  resetGame: () => {
    set({
      gameState: 'menu',
      snake: [{ x: 10, z: 10 }],
      food: [generateFood()],
      powerUps: [],
      activePowerUps: [],
      direction: 'right',
      score: 0,
      level: 1,
      lives: 3,
    });
  },

  moveSnake: (direction: Direction) => {
    const { gameState } = get();
    if (gameState === 'playing') {
      set({ direction });
    }
  },

  updateSettings: (newSettings: Partial<Settings>) => {
    const { settings } = get();
    const updatedSettings = { ...settings, ...newSettings };
    localStorage.setItem('neon-snake-settings', JSON.stringify(updatedSettings));
    set({ settings: updatedSettings });
  },

  toggleSettings: () => {
    set((state) => ({ showSettings: !state.showSettings }));
  },

  toggleLeaderboard: () => {
    set((state) => ({ showLeaderboard: !state.showLeaderboard }));
  },

  addToLeaderboard: (entry: Omit<LeaderboardEntry, 'id'>) => {
    const { leaderboard, highScore } = get();
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    
    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10
    
    const newHighScore = Math.max(highScore, entry.score);
    
    localStorage.setItem('neon-snake-leaderboard', JSON.stringify(updatedLeaderboard));
    localStorage.setItem('neon-snake-highscore', newHighScore.toString());
    
    set({ 
      leaderboard: updatedLeaderboard,
      highScore: newHighScore,
    });
  },
}));
