import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import type { Order } from '../types/index.ts';
import { Play, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';

const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparedItems, setPreparedItems] = useState<Record<string, boolean>>({});
  
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/pos/kitchen/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const socket = io('http://localhost:5000');
    if (user?.branchId) socket.emit('join-branch', user.branchId);

    socket.on('new-order', (order: Order) => {
      setOrders((prev) => {
        if (prev.find(o => o.id === order.id)) return prev;
        return [...prev, order];
      });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    });

    socket.on('order-status-updated', (updatedOrder: Order) => {
      setOrders((prev) => {
        // If completed or cancelled, remove from kitchen view
        if (['COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
          return prev.filter(o => o.id !== updatedOrder.id);
        }
        // Otherwise update its status
        return prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o);
      });
    });

    return () => { socket.disconnect(); };
  }, [user?.branchId]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/pos/orders/${orderId}/status`, { status });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleItemStrike = (itemId: string) => {
    setPreparedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getOrdersByStage = (status: string) => orders.filter(o => o.status === status);

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Establishing Kitchen Link...</div>;

  return (
    <div className="px-12 py-8 animate-fade-in flex flex-col h-full gap-10 font-manrope">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Kitchen Master Console</h2>
          <p className="text-xs font-black text-outline uppercase tracking-[0.2em] mt-1">Live prep coordination</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-surface-container-high flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-outline uppercase tracking-widest">{orders.length} ACTIVE TICKETS</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-10 overflow-hidden">
        {[
          { label: 'To Cook', status: 'CREATED', color: 'bg-error-container text-on-error-container', borderColor: 'border-error/20' },
          { label: 'Preparing', status: 'IN_PROGRESS', color: 'bg-tertiary-container text-on-tertiary-container', borderColor: 'border-tertiary/20' },
          { label: 'Ready', status: 'READY', color: 'bg-secondary text-on-secondary', borderColor: 'border-secondary/20' }
        ].map((stage) => (
          <div key={stage.status} className="flex-1 flex flex-col gap-6">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-outline text-center">
              {stage.label} ({getOrdersByStage(stage.status).length})
            </h3>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
              <AnimatePresence>
                {getOrdersByStage(stage.status).map((order) => (
                  <motion.div 
                    key={order.id}
                    layoutId={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-surface-container-low p-6 rounded-[2rem] border ${stage.borderColor} shadow-sm group hover:bg-surface-container transition-all`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stage.color}`}>
                          {stage.label}
                        </span>
                        <h4 className="text-xl font-black text-primary mt-3 tracking-tight italic">Order #{order.orderNumber}</h4>
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">Table T{order.tableId?.slice(-2) || '??'} • {order.items.length} items</p>
                      </div>
                      <span className="text-xl font-black text-primary opacity-20">
                        {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>

                    <div className="bg-white/50 rounded-2xl p-4 mb-8">
                      <ul className="space-y-3">
                        {order.items.map((item: any) => (
                          <li 
                            key={item.id} 
                            onClick={() => toggleItemStrike(item.id)}
                            className={`text-sm font-bold flex justify-between cursor-pointer transition-all ${preparedItems[item.id] ? 'opacity-30' : 'opacity-100'}`}
                          >
                            <span className={preparedItems[item.id] ? 'line-through decoration-2' : ''}>
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="material-symbols-outlined text-sm">
                              {preparedItems[item.id] ? 'check_circle' : 'circle'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {stage.status !== 'READY' && (
                      <button 
                        onClick={() => updateStatus(order.id, stage.status === 'CREATED' ? 'IN_PROGRESS' : 'READY')}
                        className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
                      >
                        {stage.status === 'CREATED' ? <><Play size={14} fill="currentColor"/> Start Preparing</> : <><CheckCircle2 size={14}/> Mark Ready</>}
                      </button>
                    )}
                    
                    {stage.status === 'READY' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'COMPLETED')}
                        className="w-full bg-secondary text-on-secondary py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-secondary/10"
                      >
                        Dismiss Ticket
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenDashboard;
