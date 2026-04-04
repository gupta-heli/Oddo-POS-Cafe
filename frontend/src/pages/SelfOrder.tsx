import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, Plus, Minus, CheckCircle, Coffee } from 'lucide-react';
import axios from 'axios';

const SelfOrder: React.FC = () => {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [orderNum, setOrderNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Force the use of Local IP for mobile connectivity
        const res = await axios.get(`http://10.213.199.99:5000/api/public/self-order/${token}`);
        setData(res.data);
      } catch (err) {
        console.error("MOBILE_API_ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.productId === product.id);
      if (exists) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, productName: product.name, price: product.price, quantity: 1 }];
    });
  };

  const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`http://10.213.199.99:5000/api/public/self-order/${token}`, {
        items: cart,
        totalAmount: total
      });
      setOrderNumber(res.data.orderNumber);
      setSuccess(true);
      setCart([]);
    } catch (err) {
      alert('Failed to place order. Store might be closed.');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background text-outline font-black uppercase tracking-widest">Opening Menu...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center bg-background text-error font-black uppercase tracking-widest">Invalid QR Code</div>;

  return (
    <div className="min-h-screen bg-background font-manrope pb-32">
      <header className="p-8 flex justify-between items-center bg-white shadow-sm border-b border-surface-container-high sticky top-0 z-30">
        <div>
          <h1 className="text-xl font-black text-primary tracking-tight">{data.table.floor.branch.name}</h1>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Table T{data.table.tableNumber}</p>
        </div>
        <div className="bg-primary p-3 rounded-2xl text-white shadow-xl shadow-primary/20">
          <Coffee size={24} />
        </div>
      </header>

      <div className="p-6 space-y-10 max-w-2xl mx-auto">
        {data.categories.map((cat: any) => (
          <div key={cat.id} className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-black text-primary uppercase tracking-widest">{cat.name}</h3>
              <div className="flex-1 h-px bg-surface-container-high"></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {cat.products.map((p: any) => (
                <div key={p.id} className="bg-white p-5 rounded-[1.5rem] border border-surface-container-high flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-primary">{p.name}</h4>
                    <p className="text-xs font-black text-secondary mt-1">₹{p.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => addToCart(p)} className="w-10 h-10 bg-surface-container-low text-primary rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 p-6 z-40">
            <div className="max-w-2xl mx-auto bg-primary text-white p-6 rounded-[2rem] shadow-2xl flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{cart.length} items selected</p>
                <p className="text-xl font-black">₹{total.toFixed(2)}</p>
              </div>
              <button onClick={handleSubmit} className="bg-white text-primary px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                Order Now <ChevronRight size={16}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-emerald-500 z-[100] flex flex-col items-center justify-center text-white p-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle size={100} strokeWidth={3} className="mb-8" />
            </motion.div>
            <h2 className="text-4xl font-black tracking-tighter mb-4">Order Received!</h2>
            <p className="text-lg font-bold opacity-80 uppercase tracking-widest">Your Order #ORD-{orderNum} is being prepared</p>
            <button onClick={() => setSuccess(false)} className="mt-12 text-sm font-black uppercase tracking-[0.3em] border-b-2 border-white pb-1">Back to Menu</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelfOrder;
