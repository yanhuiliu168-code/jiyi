import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Game1Record {
  score: number;      // 得分
  timeSpent: number;  // 花费时间 (秒)
  timestamp: number;  // 记录时间
  level: number;      // 关卡
  userId?: number;    // 用户ID
}

export interface Game2Record {
  score: number;      // 记住了多少张
  timeSpent: number;  // 花费时间 (秒)
  timestamp: number;  // 记录时间
  level?: number;
  difficulty?: 'normal' | 'hard';
  userId?: number;    // 用户ID
}

export interface Game3Record {
  score: number;      // 得分
  timeSpent: number;  // 花费时间 (秒)
  timestamp: number;  // 记录时间
  level: number;      // 关卡
  difficulty?: 'normal' | 'hard';
  userId?: number;    // 用户ID
}

interface GameState {
  battery: number;
  reviveItems: number; // 记忆沙漏（复活道具）
  game1Level: number;
  game2Level: number; // For backwards compatibility or other uses
  game3Level: number;
  game1Progress: number; // consecutive passes to unlock next level
  game2MaxCombo: number; // max consecutive cards
  game3Progress: number;
  game1Records: Game1Record[]; // 闪卡记忆训练的历史记录
  game2Records: Game2Record[]; // 连续记忆训练的历史记录
  game3Records: Game3Record[]; // 视觉注意力训练的历史记录
  serverConfig: any; // store fetched config from server
  game1Config: {
    roundsPerLevel: number; // 每一关有多少局，可由后台配置，默认 5 局
    levels: { level: number; flash: number; time: number; inter: number; rounds?: number; difficulty: string; desc: string }[];
  };
  game2Config: {
    memorizeTime: number; // 倒计时时间(秒)，默认3秒，可配置
    levels: { level: number; cardsPerTurn: number }[]; // 关卡配置
  };
  game3Config: {
    roundsPerLevel: number;
    levels: { level: number; displayTime: number; optionsCount: number; rounds?: number; difficulty: string; desc: string }[];
  };
  parentConfig: {
    videoCooldown: number; // 视频冷却时间(秒)，后台可配置
  };
  user: {
    id: number | null;
    username: string | null;
    token: string | null;
  };
  settings: {
    soundEnabled: boolean;
    cardSize: 'small' | 'medium' | 'large';
    currentTheme: string;
    parentVerifiedUntil: number; // timestamp
    lastVideoWatchTime: number; // 上次观看视频的时间戳
  };
  decrementBattery: () => boolean;
  addBattery: (amount: number) => void;
  useReviveItem: () => boolean;
  addReviveItem: (amount: number) => void;
  updateGame1Progress: (passed: boolean, levelPlayed: number) => void;
  updateGame2Combo: (passed: boolean, levelPlayed: number) => void;
  updateGame3Progress: (passed: boolean, levelPlayed: number) => void;
  addGame1Record: (record: Game1Record) => void;
  addGame2Record: (record: Game2Record) => void;
  addGame3Record: (record: Game3Record) => void;
  verifyParent: () => void;
  updateSettings: (settings: Partial<GameState['settings']>) => void;
  setServerConfig: (config: any) => void;
  updateGame1Config: (config: Partial<GameState['game1Config']>) => void;
  updateGame2Config: (config: Partial<GameState['game2Config']>) => void;
  updateGame3Config: (config: Partial<GameState['game3Config']>) => void;
  updateParentConfig: (config: Partial<GameState['parentConfig']>) => void;
  setUser: (user: Partial<GameState['user']>) => void;
  logout: () => void;
  resetProgress: () => void;
}

