import React, { useEffect, useState, useRef } from 'react';
import { Player, PlayerStats } from '../types';

// --- Shadow Puppet Theatre Stage ---

interface ShadowPuppetStageProps {
  players: Player[];
  currentPlayerId: string | null;
  lastAction?: string;
  isRolling?: boolean;
  rollResult?: number;
}

// Puppet poses based on class
const PUPPET_POSES: Record<string, string> = {
  Paladin: 'M12,40 L18,25 L24,40 L30,35 L30,55 L24,60 L18,55 L12,60 Z M18,15 L18,25 M24,15 L24,25', // Standing guard
  Saucerer: 'M12,45 L20,30 L28,45 L32,40 L32,55 L24,60 L16,55 L12,60 Z M20,20 L22,30 M26,20 L24,30', // Casting spell
  Rogue: 'M10,50 L18,35 L26,50 L32,45 L32,60 L24,65 L16,60 L10,65 Z M18,25 L20,35 M24,25 L22,35', // Crouching
  Barbarian: 'M14,45 L20,30 L26,45 L34,40 L34,60 L26,65 L18,60 L14,65 Z M20,20 L20,30 M26,20 L26,30', // Raging
  Druid: 'M12,48 L18,33 L24,48 L30,43 L30,63 L24,68 L18,63 L12,68 Z M18,23 L20,33 M24,23 L22,33', // Nature stance
  default: 'M12,45 L18,30 L24,45 L30,40 L30,60 L24,65 L18,60 L12,65 Z M18,20 L18,30 M24,20 L24,30', // Default
};

