import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Layers, Table as TableIcon } from 'lucide-react';
import api from '../services/api';
import { Floor, Table } from '../types';

const Settings: React.FC = () => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingFloor, setIsAddingFloor] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');

  const fetchFloors = async () => {
    try {
      const res = await api.get('/pos/floors');
      setFloors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  const handleAddFloor = async () => {
    if (!newFloorName) return;
    try {
      await api.post('/pos/floors', { name: newFloorName });
      setNewFloorName('');
      setIsAddingFloor(false);
      fetchFloors();
    } catch (err) {
      alert('Failed to add floor');
    }
  };

  const handleAddTable = async (floorId: string) => {
    try {
      await api.post(`/pos/floors/${floorId}/tables`, {
        tableNumber: floors.find(f => f.id === floorId)!.tables.length + 1,
        seats: 4
      });
      fetchFloors();
    } catch (err) {
      alert('Failed to add table');
    }
  };

  if (loading) return <div className="p-10 text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse text-center">Loading Configuration...</div>;

  return (
    <div className="px-12 py-8 animate-fade-in flex flex-col gap-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight text-center">Floor & Table Setup</h2>
          <p className="text-xs font-black text-outline uppercase tracking-[0.2em] mt-1 text-center">Configure your dining areas</p>
        </div>
        <button 
          onClick={() => setIsAddingFloor(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/10"
        >
          <Plus size={16}/> Add New Floor
        </button>
      </div>

      <div className="space-y-12">
        <AnimatePresence>
          {isAddingFloor && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-6 bg-surface-container-low border-dashed border-2 border-primary/20">
              <div className="flex items-center gap-4">
                <input 
                  autoFocus
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  placeholder="Floor Name (e.g. Terrace)" 
                  className="flex-1 bg-white border border-surface-container-high rounded-xl py-3 px-6 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10"
                />
                <button onClick={handleAddFloor} className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center"><Check size={20}/></button>
                <button onClick={() => setIsAddingFloor(false)} className="w-12 h-12 bg-white text-outline rounded-xl flex items-center justify-center"><X size={20}/></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {floors.map((floor) => (
          <div key={floor.id} className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="w-10 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center text-primary">
                <Layers size={20} />
              </div>
              <h3 className="text-xl font-black text-primary tracking-tight">{floor.name}</h3>
              <div className="flex-1 h-px bg-surface-container-high"></div>
              <span className="text-[10px] font-black text-outline uppercase tracking-widest">{floor.tables.length} Tables</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {floor.tables.map((table) => (
                <div key={table.id} className="bg-white p-6 rounded-[2rem] border border-surface-container-high shadow-sm group hover:border-primary transition-all relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xl font-black text-primary/30 group-hover:text-primary transition-colors">T{table.tableNumber.toString().padStart(2, '0')}</span>
                    <button className="opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-all"><Trash2 size={14}/></button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest">{table.seats} Seats</p>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{table.status}</p>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => handleAddTable(floor.id)}
                className="h-full min-h-[140px] rounded-[2rem] border-2 border-dashed border-surface-container-high flex flex-col items-center justify-center gap-2 text-outline hover:border-primary hover:text-primary transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">New Table</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