export const useStore = create<GameState>()(
  persist(
    (set, get) => ({
      battery: 20,
      reviveItems: 3, // Initial value
      game1Level: 1,
      game2Level: 1,
      game3Level: 1,
      game1Progress: 0,
      game2MaxCombo: 0,
      game3Progress: 0,
      game1Records: [],
      game2Records: [],
      game3Records: [],
      serverConfig: null,
      game1Config: {
        roundsPerLevel: 5,
        levels: [
          { level: 1, flash: 1, time: 3000, inter: 4, rounds: 5, difficulty: '⭐', desc: '1张目标图片，在4个选项中选择' },
          { level: 2, flash: 2, time: 3000, inter: 6, rounds: 5, difficulty: '⭐⭐', desc: '2张目标图片，在6个选项中选择' },
          { level: 3, flash: 3, time: 2000, inter: 8, rounds: 5, difficulty: '⭐⭐⭐', desc: '3张目标图片，在8个选项中选择' },
          { level: 4, flash: 4, time: 2000, inter: 8, rounds: 5, difficulty: '⭐⭐⭐⭐', desc: '4张目标图片，在8个选项中选择' },
          { level: 5, flash: 5, time: 1000, inter: 10, rounds: 5, difficulty: '⭐⭐⭐⭐⭐', desc: '5张目标图片，在10个选项中选择' },
        ],
      },
      game2Config: {
        memorizeTime: 3,
        levels: [
          { level: 1, cardsPerTurn: 1 },
          { level: 2, cardsPerTurn: 2 },
          { level: 3, cardsPerTurn: 3 },
          { level: 4, cardsPerTurn: 4 },
          { level: 5, cardsPerTurn: 5 },
        ],
      },
      game3Config: {
        roundsPerLevel: 5,
        levels: [
          { level: 1, displayTime: 3000, optionsCount: 4, difficulty: '⭐', desc: '显示3秒，从4个选项中找出原图' },
          { level: 2, displayTime: 2000, optionsCount: 4, difficulty: '⭐⭐', desc: '显示2秒，从4个选项中找出原图' },
          { level: 3, displayTime: 2000, optionsCount: 6, difficulty: '⭐⭐⭐', desc: '显示2秒，从6个选项中找出原图' },
          { level: 4, displayTime: 1000, optionsCount: 6, difficulty: '⭐⭐⭐⭐', desc: '显示1秒，从6个选项中找出原图' },
          { level: 5, displayTime: 1000, optionsCount: 8, difficulty: '⭐⭐⭐⭐⭐', desc: '显示1秒，从8个选项中找出原图' },
        ],
      },
      parentConfig: {
        videoCooldown: 3600, // 默认冷却时间 3600 秒 (1小时)
      },
      user: {
        id: null,
        username: null,
        token: null,
      },
      settings: {
        soundEnabled: true,
        cardSize: 'medium',
        currentTheme: 'animals',
        parentVerifiedUntil: 0,
        lastVideoWatchTime: 0,
      },
      decrementBattery: () => {
        const { battery } = get();
        if (battery > 0) {
          set({ battery: battery - 1 });
          return true;
        }
        return false;
      },
      addBattery: (amount: number) => {
        set((state) => ({ battery: state.battery + amount }));
      },
      useReviveItem: () => {
        const { reviveItems } = get();
        if (reviveItems > 0) {
          set({ reviveItems: reviveItems - 1 });
          return true;
        }
        return false;
      },
      addReviveItem: (amount: number) => {
        set((state) => ({ reviveItems: state.reviveItems + amount }));
      },
      updateGame1Progress: (passed: boolean, levelPlayed: number) => {
        if (!passed) return;
        const state = get();
        // Since we check the rounds internally in Game1.tsx, calling this means the level was fully completed
        if (levelPlayed === state.game1Level) {
          set({ game1Level: state.game1Level + 1 });
        }
      },
      updateGame2Combo: (passed: boolean, levelPlayed: number) => {
        if (!passed) return;
        const state = get();
        if (levelPlayed === state.game2Level) {
          set({ game2Level: state.game2Level + 1 });
        }
      },
      updateGame3Progress: (passed: boolean, levelPlayed: number) => {
        if (!passed) return;
        const state = get();
        if (levelPlayed === state.game3Level) {
          set({ game3Level: state.game3Level + 1 });
        }
      },
      addGame1Record: (record: Game1Record) => {
        const { user } = get();
        set((state) => ({
          game1Records: [{ ...record, userId: user.id || undefined }, ...(state.game1Records || [])],
        }));
      },
      addGame2Record: (record: Game2Record) => {
        const { user } = get();
        set((state) => ({
          game2Records: [{ ...record, userId: user.id || undefined }, ...(state.game2Records || [])],
        }));
      },
      addGame3Record: (record: Game3Record) => {
        const { user } = get();
        set((state) => ({
          game3Records: [{ ...record, userId: user.id || undefined }, ...(state.game3Records || [])],
        }));
      },
      verifyParent: () => {
        // No longer storing a 24-hour timestamp, verification is per-session/per-entry now
      },
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      setServerConfig: (config: any) => {
        set({ serverConfig: config });
      },
      updateGame1Config: (config) => {
        set((state) => ({ game1Config: { ...state.game1Config, ...config } }));
      },
      updateGame2Config: (config) => {
        set((state) => ({ game2Config: { ...state.game2Config, ...config } }));
      },
      updateGame3Config: (config) => {
        set((state) => ({ game3Config: { ...state.game3Config, ...config } }));
      },
      updateParentConfig: (config) => {
        set((state) => ({ parentConfig: { ...state.parentConfig, ...config } }));
      },
      setUser: (user) => {
        set((state) => ({ 
          user: { ...state.user, ...user },
          // Reset parent verification when user changes (e.g. login)
          settings: { ...state.settings, parentVerifiedUntil: 0 },
          // Ensure new users start at level 1 if they just logged in
          game1Level: 1,
          game2Level: 1,
          game3Level: 1,
          game1Progress: 0,
          game2MaxCombo: 0,
          game3Progress: 0,
        }));
      },
      logout: () => {
        set((state) => ({ 
          user: { id: null, username: null, token: null },
          // Reset parent verification on logout
          settings: { ...state.settings, parentVerifiedUntil: 0 }
        }));
      },
      resetProgress: () => {
        set({
          battery: 20,
          reviveItems: 3,
          game1Level: 1,
          game2Level: 1,
          game3Level: 1,
          game1Progress: 0,
          game2MaxCombo: 0,
          game3Progress: 0,
        });
      },
    }),
    {
      name: 'memory-game-storage',
    }
  )
);
