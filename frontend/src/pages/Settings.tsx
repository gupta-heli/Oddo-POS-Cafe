import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Layers, Table as TableIcon, ChevronDown, Copy, Equal } from 'lucide-react';
import api from '../services/api';

const Settings: React.FC = () => {
  const [floors, setFloors] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<any | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const fetchData = async () => {
    try {
      const [floorsRes, terminalsRes] = await Promise.all([
        api.get('/pos/floors'),
        api.get('/pos/terminals')
      ]);
      setFloors(floorsRes.data);
      setTerminals(terminalsRes.data);
      
      if (floorsRes.data.length > 0) {
        if (selectedFloor) {
          const updated = floorsRes.data.find((f: any) => f.id === selectedFloor.id);
          setSelectedFloor(updated || floorsRes.data[0]);
        } else {
          setSelectedFloor(floorsRes.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFloor = async () => {
    const name = prompt("Enter Floor Name (e.g. Ground Floor)");
    if (!name) return;
    
    try {
      const res = await api.post('/pos/floors', { name });
      await fetchData();
      setSelectedFloor(res.data);
    } catch (err: any) {
      alert(`Error creating floor: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleUpdateFloor = async (id: string, updates: any) => {
    try {
      await api.put(`/pos/floors/${id}`, updates);
      await fetchData();
    } catch (err: any) {
      alert(`Error updating floor: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleAddTable = async () => {
    if (!selectedFloor) {
      alert("Please select or create a floor first.");
      return;
    }
    try {
      const nextNum = selectedFloor.tables?.length ? Math.max(...selectedFloor.tables.map((t:any) => t.tableNumber)) + 1 : 101;
      await api.post(`/pos/floors/${selectedFloor.id}/tables`, {
        tableNumber: nextNum,
        seats: 4
      });
      await fetchData();
    } catch (err: any) {
      alert(`Error adding table: ${err.response?.data?.error || err.message}`);
    }
  };

  // PERSISTENCE ONLY
  const persistTableUpdate = async (id: string, updates: any) => {
    try {
      await api.put(`/pos/tables/${id}`, updates);
    } catch (err: any) {
      console.error("Persist failed", err);
      fetchData(); // Revert on failure
    }
  };

  // LOCAL UI UPDATE (FAST)
  const localTableUpdate = (id: string, updates: any) => {
    if (!selectedFloor) return;
    const updatedTables = selectedFloor.tables.map((t: any) => {
      if (t.id === id) {
        const newTable = { ...t, ...updates };
        // Auto-calc resource if number/seats changed
        if (updates.tableNumber || updates.seats) {
          newTable.appointmentResource = `Table ${newTable.tableNumber} (Seating ${newTable.seats})`;
        }
        return newTable;
      }
      return t;
    });
    setSelectedFloor({ ...selectedFloor, tables: updatedTables });
  };

  const toggleTableSelection = (id: string) => {
    setSelectedTableIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: 'duplicate' | 'delete') => {
    if (selectedTableIds.length === 0) return;
    try {
      if (action === 'delete') {
        if (window.confirm(`Delete ${selectedTableIds.length} tables?`)) {
          for (const id of selectedTableIds) {
            await api.delete(`/pos/tables/${id}`);
          }
        }
      } else if (action === 'duplicate') {
        for (const id of selectedTableIds) {
          const table = selectedFloor.tables.find((t: any) => t.id === id);
          await api.post(`/pos/floors/${selectedFloor.id}/tables`, {
            tableNumber: table.tableNumber + 1,
            seats: table.seats
          });
        }
      }
      setSelectedTableIds([]);
      setShowActionMenu(false);
      fetchData();
    } catch (err) {
      alert('Action failed');
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Syncing Floor Plan...</div>;

  return (
    <div className="px-12 py-12 flex flex-col gap-10 min-h-full animate-fade-in font-manrope bg-background text-primary">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black text-primary tracking-tighter italic uppercase">Floor & Table</h2>
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.4em]">Back-end View • Configure Layouts</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-full shadow-sm border border-surface-container-high">
          {floors.map(f => (
            <button 
              key={f.id}
              onClick={() => setSelectedFloor(f)} 
              className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${selectedFloor?.id === f.id ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'}`}
            >
              {f.name}
            </button>
          ))}
          <button 
            onClick={handleCreateFloor}
            className="px-4 py-2.5 text-primary hover:scale-110 transition-transform"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-surface-container-high overflow-hidden flex flex-col flex-1">
        {selectedFloor ? (
          <div className="flex flex-col h-full">
            <div className="p-12 border-b border-surface-container-low space-y-10">
              <div className="max-w-2xl space-y-8">
                <div>
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-2 italic">Floor Name</p>
                  <input 
                    type="text" 
                    value={selectedFloor.name}
                    onChange={(e) => {
                      const newFloors = [...floors];
                      const idx = newFloors.findIndex(f => f.id === selectedFloor.id);
                      newFloors[idx].name = e.target.value;
                      setFloors(newFloors);
                      setSelectedFloor({...selectedFloor, name: e.target.value});
                    }}
                    onBlur={() => handleUpdateFloor(selectedFloor.id, { name: selectedFloor.name })}
                    placeholder="e.g: Ground Floor"
                    className="bg-transparent border-b-2 border-surface-container-high w-full py-2 text-primary font-bold text-2xl outline-none focus:border-primary transition-colors placeholder:text-outline/30"
                  />
                </div>

                <div className="flex items-center gap-12">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-4 flex items-center gap-2 italic">Point Of Sale <span className="bg-surface-container-low px-2 py-0.5 rounded text-[8px] not-italic text-outline">Restaurant</span></p>
                    <div className="relative">
                      <select className="w-full bg-transparent border-b-2 border-dashed border-surface-container-high py-2 font-bold text-primary outline-none focus:border-primary transition-all appearance-none cursor-pointer italic text-sm">
                        <option value="">Odoo Cafe (Default)</option>
                        {terminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-0 bottom-3 text-outline pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex-1"></div>
                </div>
              </div>
            </div>

            <div className="px-12 py-6 bg-surface-container-low/30 border-b border-surface-container-low flex justify-between items-center">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleAddTable}
                  className="bg-[#D1B3C4] text-[#4A2E3B] px-8 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> New Table
                </button>
                {selectedTableIds.length > 0 && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowActionMenu(!showActionMenu)}
                      className="bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg"
                    >
                      <span className="bg-white/20 px-2 py-0.5 rounded text-[8px]">{selectedTableIds.length} Selected</span>
                      * Action <ChevronDown size={14} />
                    </button>
                    <AnimatePresence>
                      {showActionMenu && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 bg-white border border-surface-container-high rounded-2xl shadow-2xl z-50 w-48 overflow-hidden">
                          <button onClick={() => handleBulkAction('duplicate')} className="w-full text-left px-6 py-4 text-xs font-bold text-primary hover:bg-surface-container-low flex items-center gap-3 border-b border-surface-container-low">
                            <Copy size={14} className="text-secondary" /> Duplicate
                          </button>
                          <button onClick={() => handleBulkAction('delete')} className="w-full text-left px-6 py-4 text-xs font-bold text-error hover:bg-error/5 flex items-center gap-3">
                            <Trash2 size={14} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <button className="text-primary hover:bg-surface-container-low p-2 rounded-xl transition-colors">
                <Equal size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50 text-outline">
                    <th className="w-16 px-12 py-5 border-b border-surface-container-high"></th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-surface-container-high">Table Number</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-surface-container-high">Seats</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-surface-container-high">Active</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b border-surface-container-high">Appointment Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {(selectedFloor.tables || []).map((table: any) => {
                    const isSelected = selectedTableIds.includes(table.id);
                    return (
                      <tr key={table.id} className={`group hover:bg-surface-container-low/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="px-12 py-5">
                          <div 
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/30 text-transparent group-hover:border-primary/50'}`}
                            onClick={() => toggleTableSelection(table.id)}
                          >
                            <Check size={12} strokeWidth={4} />
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <input 
                            type="number"
                            value={table.tableNumber}
                            onChange={(e) => localTableUpdate(table.id, { tableNumber: parseInt(e.target.value) })}
                            onBlur={(e) => persistTableUpdate(table.id, { tableNumber: parseInt(e.target.value) })}
                            className="bg-transparent border-none outline-none font-black text-primary text-sm w-20 focus:ring-0"
                          />
                        </td>
                        <td className="px-8 py-5">
                          <input 
                            type="number"
                            value={table.seats}
                            onChange={(e) => localTableUpdate(table.id, { seats: parseInt(e.target.value) })}
                            onBlur={(e) => persistTableUpdate(table.id, { seats: parseInt(e.target.value) })}
                            className="bg-transparent border-none outline-none font-black text-primary text-sm w-20 focus:ring-0"
                          />
                        </td>
                        <td className="px-8 py-5">
                          <div 
                            onClick={() => {
                              const newVal = table.isActive === false;
                              localTableUpdate(table.id, { isActive: newVal });
                              persistTableUpdate(table.id, { isActive: newVal });
                            }}
                            className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${table.isActive !== false ? 'bg-green-500' : 'bg-outline/30'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${table.isActive !== false ? 'right-1' : 'left-1'}`} />
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <input 
                            type="text"
                            value={table.appointmentResource || `Table ${table.tableNumber} (Seating ${table.seats})`}
                            onChange={(e) => localTableUpdate(table.id, { appointmentResource: e.target.value })}
                            onBlur={(e) => persistTableUpdate(table.id, { appointmentResource: e.target.value })}
                            className="bg-transparent border-none outline-none font-bold text-outline text-xs italic w-full focus:ring-0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-20 text-center text-outline font-black uppercase tracking-widest opacity-50 font-manrope">Select a floor to configure tables</div>
        )}
      </div>
    </div>
  );
};

export default Settings;
