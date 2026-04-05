import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branchName: 'Main Branch'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/register', { 
        ...formData,
        role: 'ADMIN'
      });
      alert('Account created! Please log in.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center p-6 font-manrope">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-primary p-5 rounded-[2rem] shadow-2xl shadow-primary/20 mb-8 text-white">
            <span className="material-symbols-outlined text-4xl">person_add</span>
          </div>
          <h2 className="text-4xl font-black text-primary tracking-tight text-center leading-tight uppercase italic">
            Caffino
          </h2>
          <p className="mt-4 text-[10px] font-black text-outline uppercase tracking-[0.4em]">Create Your Account</p>
        </div>

        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-surface-container-high">
          <h3 className="text-2xl font-black text-primary mb-10 italic uppercase text-center border-b border-surface-container-low pb-4 tracking-tighter">SignUp</h3>
          
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-900 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-200 text-center">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ml-1">Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-4 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ml-1">Email / Username</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-4 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-[1.5rem] py-4 px-6 pr-14 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    placeholder="Create a password"
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
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-2xl shadow-primary/20 mt-4"
            >
              {loading ? '...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-outline uppercase tracking-widest">
              Already a member? <Link to="/login" className="text-secondary font-black hover:underline decoration-2 underline-offset-4 ml-2">Login</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
