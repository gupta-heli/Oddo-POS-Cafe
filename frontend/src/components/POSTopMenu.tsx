import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Layout, Calculator, Settings, Power } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const POSTopMenu: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleReload = () => {
    window.location.reload();
  };

  const handleCloseRegister = async () => {
    // For demo, we find the active session and close it
    try {
      const res = await api.get('/pos/terminals');
      const activeSession = res.data[0]?.sessions[0];
      if (activeSession && activeSession.status === 'Open') {
        await api.post(`/pos/sessions/${activeSession.id}/close`);
        alert('Register closed successfully.');
        navigate('/settings');
      } else {
        alert('No active session to close.');
      }
    } catch (err) {
      alert('Error closing register');
    }
  };

  return (
    <div className="bg-white border-b border-surface-container-high px-8 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/floor')}
          className="flex items-center gap-2 px-4 py-2 text-outline hover:text-primary font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <Layout size={16} /> Table View
        </button>
        <div className="w-px h-4 bg-surface-container-high mx-2"></div>
        <button 
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <Calculator size={16} /> Register
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={handleReload}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-low text-outline transition-all"
          title="Reload Data"
        >
          <RefreshCw size={18} />
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-low text-outline transition-all"
          title="Go to Back-end"
        >
          <Settings size={18} />
        </button>

        <button 
          onClick={handleCloseRegister}
          className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
        >
          <Power size={14} /> Close Register
        </button>
      </div>
    </div>
  );
};

export default POSTopMenu;
