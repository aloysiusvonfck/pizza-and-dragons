import React, { useState } from 'react';
import { useGame } from './GameContext';
import { Shield, Flame, Ghost, Sword, Scroll, Crown, Dices, Feather, ChevronLeft } from 'lucide-react';
import { PlayerStats, PlayerProfile } from '../types';

// --- Constants ---

const CLASSES = [
  { 
    id: "Paladin", 
    sub: "Oath of the Peel",
    icon: Shield, 
    desc: "Heavily armored defenders who ensure the delivery arrives intact.", 
    stats: "STR / CON" 
  },
  { 
    id: "Saucerer", 
    sub: "Wild Magic",
    icon: Flame, 
    desc: "Channelers of raw, spicy energy. Unpredictable and hot.", 
    stats: "CHA / INT" 
  },
  { 
    id: "Rogue", 
    sub: "Guild of the Slice",
    icon: Ghost, 
    desc: "Precision cutters who strike when the crust is thinnest.", 
    stats: "DEX / AGI" 
  },
  { 
    id: "Barbarian", 
    sub: "Path of the Oven",
    icon: Sword, 
    desc: "Fueled by a burning hunger that can never be sated.", 
    stats: "STR / CON" 
  },
  { 
    id: "Druid", 
    sub: "Circle of Yeast", 
    icon: Scroll, 
    desc: "Masters of fermentation, growth, and the natural rise.", 
    stats: "WIS / NAT" 
  }
];

const RACES = [
  { id: "Human", bonus: "+1 All" },
  { id: "Elf", bonus: "+2 DEX" },
  { id: "Dwarf", bonus: "+2 CON" },
  { id: "Orc", bonus: "+2 STR" },
  { id: "Halfling", bonus: "+2 DEX" },
  { id: "Dragonborn", bonus: "+2 STR" },
  { id: "Tiefling", bonus: "+2 CHA" },
  { id: "Gnome", bonus: "+2 INT" }
];

const THEMES = [
  "Classic Fantasy", "Cyberpunk 2099", "80s Action Movie", "Eldritch Horror", "Post-Apocalyptic", "Space Opera", "Western"
];

const INITIAL_STATS: PlayerStats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

// --- Gothic UI Components ---

const GothicCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`relative bg-[#0c0c0c] border-2 border-[#5c4d3c] shadow-[0_0_20px_rgba(0,0,0,0.8)] p-1 ${className}`}>
    <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#8a7042] z-10"></div>
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#8a7042] z-10"></div>
    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#8a7042] z-10"></div>
    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#8a7042] z-10"></div>
    <div className="border border-[#3d3226] h-full p-4 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
       {children}
    </div>
  </div>
);

const GothicButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string; variant?: 'primary' | 'secondary' }> = ({ onClick, disabled, children, className = "", variant = 'primary' }) => {
  const baseStyle = "font-fantasy tracking-widest uppercase transition-all duration-200 relative group overflow-hidden border-2 w-full";
  const variants = {
    primary: "bg-[#1a0f0a] border-[#8a7042] text-[#cbb692] hover:text-white hover:border-[#ffd700] hover:shadow-[0_0_15px_rgba(255,165,0,0.4)]",
    secondary: "bg-black border-[#4a4a4a] text-gray-500 hover:text-gray-300 hover:border-gray-400"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'active:translate-y-0.5'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span className="relative z-10 flex items-center justify-center gap-2 py-3 px-6 text-shadow-sm">{children}</span>
    </button>
  );
};

const GothicInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props}
    className={`bg-black border border-[#5c4d3c] text-[#cbb692] font-fantasy tracking-wider p-3 w-full focus:outline-none focus:border-[#ffd700] placeholder-gray-700 text-center uppercase ${props.className}`}
  />
);

const GothicTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`bg-black border border-[#5c4d3c] text-[#cbb692] font-fantasy tracking-wider p-3 w-full focus:outline-none focus:border-[#ffd700] placeholder-gray-700 resize-none scrollbar-hide ${props.className}`}
  />
);

const StatBox: React.FC<{ label: string; value: number; isRolling: boolean }> = ({ label, value, isRolling }) => (
  <div className="flex flex-col items-center bg-[#1a0f0a] border border-[#3d3226] p-2 w-full relative">
    <div className="text-[#555] text-[10px] font-bold mb-1 uppercase tracking-widest">{label}</div>
    <div className={`text-2xl font-fantasy ${isRolling ? 'text-[#ffd700] animate-pulse blur-[1px]' : 'text-[#cbb692]'}`}>
      {value}
    </div>
    {/* Modifier calculation: (Score - 10) / 2 rounded down */}
    {!isRolling && (
      <div className="absolute top-1 right-1 text-[8px] text-[#8a7042]">
        {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)}
      </div>
    )}
  </div>
);

