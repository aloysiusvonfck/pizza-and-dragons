import React from 'react';
import { GameProvider, useGame } from './components/GameContext';
import Lobby from './components/Lobby';
import GameSession from './components/GameSession';
import OrderSummary from './components/OrderSummary';
import { GamePhase } from './types';

const GameRouter: React.FC = () => {
  const { state } = useGame();

  switch (state.phase) {
    case GamePhase.LOBBY:
      return <Lobby />;
    case GamePhase.PLAYING:
      return <GameSession />;
    case GamePhase.ORDER_SUMMARY:
      return <OrderSummary />;
    default:
      return <Lobby />;
  }
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <div className="antialiased text-dnd-text font-body selection:bg-dnd-accent selection:text-white">
        <GameRouter />
        
        {/* Footer / Credits */}
        <div className="fixed bottom-2 right-4 text-[10px] text-gray-600 pointer-events-none opacity-50">
          Powered by Gemini 2.5 Flash
        </div>
      </div>
    </GameProvider>
  );
};

export default App;