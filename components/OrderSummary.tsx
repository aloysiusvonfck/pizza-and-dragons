import React from 'react';
import { useGame } from './GameContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RotateCcw, Scroll, Coins, Award } from 'lucide-react';

const COLORS = ['#8a7042', '#5c4d3c', '#3d3226', '#1a0f0a', '#000000'];

const OrderSummary: React.FC = () => {
  const { state, resetGame } = useGame();

  const totalActions = state.players.reduce((sum, p) => sum + p.contributions, 0);
  
  const data = state.players.map(p => ({
    name: p.name,
    value: p.contributions
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const basePrice = 15;
  const toppingPrice = 2.50;
  const totalBill = basePrice + (state.pizza.toppings.length * toppingPrice);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="relative w-full max-w-5xl flex flex-col md:flex-row gap-8">
        
        {/* The Scroll (Receipt) */}
        <div className="flex-1 relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
           {/* Scroll Top */}
           <div className="h-12 bg-[#e3dac9] rounded-t-lg relative border-b border-[#d4c5b0] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
           
           {/* Scroll Body */}
           <div className="bg-[#f2e8d5] p-8 text-[#2c1810] font-serif min-h-[500px] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
              <h2 className="text-4xl font-fantasy text-center mb-2 border-b-2 border-double border-[#2c1810] pb-4">Ye Olde Bill</h2>
              <p className="text-center italic text-sm mb-8 opacity-70">Issued by the Guild of Crust</p>

              <div className="space-y-3 font-mono text-sm leading-relaxed tracking-wide">
                <div className="flex justify-between">
                   <span>1x {state.pizza.size} {state.pizza.crust}</span>
                   <span>{formatCurrency(basePrice)}</span>
                </div>
                {state.pizza.toppings.map((t, i) => (
                  <div key={i} className="flex justify-between pl-4 text-[#5c4d3c]">
                    <span>+ {t}</span>
                    <span>{formatCurrency(toppingPrice)}</span>
                  </div>
                ))}
                
                <div className="my-6 border-t border-[#2c1810] border-dashed"></div>
                
                <div className="flex justify-between text-2xl font-bold font-fantasy mt-4">
                  <span>Gold Required</span>
                  <span>{formatCurrency(totalBill)}</span>
                </div>
              </div>

              {/* Wax Seal */}
              <div className="mt-16 flex justify-center">
                 <div className="w-24 h-24 rounded-full bg-red-900 border-4 border-red-800 shadow-inner flex items-center justify-center text-red-200 font-fantasy text-xs text-center p-2 rotate-12 drop-shadow-md">
                   APPROVED<br/>BY THE<br/>DM
                 </div>
              </div>
           </div>

           {/* Scroll Bottom */}
           <div className="h-12 bg-[#e3dac9] rounded-b-lg relative border-t border-[#d4c5b0] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
        </div>

        {/* The Stats (Dark Stone) */}
        <div className="flex-1 bg-[#0c0c0c] border-2 border-[#5c4d3c] p-6 shadow-2xl relative">
          <div className="absolute -inset-1 border border-[#1a0f0a] pointer-events-none"></div>
          
          <h3 className="text-2xl font-fantasy text-[#ffd700] mb-8 text-center flex items-center justify-center gap-2">
            <Award className="text-[#8a7042]" /> Deeds of Valor
          </h3>
          
          <div className="h-64 w-full mb-8 opacity-90">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a0f0a', borderColor: '#5c4d3c', color: '#cbb692', fontFamily: 'serif' }}
                  itemStyle={{ color: '#ffd700' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'Cinzel, serif' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 font-serif text-[#cbb692]">
             <h4 className="border-b border-[#3d3226] pb-2 text-sm uppercase tracking-widest text-[#8a7042]">Share of the Spoils</h4>
             {state.players.map((p, i) => {
               const share = totalActions > 0 ? (p.contributions / totalActions) * totalBill : 0;
               return (
                 <div key={p.id} className="flex justify-between items-center text-sm group hover:bg-[#1a0f0a] p-2 transition">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rotate-45" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                     <span>{p.name}</span>
                   </div>
                   <span className="text-[#ffd700]">{formatCurrency(share)}</span>
                 </div>
               );
             })}
          </div>

          <button 
            onClick={resetGame}
            className="mt-8 w-full py-4 border-2 border-[#8a7042] text-[#8a7042] font-fantasy uppercase tracking-widest hover:bg-[#8a7042] hover:text-black transition-all flex items-center justify-center gap-3 group"
          >
            <RotateCcw className="group-hover:-rotate-180 transition-transform duration-500" />
            Return to Tavern
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderSummary;