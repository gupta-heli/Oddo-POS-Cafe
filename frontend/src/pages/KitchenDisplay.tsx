import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import type { Order, Category } from '../types/index.ts';
import { Play, CheckCircle2, Search, Filter, Hash, Layers } from 'lucide-react';

const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [preparedItems, setPreparedItems] = useState<Record<string, boolean>>({});
  
  const user = useAuthStore((state) => state.user);

  const fetchData = async () => {
    try {
      const [orderRes, catRes] = await Promise.all([
        api.get('/pos/kitchen/orders'),
        api.get('/pos/products')
      ]);
      setOrders(orderRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to fetch kitchen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = io('http://localhost:5000');
    if (user?.branchId) socket.emit('join-branch', user.branchId);

    socket.on('new-order', (order: Order) => {
      setOrders(prev => [...prev, order]);
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
    });

    socket.on('order-status-updated', (updatedOrder: Order) => {
      setOrders(prev => {
        if (['COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) return prev.filter(o => o.id !== updatedOrder.id);
        return prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o);
      });
    });

    return () => { socket.disconnect(); };
  }, [user?.branchId]);

  const updateStatus = async (orderId: string, status: string) => {
    setOrders(prev => {
      if (['COMPLETED', 'CANCELLED'].includes(status)) return prev.filter(o => o.id !== orderId);
      return prev.map(o => o.id === orderId ? { ...o, status } : o);
    });

    try {
      await api.patch(`/pos/orders/${orderId}/status`, { status });
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchData();
    }
  };

  const toggleItemStrike = (orderId: string, itemId: string) => {
    const newState = !preparedItems[itemId];
    setPreparedItems(prev => ({ ...prev, [itemId]: newState }));
    
    // BROADCAST item-prepared to specific table
    const order = orders.find(o => o.id === orderId);
    if (order && order.tableId) {
      const socket = io('http://localhost:5000');
      socket.emit('join-branch', user?.branchId || 'main-branch');
      socket.emit('item-prepared', { 
        tableId: order.tableId, 
        itemId, 
        isReady: newState 
      });
    }
  };

  const getOrdersByStage = (status: string) => {
    return orders.filter(o => {
      const matchesStatus = o.status === status;
      const matchesSearch = o.orderNumber.toString().includes(searchQuery);
      const matchesCategory = !selectedCategory || o.items.some((i: any) => i.product.categoryId === selectedCategory);
      return matchesStatus && matchesSearch && matchesCategory;
    });
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Establishing Kitchen Link...</div>;

  return (
    <div className="flex h-screen bg-background font-manrope overflow-hidden">
      <aside className="w-72 bg-white border-r border-surface-container-high flex flex-col shadow-xl z-30">
        <div className="p-8 border-b border-surface-container-low bg-surface-container-low/30">
          <h3 className="text-xl font-black text-primary italic tracking-tighter flex items-center gap-2">
            <Filter size={18} className="text-secondary" /> Order Filter
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-4">By Category</p>
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3
                  ${!selectedCategory ? 'bg-primary text-white shadow-lg' : 'text-primary hover:bg-surface-container-low'}`}
              >
                <Layers size={14} /> All Categories
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3
                    ${selectedCategory === cat.id ? 'bg-primary text-white shadow-lg' : 'text-primary hover:bg-surface-container-low'}`}
                >
                  <span className="material-symbols-outlined text-sm">{cat.icon || 'restaurant'}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-surface-container-high flex items-center px-10 gap-10 z-20 shadow-sm">
          <div className="flex-1 flex items-center bg-surface-container-low px-6 py-2.5 rounded-2xl border border-surface-container-high gap-4 shadow-inner">
            <Search size={18} className="text-outline" />
            <input 
              type="text" 
              placeholder="Search by Order Number (#)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-primary w-full text-sm placeholder:text-outline/30" 
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-error-container text-on-error-container rounded-full text-[10px] font-black uppercase tracking-widest">
              To Cook: {orders.filter(o => o.status === 'CREATED').length}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-tertiary-container text-on-tertiary-container rounded-full text-[10px] font-black uppercase tracking-widest">
              Preparing: {orders.filter(o => o.status === 'IN_PROGRESS').length}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full text-[10px] font-black uppercase tracking-widest">
              Ready: {orders.filter(o => o.status === 'READY').length}
            </div>
          </div>
        </header>

        <div className="flex-1 flex gap-8 p-10 overflow-hidden">
          {[
            { label: 'To Cook', status: 'CREATED', color: 'text-error' },
            { label: 'Preparing', status: 'IN_PROGRESS', color: 'text-tertiary' },
            { label: 'Ready', status: 'READY', color: 'text-secondary' }
          ].map((stage) => (
            <div key={stage.status} className="flex-1 flex flex-col gap-6">
              <h4 className={`text-center font-black text-[10px] uppercase tracking-[0.4em] ${stage.color} opacity-60 italic`}>
                {stage.label} ({getOrdersByStage(stage.status).length})
              </h4>

              <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide pb-10">
                <AnimatePresence mode="popLayout">
                  {getOrdersByStage(stage.status).map((order) => (
                    <motion.div 
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white p-6 rounded-[2.5rem] border border-surface-container-high shadow-xl shadow-primary/5 group hover:border-primary transition-all relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-2 text-outline font-black text-[10px] uppercase tracking-widest mb-1">
                            <Hash size={10} /> {order.orderNumber}
                          </div>
                          <h5 className="text-xl font-black text-primary tracking-tighter italic">Table T{order.tableId?.slice(-2) || '01'}</h5>
                        </div>
                        <span className="text-sm font-black text-primary opacity-20">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="bg-surface-container-low/50 rounded-2xl p-4 mb-8">
                        <ul className="space-y-3">
                          {order.items.map((item: any) => (
                            <li 
                              key={item.id} 
                              onClick={() => toggleItemStrike(order.id, item.id)}
                              className={`text-sm font-bold flex justify-between cursor-pointer transition-all ${preparedItems[item.id] ? 'opacity-30 line-through' : 'text-primary'}`}
                            >
                              <span>{item.quantity}x {item.product.name}</span>
                              {preparedItems[item.id] && <CheckCircle2 size={14} className="text-secondary" />}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button 
                        onClick={() => updateStatus(order.id, stage.status === 'CREATED' ? 'IN_PROGRESS' : stage.status === 'IN_PROGRESS' ? 'READY' : 'COMPLETED')}
                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2
                          ${stage.status === 'READY' ? 'bg-secondary text-white shadow-secondary/20' : 'bg-primary text-white shadow-primary/20'}`}
                      >
                        {stage.status === 'CREATED' ? <><Play size={12} fill="currentColor"/> Start Prep</> : stage.status === 'IN_PROGRESS' ? <><CheckCircle2 size={14}/> Mark Ready</> : 'Dismiss Ticket'}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default KitchenDashboard;
