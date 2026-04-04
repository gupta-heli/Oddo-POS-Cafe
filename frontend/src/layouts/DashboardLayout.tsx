import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const DashboardLayout: React.FC = () => {
  const { user, logout, activeSessionId, setSession } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const res = await api.post('/pos/sessions/open', { openingBalance: 1000 });
      setSession(res.data.id);
    } catch (err) {
      alert('Failed to start session.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;
    try {
      await api.post(`/pos/sessions/${activeSessionId}/close`);
      setSession(null);
      navigate('/');
    } catch (err) {
      alert('Failed to end session');
    }
  };

  const menuItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { icon: 'layers', label: 'Floor Plan', path: '/dashboard/floor' },
    { icon: 'inventory_2', label: 'Inventory', path: '/dashboard/inventory' },
    { icon: 'monitoring', label: 'Analytics', path: '/dashboard/analytics' },
    { icon: 'kitchen', label: 'Kitchen Display', path: '/dashboard/kitchen' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-on-background selection:bg-secondary-container selection:text-on-secondary-fixed font-manrope">
      {/* Side Navigation Bar */}
      <aside className="fixed left-0 top-0 h-full flex flex-col py-8 bg-surface-container-low text-primary w-64 z-50 transition-all duration-300 shadow-sm border-r border-surface-container-high/50">
        <div className="px-8 mb-10 text-center">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-tight text-primary">Caffino</h2>
          <p className="text-[10px] opacity-60 uppercase tracking-[0.2em] mt-2 font-bold font-manrope">Smart Cafe Management</p>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => {
            const actualActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`${actualActive ? 'sidebar-link-active' : 'sidebar-link'} ${!activeSessionId && item.path !== '/dashboard' ? 'opacity-20 pointer-events-none grayscale' : ''}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className={actualActive ? 'font-bold' : 'font-semibold'}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-8 mt-auto flex flex-col gap-4">
          <button 
            disabled={!activeSessionId}
            onClick={() => navigate('/dashboard/pos')}
            className="bg-primary text-on-primary py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-xl shadow-primary/10 disabled:opacity-20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Order
          </button>
          
          <button 
            onClick={handleLogout}
            className="text-primary opacity-60 py-3 px-2 flex items-center gap-3 hover:opacity-100 transition-all text-left font-bold text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Clock Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-40 bg-background flex justify-between items-center w-full px-8 py-4 tracking-tight border-b border-surface-container-high/50 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-3 shadow-inner border border-surface-container-high">
              <span className="material-symbols-outlined text-secondary text-sm">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-on-surface-variant opacity-60 outline-none font-bold" 
                placeholder="Search orders..." 
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 mr-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${activeSessionId ? 'bg-secondary-container text-on-secondary-container shadow-sm border border-secondary/10' : 'bg-surface-container-highest text-outline'}`}>
              <span className={`w-2 h-2 rounded-full bg-secondary ${activeSessionId ? 'animate-pulse' : 'opacity-20'}`}></span>
              {activeSessionId ? `Live Session: ${user?.branchName || 'Morning Shift'}` : 'Offline'}
            </div>
            
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-surface-container-high shadow-sm hover:bg-surface-container transition-colors text-primary">
              <span className="material-symbols-outlined">notifications</span>
            </button>

            {activeSessionId ? (
              <button 
                onClick={handleEndSession} 
                className="ml-4 bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/10 hover:scale-95 active:duration-100 transition-all border border-primary"
              >
                End Session
              </button>
            ) : (
              <button 
                onClick={handleStartSession} 
                disabled={loading}
                className="ml-4 bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/10 hover:scale-95 active:duration-100 transition-all border border-primary"
              >
                {loading ? 'Starting...' : 'Start Session'}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {activeSessionId ? (
            <Outlet />
          ) : (
            <div className="h-full flex items-center justify-center p-20 text-center bg-surface-container-low/20">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-24 max-w-2xl flex flex-col items-center shadow-2xl shadow-primary/5 border border-surface-container-high relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary opacity-20"></div>
                <div className="w-28 h-28 bg-surface-container-low rounded-[2.5rem] flex items-center justify-center text-primary mb-10 border border-surface-container-high shadow-inner">
                  <span className="material-symbols-outlined text-6xl">lock</span>
                </div>
                <h2 className="text-5xl font-black text-primary tracking-tighter mb-6 leading-tight uppercase italic">Terminal Locked</h2>
                <p className="text-outline font-bold text-sm uppercase tracking-widest leading-relaxed mb-12 opacity-60">System requires an active barista session <br/> to process live orders.</p>
                <button onClick={handleStartSession} disabled={loading} className="btn-primary-elegant px-16 py-6 text-[10px] uppercase tracking-[0.4em] flex items-center gap-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                   {loading ? 'Initiating...' : (
                     <>
                       <span className="material-symbols-outlined">play_circle</span>
                       Start New Shift
                     </>
                   )}
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
