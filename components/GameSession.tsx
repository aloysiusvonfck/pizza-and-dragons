import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import { Send, MapPin, Pizza, User, Hexagon, LogOut, Clapperboard, Zap, Menu, X, Scroll as ScrollIcon, Sword, Shield, Crown } from 'lucide-react';
import { GameMode } from '../types';

// --- Styled Components ---

const GothicPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-[#050505] border-r border-[#3d3226] ${className}`}>
    {children}
  </div>
);

const GothicLogContainer: React.FC<{ children: React.ReactNode; className?: string; ref?: React.Ref<HTMLDivElement> }> = ({ children, className = "", ref }) => (
  <div ref={ref} className={`bg-[#000] p-6 font-serif text-[#cbb692] overflow-y-auto scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] ${className}`}>
    {children}
  </div>
);

// Mini-game Component: Rune Casting Style
const MontageMinigame: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  const requestRef = useRef<number>(0);

  // Animation Loop
  const animate = () => {
    setPosition(prev => {
      let next = prev + (2 * direction);
      if (next > 100 || next < 0) {
        setDirection(d => -d);
        next = prev;
      }
      return next;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [direction]);

  const handleStrike = () => {
    const hit = position >= 40 && position <= 60;
    if (hit) setScore(s => s + 1);
    
    if (attempts + 1 >= maxAttempts) {
      cancelAnimationFrame(requestRef.current);
      onComplete(hit ? score + 1 : score);
    } else {
      setAttempts(a => a + 1);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 animate-fade-in font-fantasy">
      <h2 className="text-4xl text-[#ffd700] mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">Fate Check</h2>
      <p className="text-[#8a7042] mb-12 italic font-serif">Strike when the spirit aligns...</p>
      
      <div className="w-full max-w-lg h-16 bg-[#1a0f0a] border-2 border-[#5c4d3c] relative shadow-[0_0_30px_rgba(0,0,0,1)]">
        {/* Target Zone */}
        <div className="absolute left-[40%] width-[20%] h-full bg-[#8a7042]/20 border-x border-[#ffd700] w-1/5 shadow-[0_0_15px_rgba(255,215,0,0.2)]"></div>
        
        {/* Cursor */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-[#fff] shadow-[0_0_15px_white,0_0_30px_cyan]"
          style={{ left: `${position}%` }}
        ></div>
      </div>

      <div className="mt-8 flex gap-12 text-3xl font-bold mb-12">
        <div className="text-[#ffd700]">Hits: {score}</div>
        <div className="text-gray-600">Essence: {maxAttempts - attempts}</div>
      </div>

      <button 
        onClick={handleStrike}
        className="group relative px-12 py-4 bg-[#2a0a0a] border-2 border-[#800] text-red-500 font-fantasy text-2xl tracking-widest hover:text-white hover:border-red-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-all active:scale-95"
      >
        <span className="relative z-10">CAST SPELL</span>
        <div className="absolute inset-0 bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </div>
  );
};

// Story Decision Overlay
const MontageDecision: React.FC = () => {
  const { state, makeMontageDecision, myPlayerId } = useGame();
  const { activePlayerId, currentPrompt, options } = state.montage;
  const activePlayer = state.players.find(p => p.id === activePlayerId);
  const isMyTurn = activePlayerId === myPlayerId;

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 text-center animate-fade-in overflow-y-auto">
      <div className="max-w-2xl w-full my-auto border-2 border-[#3d3226] p-8 bg-[#0a0a0a] relative">
        {/* Corner Decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#8a7042]"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#8a7042]"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#8a7042]"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#8a7042]"></div>

        <div className="mb-8">
          <div className="text-[#555] font-fantasy tracking-widest text-sm mb-2">Destiny Calls Upon</div>
          <div className="text-3xl font-fantasy text-[#ffd700]">{activePlayer?.name}</div>
        </div>

        <p className="text-xl text-[#cbb692] font-serif leading-loose italic mb-10 border-t border-b border-[#1a1a1a] py-6">
          "{currentPrompt}"
        </p>

        <div className="space-y-4">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => makeMontageDecision(opt)}
              disabled={!isMyTurn}
              className={`w-full p-4 border transition-all duration-300 font-fantasy text-lg tracking-wide
                ${isMyTurn 
                  ? 'bg-[#1a0f0a] border-[#5c4d3c] text-[#8a7042] hover:text-[#ffd700] hover:border-[#ffd700] hover:bg-[#2a1d15]' 
                  : 'bg-black border-[#222] text-gray-700 cursor-not-allowed'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        
        {!isMyTurn && (
          <div className="mt-8 text-xs text-gray-600 animate-pulse font-fantasy tracking-widest">
             Waiting for decision...
          </div>
        )}
      </div>
    </div>
  );
};

// Sidebar
const SidebarContent: React.FC = () => {
  const { state, myPlayerId } = useGame();
  return (
    <div className="flex flex-col gap-6 h-full p-4 font-serif">
      {/* Inventory Section */}
      <div>
        <h2 className="text-lg font-fantasy text-[#8a7042] mb-4 border-b border-[#3d3226] pb-2 flex items-center gap-2 uppercase tracking-widest">
          <Pizza size={18} /> Loot Stash
        </h2>
        {state.pizza.toppings.length === 0 ? (
          <p className="text-gray-700 text-sm italic text-center py-4">The bag is empty...</p>
        ) : (
          <div className="space-y-2">
            {state.pizza.toppings.map((t, i) => (
              <div key={i} className="bg-[#1a0f0a] px-3 py-2 border border-[#3d3226] text-[#cbb692] text-sm flex items-center gap-3">
                 <div className="w-1.5 h-1.5 bg-[#ffd700] rotate-45"></div>
                 {t}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Party Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h2 className="text-lg font-fantasy text-[#8a7042] mb-4 border-b border-[#3d3226] pb-2 flex items-center gap-2 uppercase tracking-widest">
          <Shield size={18} /> Fellowship
        </h2>
        <div className="space-y-3 overflow-y-auto pr-2 scrollbar-hide">
          {state.players.map(p => (
            <div key={p.id} className={`bg-[#0c0c0c] p-3 border transition-all ${p.id === myPlayerId ? 'border-[#8a7042] shadow-[0_0_10px_rgba(138,112,66,0.1)]' : 'border-[#222]'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className={`font-fantasy text-sm ${p.id === myPlayerId ? 'text-[#ffd700]' : 'text-[#999]'}`}>
                    {p.name}
                  </div>
                  <div className="text-[10px] text-gray-600 font-serif italic">{p.class} • Lvl {p.level}</div>
                </div>
                {p.isHost && <Crown size={12} className="text-[#ffd700]" />}
              </div>
              {/* HP/Exp Bar Style */}
              <div className="w-full bg-[#111] h-1 mt-2 border border-[#333]">
                <div className="bg-[#800] h-full" style={{ width: `${Math.min(100, (p.contributions / 10) * 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GameSession: React.FC = () => {
  const { state, sendPlayerAction, finishGame, completeMinigame, isLoading, myPlayerId } = useGame();
  const [inputText, setInputText] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [state.messages]);

  const handleSend = () => {
    if (inputText.trim() && !isLoading && myPlayerId) {
      sendPlayerAction(inputText, myPlayerId);
      setInputText('');
    }
  };

  const getRollColor = (roll: number) => {
    if (roll === 20) return 'text-[#ffd700] drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]';
    if (roll === 1) return 'text-red-600';
    return 'text-[#cbb692]';
  };

  const renderGroundingData = (metadata: any) => {
    if (!metadata?.groundingChunks) return null;
    const mapChunks = metadata.groundingChunks.filter((c: any) => c.maps);
    if (mapChunks.length === 0) return null;

    return (
      <div className="mt-4 ml-4 p-3 border border-[#5c4d3c] bg-[#1a0f0a] relative">
        <div className="absolute -top-1 -left-1 w-1 h-1 bg-[#8a7042]"></div>
        <div className="absolute -top-1 -right-1 w-1 h-1 bg-[#8a7042]"></div>
        <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-[#8a7042]"></div>
        <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-[#8a7042]"></div>
        
        <h4 className="text-xs font-bold text-[#8a7042] mb-2 flex items-center gap-2 uppercase tracking-widest border-b border-[#3d3226] pb-1">
          <MapPin size={12} /> Locations Discovered
        </h4>
        <div className="space-y-2 mt-2">
          {mapChunks.map((chunk: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-sm text-[#cbb692]">
              <span className="font-serif italic">{chunk.maps.title}</span>
              <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-[#ffd700] hover:text-white hover:underline transition text-xs font-fantasy tracking-wider">
                 [VIEW MAP]
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const myPlayer = state.players.find(p => p.id === myPlayerId);

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto md:flex-row overflow-hidden relative bg-black">
      
      {/* OVERLAYS */}
      {state.mode === GameMode.MONTAGE && state.montage.step === 'MINIGAME' && (
        <MontageMinigame onComplete={completeMinigame} />
      )}
      {state.mode === GameMode.MONTAGE && state.montage.step === 'STORY_DECISION' && (
        <MontageDecision />
      )}

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/90 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-[#0c0c0c] border-r border-[#3d3226] shadow-2xl" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <GothicPanel className="hidden md:flex w-80 flex-col gap-6 overflow-y-auto shrink-0 z-10">
        <SidebarContent />
      </GothicPanel>

      {/* MAIN LOG AREA */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <div className="h-16 border-b border-[#3d3226] bg-[#0c0c0c] flex items-center justify-between px-4 shrink-0 z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-[#8a7042] hover:text-[#ffd700]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <span className="font-fantasy text-[#cbb692] text-lg tracking-widest">
                Act {state.sceneIndex}
              </span>
              <span className="text-[10px] text-[#555] uppercase tracking-[0.2em]">
                {state.sceneIndex === 4 ? 'The Final Confrontation' : 'The Journey Continues'}
              </span>
            </div>
          </div>
          {myPlayer?.isHost && (
             <button onClick={finishGame} className="text-red-900 hover:text-red-600 font-fantasy text-xs border border-red-900 px-3 py-1 transition-colors uppercase tracking-widest">
               End Session
             </button>
          )}
        </div>

        {/* Quest Log (Chat) */}
        <GothicLogContainer ref={chatContainerRef} className="flex-1 space-y-8">
          {state.messages.map((msg) => (
            <div key={msg.id} className={`group ${msg.sender === 'player' ? '' : ''}`}>
              
              {/* Header for message */}
              <div className="flex items-center gap-3 mb-2 opacity-80">
                <span className={`text-xs font-bold uppercase tracking-widest
                  ${msg.sender === 'dm' ? 'text-[#ffd700]' : msg.sender === 'system' ? 'text-green-700' : 'text-[#8a7042]'}`}>
                  {msg.sender === 'dm' ? 'Dungeon Master' : msg.sender === 'system' ? 'Game System' : msg.playerName}
                </span>
                <span className="text-[10px] text-[#333] font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>

              {/* Message Body */}
              <div className={`relative pl-4 border-l-2 leading-relaxed ${
                 msg.sender === 'dm' ? 'border-[#ffd700] text-[#e0e0e0]' : 
                 msg.sender === 'system' ? 'border-green-800 text-green-800 italic' :
                 'border-[#555] text-gray-400'
              }`}>
                {msg.diceRoll !== undefined && (
                   <span className={`float-right ml-4 font-fantasy text-lg ${getRollColor(msg.diceRoll)}`}>
                     [Roll: {msg.diceRoll}]
                   </span>
                )}
                {msg.text}
                {renderGroundingData(msg.groundingMetadata)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-center py-4">
              <span className="inline-block w-2 h-2 bg-[#8a7042] rounded-full animate-ping mr-2"></span>
              <span className="text-[#555] text-xs font-fantasy tracking-widest">The Fates are Weaving...</span>
            </div>
          )}
        </GothicLogContainer>

        {/* Input Area */}
        <div className="p-4 bg-[#0c0c0c] border-t border-[#3d3226]">
          <div className="max-w-4xl mx-auto relative flex gap-0 shadow-[0_0_20px_rgba(0,0,0,1)] border border-[#3d3226]">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={myPlayer ? `What will ${myPlayer.name} do?` : 'Spectating...'}
              disabled={isLoading || !myPlayer}
              className="flex-1 bg-black text-[#cbb692] font-serif p-4 focus:outline-none placeholder-[#333] disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputText.trim() || !myPlayer}
              className="bg-[#1a0f0a] text-[#8a7042] px-6 border-l border-[#3d3226] hover:bg-[#2a1d15] hover:text-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSession;