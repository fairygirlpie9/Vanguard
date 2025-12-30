
import React from 'react';
import { ViewState } from '../types';
import Logo from './Logo';

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
    <aside className="w-full md:w-64 bg-tech-panel border-r border-tech-border flex flex-col h-full font-tech overflow-hidden">
      <div className="p-6 border-b border-tech-border bg-black/50 shrink-0">
        <div className="flex items-center space-x-3">
            <Logo className="w-10 h-10" />
            <h1 className="text-2xl font-bold tracking-widest text-tech-primary crt-glow">VANGUARD</h1>
        </div>
        <p className="text-xs text-gray-500 mt-2 uppercase tracking-[0.3em] pl-1">Operational OS v2.1</p>
      </div>
      
      {/* Added min-h-0 to ensure flex item shrinks properly on small screens (RPi) */}
      <nav className="flex-1 min-h-0 p-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center justify-between px-4 py-4 md:py-3 border-l-2 transition-all duration-150 group active:bg-tech-dim active:border-tech-primary ${
              currentView === item.id
                ? 'border-tech-primary bg-tech-dim text-tech-primary'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-3">
                <span className={`text-lg opacity-80 ${currentView === item.id ? 'text-tech-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>{item.icon}</span>
                <span className="uppercase tracking-widest text-sm font-bold">{item.label}</span>
            </div>
            {currentView === item.id && <span className="text-xs animate-pulse">●</span>}
          </button>
        ))}
      </nav>
      
      {/* Footer Section - shrink-0 prevents it from being squashed */}
      <div className="shrink-0 bg-tech-panel border-t border-tech-border">
         <div className="p-2">
            <button
                onClick={() => setView(ViewState.SETTINGS)}
                className={`w-full flex items-center justify-between px-4 py-4 md:py-3 border-l-2 transition-all duration-150 group active:bg-tech-secondary/20 active:border-tech-secondary active:text-tech-secondary ${
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

         <div className="p-4 pt-0">
            <div className="border border-tech-border p-3 bg-black text-xs text-gray-500 font-mono space-y-1">
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
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
