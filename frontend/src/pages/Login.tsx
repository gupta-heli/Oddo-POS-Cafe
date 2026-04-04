import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.accessToken);
      navigate('/');
    } catch (err: any) {
      console.error("LOGIN_ERROR:", err);
      setError(err.response?.data?.error || 'Invalid credentials. Try admin@cafe.com / admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center p-6 font-manrope">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="bg-primary p-5 rounded-[2rem] shadow-2xl shadow-primary/20 mb-8 text-white">
            <span className="material-symbols-outlined text-4xl">coffee</span>
          </div>
          <h2 className="text-4xl font-black text-primary tracking-tight text-center leading-tight">
            Welcome back to <br/> 
            <span className="text-secondary">Cafe POS Pro</span>
          </h2>
          <p className="mt-4 text-xs font-black text-outline uppercase tracking-[0.3em]">Elegant Barista Edition</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-12 shadow-xl shadow-primary/5 border border-surface-container-high">
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="p-4 bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-widest rounded-2xl border border-error/10 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  placeholder="name@cafe.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-3 ml-1">Secret Key</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-on-primary py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-2xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : (
                <>
                  Enter System
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-outline">
              Don't have an account? <Link to="/signup" className="text-secondary hover:underline">Sign Up</Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center space-y-4">
          <p className="text-outline text-[10px] font-black uppercase tracking-[0.2em]">Authorized Access Only</p>
          <div className="flex justify-center gap-6 grayscale opacity-30">
             <span className="material-symbols-outlined">security</span>
             <span className="material-symbols-outlined">verified_user</span>
             <span className="material-symbols-outlined">fingerprint</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
