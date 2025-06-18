
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  x: number;
  z: number;
}

export interface FoodItem extends Position {
  type: 'normal' | 'power';
  points: number;
}

export interface PowerUp extends Position {
  type: 'speed' | 'shrink' | 'magnet';
  duration: number;
}

export interface GameSettings {
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

export interface LeaderboardEntry {
  id: string;
  score: number;
  gameMode: string;
  date: number;
  playerName: string;
}

export interface GameState {
  gameState: 'menu' | 'playing' | 'paused' | 'gameOver';
  gameMode: 'classic' | 'survival' | 'multiplayer';
  snake: Position[];
  direction: 'up' | 'down' | 'left' | 'right';
  food: FoodItem[];
  powerUps: PowerUp[];
  activePowerUps: PowerUp[];
  score: number;
  highScore: number;
  level: number;
  lives: number;
  settings: GameSettings;
  leaderboard: LeaderboardEntry[];
  showSettings: boolean;
  showLeaderboard: boolean;
  
  // Actions
  startGame: (mode?: 'classic' | 'survival' | 'multiplayer') => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  moveSnake: (newDirection: 'up' | 'down' | 'left' | 'right') => void;
  updateGame: () => void;
  collectFood: (foodIndex: number) => void;
  collectPowerUp: (powerUpIndex: number) => void;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  addToLeaderboard: (entry: Omit<LeaderboardEntry, 'id'>) => void;
  toggleSettings: () => void;
  toggleLeaderboard: () => void;
  resetGame: () => void;
}

const GRID_SIZE = 20;

const defaultSettings: GameSettings = {
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

const generateRandomPosition = (): Position => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  z: Math.floor(Math.random() * GRID_SIZE),
});

const generateFood = (): FoodItem => {
  const isPowerFood = Math.random() < 0.2; // 20% chance for power food
  return {
    ...generateRandomPosition(),
    type: isPowerFood ? 'power' : 'normal',
    points: isPowerFood ? 50 : 10,
  };
};

const generatePowerUp = (): PowerUp => {
  const types: PowerUp['type'][] = ['speed', 'shrink', 'magnet'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    ...generateRandomPosition(),
    type,
    duration: 5000, // 5 seconds
  };
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      gameState: 'menu',
      gameMode: 'classic',
      snake: [{ x: 10, z: 10 }],
      direction: 'right',
      food: [generateFood()],
      powerUps: [],
      activePowerUps: [],
      score: 0,
      highScore: 0,
      level: 1,
      lives: 3,
      settings: defaultSettings,
      leaderboard: [],
      showSettings: false,
      showLeaderboard: false,

      startGame: (mode = 'classic') => {
        set({
          gameState: 'playing',
          gameMode: mode,
          snake: [{ x: 10, z: 10 }],
          direction: 'right',
          score: 0,
          level: 1,
          lives: mode === 'survival' ? 3 : 1,
          food: [generateFood()],
          powerUps: [],
          activePowerUps: [],
          showSettings: false,
          showLeaderboard: false,
        });
      },

      pauseGame: () => {
        const state = get();
        if (state.gameState === 'playing') {
          set({ gameState: 'paused' });
        } else if (state.gameState === 'paused') {
          set({ gameState: 'playing' });
        }
      },

      resumeGame: () => {
        set({ gameState: 'playing' });
      },

      endGame: () => {
        const state = get();
        if (state.score > state.highScore) {
          set({ highScore: state.score });
        }
        
        // Add to leaderboard
        const entry: Omit<LeaderboardEntry, 'id'> = {
          score: state.score,
          gameMode: state.gameMode,
          date: Date.now(),
          playerName: 'Player',
        };
        
        get().addToLeaderboard(entry);
        set({ gameState: 'gameOver' });
      },

      moveSnake: (newDirection) => {
        const state = get();
        if (state.gameState !== 'playing') return;

        // Prevent reverse direction
        const opposites = {
          up: 'down',
          down: 'up',
          left: 'right',
          right: 'left',
        };

        if (opposites[newDirection] === state.direction) return;

        set({ direction: newDirection });
        get().updateGame();
      },

      updateGame: () => {
        const state = get();
        if (state.gameState !== 'playing') return;

        const head = state.snake[0];
        let newHead: Position;

        switch (state.direction) {
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
          default:
            return;
        }

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.z < 0 || newHead.z >= GRID_SIZE) {
          get().endGame();
          return;
        }

        // Check self collision
        if (state.snake.some(segment => segment.x === newHead.x && segment.z === newHead.z)) {
          get().endGame();
          return;
        }

        const newSnake = [newHead, ...state.snake];

        // Check food collision
        const foodIndex = state.food.findIndex(
          f => f.x === newHead.x && f.z === newHead.z
        );

        if (foodIndex !== -1) {
          get().collectFood(foodIndex);
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        // Check power-up collision
        const powerUpIndex = state.powerUps.findIndex(
          p => p.x === newHead.x && p.z === newHead.z
        );

        if (powerUpIndex !== -1) {
          get().collectPowerUp(powerUpIndex);
        }

        set({ snake: newSnake });

        // Randomly spawn power-ups
        if (Math.random() < 0.02 && state.powerUps.length < 2) { // 2% chance
          set({ powerUps: [...state.powerUps, generatePowerUp()] });
        }
      },

      collectFood: (foodIndex) => {
        const state = get();
        const food = state.food[foodIndex];
        const newFood = state.food.filter((_, index) => index !== foodIndex);
        
        // Add new food
        newFood.push(generateFood());

        const newScore = state.score + food.points;
        const newLevel = Math.floor(newScore / 100) + 1;

        set({
          food: newFood,
          score: newScore,
          level: newLevel,
        });
      },

      collectPowerUp: (powerUpIndex) => {
        const state = get();
        const powerUp = state.powerUps[powerUpIndex];
        const newPowerUps = state.powerUps.filter((_, index) => index !== powerUpIndex);

        set({
          powerUps: newPowerUps,
          activePowerUps: [...state.activePowerUps, powerUp],
        });

        // Remove power-up after duration
        setTimeout(() => {
          const currentState = get();
          set({
            activePowerUps: currentState.activePowerUps.filter(p => p !== powerUp),
          });
        }, powerUp.duration);
      },

      updateSettings: (newSettings) => {
        const state = get();
        set({
          settings: { ...state.settings, ...newSettings },
        });
      },

      addToLeaderboard: (entry) => {
        const state = get();
        const newEntry: LeaderboardEntry = {
          ...entry,
          id: Date.now().toString(),
        };

        const newLeaderboard = [...state.leaderboard, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep top 10

        set({ leaderboard: newLeaderboard });
      },

      toggleSettings: () => {
        const state = get();
        set({ showSettings: !state.showSettings });
      },

      toggleLeaderboard: () => {
        const state = get();
        set({ showLeaderboard: !state.showLeaderboard });
      },

      resetGame: () => {
        set({
          gameState: 'menu',
          snake: [{ x: 10, z: 10 }],
          direction: 'right',
          score: 0,
          level: 1,
          lives: 3,
          food: [generateFood()],
          powerUps: [],
          activePowerUps: [],
          showSettings: false,
          showLeaderboard: false,
        });
      },
    }),
    {
      name: 'snake-game-storage',
      partialize: (state) => ({
        highScore: state.highScore,
        settings: state.settings,
        leaderboard: state.leaderboard,
      }),
    }
  )
);
