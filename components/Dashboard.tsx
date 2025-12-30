
import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { fetchEnvironmentalData, EnvironmentalData } from '../services/externalDataService';
import { sendMetric } from '../services/datadogService';

interface DashboardProps {
  items: InventoryItem[];
  onSimulateDay?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, onSimulateDay }) => {
  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalTarget = items.reduce((acc, curr) => acc + curr.target, 0);
  const readiness = totalTarget > 0 ? Math.round((totalItems / totalTarget) * 100) : 0;
  
  const lowStockItems = items.filter(i => (i.quantity / i.target) < 0.3);

  const [envData, setEnvData] = useState<EnvironmentalData | null>(null);
  const [proficiency, setProficiency] = useState(0);

  // Calculate Proficiency on mount
  useEffect(() => {
    const calcProficiency = () => {
        const s = parseInt(localStorage.getItem('vanguard_snake_highscore') || '0');
        const m = parseInt(localStorage.getItem('vanguard_memory_highscore') || '0');
        const c = parseInt(localStorage.getItem('vanguard_morse_highscore') || '0');
        // Targets: Snake(50), Memory(10), Morse(20)
        // Formula: Average of % completion of these targets
        const prof = Math.min(100, Math.round( ((s/50) + (m/10) + (c/20)) / 3 * 100 ));
        setProficiency(prof);
    };
    calcProficiency();
  }, []);

  // Fetch Environmental Data & Send Readiness
  useEffect(() => {
    sendMetric('vanguard.system_readiness', readiness);

    const loadEnvData = async () => {
        // Try to get simple location, else default London
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const data = await fetchEnvironmentalData(pos.coords.latitude, pos.coords.longitude);
                    setEnvData(data);
                },
                async () => {
                    // Default if denied
                    const data = await fetchEnvironmentalData(); 
                    setEnvData(data);
                }
            );
        } else {
             const data = await fetchEnvironmentalData();
             setEnvData(data);
        }
    };
    loadEnvData();

    // Refresh every 5 mins
    const interval = setInterval(loadEnvData, 300000);
    return () => clearInterval(interval);
  }, [readiness]);

  // Calculate radar data based on categories
  const categories = ['Water', 'Food', 'Medical', 'Security', 'Tools'];
  const radarData = categories.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const target = catItems.reduce((acc, curr) => acc + curr.target, 0);
      const current = catItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const val = target > 0 ? (current / target) * 100 : 0;
      return { subject: cat, A: Math.min(100, val), fullMark: 100 };
  });

  return (
    <div className="space-y-6 font-tech">
      
      {/* ENVIRONMENTAL SENSORS PANEL - Moved to Top */}
      <div className="bg-tech-panel border border-tech-secondary/30 relative overflow-hidden shadow-[0_0_15px_rgba(14,165,233,0.1)]">
         <div className="p-4 bg-black/50 border-b border-tech-border flex justify-between items-center">
             <div className="flex items-center space-x-2">
                 <span className="text-xl">📡</span>
                 <h3 className="text-tech-secondary font-bold uppercase tracking-[0.2em]">External Environmental Sensors</h3>
             </div>
             <span className="text-[10px] text-tech-primary animate-pulse">● LIVE DATA FEED</span>
         </div>
         <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
             {/* FLOOD */}
             <div className="border border-gray-800 p-4 bg-black/40 hover:border-tech-secondary transition-colors">
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Flood Risk</div>
                 {envData ? (
                     <>
                        <div className={`text-4xl font-bold font-mono my-2 ${envData.floodWarnings > 0 ? 'text-tech-alert animate-pulse' : 'text-gray-400'}`}>
                            {envData.floodWarnings}
                        </div>
                        <div className="text-[9px] text-gray-500">ACTIVE ALERTS</div>
                     </>
                 ) : <span className="text-gray-600 text-xs animate-pulse">INITIALIZING...</span>}
             </div>

             {/* SOLAR */}
             <div className="border border-gray-800 p-4 bg-black/40 hover:border-tech-secondary transition-colors">
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Solar Potential</div>
                 {envData ? (
                     <>
                        <div className="text-4xl font-bold font-mono my-2 text-tech-warning">
                            {envData.solarRadiation}
                        </div>
                        <div className="text-[9px] text-gray-500">WATTS / M²</div>
                     </>
                 ) : <span className="text-gray-600 text-xs animate-pulse">INITIALIZING...</span>}
             </div>

             {/* CLOUD */}
             <div className="border border-gray-800 p-4 bg-black/40 hover:border-tech-secondary transition-colors">
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Visibility / Cloud</div>
                 {envData ? (
                     <>
                        <div className={`text-4xl font-bold font-mono my-2 ${envData.cloudCover > 80 ? 'text-gray-500' : 'text-tech-secondary'}`}>
                            {envData.cloudCover}%
                        </div>
                        <div className="text-[9px] text-gray-500">SKY COVERAGE</div>
                     </>
                 ) : <span className="text-gray-600 text-xs animate-pulse">INITIALIZING...</span>}
             </div>

             {/* SEISMIC */}
             <div className="border border-gray-800 p-4 bg-black/40 hover:border-tech-secondary transition-colors">
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Seismic (1H)</div>
                 {envData ? (
                     <>
                        <div className={`text-4xl font-bold font-mono my-2 ${envData.maxSeismicMag > 4 ? 'text-tech-alert' : 'text-tech-primary'}`}>
                            {envData.maxSeismicMag.toFixed(1)}
                        </div>
                        <div className="text-[9px] text-gray-500">MAX MAGNITUDE</div>
                     </>
                 ) : <span className="text-gray-600 text-xs animate-pulse">INITIALIZING...</span>}
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* DEFCON / Readiness Widget */}
        <div className="bg-tech-panel p-6 border border-tech-border relative overflow-hidden flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-4 border-b border-gray-800 w-full pb-2">System Readiness</h3>
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                <svg className="absolute w-full h-full animate-spin-slow opacity-20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#00ff41" strokeWidth="1" fill="none" strokeDasharray="10 5" />
                    <circle cx="50" cy="50" r="35" stroke="#00ff41" strokeWidth="1" fill="none" />
                </svg>
                <span className={`text-4xl font-mono font-bold crt-glow ${readiness >= 80 ? 'text-tech-primary' : readiness >= 50 ? 'text-tech-warning' : 'text-tech-alert'}`}>
                {readiness}%
                </span>
            </div>
            <div className="text-xs text-gray-500 font-mono mt-2">
                STATUS: <span className={readiness >= 50 ? 'text-tech-primary' : 'text-tech-alert'}>{readiness >= 80 ? 'OPTIMAL' : 'ATTENTION REQUIRED'}</span>
            </div>
        </div>

        {/* System Proficiency Widget */}
        <div className="bg-tech-panel p-6 border border-tech-border relative overflow-hidden flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-4 border-b border-gray-800 w-full pb-2">Crew Proficiency</h3>
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
                <svg className="absolute w-full h-full animate-spin-reverse-slow opacity-20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#0ea5e9" strokeWidth="1" fill="none" strokeDasharray="2 5" />
                    <rect x="25" y="25" width="50" height="50" stroke="#0ea5e9" strokeWidth="1" fill="none" transform="rotate(45 50 50)" />
                </svg>
                <span className={`text-4xl font-mono font-bold crt-glow ${proficiency >= 80 ? 'text-tech-secondary' : 'text-gray-400'}`}>
                {proficiency}%
                </span>
            </div>
            <div className="text-xs text-gray-500 font-mono mt-2">
                TRAINING GRADE: <span className={proficiency >= 80 ? 'text-tech-secondary' : proficiency >= 50 ? 'text-gray-400' : 'text-gray-600'}>{proficiency >= 80 ? 'ELITE' : proficiency >= 50 ? 'STANDARD' : 'UNADAPTED'}</span>
            </div>
        </div>

        {/* Radar Chart (Pentagram/Pentagon vibe) */}
        <div className="bg-tech-panel p-4 border border-tech-border relative overflow-hidden">
           <h3 className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-2 text-center">Category Distribution</h3>
           <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontFamily: 'Share Tech Mono' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                    name="Readiness"
                    dataKey="A"
                    stroke="#00ff41"
                    strokeWidth={2}
                    fill="#00ff41"
                    fillOpacity={0.2}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#00ff41', fontFamily: 'Share Tech Mono' }}
                    itemStyle={{ color: '#00ff41' }}
                />
                </RadarChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Manual Ration Control (Replaces Alert Feed if all good, else sits below) */}
         <div className="bg-tech-panel p-6 border border-tech-border relative overflow-hidden flex flex-col justify-between">
           <h3 className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-4 border-b border-gray-800 w-full pb-2">Manual Ration Control</h3>
           <div className="flex-1 flex flex-col justify-center">
             <p className="text-[10px] text-gray-500 font-mono mb-4 leading-tight text-center">
                 MANUAL OVERRIDE: Log daily consumption to update supply levels based on crew manifest requirements.
             </p>
             <button 
                  onClick={onSimulateDay}
                  className="w-full py-3 border border-tech-warning text-tech-warning font-bold uppercase tracking-widest hover:bg-tech-warning hover:text-black transition-all active:scale-95 text-xs"
              >
                  Log Daily Usage [-1 Day]
             </button>
             <div className="mt-2 text-center text-[9px] text-gray-600 uppercase">
                 Deducts: Water / Rations / Meds
             </div>
           </div>
        </div>
      </div>
      
      {/* Main Status Feed / Timeline */}
      <div className="bg-tech-panel border border-tech-border p-6 relative">
        <div className="absolute top-0 left-0 w-2 h-full bg-black border-r border-tech-border"></div>
        <h3 className="text-tech-secondary font-bold uppercase tracking-[0.2em] mb-6 pl-4">Operation Timeline</h3>
        <div className="space-y-6 relative ml-4">
           {/* Timeline line */}
           <div className="absolute left-[7px] top-2 bottom-0 w-[1px] bg-gray-800"></div>

           <div className="relative pl-8">
              <div className="absolute left-0 top-1 w-4 h-4 bg-black border border-tech-primary rounded-none shadow-[0_0_5px_#00ff41]"></div>
              <p className="text-tech-primary text-sm font-bold uppercase tracking-wider">System Initialization</p>
              <p className="text-gray-600 text-xs mt-1 font-mono">Vanguard OS kernel loaded. Secure protocols active.</p>
           </div>
           
           {totalItems > 0 && (
             <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-4 h-4 bg-tech-secondary/20 border border-tech-secondary rounded-none"></div>
                <p className="text-tech-secondary text-sm font-bold uppercase tracking-wider">Manifest Updated</p>
                <p className="text-gray-600 text-xs mt-1 font-mono">Inventory tracking operative.</p>
             </div>
           )}

           <div className="relative pl-8 opacity-40">
              <div className="absolute left-0 top-1 w-4 h-4 bg-black border border-gray-600 rounded-none"></div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Objective: Full Readiness</p>
              <p className="text-gray-600 text-xs mt-1 font-mono">Pending completion of all supply categories.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
