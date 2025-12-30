
import React, { useState, useEffect } from 'react';
import { sendEvent } from '../services/datadogService';

const Tools: React.FC = () => {
  const [sosActive, setSosActive] = useState(false);
  const [converterVal, setConverterVal] = useState('');
  const [converterType, setConverterType] = useState('c_to_f');
  const [activeTab, setActiveTab] = useState<'utils' | 'comms'>('utils');

  // SOS Flasher Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (sosActive) {
      sendEvent('EMERGENCY: SOS BEACON', 'User activated emergency distress beacon.', 'error');
      
      interval = setInterval(() => {
        const body = document.body;
        if (body.style.backgroundColor === 'white') {
          body.style.backgroundColor = '#000';
        } else {
          body.style.backgroundColor = 'white';
        }
      }, 500); 
    } else {
      document.body.style.backgroundColor = '#050505';
    }
    return () => {
      if (interval) clearInterval(interval);
      document.body.style.backgroundColor = '#050505';
    };
  }, [sosActive]);

  const convert = (val: string, type: string) => {
      const v = parseFloat(val);
      if (isNaN(v)) return '---';
      switch(type) {
          case 'c_to_f': return `${(v * 9/5 + 32).toFixed(1)} °F`;
          case 'f_to_c': return `${((v - 32) * 5/9).toFixed(1)} °C`;
          case 'km_to_mi': return `${(v * 0.621371).toFixed(2)} mi`;
          case 'mi_to_km': return `${(v / 0.621371).toFixed(2)} km`;
          case 'l_to_gal': return `${(v * 0.264172).toFixed(2)} gal`;
          case 'gal_to_l': return `${(v / 0.264172).toFixed(2)} L`;
          default: return '';
      }
  };

  const phrases = [
      { key: "Help!", sp: "¡Ayuda!", fr: "Aidez-moi!", cn: "救命 (Jiùmìng)", de: "Hilfe!" },
      { key: "I need water", sp: "Necesito agua", fr: "J'ai besoin d'eau", cn: "我需要水 (Wǒ xūyào shuǐ)", de: "Ich brauche Wasser" },
      { key: "I need a doctor", sp: "Necesito un médico", fr: "J'ai besoin d'un médecin", cn: "我需要医生 (Wǒ xūyào yīshēng)", de: "Ich brauche einen Arzt" },
      { key: "Where is police?", sp: "¿Dónde está la policía?", fr: "Où est la police?", cn: "警察在哪里 (Jǐngchá zài nǎlǐ)", de: "Wo ist die Polizei?" },
      { key: "Danger", sp: "Peligro", fr: "Danger", cn: "危险 (Wéixiǎn)", de: "Gefahr" },
      { key: "Safe place?", sp: "¿Lugar seguro?", fr: "Endroit sûr?", cn: "安全的地方? (Ānquán de dìfāng?)", de: "Sicherer Ort?" },
      { key: "Food", sp: "Comida", fr: "Nourriture", cn: "食物 (Shíwù)", de: "Essen" },
      { key: "My family", sp: "Mi familia", fr: "Ma famille", cn: "我的家人 (Wǒ de jiārén)", de: "Meine Familie" },
      { key: "Don't shoot", sp: "¡No dispare!", fr: "Ne tirez pas!", cn: "别开枪 (Bié kāiqiāng)", de: "Nicht schießen!" },
      { key: "I am injured", sp: "Estoy herido", fr: "Je suis blessé", cn: "我受伤了 (Wǒ shòushāng le)", de: "Ich bin verletzt" },
  ];

  return (
    <div className="space-y-6 font-tech">
      <div className="flex space-x-4 border-b border-tech-border pb-2 mb-4">
          <button onClick={() => setActiveTab('utils')} className={`text-sm uppercase tracking-widest pb-1 ${activeTab === 'utils' ? 'text-tech-primary border-b-2 border-tech-primary' : 'text-gray-500'}`}>Field Utils</button>
          <button onClick={() => setActiveTab('comms')} className={`text-sm uppercase tracking-widest pb-1 ${activeTab === 'comms' ? 'text-tech-primary border-b-2 border-tech-primary' : 'text-gray-500'}`}>Comms / Lang</button>
      </div>

      {activeTab === 'utils' && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Signal Tool */}
                <div className="bg-tech-panel border border-tech-border p-6 flex flex-col items-center justify-center space-y-4">
                    <h3 className="text-gray-200 uppercase tracking-widest font-bold border-b border-gray-700 w-full text-center pb-2">Emergency Beacon</h3>
                    <p className="text-xs text-gray-500 text-center">VISUAL SOS SIGNAL (SCREEN FLASH)</p>
                    <button 
                        onClick={() => setSosActive(!sosActive)}
                        className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${
                            sosActive 
                            ? 'bg-white text-black border-white animate-pulse shadow-[0_0_50px_white]' 
                            : 'bg-black text-tech-alert border-tech-alert hover:bg-tech-alert hover:text-black'
                        }`}
                    >
                        <span className="text-2xl font-bold tracking-widest">{sosActive ? 'STOP' : 'SOS'}</span>
                    </button>
                    {sosActive && <p className="text-tech-alert text-xs animate-bounce uppercase">Signaling Active</p>}
                </div>

                {/* Converter */}
                <div className="bg-tech-panel border border-tech-border p-6 space-y-4">
                    <h3 className="text-gray-200 uppercase tracking-widest font-bold border-b border-gray-700 pb-2">Unit Converter</h3>
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <select 
                                value={converterType}
                                onChange={(e) => setConverterType(e.target.value)}
                                className="bg-black border border-tech-border text-tech-primary p-2 text-sm uppercase flex-1 outline-none"
                            >
                                <option value="c_to_f">Celsius → Fahr</option>
                                <option value="f_to_c">Fahr → Celsius</option>
                                <option value="km_to_mi">Km → Miles</option>
                                <option value="mi_to_km">Miles → Km</option>
                                <option value="l_to_gal">Liters → Gal</option>
                                <option value="gal_to_l">Gal → Liters</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="number" 
                                value={converterVal}
                                onChange={(e) => setConverterVal(e.target.value)}
                                placeholder="VALUE"
                                className="bg-black border border-tech-border p-2 text-white w-24 outline-none font-mono"
                            />
                            <span className="text-tech-primary">➜</span>
                            <div className="flex-1 bg-black border border-tech-border p-2 text-right font-mono text-tech-secondary">
                                {convert(converterVal, converterType)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Morse Code Ref */}
            <div className="bg-tech-panel border border-tech-border p-6">
                <h3 className="text-gray-200 uppercase tracking-widest font-bold border-b border-gray-700 pb-4 mb-4">Morse Code Reference</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-gray-400">
                    {['A .-','B -...','C -.-.','D -..','E .','F ..-.','G --.','H ....','I ..','J .---','K -.-','L .-..','M --'].map(x => (
                        <div key={x} className="border border-gray-800 p-2 text-center hover:text-tech-primary hover:border-tech-primary transition-colors cursor-default">{x}</div>
                    ))}
                    {['N -.','O ---','P .--.','Q --.-','R .-.','S ...','T -','U ..-','V ...-','W .--','X -..-','Y -.--','Z --..'].map(x => (
                        <div key={x} className="border border-gray-800 p-2 text-center hover:text-tech-primary hover:border-tech-primary transition-colors cursor-default">{x}</div>
                    ))}
                    {['SOS ... --- ...'].map(x => (
                        <div key={x} className="col-span-2 border border-tech-alert text-tech-alert p-2 text-center font-bold animate-pulse">{x}</div>
                    ))}
                </div>
            </div>
        </>
      )}

      {activeTab === 'comms' && (
          <div className="bg-tech-panel border border-tech-border p-6">
              <h3 className="text-gray-200 uppercase tracking-widest font-bold border-b border-gray-700 pb-4 mb-4">Emergency Phrasebook</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-700 text-xs text-gray-500 font-mono uppercase">
                            <th className="p-2 text-tech-primary">English</th>
                            <th className="p-2">Spanish</th>
                            <th className="p-2">French</th>
                            <th className="p-2">German</th>
                            <th className="p-2">Mandarin</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-mono text-gray-300">
                        {phrases.map((p, idx) => (
                            <tr key={idx} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                                <td className="p-3 font-bold text-tech-primary">{p.key}</td>
                                <td className="p-3">{p.sp}</td>
                                <td className="p-3">{p.fr}</td>
                                <td className="p-3">{p.de}</td>
                                <td className="p-3">{p.cn}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tools;
