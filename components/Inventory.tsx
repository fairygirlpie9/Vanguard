
import React, { useState, useEffect } from 'react';
import { InventoryItem, CrewProfile } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface InventoryProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  crew: CrewProfile;
  setCrew: React.Dispatch<React.SetStateAction<CrewProfile>>;
}

const Inventory: React.FC<InventoryProps> = ({ items, setItems, crew, setCrew }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<InventoryItem['category']>('Food');
  // Extra fields for inputs
  const [newItemCalories, setNewItemCalories] = useState(0);
  const [newItemDose, setNewItemDose] = useState(0);

  const categories = ['Water', 'Food', 'Meds', 'Medical', 'Security', 'Tools', 'Docs'];

  // --- CALCULATIONS ---
  // Water: Adult 3L, Child 2L
  const dailyWaterReq = (crew.adults * 3) + (crew.children * 2) + (crew.pets * 0.5);
  // Food: Adult 2500cal, Child 1800cal
  const dailyCalReq = (crew.adults * 2500) + (crew.children * 1800);

  const totalWaterStock = items
    .filter(i => i.category === 'Water')
    .reduce((acc, i) => acc + (i.quantity * (i.litersPerUnit || 1)), 0);
  
  const totalFoodStock = items
    .filter(i => i.category === 'Food')
    .reduce((acc, i) => acc + (i.quantity * (i.caloriesPerUnit || 0)), 0);

  const waterDays = dailyWaterReq > 0 ? totalWaterStock / dailyWaterReq : 0;
  const foodDays = dailyCalReq > 0 ? totalFoodStock / dailyCalReq : 0;

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: newItemName,
      category: newItemCategory,
      quantity: 0,
      target: 10,
      unit: 'units',
      caloriesPerUnit: newItemCategory === 'Food' ? newItemCalories : undefined,
      litersPerUnit: newItemCategory === 'Water' ? 1 : undefined, // Default 1L per unit if not specified
      dailyDose: newItemCategory === 'Meds' ? newItemDose : undefined,
    };
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemCalories(0);
    setNewItemDose(0);
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItemDetails = (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const getProgressColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return '#00ff41'; // Matrix Green
    if (ratio >= 0.5) return '#eab308'; // Warning Yellow
    return '#ef4444'; // Alert Red
  };

  // Prepare chart data
  const chartData = categories.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const totalCurrent = catItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalTarget = catItems.reduce((acc, curr) => acc + curr.target, 0);
    const percentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    return { name: cat, percentage };
  });

  return (
    <div className="space-y-6 animate-fade-in font-tech">
      
      {/* CREW MANIFEST PANEL */}
      <div className="bg-tech-panel p-4 border border-tech-border grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-tech-primary"></div>
        <div>
            <h2 className="text-sm font-bold text-tech-primary uppercase tracking-[0.2em] mb-4">Personnel Manifest</h2>
            <div className="flex space-x-4">
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500 uppercase">Adults</label>
                    <input 
                      type="number" min="1" 
                      value={crew.adults} 
                      onChange={(e) => setCrew(prev => ({...prev, adults: parseInt(e.target.value) || 0}))}
                      className="w-16 bg-black border border-tech-border text-center text-white p-2 text-sm"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500 uppercase">Minors</label>
                    <input 
                      type="number" min="0" 
                      value={crew.children} 
                      onChange={(e) => setCrew(prev => ({...prev, children: parseInt(e.target.value) || 0}))}
                      className="w-16 bg-black border border-tech-border text-center text-white p-2 text-sm"
                    />
                </div>
                 <div className="flex flex-col">
                    <label className="text-xs text-gray-500 uppercase">Pets</label>
                    <input 
                      type="number" min="0" 
                      value={crew.pets} 
                      onChange={(e) => setCrew(prev => ({...prev, pets: parseInt(e.target.value) || 0}))}
                      className="w-16 bg-black border border-tech-border text-center text-white p-2 text-sm"
                    />
                </div>
            </div>
        </div>
        
        <div className="flex items-center justify-around border-l border-tech-border pl-4">
             <div className="text-center">
                 <div className="text-xs text-gray-500 uppercase mb-1">Water Sustainability</div>
                 <div className={`text-2xl font-mono font-bold ${waterDays < 3 ? 'text-tech-alert animate-pulse' : 'text-tech-primary'}`}>
                    {waterDays.toFixed(1)} <span className="text-xs">DAYS</span>
                 </div>
                 <div className="text-xs text-gray-600">{dailyWaterReq.toFixed(1)} L / DAY REQ</div>
             </div>
             <div className="text-center">
                 <div className="text-xs text-gray-500 uppercase mb-1">Ration Sustainability</div>
                 <div className={`text-2xl font-mono font-bold ${foodDays < 3 ? 'text-tech-alert animate-pulse' : 'text-tech-secondary'}`}>
                    {foodDays.toFixed(1)} <span className="text-xs">DAYS</span>
                 </div>
                 <div className="text-xs text-gray-600">{dailyCalReq} CAL / DAY REQ</div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Add Panel */}
        <div className="bg-tech-panel p-6 border border-tech-border relative overflow-hidden group">
          <h2 className="text-lg font-bold mb-4 text-tech-primary uppercase tracking-widest border-b border-tech-border pb-2">Log Supplies</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1 tracking-wider">Item Designation</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-black border border-tech-border p-3 text-tech-primary focus:border-tech-primary outline-none font-mono text-sm"
                placeholder="TYPE DESIGNATION..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                <label className="block text-xs uppercase text-gray-500 mb-1 tracking-wider">Category</label>
                <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-black border border-tech-border p-3 text-tech-primary outline-none font-mono uppercase text-sm"
                >
                    {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
                </div>
                {/* Dynamic Inputs based on category */}
                {newItemCategory === 'Food' && (
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1 tracking-wider">Cal/Unit</label>
                        <input
                            type="number"
                            value={newItemCalories}
                            onChange={(e) => setNewItemCalories(parseInt(e.target.value) || 0)}
                            className="w-full bg-black border border-tech-border p-3 text-white outline-none font-mono text-sm"
                            placeholder="Cal"
                        />
                    </div>
                )}
                 {newItemCategory === 'Meds' && (
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1 tracking-wider">Dose/Day</label>
                        <input
                            type="number"
                            value={newItemDose}
                            onChange={(e) => setNewItemDose(parseInt(e.target.value) || 0)}
                            className="w-full bg-black border border-tech-border p-3 text-white outline-none font-mono text-sm"
                        />
                    </div>
                )}
            </div>
            
            <button
              onClick={handleAddItem}
              className="w-full bg-tech-border hover:bg-tech-primary hover:text-black active:bg-tech-primary active:text-black text-tech-primary font-bold py-3 border border-tech-primary transition-all uppercase tracking-widest text-sm active:scale-95"
            >
              Add to Manifest
            </button>
          </div>
        </div>

        {/* Stats Chart */}
        <div className="lg:col-span-2 bg-tech-panel p-6 border border-tech-border">
          <h2 className="text-lg font-bold mb-4 text-tech-primary uppercase tracking-widest border-b border-tech-border pb-2">Stockpile Levels</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#666', fontFamily: 'Share Tech Mono'}} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} unit="%" tick={{fill: '#666', fontFamily: 'Share Tech Mono'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#00ff41', fontFamily: 'Share Tech Mono' }}
                  cursor={{fill: 'rgba(0, 255, 65, 0.05)'}}
                />
                <Bar dataKey="percentage">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getProgressColor(entry.percentage, 100)} strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-tech-panel border border-tech-border overflow-hidden">
        <div className="p-4 border-b border-tech-border flex justify-between items-center bg-black">
          <h2 className="text-lg font-bold text-gray-200 uppercase tracking-widest">Supply Manifest</h2>
          <span className="text-xs font-mono text-tech-primary px-2 py-1 border border-tech-primary/30">COUNT: {items.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-black/50 text-xs uppercase text-gray-500 font-mono tracking-wider">
              <tr>
                <th className="p-4 border-b border-tech-border">Item</th>
                <th className="p-4 border-b border-tech-border">Details</th>
                <th className="p-4 border-b border-tech-border text-center">Levels</th>
                <th className="p-4 border-b border-tech-border text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tech-border">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono text-gray-300">
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</div>
                  </td>
                  <td className="p-4">
                     {/* Category Specific Data Display */}
                     {item.category === 'Food' && (
                         <div className="text-xs font-mono text-tech-secondary">
                             {item.caloriesPerUnit} Cal/Unit
                         </div>
                     )}
                     {item.category === 'Meds' && (
                         <div className="space-y-1">
                             <div className="text-xs font-mono text-tech-alert">
                                DOSE: {item.dailyDose}/day
                             </div>
                             {item.quantity < (item.dailyDose || 1) * 3 && (
                                 <div className="text-xs bg-tech-alert text-black px-1 font-bold animate-pulse inline-block">REFILL REQ</div>
                             )}
                         </div>
                     )}
                     {/* Generic expiry edit */}
                     <input 
                       type="text" 
                       placeholder="EXP: YYYY-MM-DD"
                       value={item.expiry || ''}
                       onChange={(e) => updateItemDetails(item.id, { expiry: e.target.value })}
                       className="bg-transparent border-b border-transparent group-hover:border-gray-700 text-xs text-gray-500 w-28 outline-none focus:border-tech-primary focus:text-tech-primary mt-1 p-1"
                     />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                       <span className="text-xs font-mono w-16 text-right text-gray-400">
                         {item.quantity}/{item.target}
                       </span>
                       <div className="w-24 h-2 bg-gray-800">
                         <div 
                           className="h-full transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                           style={{ 
                             width: `${Math.min(100, (item.quantity / item.target) * 100)}%`,
                             backgroundColor: getProgressColor(item.quantity, item.target),
                             boxShadow: `0 0 5px ${getProgressColor(item.quantity, item.target)}`
                           }}
                         />
                       </div>
                    </div>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 bg-black hover:bg-tech-alert hover:text-black active:bg-tech-alert active:text-black text-gray-400 border border-tech-border transition-colors font-mono font-bold"
                    >-</button>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 bg-black hover:bg-tech-primary hover:text-black active:bg-tech-primary active:text-black text-gray-400 border border-tech-border transition-colors font-mono font-bold"
                    >+</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-600 font-mono uppercase tracking-widest text-sm">
                    [ NO DATA IN MANIFEST ]
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
