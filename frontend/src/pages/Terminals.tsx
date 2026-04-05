import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { MoreVertical, Settings, Monitor, UtensilsCrossed, LayoutDashboard, X, Coffee, ChevronDown, Plus, Check } from 'lucide-react';

const Terminals: React.FC = () => {
  const [terminals, setTerminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [activeDots, setActiveDots] = useState<string | null>(null);
  
  // New Terminal Modal State (Diagram Part 1)
  const [showNewTerminalModal, setShowNewTerminalModal] = useState(false);
  const [newTerminalName, setNewTerminalName] = useState('');

  // Config UI State (Diagram Part 2)
  const [selectedTerminal, setSelectedTerminal] = useState<any | null>(null);

  const { setSession, user } = useAuthStore();
  const navigate = useNavigate();

  const fetchTerminals = async () => {
    try {
      const res = await api.get('/pos/terminals');
      setTerminals(res.data);
      if (res.data.length > 0) {
        // Find existing selected terminal or default to first
        const existing = selectedTerminal ? res.data.find((t: any) => t.id === selectedTerminal.id) : null;
        setSelectedTerminal(existing || res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
  }, []);

  const handleCreateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerminalName) return;
    try {
      const res = await api.post('/pos/terminals', { name: newTerminalName });
      setSelectedTerminal(res.data);
      setShowNewTerminalModal(false);
      setNewTerminalName('');
      fetchTerminals();
    } catch (err) {
      alert('Failed to create terminal');
    }
  };

  const handleSaveTerminal = async () => {
    if (!selectedTerminal) return;
    try {
      await api.put(`/pos/terminals/${selectedTerminal.id}`, selectedTerminal);
      fetchTerminals();
    } catch (err) {
      alert('Failed to save terminal settings');
    }
  };

  const handleDiscard = () => {
    if (selectedTerminal) {
      const original = terminals.find(t => t.id === selectedTerminal.id);
      if (original) setSelectedTerminal({ ...original });
    }
  };

  const handleStartSession = async (terminalId: string) => {
    try {
      const res = await api.post('/pos/sessions/open', { terminalId, openingBalance: 1000 });
      setSession(res.data.id);
      navigate('/dashboard/pos');
    } catch (err) {
      alert('Failed to start session');
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse">Syncing Terminals...</div>;

  return (
    <div className="min-h-full flex flex-col font-manrope bg-background animate-fade-in relative overflow-hidden">
      {/* 1. TOP NAVIGATION */}
      <header className="h-16 bg-white border-b border-surface-container-high px-12 flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-black text-primary tracking-tighter uppercase italic">Caffino</h1>
          <nav className="flex items-center gap-8">
            <button onClick={() => setShowMenu(true)} className="text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:text-primary transition-all flex items-center gap-2">Orders <ChevronDown size={12}/></button>
            <button onClick={() => setShowMenu(true)} className="text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:text-primary transition-all flex items-center gap-2">Products <ChevronDown size={12}/></button>
            <button onClick={() => setShowMenu(true)} className="text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:text-primary transition-all flex items-center gap-2">Reporting <ChevronDown size={12}/></button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest">Branch: {user?.branchName || 'Main'}</span>
        </div>
      </header>

      {/* 2. CONFIGURATION AREA - Matching Diagram 3.png */}
      <div className="flex-1 p-12 space-y-12">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-surface-container-high overflow-hidden">
          {/* Settings Header */}
          <div className="bg-primary p-10 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Point of Sale</h2>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={selectedTerminal?.name || ''} 
                  onChange={(e) => setSelectedTerminal({ ...selectedTerminal, name: e.target.value })}
                  placeholder="Terminal Name"
                  className="bg-transparent border-b-2 border-secondary font-bold text-xl outline-none w-48 text-secondary placeholder-secondary/50"
                />
                <button onClick={() => setShowNewTerminalModal(true)} className="text-secondary hover:text-white transition-colors flex items-center gap-1 ml-4">
                  <Plus size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">New</span>
                </button>
              </div>
            </div>
            <div className="flex gap-4">
               <button onClick={handleSaveTerminal} className="bg-secondary text-primary px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-secondary/90 transition-colors">Save</button>
               <button onClick={handleDiscard} className="bg-white/10 hover:bg-white/20 text-white px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-colors">Discard</button>
            </div>
          </div>

          {/* Payment Method Config Section */}
          <div className="p-12 space-y-10">
            <div>
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] border-b border-surface-container-high pb-4 mb-8 italic">Payment Methods</h3>
              <div className="grid grid-cols-2 gap-12">
                {/* Left Side: Cash & UPI */}
                <div className="space-y-8">
                  <div 
                    className="flex items-center gap-4 group cursor-pointer"
                    onClick={() => setSelectedTerminal({ ...selectedTerminal, enableCash: !selectedTerminal?.enableCash })}
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selectedTerminal?.enableCash ? 'bg-primary border-primary' : 'border-outline'}`}>
                      {selectedTerminal?.enableCash && <Check size={14} className="text-secondary" strokeWidth={4} />}
                    </div>
                    <div>
                      <p className="font-bold text-primary text-sm tracking-tight">Cash</p>
                      <p className="text-[10px] text-outline font-medium uppercase tracking-widest">If Enabled it'll be available during checkout</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div 
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => setSelectedTerminal({ ...selectedTerminal, enableUPI: !selectedTerminal?.enableUPI })}
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selectedTerminal?.enableUPI ? 'bg-primary border-primary' : 'border-outline'}`}>
                        {selectedTerminal?.enableUPI && <Check size={14} className="text-secondary" strokeWidth={4} />}
                      </div>
                      <div>
                        <p className="font-bold text-primary text-sm tracking-tight">QR Payment (UPI)</p>
                        <p className="text-[10px] text-outline font-medium uppercase tracking-widest">Generates dynamic QR based on UPI ID</p>
                      </div>
                    </div>
                    <div className="ml-10 pt-2">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">UPI ID</p>
                      <input 
                        type="text" 
                        value={selectedTerminal?.upiId || ''}
                        onChange={(e) => setSelectedTerminal({ ...selectedTerminal, upiId: e.target.value })}
                        placeholder="e.g: 123@ybl.com" 
                        className="bg-transparent border-b border-dashed border-primary/30 font-bold text-primary italic outline-none w-64 pb-1 focus:border-secondary transition-all"
                        disabled={!selectedTerminal?.enableUPI}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Digital & Interface */}
                <div className="space-y-8">
                  <div 
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => setSelectedTerminal({ ...selectedTerminal, enableDigital: !selectedTerminal?.enableDigital })}
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selectedTerminal?.enableDigital ? 'bg-primary border-primary' : 'border-outline'}`}>
                      {selectedTerminal?.enableDigital && <Check size={14} className="text-secondary" strokeWidth={4} />}
                    </div>
                    <div>
                      <p className="font-bold text-primary text-sm tracking-tight">Digital (Bank, Card)</p>
                      <p className="text-[10px] text-outline font-medium uppercase tracking-widest">Standard card/terminal payments</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-container-high space-y-6">
                    <h4 className="text-[10px] font-black text-outline uppercase tracking-[0.2em] italic">POS Interface</h4>
                    <div className="space-y-4">
                      <div 
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => setSelectedTerminal({ ...selectedTerminal, enableFloorPlan: !selectedTerminal?.enableFloorPlan })}
                      >
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selectedTerminal?.enableFloorPlan ? 'bg-primary border-primary' : 'border-outline'}`}>
                          {selectedTerminal?.enableFloorPlan && <Check size={14} className="text-secondary" strokeWidth={4} />}
                        </div>
                        <div>
                          <p className="font-bold text-primary text-sm tracking-tight">Floor Plan</p>
                          <p className="text-[10px] text-outline font-medium uppercase tracking-widest">Enable graphical table selection</p>
                        </div>
                      </div>
                      {selectedTerminal?.enableFloorPlan && (
                        <button 
                          onClick={() => navigate('/dashboard/settings')}
                          className="ml-10 bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 group"
                        >
                          Plan <span className="group-hover:translate-x-1 transition-transform">--&gt;</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TERMINAL LISTING - Quick Start */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {terminals.map((term) => {
            const lastSession = term.sessions?.[0];
            return (
              <motion.div 
                key={term.id} 
                whileHover={{ y: -5 }} 
                className={`bg-white rounded-[3rem] p-10 shadow-xl border cursor-pointer transition-all ${selectedTerminal?.id === term.id ? 'border-primary' : 'border-surface-container-high'} flex flex-col gap-8 relative overflow-hidden group`}
                onClick={() => setSelectedTerminal(term)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-primary tracking-tight italic uppercase">{term.name}</h3>
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">Operational Station</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveDots(activeDots === term.id ? null : term.id); }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-low text-outline transition-all"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  <AnimatePresence>
                    {activeDots === term.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveDots(null); }} />
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          className="absolute right-4 top-14 bg-white border border-surface-container-high rounded-2xl shadow-2xl z-50 w-48 overflow-hidden"
                        >
                          <button onClick={(e) => { e.stopPropagation(); navigate('/dashboard/settings'); }} className="w-full text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-surface-container-low flex items-center gap-3 border-b border-surface-container-low transition-colors">
                            <Settings size={14} /> Setting
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); navigate('/dashboard/kitchen'); }} className="w-full text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-surface-container-low flex items-center gap-3 border-b border-surface-container-low transition-colors">
                            <Coffee size={14} /> Kitchen Display
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); navigate('/dashboard/pos'); }} className="w-full text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-surface-container-low flex items-center gap-3 transition-colors">
                            <Monitor size={14} /> Customer Display
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-outline">Last Open:</span>
                    <span className="text-primary">{lastSession ? new Date(lastSession.startAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-outline">Last Sell:</span>
                    <span className="text-secondary">₹{lastSession?.closingBalance?.toLocaleString() || '0.00'}</span>
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleStartSession(term.id); }}
                  className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3"
                >
                  <Coffee size={16} fill="currentColor"/> Open Session
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* MODALS (New Terminal & Mega Menu) */}
      <AnimatePresence>
        {showNewTerminalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/40 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-12 shadow-2xl border border-surface-container-high max-w-md w-full">
              <h3 className="text-2xl font-black text-primary italic uppercase mb-8">Create New POS Config</h3>
              <form onSubmit={handleCreateTerminal} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2">Terminal Name</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    value={newTerminalName}
                    onChange={(e) => setNewTerminalName(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10" 
                    placeholder="e.g. Coffee Counter 2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button type="submit" className="bg-primary text-secondary py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-colors">Save</button>
                  <button type="button" onClick={() => setShowNewTerminalModal(false)} className="bg-surface-container-low text-outline py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container-low/80 transition-colors">Discard</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[100] flex items-start justify-center pt-20">
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl border border-surface-container-high p-16 relative">
              <button onClick={() => setShowMenu(false)} className="absolute right-12 top-12 w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-low text-outline hover:text-error transition-all"><X size={24}/></button>
              
              <div className="grid grid-cols-3 gap-16">
                <div className="space-y-10">
                  <h4 className="text-2xl font-black text-primary italic uppercase tracking-tighter border-b-4 border-secondary/20 pb-4 inline-block">Orders</h4>
                  <nav className="flex flex-col gap-6">
                    <button onClick={() => { setShowMenu(false); navigate('/dashboard/orders'); }} className="text-left font-bold text-outline hover:text-primary transition-all">Orders</button>
                    <button onClick={() => { setShowMenu(false); navigate('/dashboard/payments'); }} className="text-left font-bold text-outline hover:text-primary transition-all">Payments</button>
                    <button onClick={() => { setShowMenu(false); navigate('/dashboard/customers'); }} className="text-left font-bold text-outline hover:text-primary transition-all">Customers</button>
                  </nav>
                </div>
                <div className="space-y-10">
                  <h4 className="text-2xl font-black text-primary italic uppercase tracking-tighter border-b-4 border-secondary/20 pb-4 inline-block">Products</h4>
                  <nav className="flex flex-col gap-6">
                    <button onClick={() => { setShowMenu(false); navigate('/dashboard/inventory'); }} className="text-left font-bold text-outline hover:text-primary transition-all">Products</button>
                    <button onClick={() => { setShowMenu(false); navigate('/dashboard/inventory'); }} className="text-left font-bold text-outline hover:text-primary transition-all">Category</button>
                  </nav>
                </div>
                <div className="space-y-10">
                  <h4 className="text-2xl font-black text-primary italic uppercase tracking-tighter border-b-4 border-secondary/20 pb-4 inline-block">Reporting</h4>
                  <nav className="flex flex-col gap-6">
                    <button onClick={() => { setShowMenu(false); navigate('/dashboard/analytics'); }} className="text-left font-bold text-outline hover:text-primary transition-all">Dashboard</button>
                  </nav>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Terminals;
