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
  let attempts = 0;
  
  do {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      z: Math.floor(Math.random() * GRID_SIZE),
    };
    attempts++;
  } while (snake.some(segment => segment.x === position.x && segment.z === position.z) && attempts < 100);
  
  return {
    ...position,
    type: Math.random() < 0.15 ? 'power' : 'normal',
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
    console.log('Starting game with mode:', mode);
    const initialSnake = [{ x: 10, z: 10 }];
    const newFood = generateFood(initialSnake);
    console.log('Initial food generated at:', newFood);
    
    set({
      gameState: 'playing',
      gameMode: mode,
      snake: initialSnake,
      food: [newFood],
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
    console.log('Pause game called, current state:', gameState);
    if (gameState === 'playing') {
      set({ gameState: 'paused' });
    } else if (gameState === 'paused') {
      set({ gameState: 'playing' });
    }
  },

  resetGame: () => {
    console.log('Resetting game');
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
    const { gameState, direction: currentDirection, snake } = get();
    console.log('moveSnake called:', direction, 'Current state:', gameState, 'Current direction:', currentDirection);
    
    if (gameState !== 'playing') {
      console.log('Game not playing, ignoring move');
      return;
    }

    // Prevent reversing into itself (only if snake has more than 1 segment)
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    
    if (snake.length > 1 && opposites[direction] === currentDirection) {
      console.log('Preventing reverse direction');
      return;
    }
    
    console.log('Setting new direction:', direction);
    set({ direction });
  },

  updateGame: () => {
    const { gameState, snake, direction, food, score, gameMode, snakeSpeed, highScore } = get();
    
    if (gameState !== 'playing') {
      console.log('Game not playing, skipping update');
      return;
    }

    console.log('Updating game - Snake:', snake, 'Direction:', direction);

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

    console.log('New head position:', newHead);

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.z < 0 || newHead.z >= GRID_SIZE) {
      console.log('Wall collision detected');
      
      // Update high score before game over
      const newHighScore = Math.max(highScore, score);
      if (newHighScore > highScore) {
        localStorage.setItem('neon-snake-highscore', newHighScore.toString());
      }
      
      set({ 
        gameState: 'gameOver',
        highScore: newHighScore
      });
      return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === newHead.x && segment.z === newHead.z)) {
      console.log('Self collision detected');
      
      // Update high score before game over
      const newHighScore = Math.max(highScore, score);
      if (newHighScore > highScore) {
        localStorage.setItem('neon-snake-highscore', newHighScore.toString());
      }
      
      set({ 
        gameState: 'gameOver',
        highScore: newHighScore
      });
      return;
    }

    // Create new snake
    const newSnake = [newHead, ...snake];

    // Check food collision
    const eatenFoodIndex = food.findIndex(f => f.x === newHead.x && f.z === newHead.z);
    
    if (eatenFoodIndex !== -1) {
      console.log('Food eaten!');
      // Snake ate food - grow and generate new food
      const eatenFood = food[eatenFoodIndex];
      const newFood = [...food];
      newFood[eatenFoodIndex] = generateFood(newSnake);
      
      const pointsGained = eatenFood.type === 'power' ? 20 : 10;
      const newScore = score + pointsGained;
      
      // Increase level every 100 points
      const newLevel = Math.floor(newScore / 100) + 1;
      
      console.log('Score increased to:', newScore, 'Level:', newLevel);
      
      set({
        snake: newSnake,
        food: newFood,
        score: newScore,
        level: newLevel,
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