// Oven flame animation component
const PizzaOven: React.FC = () => {
  const [flicker, setFlicker] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFlicker(0.8 + Math.random() * 0.4);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-48 h-64 mx-auto">
      {/* Oven bricks */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-800 via-stone-900 to-black rounded-t-3xl border-4 border-stone-700">
        {/* Brick texture overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 95%, #1a1a1a 95%),
              linear-gradient(0deg, transparent 95%, #1a1a1a 95%)
            `,
            backgroundSize: '20px 15px'
          }}
        />
      </div>
      
      {/* Fire glow */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-24 rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, 
            rgba(255, 200, 50, ${0.8 * flicker}) 0%, 
            rgba(255, 100, 20, ${0.6 * flicker}) 30%, 
            rgba(200, 50, 0, ${0.4 * flicker}) 60%, 
            transparent 100%)`,
          filter: `blur(${4 + Math.random() * 2}px)`,
          transform: `translateX(-50%) scale(${0.95 + Math.random() * 0.1})`,
        }}
      />
      
      {/* Flame tongues */}
      <svg className="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-20 overflow-visible">
        {[...Array(5)].map((_, i) => (
          <ellipse
            key={i}
            cx={14 + i * 7}
            cy={15 + Math.random() * 5}
            rx={3 + Math.random() * 2}
            ry={8 + Math.random() * 4}
            fill={`rgba(255, ${150 + Math.random() * 50}, 0, ${0.6 + Math.random() * 0.3})`}
            style={{
              animation: `flicker ${0.3 + Math.random() * 0.2}s ease-in-out infinite`,
              transformOrigin: 'bottom center',
            }}
          />
        ))}
      </svg>
      
      {/* Oven interior darkness */}
      <div className="absolute inset-4 top-8 bg-black rounded-t-2xl opacity-80" />
      
      {/* Heat shimmer */}
      <div 
        className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-32"
        style={{
          background: 'linear-gradient(to top, rgba(255,150,0,0.2), transparent)',
          filter: 'blur(20px)',
          animation: 'shimmer 2s ease-in-out infinite',
        }}
      />
      
      <style>{`
        @keyframes flicker {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.8; }
          50% { transform: scaleY(1.1) scaleX(0.95); opacity: 1; }
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.3; }
          50% { transform: translateX(-50%) translateY(-5px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Individual puppet character
interface PuppetProps {
  player: Player;
  isActive: boolean;
  position: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
  isRolling?: boolean;
}

const Puppet: React.FC<PuppetProps> = ({ player, isActive, position, isRolling }) => {
  const [frame, setFrame] = useState(0);
  const pose = PUPPET_POSES[player.class.split(' ')[0]] || PUPPET_POSES.default;
  
  // Stop-motion animation
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 200); // Jerky stop-motion timing
    return () => clearInterval(interval);
  }, [isActive]);
  
  const positionStyles: Record<string, React.CSSProperties> = {
    'left': { left: '10%', bottom: '15%' },
    'center-left': { left: '25%', bottom: '12%' },
    'center': { left: '50%', bottom: '10%', transform: 'translateX(-50%)' },
    'center-right': { right: '25%', bottom: '12%' },
    'right': { right: '10%', bottom: '15%' },
  };

  return (
    <div 
      className="absolute transition-all duration-200"
      style={{
        ...positionStyles[position],
        filter: 'contrast(200%) brightness(0%) drop-shadow(2px 2px 0 rgba(139, 69, 19, 0.3))',
        transform: `${positionStyles[position].transform || ''} ${isRolling ? 'translateY(-20px)' : isActive ? `translateY(${Math.sin(frame) * 3}px)` : ''}`,
      }}
    >
      {/* Puppet body */}
      <svg width="48" height="80" viewBox="0 0 48 80" className="overflow-visible">
        {/* Joint circles (visible when active) */}
        {isActive && (
          <>
            <circle cx="21" cy="28" r="2" fill="#8B4513" opacity="0.5" />
            <circle cx="27" cy="28" r="2" fill="#8B4513" opacity="0.5" />
            <circle cx="21" cy="58" r="2" fill="#8B4513" opacity="0.5" />
            <circle cx="27" cy="58" r="2" fill="#8B4513" opacity="0.5" />
          </>
        )}
        
        {/* Silhouette path */}
        <path 
          d={pose} 
          fill="black"
          style={{
            transformOrigin: 'center bottom',
            animation: isActive ? `puppet-jerk 0.4s steps(2) infinite` : 'none',
          }}
        />
        
        {/* Control string (visible when active) */}
        {isActive && (
          <line 
            x1="24" 
            y1="15" 
            x2="24" 
            y2="-40" 
            stroke="#8B4513" 
            strokeWidth="1" 
            strokeDasharray="2,2"
            opacity="0.4"
          />
        )}
      </svg>
      
      {/* Name label */}
      <div 
        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-serif whitespace-nowrap transition-all ${
          isActive ? 'text-amber-400 opacity-100' : 'text-stone-600 opacity-60'
        }`}
      >
        {player.name}
      </div>
      
      {/* Initiative indicator */}
      {player.initiativeRoll && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs flex items-center justify-center font-bold border border-amber-500">
          {player.initiativeRoll}
        </div>
      )}
    </div>
  );
};

// Dragon silhouette (appears during dramatic moments)
const DragonSilhouette: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
  <div 
    className={`absolute top-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ${
      isVisible ? 'opacity-80 scale-100' : 'opacity-0 scale-95'
    }`}
    style={{
      filter: 'contrast(200%) brightness(0%) drop-shadow(0 0 20px rgba(200, 50, 0, 0.5))',
    }}
  >
    <svg width="200" height="150" viewBox="0 0 200 150" className="overflow-visible">
      {/* Dragon body - stylized silhouette */}
      <path 
        d="M40,120 Q30,100 50,90 L70,85 Q80,60 100,55 L130,50 Q150,45 170,55 L180,60 
           Q185,70 175,75 L160,80 Q150,85 140,90 L130,95 Q120,100 110,98 L100,100
           Q90,105 80,110 L70,115 Q60,120 50,118 L40,120 Z
           M130,50 Q135,30 140,25 L145,20 Q150,15 155,20 L160,25 Q165,30 160,35 L155,40
           M170,55 Q175,45 180,50 L185,55 Q190,60 185,65" 
        fill="black"
      />
      {/* Glowing eyes */}
      <ellipse cx="165" cy="58" rx="3" ry="2" fill="#ff4400" className="animate-pulse" />
      <ellipse cx="175" cy="62" rx="3" ry="2" fill="#ff4400" className="animate-pulse" />
    </svg>
  </div>
);

// Main Stage Component
export const ShadowPuppetStage: React.FC<ShadowPuppetStageProps> = ({ 
  players, 
  currentPlayerId, 
  lastAction,
  isRolling,
  rollResult 
}) => {
  const [showDragon, setShowDragon] = useState(false);
  const positions: PuppetProps['position'][] = ['left', 'center-left', 'center', 'center-right', 'right'];
  
  useEffect(() => {
    // Show dragon on dramatic rolls or boss encounters
    if (rollResult === 20 || rollResult === 1) {
      setShowDragon(true);
      const timer = setTimeout(() => setShowDragon(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [rollResult]);

  return (
    <div 
      className="relative w-full h-96 overflow-hidden rounded-lg border-4 border-stone-800"
      style={{
        background: `
          radial-gradient(ellipse at 50% 80%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
          linear-gradient(to bottom, #f4e4c1 0%, #e8d5a3 50%, #d4c594 100%)
        `,
      }}
    >
      {/* Parchment texture overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply',
        }}
      />
      
      {/* Stage curtain edges (shadow) */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/60 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/60 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
      
      {/* Dragon silhouette */}
      <DragonSilhouette isVisible={showDragon} />
      
      {/* Puppet characters */}
      {players.map((player, index) => (
        <Puppet 
          key={player.id}
          player={player}
          isActive={player.id === currentPlayerId}
          position={positions[index % positions.length]}
          isRolling={isRolling && player.id === currentPlayerId}
        />
      ))}
      
      {/* Pizza Oven (center stage) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <PizzaOven />
      </div>
      
      {/* Dramatic vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 90%, transparent 20%, rgba(0,0,0,0.4) 100%)',
        }}
      />
      
      {/* Action text overlay (theatrical subtitle style) */}
      {lastAction && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-md text-center">
          <p className="text-stone-800 font-serif italic text-sm bg-stone-200/80 px-4 py-2 rounded border border-stone-400">
            "{lastAction}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ShadowPuppetStage;