const FloatingEmbers = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <style>{`
      @keyframes floatUp {
        0% { transform: translateY(100vh) scale(0); opacity: 0; }
        50% { opacity: 0.6; }
        100% { transform: translateY(-10vh) scale(1); opacity: 0; }
      }
      .ember {
        position: absolute;
        background: radial-gradient(circle, #ffaa00 0%, #ff4500 100%);
        border-radius: 50%;
        opacity: 0;
        animation: floatUp linear infinite;
      }
    `}</style>
    {[...Array(20)].map((_, i) => (
      <div 
        key={i} 
        className="ember"
        style={{
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 6 + 2}px`,
          height: `${Math.random() * 6 + 2}px`,
          animationDuration: `${Math.random() * 5 + 5}s`,
          animationDelay: `${Math.random() * 5}s`,
          filter: 'blur(1px)'
        }}
      />
    ))}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)]"></div>
  </div>
);

// --- Sub-Components ---

const ClassSelector: React.FC<{ selected: string; onSelect: (c: string) => void }> = ({ selected, onSelect }) => (
  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-hide">
    {CLASSES.map((c) => {
      const isSelected = selected === c.id;
      const Icon = c.icon;
      return (
        <div 
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`cursor-pointer p-3 border-2 transition-all duration-300 flex items-center gap-3 group relative overflow-hidden ${isSelected ? 'bg-[#2a1d15] border-[#ffd700]' : 'bg-black/40 border-[#3d3226] hover:border-[#8a7042]'}`}
        >
          <div className={`p-2 border border-[#3d3226] ${isSelected ? 'bg-[#ffd700] text-black' : 'bg-[#1a0f0a] text-[#8a7042] group-hover:text-[#ffd700]'}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
               <div className={`font-fantasy uppercase text-sm tracking-wide ${isSelected ? 'text-[#ffd700]' : 'text-[#cbb692]'}`}>{c.id}</div>
               <div className={`text-[9px] font-mono px-1 rounded border ${isSelected ? 'border-[#ffd700] text-[#ffd700]' : 'border-[#333] text-[#555]'}`}>{c.stats}</div>
            </div>
            <div className={`text-[10px] font-bold mb-0.5 uppercase tracking-wider ${isSelected ? 'text-[#e0d0b0]' : 'text-[#8a7042]'}`}>{c.sub}</div>
            <div className="text-[10px] font-serif italic leading-tight text-gray-600">{c.desc}</div>
          </div>
        </div>
      );
    })}
  </div>
);

const CharacterCard: React.FC<{ profile: PlayerProfile, onEdit: () => void }> = ({ profile, onEdit }) => {
  const selectedClass = CLASSES.find(c => profile.class.includes(c.id)) || CLASSES[0];
  const Icon = selectedClass.icon;

  return (
    <div className="bg-[#1a0f0a] border-2 border-[#5c4d3c] p-6 relative group overflow-hidden max-w-sm mx-auto">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8a7042]"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#8a7042]"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#8a7042]"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8a7042]"></div>

      <div className="flex flex-col items-center text-center relative z-10">
        <div className="w-24 h-24 bg-black border-2 border-[#ffd700] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
           <Icon size={48} className="text-[#ffd700]" />
        </div>
        
        <h2 className="text-3xl font-fantasy text-[#cbb692] mb-1">{profile.name}</h2>
        <div className="text-[#8a7042] text-sm uppercase tracking-widest mb-4 font-bold">
           Lvl 1 {profile.race} {selectedClass.id}
        </div>
        
        <p className="text-gray-500 font-serif italic text-xs mb-6 px-4">"{profile.description}"</p>

        <div className="grid grid-cols-6 gap-2 w-full border-t border-b border-[#3d3226] py-2 mb-6">
           {Object.entries(profile.stats).map(([k, v]) => (
             <div key={k} className="flex flex-col items-center">
               <span className="text-[8px] uppercase text-[#555]">{k}</span>
               <span className="text-[#cbb692] font-bold">{v}</span>
             </div>
           ))}
        </div>

        <button onClick={onEdit} className="text-[#555] hover:text-[#8a7042] text-xs flex items-center gap-1 uppercase tracking-widest">
           <ChevronLeft size={12} /> Edit Hero
        </button>
      </div>
      
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-0"></div>
    </div>
  );
};

// --- Main Lobby Component ---

