import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { GameState, GamePhase, GameMode, GameContextType, Player, ChatMessage, NetworkState, NetworkMessage, PlayerProfile, CampaignPacing, CampaignPacingKey } from '../types';
import { geminiService } from '../services/geminiService';
import Peer, { DataConnection } from 'peerjs';
import { agentService } from '../services/AgentService';

const PACE_PRESETS: Record<CampaignPacingKey, CampaignPacing> = {
  'quick-bite': {
    key: 'quick-bite',
    name: 'Quick Bite',
    averageLabel: 'about 1 hour on average',
    averageMinutes: 60,
    minScenes: 3,
    maxScenes: 4,
    branchingFactor: 2,
    sideQuestBudget: 1
  },
  'table-talk': {
    key: 'table-talk',
    name: 'Table Talk',
    averageLabel: 'about 2–3 hours on average',
    averageMinutes: 150,
    minScenes: 5,
    maxScenes: 7,
    branchingFactor: 3,
    sideQuestBudget: 2
  },
  'feast': {
    key: 'feast',
    name: 'Feast',
    averageLabel: 'several sessions on average',
    averageMinutes: 360,
    minScenes: 9,
    maxScenes: 14,
    branchingFactor: 4,
    sideQuestBudget: 4
  }
};

const defaultPacing = PACE_PRESETS['table-talk'];
const SAVE_KEY = 'pizza_dragons_state';
const SNAPSHOT_KEY = 'pizza_dragons_snapshot';
const CHAPTER_KEY = 'pizza_dragons_campaign';

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
  campaignPacing: defaultPacing,
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

const safeParseState = (value: string | null): Partial<GameState> | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as Partial<GameState>;
  } catch {
    return null;
  }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    const saved = safeParseState(localStorage.getItem(SAVE_KEY));
    return { ...defaultState, ...(saved || {}), campaignPacing: saved?.campaignPacing || defaultPacing };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState<NetworkState>({
    isHost: false,
    roomId: null,
    peerId: null,
    connected: false
  });
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);
  const stateRef = useRef<GameState>(state);
  const snapshotRef = useRef<GameState>(state);
  const saveTimerRef = useRef<number | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);

  useEffect(() => {
    stateRef.current = state;
    snapshotRef.current = state;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
        updatedAt: Date.now(),
        state: stateRef.current
      }));
    }, 1500);
    if (network.isHost && network.connected) {
      broadcast({ type: 'SYNC_STATE', payload: state });
    }
  }, [state, network.isHost, network.connected]);

  useEffect(() => {
    const peers = connectionsRef.current.filter(c => c.open).map(c => c.peerId);
    setConnectedPeers(peers);
  }, [state]);

  useEffect(() => {
    if (state.phase !== GamePhase.PLAYING) return;
    if (state.isProcessingTurn) return;

    const currentPlayer = state.players.find(p => p.id === state.currentTurnPlayerId);
    if (!currentPlayer) return;

    const isPlayerConnected = connectedPeers.includes(currentPlayer.id) || currentPlayer.id === myPlayerId;
    if (!isPlayerConnected) {
      console.log(`Player ${currentPlayer.name} is offline. Triggering AI Agent.`);
      handleAgentTurn(currentPlayer);
    }
  }, [state.currentTurnPlayerId, connectedPeers, state.phase]);

  const broadcast = (msg: NetworkMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  const sendToHost = (msg: NetworkMessage) => {
    const conn = connectionsRef.current[0];
    if (conn && conn.open) conn.send(msg);
  };

  const persistSnapshot = (nextState: GameState) => {
    snapshotRef.current = nextState;
    localStorage.setItem(SAVE_KEY, JSON.stringify(nextState));
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      updatedAt: Date.now(),
      state: nextState
    }));
  };

  const pushState = (nextState: GameState, broadcastState = true) => {
    setState(nextState);
    persistSnapshot(nextState);
    if (broadcastState) {
      broadcast({ type: 'SYNC_STATE', payload: nextState });
    }
  };

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
        console.error('Peer Error:', err);
        reject(err);
      });
    });
  };

  const setCampaignPacing = (pacingKey: CampaignPacingKey) => {
    const pacing = PACE_PRESETS[pacingKey] || defaultPacing;
    pushState({ ...stateRef.current, campaignPacing: pacing }, true);
  };

  const hostGame = async (profile: PlayerProfile, theme: string): Promise<string> => {
    const peer = await initializePeer();
    setNetwork(prev => ({ ...prev, isHost: true, roomId: peer.id }));

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
    pushState({ ...stateRef.current, players: [...stateRef.current.players, newPlayer] }, true);

    const envKey = process.env.API_KEY || '';
    if (!envKey) {
      console.warn('API_KEY not found in environment variables. Game may not function correctly.');
    }
    geminiService.initialize(envKey);

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        connectionsRef.current.push(conn);
        conn.send({ type: 'SYNC_STATE', payload: stateRef.current });
      });

      conn.on('data', (data: any) => {
        handleHostMessage(data as NetworkMessage);
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
      });
    });

    setIsLoading(true);
    await generateCampaign(theme);
    return peer.id;
  };

  const joinGame = async (roomId: string, profile: PlayerProfile) => {
    const peer = await initializePeer();
    setNetwork(prev => ({ ...prev, isHost: false, roomId }));

    const conn = peer.connect(roomId);
    connectionsRef.current = [conn];

    return new Promise<void>((resolve, reject) => {
      conn.on('open', () => {
        const pid = peer.id || Date.now().toString();
        setMyPlayerId(pid);

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
        console.error('Connection Error', err);
        reject(err);
      });
    });
  };

  const handleHostMessage = async (msg: NetworkMessage) => {
    switch (msg.type) {
      case 'PLAYER_JOIN':
        pushState({
          ...stateRef.current,
          players: [...stateRef.current.players, msg.payload],
          messages: [...stateRef.current.messages, {
            id: Date.now().toString(),
            sender: 'system',
            text: `${msg.payload.name} arrives at the tavern.` ,
            timestamp: Date.now(),
            channel: 'party'
          }]
        });
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
      case 'PARTY_CHAT':
        pushState({
          ...stateRef.current,
          messages: [...stateRef.current.messages, {
            id: Date.now().toString(),
            sender: 'party',
            playerName: msg.payload.playerName,
            text: msg.payload.text,
            timestamp: Date.now(),
            channel: 'party'
          }]
        });
        break;
    }
  };

  const handleClientMessage = (msg: NetworkMessage) => {
    if (msg.type === 'SYNC_STATE') {
      pushState(msg.payload, false);
    }
  };

  const generateCampaign = async (theme: string) => {
    if (!network.isHost && network.connected) return;
    setIsLoading(true);

    try {
      const campaign = await geminiService.generateFullCampaign(theme);
      pushState({ ...stateRef.current, campaign }, true);
      console.log('Campaign generated:', campaign.title);
    } catch (e) {
      console.error('Campaign gen failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async () => {
    if (!network.isHost && network.connected) return;
    setIsLoading(true);

    const location = await getGeoLocation();
    let introText = '';
    let campaign = stateRef.current.campaign;

    if (!campaign) {
      introText = await geminiService.startMovie(stateRef.current.players, location);
      campaign = {
        title: 'The Unwritten Chronicle',
        intro: introText,
        startSceneId: 'prologue',
        scenes: {
          prologue: {
            id: 'prologue',
            title: 'The Beginning',
            description: 'The story begins...',
            encounterType: 'SOCIAL',
            options: [{ text: 'Begin', nextSceneId: 'scene_1' }]
          }
        }
      };
      generateCampaign(stateRef.current.campaignPacing.key === 'quick-bite' ? 'Classic Fantasy' : 'Classic Fantasy');
    } else {
      introText = await geminiService.startMovie(stateRef.current.players, location);
    }

    const initialText = campaign ?
      `**${campaign.title}**\n\n${campaign.intro}\n\n${introText}` :
      introText;

    const firstPlayer = [...stateRef.current.players].sort((a, b) => (b.initiativeRoll || 0) - (a.initiativeRoll || 0))[0];

    const newState = {
      ...stateRef.current,
      phase: GamePhase.PLAYING,
      mode: GameMode.CINEMATIC,
      sceneIndex: 1,
      currentSceneId: campaign?.startSceneId || 'prologue',
      players: [...stateRef.current.players].sort((a, b) => (b.initiativeRoll || 0) - (a.initiativeRoll || 0)),
      currentTurnPlayerId: firstPlayer?.id || null,
      turnCounter: 1,
      isProcessingTurn: false,
      messages: [{ id: 'intro', sender: 'dm', text: initialText, timestamp: Date.now(), isCinematic: true }]
    };

    pushState(newState, true);
    setIsLoading(false);
  };

  const sendPartyMessage = (text: string, playerId: string, playerName: string) => {
    const message = {
      id: Date.now().toString(),
      sender: 'party' as const,
      playerName,
      text,
      timestamp: Date.now(),
      channel: 'party' as const
    };

    const nextState = {
      ...stateRef.current,
      messages: [...stateRef.current.messages, message]
    };

    pushState(nextState, true);
    sendToHost({
      type: 'PARTY_CHAT',
      payload: { text, playerId, playerName }
    });
  };

  const sendPlayerAction = async (text: string, playerId: string, channel: 'narrative' | 'meta' = 'narrative') => {
    if (playerId !== stateRef.current.currentTurnPlayerId) {
      console.warn('Not your turn!');
      return;
    }

    if (stateRef.current.isProcessingTurn) {
      console.warn('Turn already processing!');
      return;
    }

    setIsLoading(true);
    const player = stateRef.current.players.find(p => p.id === playerId);

    if (channel === 'meta') {
      const newState = {
        ...stateRef.current,
        messages: [...stateRef.current.messages, {
          id: Date.now().toString(),
          sender: 'meta',
          playerName: player?.name,
          text,
          timestamp: Date.now(),
          channel: 'meta'
        }]
      };
      pushState(newState, true);
      return;
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    const boostedRoll = roll + (player ? player.level - 1 : 0);

    const optimisticState = {
      ...stateRef.current,
      isProcessingTurn: true,
      messages: [...stateRef.current.messages, {
        id: Date.now().toString(),
        sender: 'player',
        playerName: player?.name || 'Actor',
        text: text,
        timestamp: Date.now(),
        diceRoll: boostedRoll
      }],
      players: stateRef.current.players.map(p => p.id === playerId ? { ...p, contributions: p.contributions + 1 } : p)
    };
    pushState(optimisticState, true);

    const location = await getGeoLocation();
    const response = await geminiService.resolveActionAndCut(
      `[Roll: ${boostedRoll}] ${text}`,
      Math.max(...stateRef.current.players.map(p => p.level)),
      location
    );
    parseInventoryUpdate(response.text);

    const currentPlayerIndex = stateRef.current.players.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % stateRef.current.players.length;
    const nextPlayer = stateRef.current.players[nextPlayerIndex];

    let nextSceneId = null;
    if (stateRef.current.campaign && stateRef.current.currentSceneId) {
      const currentScene = stateRef.current.campaign.scenes[stateRef.current.currentSceneId];
      if (currentScene.options && currentScene.options.length > 0) {
        nextSceneId = currentScene.options[0].nextSceneId;
      }
    }

    if (nextSceneId && stateRef.current.campaign && !stateRef.current.campaign.scenes[nextSceneId]) {
      setTimeout(() => expandStoryBranch(stateRef.current.currentSceneId || ''), 1000);
    }

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
      mode: optimisticState.sceneIndex < Math.max(4, stateRef.current.campaignPacing.minScenes) ? GameMode.MONTAGE : GameMode.CINEMATIC,
      montage: {
        ...optimisticState.montage,
        step: 'MINIGAME'
      },
      currentTurnPlayerId: nextPlayer.id,
      turnCounter: stateRef.current.turnCounter + 1,
      isProcessingTurn: false,
      currentSceneId: nextSceneId || optimisticState.currentSceneId
    };

    pushState(finalState, true);
    setIsLoading(false);
  };

  const completeMinigame = async (successCount: number) => {
    const levelsGained = successCount > 0 ? 1 : 0;
    const newState = {
      ...stateRef.current,
      players: stateRef.current.players.map(p => ({ ...p, level: p.level + levelsGained })),
      messages: [...stateRef.current.messages, {
        id: Date.now().toString(),
        sender: 'system',
        text: `MONTAGE TRAINING COMPLETE: Party gained ${levelsGained} Level(s). Now entering Story Mode...`,
        timestamp: Date.now()
      }],
      montage: {
        ...stateRef.current.montage,
        step: 'STORY_DECISION',
        queue: [...stateRef.current.players.map(p => p.id)],
        activePlayerId: null
      }
    };

    pushState(newState, true);
    await startNextMontageTurn([...stateRef.current.players.map(p => p.id)]);
  };

  const startNextMontageTurn = async (queue: string[]) => {
    if (queue.length === 0) {
      finishMontage();
      return;
    }
    const nextPlayerId = queue[0];
    const player = stateRef.current.players.find(p => p.id === nextPlayerId);
    if (!player) return;

    setIsLoading(true);
    const scenario = await geminiService.getMontageSituation(player.name, player.class);

    pushState({
      ...stateRef.current,
      montage: {
        ...stateRef.current.montage,
        activePlayerId: nextPlayerId,
        queue: queue,
        currentPrompt: scenario.text,
        options: scenario.options
      }
    }, true);
    setIsLoading(false);
  };

  const makeMontageDecision = async (choice: string) => {
    const player = stateRef.current.players.find(p => p.id === stateRef.current.montage.activePlayerId);
    if (!player) return;

    setIsLoading(true);
    const resolution = await geminiService.resolveMontageChoice(player.name, choice);
    parseInventoryUpdate(resolution);

    const newState = {
      ...stateRef.current,
      messages: [...stateRef.current.messages, {
        id: Date.now().toString(),
        sender: 'dm',
        text: `**${player.name}** chose: "${choice}"\nResult: ${resolution}`,
        timestamp: Date.now(),
        isCinematic: true
      }],
      players: stateRef.current.players.map(p => p.id === player.id ? { ...p, contributions: p.contributions + 1 } : p)
    };

    pushState(newState, true);

    const remainingQueue = stateRef.current.montage.queue.slice(1);
    await startNextMontageTurn(remainingQueue);
  };

  const finishMontage = async () => {
    setIsLoading(true);
    const nextSceneIdx = stateRef.current.sceneIndex + 1;
    const location = await getGeoLocation();
    const nextSceneText = await geminiService.generateNextScene(nextSceneIdx, location);

    const newState = {
      ...stateRef.current,
      sceneIndex: nextSceneIdx,
      mode: GameMode.CINEMATIC,
      messages: [...stateRef.current.messages, {
        id: Date.now().toString(),
        sender: 'dm',
        text: nextSceneText,
        timestamp: Date.now(),
        isCinematic: true
      }]
    };

    pushState(newState, true);
    setIsLoading(false);
  };

  const handleAgentTurn = async (player: Player) => {
    setIsLoading(true);

    const action = await agentService.generateAction(player, stateRef.current.messages, `Scene ${stateRef.current.sceneIndex}`);
    await sendPlayerAction(action, player.id);
    setIsLoading(false);
  };

  const getGeoLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch {
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
      setState(prev => {
        const updated = {
          ...prev,
          pizza: {
            ...prev.pizza,
            toppings: [...prev.pizza.toppings, ...newToppings]
          }
        };
        persistSnapshot(updated);
        return updated;
      });
    }
  };

  const resetGame = () => {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SNAPSHOT_KEY);
    localStorage.removeItem(CHAPTER_KEY);
    window.location.reload();
  };

  const finishGame = () => {
    const newState = { ...stateRef.current, phase: GamePhase.ORDER_SUMMARY };
    pushState(newState, true);
  };

  const expandStoryBranch = async (currentSceneId: string) => {
    if (!network.isHost && network.connected) return;
    setIsLoading(true);

    const currentScene = stateRef.current.campaign?.scenes[currentSceneId];
    if (!currentScene) {
      setIsLoading(false);
      return;
    }

    const prompt = `
     The party has just arrived at: "${currentScene.title}".
     They are now facing the next challenge.
     Generate ${stateRef.current.campaignPacing.branchingFactor} distinct choices and the immediate NEXT scene for EACH choice.
     The campaign pacing target is ${stateRef.current.campaignPacing.averageLabel}.
     Output JSON:
     {
       "newScenes": [
         { "id": "scene_3_A", "title": "...", "description": "...", "encounterType": "...", "options": [...] }
       ]
     }
     `;

    try {
      const response = await geminiService.ai?.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response?.text || '{}');
      const newScenes = data.newScenes || [];
      const updatedScenes = { ...stateRef.current.campaign?.scenes };
      newScenes.forEach((s: any) => {
        updatedScenes[s.id] = s;
      });

      pushState({
        ...stateRef.current,
        campaign: stateRef.current.campaign ? { ...stateRef.current.campaign, scenes: updatedScenes } : null
      }, true);
    } catch (err) {
      console.error('Failed to expand story branch', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: GameContextType = {
    state,
    network,
    hostGame,
    joinGame,
    generateCampaign,
    startGame,
    sendPlayerAction,
    sendPartyMessage,
    completeMinigame,
    makeMontageDecision,
    resetGame,
    finishGame,
    setCampaignPacing,
    isLoading,
    myPlayerId,
    expandStoryBranch
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};