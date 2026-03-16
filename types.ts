export enum GamePhase {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  ORDER_SUMMARY = 'ORDER_SUMMARY'
}

export enum GameMode {
  CINEMATIC = 'CINEMATIC', // Reading story / Entering action
  MONTAGE = 'MONTAGE'      // Mini-game & Decision making
}

export interface PlayerStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Player {
  id: string;
  name: string;
  race: string;
  class: string;
  age: number;
  stats: PlayerStats;
  description: string;
  contributions: number;
  level: number;
  isHost?: boolean;
}

export interface PlayerProfile {
  name: string;
  race: string;
  class: string;
  age: number;
  stats: PlayerStats;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'dm' | 'player' | 'system';
  playerName?: string;
  text: string;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
  diceRoll?: number;
  isCinematic?: boolean;
}

export interface GroundingMetadata {
  groundingChunks?: {
    web?: { uri: string; title: string };
    maps?: { 
      uri: string; 
      title: string;
      placeAnswerSources?: { reviewSnippets?: { content: string }[] }[]
    };
  }[];
}

export interface PizzaState {
  toppings: string[];
  size: string;
  crust: string;
  sides: string[];
  totalGoldCost: number;
}

export interface MontageState {
  step: 'MINIGAME' | 'STORY_DECISION';
  queue: string[]; // List of Player IDs waiting to make a decision
  activePlayerId: string | null;
  currentPrompt: string;
  options: string[];
}

// --- Story Engine Types ---
export interface StoryOption {
  text: string;
  nextSceneId: string;
  requiredClass?: string; // Optional: Only certain classes can see/take this
}

export interface StoryScene {
  id: string;
  title: string;
  description: string;
  encounterType: 'COMBAT' | 'PUZZLE' | 'SOCIAL' | 'FINALE';
  reward?: string; // Pizza topping/side
  options: StoryOption[];
}

export interface Campaign {
  title: string;
  intro: string;
  startSceneId: string;
  scenes: Record<string, StoryScene>; // Map ID -> Scene
}

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  sceneIndex: number;
  players: Player[];
  messages: ChatMessage[];
  pizza: PizzaState;
  montage: MontageState;
  campaign: Campaign | null; // The pre-generated story
  currentSceneId: string | null;
  // NEW: Turn Management
  currentTurnPlayerId: string | null; // Who can act right now?
  turnCounter: number; // Global incrementing counter for sync
  isProcessingTurn: boolean; // Lock for AI generation
}

// --- Networking Types ---
export interface NetworkState {
  isHost: boolean;
  roomId: string | null;
  peerId: string | null;
  connected: boolean;
}

export type NetworkMessage = 
  | { type: 'SYNC_STATE'; payload: GameState }
  | { type: 'PLAYER_JOIN'; payload: Player }
  | { type: 'PLAYER_ACTION'; payload: { text: string; playerId: string } }
  | { type: 'MONTAGE_DECISION'; payload: { choice: string; playerId: string } }
  | { type: 'MINIGAME_COMPLETE'; payload: { score: number } };

export interface GameContextType {
  state: GameState;
  network: NetworkState;
  // Actions
  hostGame: (profile: PlayerProfile) => Promise<string>;
  joinGame: (roomId: string, profile: PlayerProfile) => Promise<void>;
  generateCampaign: (theme: string) => Promise<void>;
  startGame: () => void;
  sendPlayerAction: (text: string, playerId: string) => Promise<void>;
  completeMinigame: (successCount: number) => void;
  makeMontageDecision: (choice: string) => void;
  resetGame: () => void;
  finishGame: () => void;
  isLoading: boolean;
  myPlayerId: string | null;
}