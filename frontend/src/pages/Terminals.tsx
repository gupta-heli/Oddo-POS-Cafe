import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Play, StopCircle, Receipt, Wallet, History, Monitor } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const Terminals: React.FC = () => {
  const [terminals, setTerminals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState('1000');

  const fetchTerminals = async () => {
    try {
      const res = await api.get('/pos/terminals');
      setTerminals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
  }, []);

  const handleOpenSession = async (terminalId: string) => {
    try {
      await api.post('/pos/sessions/open', { 
        terminalId, 
        openingBalance: parseFloat(openingBalance) 
      });
      setShowOpenModal(null);
      fetchTerminals();
    } catch (err) {
      alert('Failed to open session');
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    try {
      const res = await api.post(`/pos/sessions/${sessionId}/close`);
      alert(`Session closed. Final Amount: ₹${res.data.closingBalance}`);
      fetchTerminals();
    } catch (err) {
      alert('Failed to close session');
    }
  };

  if (loading) return <div className="p-10 text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse text-center">Scanning Terminals...</div>;

  return (
    <div className="px-12 py-8 animate-fade-in flex flex-col gap-10 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-black text-primary tracking-tight">POS Terminals</h2>
        <p className="text-xs font-black text-outline uppercase tracking-[0.2em] mt-1">Session & shift management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {terminals.map((terminal) => {
          const latestSession = terminal.sessions[0];
          const isOpen = latestSession?.status === 'Open';

          return (
            <div key={terminal.id} className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 border border-surface-container-high flex flex-col gap-8 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Monitor size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary">{terminal.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-outline">{isOpen ? 'Live Now' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
                
                {!isOpen ? (
                  <button 
                    onClick={() => setShowOpenModal(terminal.id)}
                    className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 transition-transform active:scale-95"
                  >
                    <Play size={16} fill="currentColor"/> Open Session
                  </button>
                ) : (
                  <button 
                    onClick={() => handleCloseSession(latestSession.id)}
                    className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-red-100 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                  >
                    <StopCircle size={16}/> End Session
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-surface-container-low">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest">Last Activity</p>
                  <p className="font-bold text-sm text-primary">
                    {latestSession ? new Date(latestSession.startAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest">Last Closing Sale</p>
                  <p className="font-black text-lg text-secondary">
                    ₹{latestSession?.closingBalance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {isOpen && (
                <div className="bg-emerald-50/50 p-6 rounded-[1.5rem] border border-emerald-100/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Wallet size={20} className="text-emerald-600" />
                    <div>
                      <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Opening Balance</p>
                      <p className="font-black text-emerald-900">₹{latestSession.openingBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Started At</p>
                    <p className="font-black text-emerald-900">{new Date(latestSession.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Opening Modal */}
      <AnimatePresence>
        {showOpenModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[100] flex items-center justify-center p-6 font-manrope"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-12 shadow-2xl border border-surface-container-high"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                  <Wallet size={32} />
                </div>
                <h3 className="text-2xl font-black text-primary tracking-tight">Open New Session</h3>
                <p className="text-xs font-bold text-outline mt-2 uppercase tracking-widest">Verify opening cash float</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-3 ml-1">Cash Balance (Opening)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-primary text-lg">₹</span>
                    <input 
                      type="number"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-5 pl-12 pr-6 text-xl font-black text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={() => handleOpenSession(showOpenModal)}
                    className="w-full bg-primary text-on-primary py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/20"
                  >
                    Confirm & Start Shift
                  </button>
                  <button 
                    onClick={() => setShowOpenModal(null)}
                    className="w-full text-outline font-black text-[10px] uppercase tracking-widest py-2"
                  >
                    Cancel
                  </button>
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
