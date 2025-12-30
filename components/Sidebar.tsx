
import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: ViewState.DASHBOARD, label: 'SITREP', icon: '⚡' },
    { id: ViewState.INVENTORY, label: 'MANIFEST', icon: '📦' },
    { id: ViewState.TOOLS, label: 'UTILITIES', icon: '🛠' },
    { id: ViewState.ADVISOR, label: 'AI UPLINK', icon: '📡' },
    { id: ViewState.LOCATOR, label: 'INTEL MAP', icon: '⊕' },
    { id: ViewState.GUIDES, label: 'PROTOCOLS', icon: '🕮' },
    { id: ViewState.SIMULATION, label: 'TRAINING', icon: '🎮' },
  ];

  return (
    <aside className="w-full md:w-64 bg-tech-panel border-r border-tech-border flex flex-col h-full font-tech">
      <div className="p-6 border-b border-tech-border bg-black/50">
        <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-tech-primary rounded-full animate-pulse shadow-[0_0_10px_#00ff41]"></div>
            <h1 className="text-2xl font-bold tracking-widest text-tech-primary crt-glow">VANGUARD</h1>
        </div>
        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.3em]">Operational OS v2.1</p>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 border-l-2 transition-all duration-150 group ${
              currentView === item.id
                ? 'border-tech-primary bg-tech-dim text-tech-primary'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
                <span className={`text-lg opacity-80 ${currentView === item.id ? 'text-tech-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>{item.icon}</span>
                <span className="uppercase tracking-widest text-sm font-bold">{item.label}</span>
            </div>
            {currentView === item.id && <span className="text-[10px] animate-pulse">●</span>}
          </button>
        ))}
      </nav>
      
      {/* Settings / Network Config Link */}
      <div className="p-2 border-t border-tech-border">
         <button
            onClick={() => setView(ViewState.SETTINGS)}
            className={`w-full flex items-center justify-between px-4 py-3 border-l-2 transition-all duration-150 group ${
              currentView === ViewState.SETTINGS
                ? 'border-tech-secondary bg-tech-secondary/10 text-tech-secondary'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
                <span className="text-lg opacity-80">⚙</span>
                <span className="uppercase tracking-widest text-sm font-bold">NETWORK</span>
            </div>
          </button>
      </div>

      <div className="p-4">
        <div className="border border-tech-border p-3 bg-black text-[10px] text-gray-500 font-mono space-y-1">
          <div className="flex justify-between">
            <span>NET:</span>
            <span className={navigator.onLine ? 'text-tech-primary' : 'text-tech-alert'}>
              {navigator.onLine ? 'SECURE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>GEO:</span>
            <span className="text-gray-500">STANDBY</span>
          </div>
          <div className="mt-2 text-center text-tech-secondary/50 tracking-widest uppercase text-[9px]">
            No Fate But What We Make
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
