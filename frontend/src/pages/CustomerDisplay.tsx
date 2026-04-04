import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { io } from 'socket.io-client';
import { CheckCircle2, Coffee, Utensils, Smile } from 'lucide-react';

const CustomerDisplay: React.FC = () => {
  const { tableId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [readyItems, setReadyItems] = useState<Record<string, boolean>>({});

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/pos/customer-display/${tableId}`);
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const socket = io('http://localhost:5000');
    
    if (tableId) {
      socket.emit('join-branch', `table-${tableId}`);
    }

    socket.on('order-status-updated', (updatedOrder) => {
      if (updatedOrder.tableId === tableId) {
        setOrder(updatedOrder);
        // If whole order marked as READY, mark all items as ready
        if (updatedOrder.status === 'READY' || updatedOrder.status === 'COMPLETED') {
          const allReady: Record<string, boolean> = {};
          updatedOrder.items?.forEach((i: any) => allReady[i.id] = true);
          setReadyItems(allReady);
        }
      }
    });

    socket.on('new-order', (newOrder) => {
      if (newOrder.tableId === tableId) setOrder(newOrder);
    });

    // Listen for item-level preparation sync from kitchen
    socket.on('item-prepared', (data: { itemId: string, isReady: boolean }) => {
      setReadyItems(prev => ({ ...prev, [data.itemId]: data.isReady }));
    });

    return () => { socket.disconnect(); };
  }, [tableId]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-background font-manrope font-black text-outline animate-pulse">Establishing Connection...</div>;

  const isOrderFinal = order?.status === 'COMPLETED' || order?.status === 'READY';

  return (
    <div className="h-screen bg-background font-manrope flex flex-col overflow-hidden">
      <header className="h-24 bg-primary text-white flex justify-between items-center px-12 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-primary rotate-3">
            <Coffee size={24} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Caffino</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 text-secondary">Your Location</p>
          <h2 className="text-xl font-black italic">Table T{tableId?.slice(-2) || '??'}</h2>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-16 flex flex-col gap-10 overflow-hidden">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <h3 className="text-5xl font-black text-primary tracking-tighter italic">Order Progress</h3>
              <p className="text-xs font-bold text-outline uppercase tracking-widest">Live from the roasting station</p>
            </div>
            {order && (
              <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-lg
                ${order.status === 'CREATED' ? 'bg-error text-white' : 
                  order.status === 'IN_PROGRESS' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {order.status === 'CREATED' ? 'QUEUED' : order.status === 'IN_PROGRESS' ? 'PREPARING' : 'READY'}
              </div>
            )}
          </div>

          {!order ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-6">
              <Utensils size={120} strokeWidth={1} />
              <p className="text-2xl font-black italic uppercase tracking-tighter">Awaiting your selection...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-6 scrollbar-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-4 border-surface-container-high">
                    <th className="pb-8 text-[10px] font-black text-outline uppercase tracking-widest">Items</th>
                    <th className="pb-8 text-[10px] font-black text-outline uppercase tracking-widest text-center">Qty</th>
                    <th className="pb-8 text-[10px] font-black text-outline uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {order.items?.map((item: any) => {
                    const isItemReady = readyItems[item.id] || isOrderFinal || order.status === 'READY';
                    return (
                      <tr key={item.id} className="group transition-colors">
                        <td className="py-8">
                          <h5 className={`text-2xl font-black transition-all ${isItemReady ? 'text-outline line-through opacity-40' : 'text-primary'}`}>{item.product.name}</h5>
                          {item.notes && <p className="text-xs font-bold text-secondary mt-1 uppercase italic tracking-widest">{item.notes}</p>}
                        </td>
                        <td className="py-8 text-center">
                          <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border transition-all
                            ${isItemReady ? 'bg-surface-container-high text-outline border-transparent' : 'bg-white text-primary border-surface-container-high shadow-sm'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-8 text-right">
                          <div className={`flex items-center justify-end gap-3 font-black italic ${isItemReady ? 'text-emerald-500' : 'text-orange-500'}`}>
                            {isItemReady ? (
                              <><CheckCircle2 size={28} /> <span className="text-lg uppercase">Done</span></>
                            ) : order.status === 'CREATED' ? (
                              <span className="text-[10px] uppercase opacity-40">Waiting...</span>
                            ) : (
                              <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce delay-0"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce delay-150"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce delay-300"></span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <aside className="w-[480px] bg-white border-l border-surface-container-high p-12 flex flex-col justify-between shadow-2xl relative">
          <div className="flex flex-col gap-10">
            <div className="bg-surface-container-low p-10 rounded-[3rem] border border-surface-container-high shadow-inner text-center">
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.4em] mb-4">Final Amount</p>
              <h4 className="text-7xl font-black text-primary tracking-tighter italic">₹{order?.totalAmount?.toFixed(2) || '0.00'}</h4>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-surface-container-high flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                  ${order?.paidAmount >= (order?.totalAmount - 0.01) ? 'bg-emerald-50 text-emerald-500' : 'bg-surface-container-low text-outline'}`}>
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h5 className="font-black text-primary text-sm uppercase tracking-widest">Payment Status</h5>
                  <p className={`text-xl font-black italic tracking-tight ${order?.paidAmount >= (order?.totalAmount - 0.01) ? 'text-emerald-500' : 'text-outline opacity-40'}`}>
                    {order?.paidAmount >= (order?.totalAmount - 0.01) ? 'Fully Paid' : 'Pending...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center opacity-40 py-10">
            <Smile size={48} className="mx-auto mb-4 text-secondary" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Thank you for choosing <br/> Caffino</p>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {(order?.status === 'COMPLETED') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-primary/95 z-[100] flex flex-col items-center justify-center text-white text-center p-20">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-48 h-48 bg-secondary rounded-[4rem] flex items-center justify-center mb-12 shadow-2xl text-primary">
              <Smile size={100} />
            </motion.div>
            <h2 className="text-8xl font-black tracking-tighter italic leading-none mb-6">See You Again!</h2>
            <p className="text-2xl font-bold uppercase tracking-[0.4em] opacity-60">Served with love at station T{tableId?.slice(-2)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDisplay;
