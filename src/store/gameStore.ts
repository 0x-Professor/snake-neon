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
  
  // Enhanced properties
  snakeSpeed: number;
  cameraMode: 'follow' | 'overview' | 'cinematic';
  effectsEnabled: boolean;
  
  // Actions
  startGame: (mode: GameMode) => void;
  pauseGame: () => void;
  resetGame: () => void;
  moveSnake: (direction: Direction) => void;
  updateGame: () => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  toggleSettings: () => void;
  toggleLeaderboard: () => void;
  addToLeaderboard: (entry: Omit<LeaderboardEntry, 'id'>) => void;
  setSnakeSpeed: (speed: number) => void;
  setCameraMode: (mode: 'follow' | 'overview' | 'cinematic') => void;
  toggleEffects: () => void;
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

const generateFood = (snake: Position[]): Food => {
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      z: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === position.x && segment.z === position.z));
  
  return {
    ...position,
    type: Math.random() < 0.1 ? 'power' : 'normal',
  };
};

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
  food: [{ x: 15, z: 15, type: 'normal' }],
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
  
  // Enhanced initial state
  snakeSpeed: 5,
  cameraMode: 'cinematic',
  effectsEnabled: true,
  
  // Actions
  startGame: (mode: GameMode) => {
    const initialSnake = [{ x: 10, z: 10 }];
    set({
      gameState: 'playing',
      gameMode: mode,
      snake: initialSnake,
      food: [generateFood(initialSnake)],
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
    const initialSnake = [{ x: 10, z: 10 }];
    set({
      gameState: 'menu',
      snake: initialSnake,
      food: [generateFood(initialSnake)],
      powerUps: [],
      activePowerUps: [],
      direction: 'right',
      score: 0,
      level: 1,
      lives: 3,
    });
  },

  moveSnake: (direction: Direction) => {
    const { gameState, direction: currentDirection } = get();
    if (gameState === 'playing') {
      // Prevent reversing into itself
      const opposites: Record<Direction, Direction> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
      };
      
      if (opposites[direction] !== currentDirection) {
        set({ direction });
      }
    }
  },

  updateGame: () => {
    const { gameState, snake, direction, food, score, gameMode, snakeSpeed } = get();
    
    if (gameState !== 'playing') return;

    const head = snake[0];
    let newHead: Position;

    // Calculate new head position based on direction
    switch (direction) {
      case 'up':
        newHead = { x: head.x, z: head.z - 1 };
        break;
      case 'down':
        newHead = { x: head.x, z: head.z + 1 };
        break;
      case 'left':
        newHead = { x: head.x - 1, z: head.z };
        break;
      case 'right':
        newHead = { x: head.x + 1, z: head.z };
        break;
    }

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.z < 0 || newHead.z >= GRID_SIZE) {
      set({ gameState: 'gameOver' });
      return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === newHead.x && segment.z === newHead.z)) {
      set({ gameState: 'gameOver' });
      return;
    }

    // Create new snake
    const newSnake = [newHead, ...snake];

    // Check food collision
    const eatenFoodIndex = food.findIndex(f => f.x === newHead.x && f.z === newHead.z);
    
    if (eatenFoodIndex !== -1) {
      // Snake ate food - grow and generate new food
      const eatenFood = food[eatenFoodIndex];
      const newFood = [...food];
      newFood[eatenFoodIndex] = generateFood(newSnake);
      
      const newScore = score + (eatenFood.type === 'power' ? 20 : 10);
      
      // Increase snake speed slightly when eating
      const newSpeed = Math.min(snakeSpeed + 0.1, 10);
      
      set({
        snake: newSnake,
        food: newFood,
        score: newScore,
        snakeSpeed: newSpeed,
      });
    } else {
      // Snake didn't eat - remove tail
      newSnake.pop();
      set({ snake: newSnake });
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

  setSnakeSpeed: (speed: number) => {
    set({ snakeSpeed: speed });
  },

  setCameraMode: (mode: 'follow' | 'overview' | 'cinematic') => {
    set({ cameraMode: mode });
  },

  toggleEffects: () => {
    set((state) => ({ effectsEnabled: !state.effectsEnabled }));
  },
}));
