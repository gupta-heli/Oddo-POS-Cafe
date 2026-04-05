import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      navigate('/dashboard');
    } catch (err: any) {
      console.error("LOGIN_ERROR:", err);
      setError(err.response?.data?.error || 'Invalid credentials.');
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
          <h2 className="text-4xl font-black text-primary tracking-tight text-center leading-tight uppercase italic">
            Caffino
          </h2>
          <p className="mt-4 text-[10px] font-black text-outline uppercase tracking-[0.4em]">Smart Cafe Management</p>
        </div>

        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-surface-container-high">
          <h3 className="text-2xl font-black text-primary mb-10 italic uppercase text-center border-b border-surface-container-low pb-4 tracking-tighter">Login</h3>
          
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-900 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-200 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-3 ml-1">Email / Username</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-5 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-5 px-6 pr-14 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  placeholder="Enter your password"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-2xl shadow-primary/20"
            >
              {loading ? '...' : 'Login'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs font-bold text-outline uppercase tracking-widest leading-loose">
              Don't have an account? <br/>
              <Link to="/signup" className="text-secondary font-black hover:underline decoration-2 underline-offset-4">Sign Up here</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
