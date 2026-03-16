import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { GameState, GamePhase, GameMode, GameContextType, Player, ChatMessage, NetworkState, NetworkMessage, PlayerProfile } from '../types';
import { geminiService } from '../services/geminiService';
import Peer, { DataConnection } from 'peerjs';

const defaultState: GameState = {
  phase: GamePhase.LOBBY,
  mode: GameMode.CINEMATIC,
  sceneIndex: 0,
  players: [],
  messages: [],
  pizza: {
    toppings: [],
    size: 'Large',
    crust: 'Hand Tossed',
    sides: [],
    totalGoldCost: 0
  },
  montage: {
    step: 'MINIGAME',
    queue: [],
    activePlayerId: null,
    currentPrompt: '',
    options: []
  },
  campaign: null,
  currentSceneId: null,
  currentTurnPlayerId: null,
  turnCounter: 0,
  isProcessingTurn: false
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(defaultState);
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState<NetworkState>({
    isHost: false, // Kept for UI only, logic is now distributed
    roomId: null,
    peerId: null,
    connected: false
  });
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  // Refs for networking to avoid stale closures in callbacks
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const stateRef = useRef<GameState>(state);

  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = state;
    // If we are host, broadcast state on change (debounced slightly in real app, but direct here)
    if (network.isHost && network.connected) {
      broadcast({ type: 'SYNC_STATE', payload: state });
    }
  }, [state, network.isHost, network.connected]);

  // --- Networking Helpers ---
  // Now we broadcast to ALL peers, not just "clients"
  const broadcast = (msg: NetworkMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  const sendToHost = (msg: NetworkMessage) => {
    const conn = connectionsRef.current[0]; // Clients only have one connection (to host)
    if (conn && conn.open) conn.send(msg);
  };

  // --- Initialization & Peer Setup ---

  const initializePeer = async (): Promise<Peer> => {
    const { Peer } = await import('peerjs');
    const peer = new Peer(undefined as any, { debug: 1 });
    peerRef.current = peer;
    
    return new Promise((resolve, reject) => {
      peer.on('open', (id) => {
        setNetwork(prev => ({ ...prev, peerId: id, connected: true }));
        resolve(peer);
      });
      peer.on('error', (err) => {
        console.error("Peer Error:", err);
        reject(err);
      });
    });
  };

  const hostGame = async (profile: PlayerProfile): Promise<string> => {
    const peer = await initializePeer();
    setNetwork(prev => ({ ...prev, isHost: true, roomId: peer.id }));
    
    // Add Host Player Locally
    const newPlayer: Player = {
        id: peer.id, 
        name: profile.name,
        race: profile.race,
        class: profile.class,
        age: profile.age,
        stats: profile.stats,
        description: profile.description,
        contributions: 0,
        level: 1,
        isHost: true
    };
    setMyPlayerId(newPlayer.id);
    setState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
    
    // Initialize Gemini Service with Env Key
    const envKey = process.env.API_KEY || '';
    if (!envKey) {
      console.warn("API_KEY not found in environment variables. Game may not function correctly.");
    }
    geminiService.initialize(envKey);
    
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        connectionsRef.current.push(conn);
        // Send immediate sync
        conn.send({ type: 'SYNC_STATE', payload: stateRef.current });
      });

      conn.on('data', (data: any) => {
        handleHostMessage(data as NetworkMessage);
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
      });
    });

    return peer.id;
  };

  const joinGame = async (roomId: string, profile: PlayerProfile) => {
    const peer = await initializePeer();
    setNetwork(prev => ({ ...prev, isHost: false, roomId }));

    const conn = peer.connect(roomId);
    connectionsRef.current = [conn];

    return new Promise<void>((resolve, reject) => {
      conn.on('open', () => {
        // Create local player ID
        const pid = peer.id || Date.now().toString();
        setMyPlayerId(pid);
        
        // Send Join Request
        const newPlayer: Player = {
          id: pid,
          name: profile.name,
          race: profile.race,
          class: profile.class,
          age: profile.age,
          stats: profile.stats,
          description: profile.description,
          contributions: 0,
          level: 1,
          isHost: false
        };

        conn.send({ 
          type: 'PLAYER_JOIN', 
          payload: newPlayer
        });
        resolve();
      });

      conn.on('data', (data: any) => {
        handleClientMessage(data as NetworkMessage);
      });

      conn.on('error', (err) => {
        console.error("Connection Error", err);
        reject(err);
      });
    });
  };

  // --- Message Handling ---

  const handleHostMessage = async (msg: NetworkMessage) => {
    switch (msg.type) {
      case 'PLAYER_JOIN':
        setState(prev => ({
          ...prev,
          players: [...prev.players, msg.payload]
        }));
        break;
      case 'PLAYER_ACTION':
        await sendPlayerAction(msg.payload.text, msg.payload.playerId);
        break;
      case 'MONTAGE_DECISION':
        await makeMontageDecision(msg.payload.choice);
        break;
      case 'MINIGAME_COMPLETE':
        await completeMinigame(msg.payload.score);
        break;
    }
  };

  const handleClientMessage = (msg: NetworkMessage) => {
    if (msg.type === 'SYNC_STATE') {
      setState(msg.payload);
    }
  };

  // --- Host Logic Removed: Now everyone can do this ---
  const generateCampaign = async (theme: string) => {
    setIsLoading(true);
    const campaign = await geminiService.generateFullCampaign(theme);
    setState(prev => ({ ...prev, campaign }));
    
    // Broadcast the new campaign to the mesh
    broadcast({ type: 'SYNC_STATE', payload: { ...state, campaign } });
    setIsLoading(false);
  };

  const startGame = async () => {
    setIsLoading(true);
    const location = await getGeoLocation();
    const introText = await geminiService.startMovie(
      state.players,
      location
    );
    const initialText = state.campaign ? 
      `**${state.campaign.title}**\n\n${state.campaign.intro}\n\n${introText}` : 
      introText;

    // Initialize turn: First player in the list starts
    const firstPlayer = state.players[0];
    const newState = { 
      ...state, 
      phase: GamePhase.PLAYING, 
      mode: GameMode.CINEMATIC, 
      sceneIndex: 1, 
      currentSceneId: state.campaign?.startSceneId || '1',
      currentTurnPlayerId: firstPlayer?.id || null, // Start turn with first player
      turnCounter: 1,
      messages: [{ id: 'intro', sender: 'dm', text: initialText, timestamp: Date.now(), isCinematic: true }] 
    };
    setState(newState);
    broadcast({ type: 'SYNC_STATE', payload: newState });
    setIsLoading(false);
  };

  const sendPlayerAction = async (text: string, playerId: string) => {
    // TURN LOCK: Only the active player can act
    if (playerId !== state.currentTurnPlayerId) {
      console.warn("Not your turn!");
      return; // Ignore action
    }

    // Lock the turn
    if (state.isProcessingTurn) {
      console.warn("Turn already processing!");
      return;
    }

    setIsLoading(true);
    const roll = Math.floor(Math.random() * 20) + 1;
    const player = state.players.find(p => p.id === playerId);
    const boostedRoll = roll + (player ? player.level - 1 : 0);

    // Optimistic update with turn lock
    const optimisticState = {
      ...state,
      isProcessingTurn: true, // Lock
      messages: [...state.messages, {
        id: Date.now().toString(),
        sender: 'player',
        playerName: player?.name || 'Actor',
        text: text,
        timestamp: Date.now(),
        diceRoll: boostedRoll
      }],
      players: state.players.map(p => p.id === playerId ? { ...p, contributions: p.contributions + 1 } : p)
    };
    setState(optimisticState);

    // AI Resolution (Local)
    const location = await getGeoLocation();
    const response = await geminiService.resolveActionAndCut(
      `[Roll: ${boostedRoll}] ${text}`,
      Math.max(...state.players.map(p => p.level)),
      location
    );
    parseInventoryUpdate(response.text);

    // Determine next player (simple round-robin for now)
    const currentPlayerIndex = state.players.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    const nextPlayer = state.players[nextPlayerIndex];

    const finalState = {
      ...optimisticState,
      messages: [...optimisticState.messages, {
        id: (Date.now() + 1).toString(),
        sender: 'dm',
        text: response.text,
        groundingMetadata: response.groundingMetadata,
        timestamp: Date.now(),
        isCinematic: true
      }],
      mode: optimisticState.sceneIndex < 4 ? GameMode.MONTAGE : GameMode.CINEMATIC,
      montage: {
        ...optimisticState.montage,
        step: 'MINIGAME'
      },
      currentTurnPlayerId: nextPlayer.id, // Pass the token
      turnCounter: state.turnCounter + 1, // Increment turn counter
      isProcessingTurn: false // Unlock
    };

    setState(finalState);
    // Broadcast the result to the mesh
    broadcast({ type: 'SYNC_STATE', payload: finalState });
    setIsLoading(false);
  };

  const completeMinigame = async (successCount: number) => {
    // Mesh: Everyone processes locally and broadcasts
    const levelsGained = successCount > 0 ? 1 : 0;
    const newState = {
      ...state,
      players: state.players.map(p => ({ ...p, level: p.level + levelsGained })),
      messages: [...state.messages, {
        id: Date.now().toString(),
        sender: 'system',
        text: `MONTAGE TRAINING COMPLETE: Party gained ${levelsGained} Level(s). Now entering Story Mode...`,
        timestamp: Date.now()
      }],
      montage: {
        ...state.montage,
        step: 'STORY_DECISION',
        queue: [...state.players.map(p => p.id)], 
        activePlayerId: null
      }
    };

    setState(newState);
    broadcast({ type: 'SYNC_STATE', payload: newState });
    await startNextMontageTurn([...state.players.map(p => p.id)]);
  };

  const startNextMontageTurn = async (queue: string[]) => {
    if (queue.length === 0) {
      finishMontage();
      return;
    }
    const nextPlayerId = queue[0];
    const player = state.players.find(p => p.id === nextPlayerId);
    if (!player) return;

    setIsLoading(true);
    const scenario = await geminiService.getMontageSituation(player.name, player.class);

    setState(prev => ({
      ...prev,
      montage: {
        ...prev.montage,
        activePlayerId: nextPlayerId,
        queue: queue,
        currentPrompt: scenario.text,
        options: scenario.options
      }
    }));
    setIsLoading(false);
  };

  const makeMontageDecision = async (choice: string) => {
    // Mesh: Everyone processes locally and broadcasts
    const player = state.players.find(p => p.id === state.montage.activePlayerId);
    if (!player) return;

    setIsLoading(true);
    const resolution = await geminiService.resolveMontageChoice(player.name, choice);
    parseInventoryUpdate(resolution);

    const newState = {
      ...state,
      messages: [...state.messages, {
        id: Date.now().toString(),
        sender: 'dm',
        text: `**${player.name}** chose: "${choice}"\nResult: ${resolution}`,
        timestamp: Date.now(),
        isCinematic: true
      }],
      players: state.players.map(p => p.id === player.id ? { ...p, contributions: p.contributions + 1 } : p)
    };

    setState(newState);
    broadcast({ type: 'SYNC_STATE', payload: newState });

    const remainingQueue = state.montage.queue.slice(1);
    await startNextMontageTurn(remainingQueue);
  };

  const finishMontage = async () => {
    // Mesh: Everyone processes locally and broadcasts
    setIsLoading(true);
    const nextSceneIdx = state.sceneIndex + 1;
    const location = await getGeoLocation();
    const nextSceneText = await geminiService.generateNextScene(nextSceneIdx, location);

    const newState = {
      ...state,
      sceneIndex: nextSceneIdx,
      mode: GameMode.CINEMATIC,
      messages: [...state.messages, {
        id: Date.now().toString(),
        sender: 'dm',
        text: nextSceneText,
        timestamp: Date.now(),
        isCinematic: true
      }]
    };

    setState(newState);
    broadcast({ type: 'SYNC_STATE', payload: newState });
    setIsLoading(false);
  };

  // --- Helpers ---

  const getGeoLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (e) {
      return undefined;
    }
  };

  const parseInventoryUpdate = (text: string) => {
    const regex = /INVENTORY_UPDATE:\s*([^\.]+)/gi;
    let match;
    const newToppings: string[] = [];
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) newToppings.push(match[1].trim());
    }
    
    if (newToppings.length > 0) {
      setState(prev => ({
        ...prev,
        pizza: {
          ...prev.pizza,
          toppings: [...prev.pizza.toppings, ...newToppings]
        }
      }));
    }
  };

  const resetGame = () => {
     window.location.reload();
  };

  const finishGame = () => {
    // Mesh: Anyone can finish and broadcast
    const newState = { ...state, phase: GamePhase.ORDER_SUMMARY };
    setState(newState);
    broadcast({ type: 'SYNC_STATE', payload: newState });
  };

  const value: GameContextType = {
    state,
    network,
    hostGame,
    joinGame,
    generateCampaign,
    startGame,
    sendPlayerAction,
    completeMinigame,
    makeMontageDecision,
    resetGame,
    finishGame,
    isLoading,
    myPlayerId
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};