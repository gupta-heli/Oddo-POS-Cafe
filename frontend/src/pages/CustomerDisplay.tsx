import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const CustomerDisplay: React.FC = () => {
  const { tableId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/pos/customer-display/${tableId}`);
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
    // Listen for updates related to this table
    socket.on('order-status-updated', (updatedOrder) => {
      if (updatedOrder.tableId === tableId) {
        if (updatedOrder.status === 'COMPLETED') {
          setOrder({ ...updatedOrder, isPaid: true });
          setTimeout(() => setOrder(null), 5000); // Clear after 5s of success
        } else {
          setOrder(updatedOrder);
        }
      }
    });

    socket.on('new-order', (newOrder) => {
      if (newOrder.tableId === tableId) {
        setOrder(newOrder);
      }
    });

    return () => { socket.disconnect(); };
  }, [tableId]);

  if (loading) return <div className="h-screen bg-background flex items-center justify-center font-black uppercase tracking-[0.3em] text-outline opacity-20">Syncing Display...</div>;

  return (
    <div className="h-screen w-screen bg-background p-12 font-manrope flex gap-12 overflow-hidden">
      {/* Left: Branding & Welcome */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="bg-primary w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl">
            <Coffee size={40} />
          </div>
          <h1 className="text-6xl font-black text-primary tracking-tighter">Welcome to <br/><span className="text-secondary">Elegant Barista</span></h1>
          <p className="text-xl font-bold text-outline uppercase tracking-widest">Table T-{tableId?.slice(-2) || '01'}</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-surface-container-high relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <h3 className="text-2xl font-black text-primary mb-2">Order Status</h3>
          {!order ? (
            <p className="text-lg font-bold text-outline italic">Ready for your next order...</p>
          ) : (
            <div className="flex items-center gap-4 mt-6">
              <div className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-sm 
                ${order.isPaid ? 'bg-emerald-500 text-white' : 'bg-secondary-container text-on-secondary-container animate-pulse'}`}>
                {order.isPaid ? 'Payment Successful' : `Status: ${order.status}`}
              </div>
              {order.status === 'READY' && <span className="text-emerald-600 font-black text-sm uppercase tracking-widest flex items-center gap-2"><CheckCircle size={18}/> Ready to Collect</span>}
            </div>
          )}
        </div>
      </div>

      {/* Right: Order Details */}
      <div className="w-[500px] bg-white rounded-[4rem] shadow-2xl border border-surface-container-high flex flex-col overflow-hidden">
        <div className="p-12 border-b border-surface-container-low flex justify-between items-end bg-surface-container-low/30">
          <h2 className="text-3xl font-black text-primary tracking-tight text-center">Your Order</h2>
          <span className="text-outline font-black text-xs uppercase tracking-widest mb-1">Items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide">
          {!order || order.items?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
              <ShoppingBag size={80} />
              <p className="mt-6 font-black text-xl uppercase tracking-widest">Awaiting Items</p>
            </div>
          ) : (
            order.items.map((item: any) => (
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={item.id} className="flex justify-between items-center group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center text-primary/40 font-black text-xl group-hover:bg-primary group-hover:text-white transition-all">
                    {item.quantity}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-primary tracking-tight">{item.product.name}</h4>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">Curated item</p>
                  </div>
                </div>
                <span className="text-xl font-black text-primary tracking-tighter">₹{(item.price * item.quantity).toFixed(2)}</span>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-12 bg-primary text-white space-y-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-[0.3em] opacity-60 text-center">
            <span>Amount Due</span>
            <span>Total Payable</span>
          </div>
          <div className="flex justify-between items-center">
            <h3 className="text-5xl font-black tracking-tighter italic">₹{order?.totalAmount?.toFixed(2) || '0.00'}</h3>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Clock size={32} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
