import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branchName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post('http://localhost:5000/api/auth/register', { 
        ...formData,
        role: 'ADMIN' // Default first user as Admin for demo
      });
      alert('Account created! Please log in.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
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
          <div className="bg-primary p-4 rounded-3xl shadow-xl text-white mb-6">
            <span className="material-symbols-outlined text-3xl">person_add</span>
          </div>
          <h2 className="text-3xl font-black text-primary tracking-tight text-center leading-tight">
            Create Your <br/> 
            <span className="text-secondary">Barista Account</span>
          </h2>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 border border-surface-container-high">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-widest rounded-2xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ml-1">Barista Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 outline-none"
                  placeholder="e.g. Alex"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ml-1">Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 outline-none"
                  placeholder="name@cafe.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ml-1">Cafe / Branch Name</label>
                <input 
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 outline-none"
                  placeholder="e.g. Downtown Roastery"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
                <input 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-2xl shadow-primary/20"
            >
              {loading ? 'Creating Account...' : 'Register Now'}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-outline">
              Already have an account? <Link to="/login" className="text-secondary hover:underline">Log In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
