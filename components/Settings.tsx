
import React, { useState, useEffect, useRef } from 'react';
import { getStoredConfig, saveConfig, testConnection, subscribeToLogs, DatadogConfig, TelemetryLog } from '../services/datadogService';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [appKey, setAppKey] = useState('');
  const [site, setSite] = useState('datadoghq.eu');
  const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredConfig();
    if (stored) {
      setApiKey(stored.apiKey);
      setAppKey(stored.appKey);
      setSite(stored.site);
    }

    // Subscribe to service logs
    const unsubscribe = subscribeToLogs((log) => {
        setLogs(prev => [...prev.slice(-19), log]); // Keep last 20
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSave = async () => {
    setStatus('TESTING');
    const config: DatadogConfig = { apiKey, appKey, site };
    saveConfig(config);
    
    const valid = await testConnection(config);
    if (valid) {
      setStatus('SUCCESS');
      setTimeout(() => setStatus('IDLE'), 3000);
    } else {
      setStatus('FAILURE');
    }
  };

  const loadPreset = () => {
      setApiKey('b1d7f14cd1527277e289b3f8fd65dd35');
      setAppKey('265653fdca3c4677cda4403279949304f6c77fd9');
      setSite('datadoghq.eu'); 
  };

  return (
    <div className="space-y-6 font-tech h-full flex flex-col max-w-4xl mx-auto pb-6">
      <div className="bg-tech-panel p-8 border border-tech-border w-full relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tech-primary to-transparent opacity-50"></div>
        
        <div className="flex items-center space-x-3 mb-8 border-b border-tech-border pb-4">
            <span className="text-3xl">⚙</span>
            <div>
                <h2 className="text-2xl font-bold text-tech-primary uppercase tracking-[0.2em] crt-glow">Network Config</h2>
                <p className="text-xs text-gray-500 font-mono">DATADOG TELEMETRY UPLINK</p>
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex justify-end">
                <button onClick={loadPreset} className="text-[10px] text-tech-secondary border border-tech-secondary px-2 py-1 uppercase hover:bg-tech-secondary hover:text-black transition-colors">
                    Load Hackathon Preset
                </button>
            </div>

            <div>
                <label className="block text-xs uppercase text-tech-secondary mb-2 tracking-wider font-bold">Datadog API Key</label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="ENTER API KEY"
                    className="w-full bg-black border border-tech-border p-3 text-white focus:border-tech-secondary outline-none font-mono text-sm tracking-widest"
                />
            </div>

            <div>
                <label className="block text-xs uppercase text-tech-secondary mb-2 tracking-wider font-bold">Datadog Application Key</label>
                <input
                    type="password"
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder="ENTER APP KEY"
                    className="w-full bg-black border border-tech-border p-3 text-white focus:border-tech-secondary outline-none font-mono text-sm tracking-widest"
                />
            </div>

            <div>
                <label className="block text-xs uppercase text-tech-secondary mb-2 tracking-wider font-bold">Data Center Region</label>
                <select
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="w-full bg-black border border-tech-border p-3 text-white focus:border-tech-secondary outline-none font-mono text-sm uppercase"
                >
                    <option value="datadoghq.eu">Europe (datadoghq.eu)</option>
                    <option value="datadoghq.com">US (datadoghq.com)</option>
                    <option value="us3.datadoghq.com">US3</option>
                    <option value="us5.datadoghq.com">US5</option>
                </select>
            </div>

            <div className="pt-4 border-t border-tech-border flex items-center justify-between">
                <div className="text-xs font-mono">
                    {status === 'TESTING' && <span className="text-tech-warning animate-pulse">>> VERIFYING HANDSHAKE...</span>}
                    {status === 'SUCCESS' && <span className="text-tech-primary">>> CONNECTION ESTABLISHED</span>}
                    {status === 'FAILURE' && (
                        <div className="flex flex-col">
                            <span className="text-tech-alert">>> CONNECTION REFUSED</span>
                            <span className="text-[9px] text-gray-500">CHECK KEYS OR CORS SETTINGS</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={!apiKey || !appKey || status === 'TESTING'}
                    className="bg-tech-border text-tech-primary border border-tech-primary font-bold px-8 py-3 hover:bg-tech-primary hover:text-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    {status === 'TESTING' ? 'CONNECTING' : 'INITIALIZE UPLINK'}
                </button>
            </div>
        </div>

        <div className="mt-8 bg-black/50 p-4 border border-tech-border/50 text-[10px] text-gray-600 font-mono">
            <p>NOTE: API Keys are stored locally in your browser. Connection is routed via secure CORS proxy for demo compatibility.</p>
        </div>
      </div>

      {/* Live Telemetry Console */}
      <div className="bg-black border border-tech-border p-4 h-64 overflow-hidden flex flex-col">
         <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-2">
            <h3 className="text-xs text-tech-primary font-bold uppercase tracking-widest">Live Telemetry Console</h3>
            <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-tech-alert rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-500">REAL-TIME TRAFFIC</span>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar p-2 bg-black/50">
             {logs.length === 0 && <div className="text-gray-700 italic">>> No traffic detected. Initialize Uplink or perform actions to generate telemetry.</div>}
             {logs.map((log) => (
                 <div key={log.id} className="flex space-x-2">
                     <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                     <span className={`font-bold ${
                         log.type === 'OUTGOING' ? 'text-tech-secondary' : 
                         log.type === 'INCOMING' ? 'text-tech-primary' : 'text-tech-alert'
                     }`}>
                         {log.type === 'OUTGOING' ? '>>' : log.type === 'INCOMING' ? '<<' : '!!'}
                     </span>
                     <span className="text-gray-300">{log.message}</span>
                 </div>
             ))}
             <div ref={logsEndRef} />
         </div>
      </div>
    </div>
  );
};

export default Settings;
