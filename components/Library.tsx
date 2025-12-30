
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface GuideData {
  title: string;
  desc: string;
  content: string;
}

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offline' | 'online'>('offline');
  const [selectedGuide, setSelectedGuide] = useState<GuideData | null>(null);

  const categories = [
    {
      title: "Immediate Action Protocols",
      id: "IA-01",
      links: [
        { 
            title: "The Rule of 3s", 
            desc: "SURVIVAL HIERARCHY: Air, Shelter, Water, Food.", 
            content: `
### THE RULE OF THREES
In any survival situation, prioritize your actions based on immediate threats to life.

1. **3 MINUTES without Air**: Or in icy water. Immediate safety is priority #1.
2. **3 HOURS without Shelter**: In harsh environments (extreme heat or cold). Regulate body temp.
3. **3 DAYS without Water**: Dehydration causes delirium and death rapidly.
4. **3 WEEKS without Food**: Hunger is painful but rarely the first killer.

**ACTION PLAN:**
- STOP (Sit, Think, Observe, Plan).
- Do not panic. Panic burns oxygen and energy.
            `
        },
        { 
            title: "Bug Out Bag (BOB)", 
            desc: "72-HOUR DISPLACEMENT KIT.", 
            content: `
### 72-HOUR KIT MANIFEST
A "Bug Out Bag" is designed to get you from Point A to Point B safely.

**CORE MODULES:**
- **Water**: 1L Stainless steel bottle + purification tabs/filter (Sawyer Mini).
- **Shelter**: Tarp (10x10), mylar blanket, 50ft paracord.
- **Fire**: Bic lighter x2, ferro rod, vaseline cotton balls.
- **Food**: 3000 calories ready-to-eat (bars, jerky). No cooking req.
- **Tools**: Multitool, fixed blade knife, headlamp (spare batteries).
- **Comms**: AM/FM radio, whistle, signal mirror.
- **Docs**: ID copies, cash (small bills), map of area.
            ` 
        },
        { 
            title: "Get Home Bag (GHB)", 
            desc: "INTERMEDIATE TRANSIT KIT.", 
            content: `
### GET HOME BAG (Vehicle/Office)
Designed to get you home to your main supplies if stranded.

**DIFFERENCES FROM BOB:**
- Lighter, speed-focused.
- Comfortable walking shoes/socks (critical if you must walk home).
- Season-appropriate clothing layers.
- N95 Mask / Bandana (urban dust/debris).
- Silcock Key (access commercial water spigots).
- Hidden cash.
            ` 
        },
      ]
    },
    {
      title: "Field Medicine",
      id: "MED-02",
      links: [
        { 
            title: "Trauma / Shock", 
            desc: "STABILIZATION PROCEDURES.", 
            content: `
### TREATING SHOCK
Shock is a silent killer after trauma. 

**SYMPTOMS:** Pale/clammy skin, rapid pulse, rapid breathing, nausea, confusion.

**PROTOCOL:**
1. **Lay Down**: Keep patient flat.
2. **Elevate Legs**: 12 inches (unless spinal injury suspected).
3. **Warmth**: Cover with blankets/coats. Prevent heat loss.
4. **Comfort**: Reassure them. Do NOT give food/water.
5. **Monitor**: Check vitals every 5 mins.
            ` 
        },
        { 
            title: "Wound Management", 
            desc: "INFECTION CONTROL PROTOCOLS.", 
            content: `
### WOUND CLEANING
Infection killed more people historically than weapons.

1. **Stop Bleeding**: Direct pressure. Tourniquet only for life-threatening limb bleeds.
2. **Irrigate**: Flush with drinkable water. The solution to pollution is dilution. Use 500ml+ if possible.
3. **Disinfect**: Betadine/Alcohol around the wound, NOT inside deep tissue if avoidable (damages cells). Honey can be used as topical antibacterial.
4. **Dress**: Sterile gauze. Change daily. Monitor for red streaks (sepsis).
            ` 
        },
      ]
    },
    {
      title: "Sustenance Ops",
      id: "SUS-03",
      links: [
        { 
            title: "Hydration Purification", 
            desc: "FILTRATION / CHEMICAL / BOILING.", 
            content: `
### WATER PURIFICATION
Never drink questionable water without treatment.

**METHOD 1: BOILING**
- Bring to rolling boil for 1 minute (3 minutes at high altitude).
- Kills viruses, bacteria, protozoa.

**METHOD 2: CHEMICAL (Bleach)**
- Regular unscented bleach (5-8% sodium hypochlorite).
- Add 8 drops per gallon (2 drops per liter).
- Wait 30 minutes. Should smell slightly of chlorine.
- Double dose if water is cloudy.

**METHOD 3: FILTRATION**
- Ceramic/Hollow Fiber (0.1 micron) removes bacteria/protozoa.
- Does NOT remove viruses (add chemical treatment).
            ` 
        },
        { 
            title: "LTS (Long Term Storage)", 
            desc: "MYLAR / O2 ABSORBERS / ROTATION.", 
            content: `
### LONG TERM FOOD STORAGE
Dry goods can last 20+ years if stored correctly.

**THE ENEMIES:** Heat, Light, Oxygen, Moisture, Pests.

**PROTOCOL:**
1. **Container**: 5-Gallon food grade bucket or Mylar bag.
2. **Oxygen Absorber**: Use appropriate cc (e.g., 2000cc for 5 gal).
3. **Seal**: Iron the mylar bag shut.
4. **Store**: Cool, dark, dry place. Off the concrete floor.

**BEST CROPS:** White rice, dried beans, rolled oats, pasta, honey, salt (indefinite).
            ` 
        },
      ]
    }
  ];

  const onlineResources = [
    { title: "Ready.gov", url: "https://www.ready.gov", desc: "OFFICIAL DEPT OF HOMELAND SECURITY" },
    { title: "CDC Emergency", url: "https://emergency.cdc.gov", desc: "DISEASE CONTROL & PREVENTION" },
    { title: "Red Cross Mobile", url: "https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html", desc: "DISASTER RELIEF PROTOCOLS" },
    { title: "FEMA Flood Maps", url: "https://msc.fema.gov/portal/home", desc: "GEOSPATIAL HAZARD DATA" },
    { title: "NHC NOAA", url: "https://www.nhc.noaa.gov", desc: "HURRICANE TRACKING CENTER" }
  ];

  return (
    <div className="space-y-6 font-tech relative">
      <div className="bg-tech-panel p-6 border border-tech-border relative overflow-hidden">
        <h2 className="text-xl font-bold mb-2 text-tech-primary uppercase tracking-[0.2em] crt-glow">Survival Protocols</h2>
        <div className="flex space-x-4 mt-4 text-xs font-mono uppercase tracking-widest">
            <button 
              onClick={() => setActiveTab('offline')}
              className={`px-4 py-2 border ${activeTab === 'offline' ? 'bg-tech-primary text-black border-tech-primary' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
            >
                Local Database
            </button>
            <button 
              onClick={() => setActiveTab('online')}
              className={`px-4 py-2 border ${activeTab === 'online' ? 'bg-tech-secondary text-black border-tech-secondary' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
            >
                Remote Uplink
            </button>
        </div>
      </div>

      {activeTab === 'offline' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {categories.map((cat, idx) => (
            <div key={idx} className="bg-tech-panel border border-tech-border overflow-hidden hover:border-tech-primary transition-colors group">
                <div className="bg-black px-4 py-3 border-b border-tech-border flex justify-between items-center group-hover:bg-tech-dim transition-colors">
                <h3 className="font-bold text-gray-200 uppercase tracking-wider text-sm">{cat.title}</h3>
                <span className="text-xs text-gray-600 font-mono border border-gray-800 px-1">{cat.id}</span>
                </div>
                <div className="p-4">
                <ul className="space-y-4">
                    {cat.links.map((link, lIdx) => (
                    <li key={lIdx} onClick={() => setSelectedGuide({ title: link.title, desc: link.desc, content: link.content })} className="group/item cursor-pointer active:opacity-70">
                        <div className="flex items-start space-x-3">
                        <span className="text-tech-primary mt-1 text-xs">>></span>
                        <div>
                            <h4 className="text-gray-300 font-bold uppercase text-sm group-hover/item:text-tech-primary transition-colors border-b border-transparent group-hover/item:border-tech-primary inline-block">{link.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 font-mono tracking-wide">{link.desc}</p>
                        </div>
                        </div>
                    </li>
                    ))}
                </ul>
                </div>
            </div>
            ))}
        </div>
      ) : (
          <div className="animate-fade-in">
              {navigator.onLine ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {onlineResources.map((res, idx) => (
                        <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="bg-tech-panel border border-tech-border p-6 hover:border-tech-secondary hover:bg-tech-secondary/10 transition-all group block active:scale-95">
                             <div className="flex justify-between items-start">
                                 <h3 className="text-lg font-bold text-tech-secondary uppercase tracking-widest group-hover:underline decoration-dotted">{res.title}</h3>
                                 <span className="text-xs text-black bg-tech-secondary px-2 py-1 font-bold">EXT</span>
                             </div>
                             <p className="text-gray-400 font-mono text-sm mt-2">{res.desc}</p>
                             <div className="mt-4 text-xs text-gray-600 uppercase">Status: <span className="text-tech-primary">ONLINE</span></div>
                        </a>
                    ))}
                     <div className="col-span-1 md:col-span-2 bg-black border border-tech-warning p-4 text-center">
                        <p className="text-tech-warning text-xs font-mono uppercase tracking-widest">
                            CAUTION: EXTERNAL LINKS REQUIRE ACTIVE DATA CONNECTION.
                        </p>
                    </div>
                </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-64 border border-tech-alert bg-black/50">
                      <div className="text-4xl text-tech-alert mb-4">⚠</div>
                      <h3 className="text-tech-alert font-bold uppercase tracking-widest">CONNECTION SEVERED</h3>
                      <p className="text-gray-500 text-xs font-mono mt-2">UNABLE TO REACH EXTERNAL SERVERS. OFFLINE MODE ACTIVE.</p>
                  </div>
              )}
          </div>
      )}

      {/* Guide Modal Overlay */}
      {selectedGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
              <div className="bg-tech-panel border border-tech-primary w-full max-w-2xl max-h-[80vh] flex flex-col relative shadow-[0_0_30px_rgba(0,255,65,0.1)]">
                  <div className="p-4 border-b border-tech-border flex justify-between items-center bg-black">
                      <div>
                          <h2 className="text-xl font-bold text-tech-primary uppercase tracking-[0.2em]">{selectedGuide.title}</h2>
                          <p className="text-xs text-gray-500 font-mono">{selectedGuide.desc}</p>
                      </div>
                      <button onClick={() => setSelectedGuide(null)} className="text-tech-alert hover:text-white border border-tech-alert hover:bg-tech-alert px-3 py-1 uppercase text-xs font-bold transition-colors">
                          Close
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar font-mono text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      <ReactMarkdown>{selectedGuide.content}</ReactMarkdown>
                  </div>
                  <div className="p-2 bg-black border-t border-tech-border text-center text-xs text-gray-600 uppercase tracking-widest">
                      End of File
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Library;
