import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import type { Order, Floor, Table } from '../types/index.ts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({ totalRevenue: 0, orderCount: 0 });
  const [floors, setFloors] = useState<Floor[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchData = async () => {
    try {
      const [statsRes, floorsRes, kitchenRes] = await Promise.all([
        api.get('/pos/reports/analytics'),
        api.get('/pos/floors'),
        api.get('/pos/kitchen/orders')
      ]);
      setStats(statsRes.data);
      setFloors(floorsRes.data);
      setKitchenOrders(kitchenRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:5000');
    if (user?.branchId) socket.emit('join-branch', user.branchId);

    socket.on('new-order', (order: Order) => {
      setKitchenOrders(prev => [...prev, order]);
      fetchData(); // Refresh stats
    });

    socket.on('order-status-updated', () => {
      fetchData();
    });

    return () => { socket.disconnect(); };
  }, [user?.branchId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/pos/orders/${orderId}/status`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Syncing Dashboard...</div>;

  return (
    <div className="px-12 py-8 flex-1 animate-fade-in font-manrope">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-surface-container-low p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[160px] group hover:bg-surface-container transition-all shadow-sm border border-surface-container-high/50">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Today's Sales</p>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black tracking-tight text-primary">₹{stats.totalRevenue?.toLocaleString() || '0'}</h3>
            <p className="text-xs text-secondary font-bold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              +12.4% from yesterday
            </p>
          </div>
        </div>

        <div className="bg-surface-container-low p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[160px] group hover:bg-surface-container transition-all shadow-sm border border-surface-container-high/50">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Order Count</p>
            <span className="material-symbols-outlined text-primary">receipt_long</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black tracking-tight text-primary">{stats.orderCount || '0'}</h3>
            <p className="text-xs text-outline font-bold mt-2">Avg. 4.2m prep time</p>
          </div>
        </div>

        <div className="bg-surface-container-low p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[160px] group hover:bg-surface-container transition-all shadow-sm border border-surface-container-high/50">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Occupied Tables</p>
            <span className="material-symbols-outlined text-on-tertiary-container">table_restaurant</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black tracking-tight text-primary">
              {floors.reduce((acc, f) => acc + f.tables.filter(t => t.status === 'OCCUPIED').length, 0)} 
              <span className="text-2xl font-normal opacity-30"> / {floors.reduce((acc, f) => acc + f.tables.length, 0)}</span>
            </h3>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-primary-container h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(floors.reduce((acc, f) => acc + f.tables.filter(t => t.status === 'OCCUPIED').length, 0) / floors.reduce((acc, f) => acc + f.tables.length, 0)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-12">
        {/* Floor View (Col 8) */}
        <div className="col-span-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-primary tracking-tight italic">Main Floor</h2>
            <div className="flex gap-2">
              <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-black uppercase tracking-widest border border-secondary/10">Occupied</span>
              <span className="px-4 py-1.5 bg-surface-container-high text-outline rounded-full text-[10px] font-black uppercase tracking-widest border border-surface-container-highest">Available</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {floors[0]?.tables.map((table) => {
              const isOccupied = table.status === 'OCCUPIED';
              return (
                <div key={table.id} className={`p-5 rounded-[2rem] border-b-4 flex flex-col justify-between h-40 transition-all ${
                  isOccupied ? 'bg-surface-container-highest border-secondary/20 shadow-sm' : 'bg-surface-container-low border-outline-variant/10 opacity-40 hover:opacity-100 cursor-pointer'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="text-xl font-black text-primary">T{table.tableNumber.toString().padStart(2, '0')}</span>
                    <div className="flex items-center gap-1 opacity-40">
                      <span className="material-symbols-outlined text-xs font-black">group</span>
                      <span className="text-[10px] font-bold">{table.seats}</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-[8px] uppercase tracking-widest opacity-50 font-black mb-1">Status</p>
                    <p className={`text-sm font-black uppercase tracking-widest ${isOccupied ? 'text-primary' : 'text-outline opacity-30'}`}>
                      {isOccupied ? 'In Service' : 'Vacant'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Space */}
          <div className="mt-10 rounded-[3rem] h-52 overflow-hidden relative group shadow-2xl shadow-primary/5">
            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=2070" alt="Cafe" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent flex flex-col justify-end p-10 text-white">
              <h4 className="text-xl font-black mb-1 uppercase tracking-tight">Barista Tip of the Day</h4>
              <p className="text-xs font-medium opacity-70 max-w-md leading-relaxed">Consistent tamping pressure ensures even extraction for that perfect golden crema every time.</p>
            </div>
          </div>
        </div>

        {/* Kitchen Feed (Col 4) */}
        <div className="col-span-4">
          <div className="flex justify-between items-center mb-8 px-2">
            <h2 className="text-2xl font-black text-primary tracking-tight italic">Kitchen Feed</h2>
            <button className="text-secondary font-black text-[10px] uppercase tracking-widest hover:underline underline-offset-8">Live Feed</button>
          </div>

          <div className="flex flex-col gap-6 max-h-[800px] overflow-y-auto pr-2 scrollbar-hide">
            <AnimatePresence>
              {kitchenOrders.length === 0 ? (
                <div className="py-20 text-center text-outline opacity-20 italic font-bold uppercase tracking-widest text-xs">No active tickets</div>
              ) : (
                kitchenOrders.map((order) => (
                  <motion.div 
                    key={order.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="bg-surface-container-low p-6 rounded-[2.5rem] group border border-transparent hover:border-outline-variant/20 transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          order.status === 'CREATED' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'
                        }`}>
                          {order.status === 'CREATED' ? 'To Cook' : 'Preparing'}
                        </span>
                        <h4 className="text-lg font-black text-primary mt-2 italic tracking-tight">Order #{order.orderNumber}</h4>
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest mt-1 opacity-60">Table T{order.tableId?.slice(-2)} • {order.items.length} items</p>
                      </div>
                      <span className="text-xl font-black text-primary opacity-20">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <ul className="space-y-2 mb-8 border-t border-surface-container-high pt-4">
                      {order.items.map((item: any) => (
                        <li key={item.id} className="text-sm font-bold text-primary/80 flex justify-between">
                          <span>{item.quantity}x {item.product.name}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => updateOrderStatus(order.id, order.status === 'CREATED' ? 'IN_PROGRESS' : 'READY')}
                      className="w-full bg-primary py-4 rounded-2xl text-on-primary font-black text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-xl shadow-primary/10"
                    >
                      {order.status === 'CREATED' ? 'Start Preparing' : 'Mark Ready'}
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