export default function Lobby() {
  const { hostGame, joinGame, startGame, state, isLoading } = useGame();
  
  // Steps: CREATION -> CONNECTION
  const [step, setStep] = useState<'CREATION' | 'CONNECTION'>('CREATION');

  // Character State
  const [name, setName] = useState('');
  const [race, setRace] = useState(RACES[0].id);
  const [charClass, setCharClass] = useState(CLASSES[0].id);
  const [age, setAge] = useState<number | ''>(25);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [description, setDescription] = useState('');
  const [isRolling, setIsRolling] = useState(false);

  // Connection State
  const [connectionMode, setConnectionMode] = useState<'HOME' | 'HOST' | 'JOIN'>('HOME');
  const [roomId, setRoomId] = useState('');
  const [theme, setTheme] = useState(THEMES[0]);

  // --- Logic ---

  const rollStats = () => {
    setIsRolling(true);
    let duration = 0;
    const interval = setInterval(() => {
      setStats({
        str: Math.floor(Math.random() * 16) + 3,
        dex: Math.floor(Math.random() * 16) + 3,
        con: Math.floor(Math.random() * 16) + 3,
        int: Math.floor(Math.random() * 16) + 3,
        wis: Math.floor(Math.random() * 16) + 3,
        cha: Math.floor(Math.random() * 16) + 3,
      });
      duration += 50;
      if (duration > 800) {
        clearInterval(interval);
        // Final Roll (4d6 drop lowest for heroic stats)
        const roll = () => {
          const r = [0,0,0,0].map(() => Math.floor(Math.random() * 6) + 1);
          r.sort((a,b) => a-b);
          return r.slice(1).reduce((a,b) => a+b, 0);
        };
        setStats({
          str: roll(), dex: roll(), con: roll(),
          int: roll(), wis: roll(), cha: roll()
        });
        setIsRolling(false);
      }
    }, 50);
  };

  const getProfile = (): PlayerProfile => {
    const selectedClassObj = CLASSES.find(c => c.id === charClass);
    const fullClassName = selectedClassObj ? `${selectedClassObj.id} (${selectedClassObj.sub})` : charClass;
    
    return {
      name, 
      race, 
      class: fullClassName, 
      age: Number(age) || 25, 
      stats, 
      description: description || "A mysterious traveler with a hunger for adventure."
    };
  };

  const handleFinalizeHero = () => {
    if (name && age) {
      // NEW: If this is the first player (host), start story generation IMMEDIATELY
      if (step === 'CREATION' && !state.campaign) {
        // We are about to become host, trigger story gen now
        // This will happen in the background
        const theme = THEMES[0]; 
        // We can't call generateCampaign here directly because hostGame isn't called yet
        // Instead, we'll trigger it in the effect when hostGame is called, 
        // but we can also trigger it here if we are already connected?
        // Better: Trigger it in the 'CONNECTION' step when we are ready to host.
        setStep('CONNECTION');
      } else {
        setStep('CONNECTION');
      }
    }
  };

  const handleHostSetup = async () => {
    await hostGame(getProfile());
    setConnectionMode('HOST');
  };

  const handleJoinGame = async () => {
    if (!roomId) return;
    await joinGame(roomId, getProfile());
    setConnectionMode('JOIN');
  };

  // --- Render: HOST WAIT SCREEN ---

  if (state.campaign && connectionMode === 'HOST') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingEmbers />
        <GothicCard className="w-full max-w-4xl z-10 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-fantasy text-[#ffd700] border-b border-[#3d3226] pb-2">The Chronicle</h2>
              <div className="h-64 overflow-y-auto custom-scrollbar bg-[#0a0a0a] p-4 border border-[#3d3226] shadow-inner text-gray-400 font-serif leading-relaxed">
                <h3 className="text-lg text-[#cbb692] mb-2 font-bold">{state.campaign.title}</h3>
                <p className="italic mb-4">{state.campaign.intro}</p>
                <div className="space-y-2">
                  {Object.values(state.campaign.scenes).map((s: any, i) => (
                    <div key={s.id} className="text-xs border-l-2 border-[#8a7042] pl-2">
                      <span className="text-[#8a7042] font-bold">Scene {i+1}:</span> {s.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-fantasy text-[#cbb692] mb-4 flex items-center gap-2">
                   <Crown size={20} className="text-[#ffd700]" /> Party Gathering
                </h2>
                <div className="space-y-2 mb-6">
                  {state.players.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-[#1a0f0a] p-2 border border-[#3d3226]">
                      <div className="w-2 h-2 bg-green-500 rotate-45"></div>
                      <span className="text-[#cbb692] font-fantasy">{p.name}</span>
                      <span className="text-gray-600 text-xs">({p.race} {p.class})</span>
                    </div>
                  ))}
                  {state.players.length === 0 && <div className="text-gray-600 italic">Summoning heroes...</div>}
                </div>
                
                <div className="bg-[#111] p-3 border border-[#333] mb-4 text-center">
                   <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Room Glyph</div>
                   <div className="text-[#ffd700] font-mono text-xl tracking-widest select-all cursor-pointer hover:text-white" onClick={() => navigator.clipboard.writeText(state.network.roomId || "")}>
                     {state.network.roomId}
                   </div>
                </div>
              </div>

              <GothicButton onClick={startGame} disabled={isLoading || state.players.length === 0}>
                 {isLoading ? 'Weaving Fate...' : 'Embark on Quest'}
              </GothicButton>
            </div>
          </div>
        </GothicCard>
      </div>
    );
  }

  // --- Render: JOIN WAIT SCREEN ---

  if (connectionMode === 'JOIN' && !state.campaign) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
        <FloatingEmbers />
        <GothicCard className="w-full max-w-md text-center z-10">
          <h2 className="text-2xl font-fantasy text-[#cbb692] mb-4">Awaiting the Dungeon Master</h2>
          <div className="flex justify-center my-8">
            <div className="w-12 h-12 border-4 border-[#8a7042] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 font-serif italic">"Patience is a virtue, but pizza is eternal."</p>
          <div className="mt-8 text-xs text-[#555]">Connected as {name}</div>
        </GothicCard>
      </div>
    );
  }

  // --- Render: MAIN ---

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-body text-gray-300">
      <FloatingEmbers />
      
      {/* Header */}
      <div className="z-10 text-center mb-6 relative animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-fantasy text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] via-[#cbb692] to-[#8a7042] drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tight">
          Pizza & Dragons
        </h1>
        <p className="text-[#8a7042] font-serif italic text-sm md:text-lg mt-2 tracking-widest opacity-80">The Quest for the Ultimate Slice</p>
      </div>

      <GothicCard className="w-full max-w-5xl z-10 transition-all duration-500">
        
        {/* --- STEP 1: CREATION --- */}
        {step === 'CREATION' && (
          <div className="flex flex-col md:flex-row h-full min-h-[500px] animate-slide-in">
            {/* Left Panel: Identity */}
            <div className="md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-[#3d3226] flex flex-col gap-5 bg-[#080808]">
              <h3 className="text-[#8a7042] font-fantasy border-b border-[#3d3226] pb-1">Identity</h3>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[#555] text-[10px] uppercase tracking-widest mb-1 font-bold">Hero Name</label>
                  <GothicInput 
                    placeholder="Enter Name..." 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[#555] text-[10px] uppercase tracking-widest mb-1 font-bold">Age</label>
                  <GothicInput 
                    type="number"
                    placeholder="25" 
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#555] text-[10px] uppercase tracking-widest mb-1 font-bold">Lineage</label>
                <div className="grid grid-cols-4 gap-2">
                  {RACES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRace(r.id)}
                      className={`relative text-[10px] py-2 px-1 border transition-all flex flex-col items-center justify-center gap-1 h-14
                        ${race === r.id 
                          ? 'bg-[#2a1d15] border-[#ffd700] text-[#ffd700]' 
                          : 'border-[#333] text-gray-500 hover:border-gray-500 bg-[#0a0a0a]'
                        }`}
                    >
                      <span className="font-bold uppercase tracking-wide">{r.id}</span>
                      <span className="text-[9px] opacity-70 font-serif text-[#8a7042] leading-none">{r.bonus}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-[#555] text-[10px] uppercase tracking-widest mb-1 font-bold">Class & Vocation</label>
                <ClassSelector selected={charClass} onSelect={setCharClass} />
              </div>
            </div>

            {/* Right Panel: Stats & Details */}
            <div className="md:w-1/2 p-4 flex flex-col gap-6 bg-[#0c0c0c] relative">
              <div>
                  <div className="flex justify-between items-end mb-2 border-b border-[#3d3226] pb-1">
                    <h3 className="text-[#8a7042] font-fantasy">Attributes</h3>
                    <button 
                      onClick={rollStats} 
                      disabled={isRolling}
                      className="flex items-center gap-1 text-[10px] text-[#ffd700] hover:text-white uppercase tracking-widest disabled:opacity-50"
                    >
                      <Dices size={12} /> Reroll Fate
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <StatBox label="STR" value={stats.str} isRolling={isRolling} />
                    <StatBox label="DEX" value={stats.dex} isRolling={isRolling} />
                    <StatBox label="CON" value={stats.con} isRolling={isRolling} />
                    <StatBox label="INT" value={stats.int} isRolling={isRolling} />
                    <StatBox label="WIS" value={stats.wis} isRolling={isRolling} />
                    <StatBox label="CHA" value={stats.cha} isRolling={isRolling} />
                  </div>
              </div>

              <div className="flex-1">
                  <label className="block text-[#555] text-[10px] uppercase tracking-widest mb-1 font-bold flex items-center gap-2">
                    <Feather size={10} /> Character Vibe
                  </label>
                  <GothicTextArea 
                    rows={4}
                    placeholder="Describe your hero... (e.g., 'A grumpy old dwarf who loves spicy peppers and hates goblins.')"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-full min-h-[100px] text-sm font-serif"
                  />
              </div>

              <div className="mt-auto pt-4 border-t border-[#3d3226]">
                <GothicButton onClick={handleFinalizeHero} disabled={!name || !age}>
                   Finalize Hero
                </GothicButton>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 2: CONNECTION --- */}
        {step === 'CONNECTION' && (
           <div className="flex flex-col md:flex-row h-full min-h-[500px] animate-slide-in">
             {/* Left Panel: The Character Card (Image Display) */}
             <div className="md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-[#3d3226] bg-[#080808] flex items-center justify-center">
                <CharacterCard profile={getProfile()} onEdit={() => setStep('CREATION')} />
             </div>

             {/* Right Panel: Join / Host Actions */}
             <div className="md:w-1/2 p-8 bg-[#0c0c0c] flex flex-col justify-center gap-8">
               <h3 className="text-[#8a7042] font-fantasy text-center text-xl mb-4 border-b border-[#3d3226] pb-4">Choose Your Path</h3>
               
               <div className="space-y-6">
                 {/* Option 1: Host */}
                 <div className={`p-4 border transition-all duration-300 ${connectionMode === 'HOME' ? 'border-[#8a7042] bg-[#1a0f0a]' : 'border-[#222] bg-black opacity-50'}`}>
                    <div className="flex justify-between items-center mb-4" onClick={() => setConnectionMode('HOME')}>
                      <label className="text-[#ffd700] font-fantasy tracking-widest cursor-pointer hover:underline">Start New Adventure</label>
                      <div className={`w-4 h-4 rounded-full border border-[#8a7042] ${connectionMode === 'HOME' ? 'bg-[#ffd700]' : ''}`}></div>
                    </div>
                    
                    {connectionMode === 'HOME' && (
                      <div className="space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-[#555] text-[10px] uppercase tracking-widest mb-1">Campaign Theme</label>
                          <select 
                              value={theme} 
                              onChange={(e) => setTheme(e.target.value)}
                              className="w-full bg-black border border-[#3d3226] text-[#cbb692] text-xs p-2 focus:outline-none"
                            >
                              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <GothicButton onClick={handleHostSetup} disabled={isLoading}>
                          {isLoading ? 'Consulting Oracles...' : 'Forge Chronicle'}
                        </GothicButton>
                      </div>
                    )}
                 </div>

                 {/* Option 2: Join */}
                 <div className={`p-4 border transition-all duration-300 ${connectionMode === 'JOIN' ? 'border-[#8a7042] bg-[#1a0f0a]' : 'border-[#222] bg-black opacity-50'}`}>
                    <div className="flex justify-between items-center mb-4" onClick={() => setConnectionMode('JOIN')}>
                      <label className="text-[#ffd700] font-fantasy tracking-widest cursor-pointer hover:underline">Join Existing Party</label>
                      <div className={`w-4 h-4 rounded-full border border-[#8a7042] ${connectionMode === 'JOIN' ? 'bg-[#ffd700]' : ''}`}></div>
                    </div>

                    {connectionMode === 'JOIN' && (
                      <div className="space-y-4 animate-fade-in">
                        <GothicInput 
                            placeholder="Enter Room Glyph (ID)" 
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="text-sm"
                          />
                        <GothicButton onClick={handleJoinGame} disabled={isLoading || !roomId}>
                          {isLoading ? 'Opening Portal...' : 'Enter Realm'}
                        </GothicButton>
                      </div>
                    )}
                 </div>
               </div>

             </div>
           </div>
        )}

      </GothicCard>
      
      {/* Footer Decoration */}
      <div className="absolute bottom-4 text-center text-[#3d3226] text-xs font-fantasy tracking-[0.2em] opacity-50">
        Est. 1997 • Tristram Pizza Co.
      </div>
    </div>
  );
}