
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Advisor from './components/Advisor';
import Locator from './components/Locator';
import Library from './components/Library';
import Tools from './components/Tools';
import Simulation from './components/Simulation';
import Settings from './components/Settings';
import { ViewState, InventoryItem, CrewProfile } from './types';
import { sendMetric, sendEvent } from './services/datadogService';

// Mock initial data
const INITIAL_ITEMS: InventoryItem[] = [
  { id: '1', name: 'Water (Bottled)', category: 'Water', quantity: 24, target: 100, unit: 'L', litersPerUnit: 1 },
  { id: '2', name: 'Canned Beans', category: 'Food', quantity: 12, target: 50, unit: 'cans', caloriesPerUnit: 350 },
  { id: '3', name: 'Trauma Kit I', category: 'Medical', quantity: 1, target: 2, unit: 'kit' },
  { id: '4', name: 'Leatherman Tool', category: 'Tools', quantity: 1, target: 1, unit: 'pc' },
  { id: '5', name: 'Perimeter Alarm', category: 'Security', quantity: 0, target: 4, unit: 'units' },
  { id: '6', name: 'Antibiotics', category: 'Meds', quantity: 14, target: 14, unit: 'pills', dailyDose: 2, expiry: '2024-12-01' },
];

const INITIAL_CREW: CrewProfile = {
  adults: 1,
  children: 0,
  pets: 0
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [crew, setCrew] = useState<CrewProfile>(INITIAL_CREW);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [utcTime, setUtcTime] = useState<string>('');

  // Clock Timer
  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const timeString = now.toISOString().split('T')[1].split('.')[0];
        setUtcTime(`${timeString} UTC`);
    };
    updateTime(); // Initial call
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize & Send Training Metrics (Ensures 0 values are sent if no history)
  useEffect(() => {
    // Read High Scores (Default to 0)
    const s = parseInt(localStorage.getItem('vanguard_snake_highscore') || '0');
    const m = parseInt(localStorage.getItem('vanguard_memory_highscore') || '0');
    const c = parseInt(localStorage.getItem('vanguard_morse_highscore') || '0');

    // Send individual metrics to ensure dashboard widgets have data
    sendMetric('vanguard.simulation.snake_score', s);
    sendMetric('vanguard.simulation.memory_level', m);
    sendMetric('vanguard.simulation.morse_score', c);

    // Calculate Proficiency (Composite Score)
    // Targets: Snake=50, Memory=10, Morse=20
    const prof = Math.min(100, Math.round( ((s/50) + (m/10) + (c/20)) / 3 * 100 ));
    sendMetric('vanguard.training.proficiency', prof);

  }, []);

  // Check for critical supplies & Send Inventory Metrics
  useEffect(() => {
    const dailyWaterReq = (crew.adults * 3) + (crew.children * 2);
    const totalWater = inventoryItems.filter(i => i.category === 'Water').reduce((acc, i) => acc + (i.quantity * (i.litersPerUnit || 1)), 0);
    const waterDays = dailyWaterReq > 0 ? totalWater / dailyWaterReq : 999;

    const dailyCalReq = (crew.adults * 2500) + (crew.children * 1800);
    const totalFoodStock = inventoryItems.filter(i => i.category === 'Food').reduce((acc, i) => acc + (i.quantity * (i.caloriesPerUnit || 0)), 0);
    const foodDays = dailyCalReq > 0 ? totalFoodStock / dailyCalReq : 999;

    const newNotes: string[] = [];
    if (waterDays < 3) newNotes.push("CRITICAL: WATER SUPPLY < 3 DAYS");
    
    // Check Meds
    const lowMeds = inventoryItems.filter(i => i.category === 'Meds' && i.quantity < (i.dailyDose || 1) * 3);
    if (lowMeds.length > 0) newNotes.push(`CRITICAL: ${lowMeds.length} MEDS REQUIRE REFILL`);

    setNotifications(newNotes);

    // Send Telemetry to Datadog
    sendMetric('vanguard.inventory.total_items', inventoryItems.reduce((acc, i) => acc + i.quantity, 0));
    sendMetric('vanguard.sustainability.water_days', waterDays < 900 ? waterDays : 30);
    sendMetric('vanguard.sustainability.food_days', foodDays < 900 ? foodDays : 30);
    sendMetric('vanguard.crew.count', crew.adults + crew.children);

  }, [inventoryItems, crew]);

  // --- MANUAL CONSUMPTION LOGIC ---
  const handleSimulateDay = () => {
      // 1. Calculate Requirements
      let waterNeededLiters = (crew.adults * 3) + (crew.children * 2) + (crew.pets * 0.5);
      let caloriesNeeded = (crew.adults * 2500) + (crew.children * 1800);
      
      const newItems = [...inventoryItems];
      const consumedLog: string[] = [];

      // 2. Consume Water
      for (const item of newItems) {
          if (item.category === 'Water' && waterNeededLiters > 0 && item.quantity > 0) {
              const unitSize = item.litersPerUnit || 1;
              // Calculate how many units needed to cover the remaining requirement
              const unitsNeeded = Math.ceil(waterNeededLiters / unitSize);
              const take = Math.min(item.quantity, unitsNeeded);
              
              item.quantity -= take;
              waterNeededLiters -= (take * unitSize);
              consumedLog.push(`Consumed ${take} units of ${item.name}`);
          }
          if (waterNeededLiters <= 0) break;
      }

      // 3. Consume Food
      for (const item of newItems) {
          if (item.category === 'Food' && caloriesNeeded > 0 && item.quantity > 0) {
              const unitCals = item.caloriesPerUnit || 200; // default to 200 if missing
              const unitsNeeded = Math.ceil(caloriesNeeded / unitCals);
              const take = Math.min(item.quantity, unitsNeeded);

              item.quantity -= take;
              caloriesNeeded -= (take * unitCals);
              consumedLog.push(`Consumed ${take} units of ${item.name}`);
          }
          if (caloriesNeeded <= 0) break;
      }

      // 4. Consume Daily Meds
      for (const item of newItems) {
          if (item.category === 'Meds' && item.dailyDose && item.quantity > 0) {
              const take = Math.min(item.quantity, item.dailyDose);
              item.quantity -= take;
              consumedLog.push(`Administered ${take} dose(s) of ${item.name}`);
          }
      }

      setInventoryItems(newItems);
      sendEvent('Manual Consumption Logged', `User manually logged daily rations:\n${consumedLog.join('\n')}`, 'info');
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard items={inventoryItems} onSimulateDay={handleSimulateDay} />;
      case ViewState.INVENTORY:
        return <Inventory items={inventoryItems} setItems={setInventoryItems} crew={crew} setCrew={setCrew} />;
      case ViewState.ADVISOR:
        return <Advisor />;
      case ViewState.LOCATOR:
        return <Locator />;
      case ViewState.GUIDES:
        return <Library />;
      case ViewState.TOOLS:
        return <Tools />;
      case ViewState.SIMULATION:
        return <Simulation />;
      case ViewState.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard items={inventoryItems} onSimulateDay={handleSimulateDay} />;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-black text-slate-200 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-black/90 p-3 text-tech-primary border border-tech-primary shadow-[0_0_10px_#00ff41] active:bg-tech-primary active:text-black transition-colors"
        >
          {isSidebarOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-72 md:w-auto
      `}>
        <Sidebar currentView={currentView} setView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full bg-grid-pattern bg-[length:40px_40px]">
         {/* Top Bar Decoration */}
         <div className="absolute top-0 left-0 w-full h-16 border-b border-tech-border bg-black/80 backdrop-blur-sm z-10 flex items-center justify-end px-6">
            <div className="text-xs md:text-sm font-mono text-gray-500 flex space-x-6">
               <span className="text-tech-secondary font-bold tracking-widest">{utcTime}</span>
               <span className="hidden md:inline text-tech-primary">v2.4.2-BETA</span>
            </div>
         </div>

         {/* Notifications */}
         <div className="absolute top-20 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
            {notifications.map((note, idx) => (
                <div key={idx} className="bg-black border border-tech-alert text-tech-alert px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce">
                    ⚠ {note}
                </div>
            ))}
         </div>
         
         <div className="h-full overflow-y-auto p-4 md:p-8 pt-20 md:pt-24 scroll-smooth">
            {/* Changed h-full to min-h-full to prevent clipping on mobile when content overflows */}
            <div className="max-w-7xl mx-auto min-h-full pb-20">
              {renderView()}
            </div>
         </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
