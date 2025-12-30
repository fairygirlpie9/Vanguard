
import React, { useState, useEffect, useRef } from 'react';
import { searchPlaces } from '../services/geminiService';
import { GroundingChunk } from '../types';
import ReactMarkdown from 'react-markdown';

// Global Leaflet variable from index.html
declare var L: any;

interface SavedLocation {
    id: string;
    title: string;
    uri: string;
    notes: string;
    timestamp: number;
}

const Locator: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{text: string, chunks: GroundingChunk[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'locked' | 'denied'>('idle');
  const [savedLogs, setSavedLogs] = useState<SavedLocation[]>([]);
  const [viewMode, setViewMode] = useState<'search' | 'saved'>('search');
  
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const mapContainerId = "tactical-map-container";

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) {
        mapRef.current = L.map(mapContainerId, {
            center: [51.505, -0.09],
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(mapRef.current);

        markersGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }
    
    // Resize map when component mounts/updates to handle flex container changes
    setTimeout(() => {
        mapRef.current?.invalidateSize();
    }, 100);

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  }, []);

  // Load saved logs
  useEffect(() => {
      const saved = localStorage.getItem('vanguard_intel_logs');
      if (saved) {
          try {
              setSavedLogs(JSON.parse(saved));
          } catch(e) {}
      }
  }, []);

  const saveToLog = (chunk: GroundingChunk) => {
      if (!chunk.maps?.title) return;
      const newLog: SavedLocation = {
          id: Date.now().toString(),
          title: chunk.maps.title,
          uri: chunk.maps.uri,
          notes: chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.content || "No intel detail available.",
          timestamp: Date.now()
      };
      const updated = [newLog, ...savedLogs];
      setSavedLogs(updated);
      localStorage.setItem('vanguard_intel_logs', JSON.stringify(updated));
  };

  const deleteLog = (id: string) => {
      const updated = savedLogs.filter(l => l.id !== id);
      setSavedLogs(updated);
      localStorage.setItem('vanguard_intel_logs', JSON.stringify(updated));
  };

  const toggleLocation = () => {
    if (!useLocation) {
        setLocationStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUseLocation(true);
                setLocationStatus('locked');
                if (mapRef.current) {
                    mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
                    L.circle([pos.coords.latitude, pos.coords.longitude], {
                        color: '#00ff41',
                        fillColor: '#00ff41',
                        fillOpacity: 0.1,
                        radius: 500
                    }).addTo(mapRef.current);
                }
            },
            () => {
                setUseLocation(false);
                setLocationStatus('denied');
            }
        );
    } else {
        setUseLocation(false);
        setLocationStatus('idle');
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults(null);
    setViewMode('search');

    try {
      let location: { lat: number; lng: number } | undefined;
      
      if (useLocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (e) {
          console.warn("Location failed, proceeding with general search.");
        }
      }

      const response = await searchPlaces(query, location);
      const text = response.text || "No intelligence gathered.";
      const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];

      setResults({ text, chunks });

      // Update Map Markers
      if (markersGroupRef.current) {
          markersGroupRef.current.clearLayers();
          
          let bounds: any[] = [];
          
          chunks.forEach(chunk => {
              if (chunk.maps?.title) {
                  // For visual impact in this simulation context, we drop markers around the center
                  const baseLat = location?.lat || 51.505;
                  const baseLng = location?.lng || -0.09;
                  const offsetLat = (Math.random() - 0.5) * 0.04;
                  const offsetLng = (Math.random() - 0.5) * 0.04;
                  
                  const marker = L.marker([baseLat + offsetLat, baseLng + offsetLng], {
                      icon: L.divIcon({ className: 'custom-tactical-marker', iconSize: [14, 14] })
                  }).addTo(markersGroupRef.current);
                  
                  marker.bindPopup(`
                    <div class="font-mono text-xs">
                        <strong class="text-tech-primary uppercase">${chunk.maps.title}</strong><br/>
                        <a href="${chunk.maps.uri}" target="_blank" class="text-tech-secondary underline block mt-1 uppercase">View Source Intel</a>
                    </div>
                  `);
                  bounds.push([baseLat + offsetLat, baseLng + offsetLng]);
              }
          });

          if (bounds.length > 0 && mapRef.current) {
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
      }

    } catch (err: any) {
      console.error(err);
      setError("Uplink failed. Local signal interference detected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 font-tech">
      <div className="bg-tech-panel p-6 border border-tech-border relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl text-tech-primary">⌖</div>
        <h2 className="text-xl font-bold mb-2 text-tech-primary uppercase tracking-widest crt-glow">Tactical Intel Map</h2>
        <p className="text-xs text-gray-500 mb-6 font-mono border-b border-gray-800 pb-2">UPLINK: GEMINI-2.5-FLASH // GROUNDING: GOOGLE MAPS ACTIVE</p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 flex space-x-2 relative">
                <span className="absolute left-3 top-3 text-tech-primary font-mono">{'>'}</span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="QUERY RESOURCE LOCATIONS (E.G. 'NEAREST WATER WELLS')..."
                    className="flex-1 bg-black border border-tech-border p-3 pl-8 text-white focus:border-tech-primary outline-none font-mono text-sm uppercase"
                />
                <button
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="bg-tech-border text-tech-primary border border-tech-primary font-bold px-6 py-2 hover:bg-tech-primary hover:text-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                    {loading ? 'SCANNING...' : 'SCAN'}
                </button>
            </div>
            
            <button 
                onClick={toggleLocation}
                className={`flex items-center space-x-2 px-4 py-2 border font-bold text-xs uppercase tracking-widest transition-all ${
                    locationStatus === 'locked' ? 'bg-tech-primary text-black border-tech-primary' : 
                    locationStatus === 'locating' ? 'bg-tech-warning text-black border-tech-warning animate-pulse' :
                    'border-gray-700 text-gray-500 hover:border-tech-primary'
                }`}
            >
                <span>{locationStatus === 'locked' ? 'LOCATION LOCKED' : locationStatus === 'locating' ? 'LOCATING...' : 'GEO-TAG SEARCH'}</span>
            </button>
        </div>

        <div className="flex space-x-4 text-xs font-mono uppercase tracking-widest">
            <button 
                onClick={() => setViewMode('search')}
                className={`pb-1 border-b-2 transition-all ${viewMode === 'search' ? 'border-tech-primary text-tech-primary' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                Live Results
            </button>
            <button 
                onClick={() => setViewMode('saved')}
                className={`pb-1 border-b-2 transition-all ${viewMode === 'saved' ? 'border-tech-secondary text-tech-secondary' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                Intelligence Logs ({savedLogs.length})
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Map Display - Ensure container fills available height */}
        <div className="lg:col-span-2 relative border border-tech-border bg-black group overflow-hidden h-[400px] lg:h-auto min-h-[400px]">
            <div id={mapContainerId} className="w-full h-full z-0"></div>
            
            {/* Map Overlay Decorations */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="bg-black/80 border border-tech-border p-2 text-[10px] text-tech-primary font-mono space-y-1">
                    <div>SCAN_RADIUS: <span className="text-white">50KM</span></div>
                    <div>FREQ: <span className="text-white">2.4GHZ</span></div>
                    <div className="border-t border-tech-border/30 pt-1 text-[8px] opacity-50 uppercase tracking-[0.2em]">Downlink established</div>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                    <div className="text-center">
                        <div className="w-16 h-16 border-2 border-tech-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                        <p className="text-tech-primary font-bold uppercase tracking-[0.3em] animate-pulse font-mono">Decoding Signal...</p>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="absolute bottom-4 left-4 z-10 bg-tech-alert/90 text-black px-4 py-2 font-bold text-xs uppercase tracking-widest">
                    ⚠ {error}
                </div>
            )}
        </div>

        {/* Results / Briefing Panel */}
        <div className="bg-tech-panel border border-tech-border flex flex-col h-[400px] lg:h-auto overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="p-4 bg-black border-b border-tech-border flex justify-between items-center shrink-0">
                <h3 className="text-tech-secondary font-bold uppercase tracking-widest text-sm">Strategic Intelligence</h3>
                <div className="w-2 h-2 bg-tech-secondary rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                {viewMode === 'search' ? (
                    results ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-black/40 p-4 border-l-2 border-tech-primary font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                                <ReactMarkdown 
                                    components={{
                                        p: ({node, ...props}) => <p className="mb-2" {...props} />,
                                        strong: ({node, ...props}) => <strong className="text-tech-primary font-bold" {...props} />,
                                        a: ({node, ...props}) => <a className="text-tech-secondary underline" target="_blank" {...props} />
                                    }}
                                >
                                    {results.text}
                                </ReactMarkdown>
                            </div>
                            
                            {results.chunks.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-tech-primary text-[10px] font-bold uppercase tracking-widest border-b border-tech-border pb-1">Grounding Sources</h4>
                                    {results.chunks.map((chunk, idx) => (
                                        chunk.maps && (
                                            <div key={idx} className="bg-black/60 p-3 border border-gray-800 hover:border-tech-secondary transition-colors group">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="text-gray-200 font-bold text-sm uppercase group-hover:text-tech-secondary transition-colors">{chunk.maps.title}</h5>
                                                    <button 
                                                        onClick={() => saveToLog(chunk)}
                                                        className="text-[10px] text-tech-primary border border-tech-primary px-1 hover:bg-tech-primary hover:text-black transition-colors"
                                                    >
                                                        ARCHIVE
                                                    </button>
                                                </div>
                                                <a href={chunk.maps.uri} target="_blank" className="text-[10px] text-tech-secondary underline decoration-dotted mt-2 block uppercase tracking-tighter">Open in GPS Terminal</a>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                            <span className="text-4xl mb-4">📡</span>
                            <p className="text-xs font-mono uppercase tracking-widest">Awaiting Scan Target</p>
                            <p className="text-[10px] text-gray-600 mt-2 uppercase italic">Initialize query for tactical reconnaissance</p>
                        </div>
                    )
                ) : (
                    <div className="space-y-4">
                        {savedLogs.length > 0 ? (
                            savedLogs.map(log => (
                                <div key={log.id} className="bg-black/60 p-4 border border-tech-secondary/30 relative group">
                                    <button 
                                        onClick={() => deleteLog(log.id)}
                                        className="absolute top-2 right-2 text-tech-alert text-xs hover:text-white opacity-50 group-hover:opacity-100"
                                    >
                                        [REMOVE]
                                    </button>
                                    <h5 className="text-tech-secondary font-bold text-sm uppercase mb-1">{log.title}</h5>
                                    <p className="text-[10px] text-gray-500 font-mono mb-2 tracking-tighter">LOGGED: {new Date(log.timestamp).toLocaleTimeString()} UTC</p>
                                    <div className="text-xs text-gray-400 font-mono italic bg-black/40 p-2 mb-3 border-l border-tech-secondary/40 leading-snug">
                                        "{log.notes.length > 80 ? log.notes.substring(0, 80) + '...' : log.notes}"
                                    </div>
                                    <a href={log.uri} target="_blank" className="text-[10px] text-tech-primary font-bold border border-tech-primary px-3 py-1 hover:bg-tech-primary hover:text-black transition-all inline-block uppercase tracking-widest">
                                        View Intel Source
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                                <span className="text-4xl mb-4">🗄</span>
                                <p className="text-xs font-mono uppercase tracking-widest">Archives Cleared</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="p-3 bg-black border-t border-tech-border text-[9px] text-gray-600 font-mono flex justify-between uppercase tracking-widest">
                <span>Buffer Status: Secure</span>
                <span>Signal: {results ? 'Locked' : 'Standby'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Locator;
