import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Utensils, Trash2, Plus, X, CheckCircle, RefreshCw, LayoutDashboard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePOSStore } from '../stores/posStore';
import { useAuthStore } from '../stores/authStore';
import type { Category, Product, Branch } from '../types/index.ts';
import POSTopMenu from '../components/POSTopMenu';

const POSTerminal: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showUPI, setShowUPI] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settings, setSettings] = useState<Branch | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [showVariantModal, setShowVariantModal] = useState<any | null>(null);
  
  // Numpad State
  const [numpadValue, setNumpadValue] = useState('');

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, activeTable } = usePOSStore();
  const { logout, activeSessionId, setSession } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, settingsRes] = await Promise.all([
        api.get('/pos/products'),
        api.get('/pos/settings')
      ]);
      setCategories(prodRes.data);
      setSettings(settingsRes.data);
      if (prodRes.data.length > 0) setActiveCategory(prodRes.data[0].id);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeCategoryData = categories.find(c => c.id === activeCategory);
  const activeProducts = activeCategoryData?.products || [];
  const filteredProducts = activeProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleNumpadClick = (val: string) => {
    if (val === 'C') setNumpadValue('');
    else if (val === '⌫') setNumpadValue(prev => prev.slice(0, -1));
    else setNumpadValue(prev => prev + val);
  };

  const handleCloseRegister = async () => {
    if (!activeSessionId) return;
    try {
      await api.post(`/pos/sessions/${activeSessionId}/close`);
      setSession(null);
      navigate('/');
    } catch (err) {
      alert('Failed to close register');
    }
  };

  const addToModalCart = (product: any, variant?: any) => {
    const itemPrice = product.price + (variant?.extraPrice || 0);
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    const itemName = variant ? `${product.name} (${variant.name})` : product.name;
    const qty = parseInt(numpadValue) || 1;
    addToCart({ ...product, id: itemId, name: itemName, price: itemPrice }, qty);
    setShowVariantModal(null);
    setNumpadValue('');
  };

  const handleProductClick = (product: any) => {
    if (product.variants?.length > 0) {
      setShowVariantModal(product);
    } else {
      const qty = parseInt(numpadValue) || 1;
      addToCart(product, qty);
      setNumpadValue('');
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isPlacing) return;
    setIsPlacing(true);
    try {
      const res = await api.post('/pos/orders', {
        tableId: activeTable?.id,
        items: cart.map(item => ({ ...item, productId: item.productId || item.id, notes: itemNotes[item.productId || item.id] || '' })),
        totalAmount: total,
        orderType: 'DINE_IN'
      });
      setCurrentOrderId(res.data.id);
      setShowPayment(true);
    } catch (err: any) {
      alert('Failed to place order.');
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePay = async (method: string) => {
    if (!currentOrderId) return;
    try {
      const res = await api.post(`/pos/orders/${currentOrderId}/payment`, { amount: total, method });
      if (res.data.isFullyPaid) {
        setShowPayment(false);
        setShowUPI(false);
        setShowSuccess(true);
        clearCart();
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      alert('Payment failed');
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Syncing Terminal...</div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden animate-fade-in bg-background font-manrope">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-surface-container-high px-8 flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/floor')} className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest hover:text-secondary transition-all">
            <span className="material-symbols-outlined text-lg">grid_view</span> Table
          </button>
          <div className="h-4 w-px bg-surface-container-high"></div>
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
            {activeTable ? `Table T${activeTable.tableNumber}` : 'Register Open'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={fetchData} className="flex items-center gap-2 text-outline font-bold text-[9px] uppercase tracking-widest hover:text-primary transition-all">
            <RefreshCw size={12} /> Reload
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-outline font-bold text-[9px] uppercase tracking-widest hover:text-primary transition-all">
            <LayoutDashboard size={12} /> Dashboard
          </button>
          <button onClick={handleCloseRegister} className="bg-error text-white px-4 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest flex items-center gap-2">
            <LogOut size={10} /> Close
          </button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Selection Area */}
        <div className="flex-1 flex flex-col gap-6 p-8 overflow-hidden">
          {/* Categories */}
          <div className="grid grid-cols-6 gap-4">
            {categories.filter(c => c.products.length > 0).map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-5 rounded-[2rem] border transition-all flex flex-col items-center gap-3 group
                  ${activeCategory === cat.id ? 'bg-primary border-primary shadow-xl scale-[1.02]' : 'bg-white border-surface-container-high hover:border-primary'}`}
              >
                <span className={`material-symbols-outlined text-3xl ${activeCategory === cat.id ? 'text-secondary' : 'text-primary/20 group-hover:text-primary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {cat.icon || 'coffee'}
                </span>
                <span className={`font-black text-[10px] uppercase tracking-widest ${activeCategory === cat.id ? 'text-white' : 'text-primary'}`}>{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white p-3.5 rounded-2xl shadow-sm border border-surface-container-high gap-4 px-6">
            <Search size={18} className="text-outline" />
            <input type="text" placeholder="Search Menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-none outline-none font-bold text-primary w-full text-sm placeholder:text-outline/30" />
          </div>

          {/* Product Grid - Identical & Responsive Sizing */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 scrollbar-hide pr-4">
            {filteredProducts.map((p: any) => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => handleProductClick(p)}
                className="bg-white p-8 rounded-[3rem] border border-surface-container-high hover:border-primary cursor-pointer transition-all text-center group shadow-sm hover:shadow-2xl hover:shadow-primary/5 flex flex-col items-center justify-center min-h-[260px]"
              >
                <div className="w-20 h-20 bg-surface-container-low rounded-full mb-6 flex items-center justify-center text-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner group-hover:shadow-xl">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {activeCategoryData?.icon || 'restaurant'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-full min-h-[60px] justify-start">
                  <h4 className="font-black text-primary text-base tracking-tight leading-snug px-2 italic line-clamp-2">
                    {p.name}
                  </h4>
                  <div className="flex items-center justify-center gap-2 mt-auto">
                    <span className="w-1 h-1 rounded-full bg-secondary opacity-40"></span>
                    <span className="text-secondary font-black text-[10px] tracking-[0.2em] uppercase">₹{p.price.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Sidebar */}
        <aside className="w-[460px] bg-white border-l border-surface-container-high flex flex-col shadow-2xl z-40">
          <div className="p-8 border-b border-surface-container-low bg-surface-container-low/30">
            <h4 className="text-xl font-black text-primary italic uppercase tracking-tighter flex items-center gap-3">
              <ShoppingBag size={22} className="text-secondary" /> Active Ticket
            </h4>
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide pb-24">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 italic font-black uppercase text-[10px] tracking-widest text-center">Awaiting selection</div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center group animate-fade-in bg-surface-container-low/20 p-4 rounded-[1.5rem] border border-transparent hover:border-surface-container-high transition-all">
                  <div className="flex-1 flex flex-col gap-1">
                    <h5 className="font-black text-primary text-sm tracking-tight">{item.productName}</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">₹{item.price}</span>
                      <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-sm">{item.quantity}</div>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-outline/30 hover:text-error hover:shadow-lg transition-all border border-transparent hover:border-error/10"><Trash2 size={18}/></button>
                </div>
              ))
            )}
          </div>

          {/* Numpad Section */}
          <div className="p-8 bg-surface-container-low/80 border-t border-surface-container-high shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">Next Item Qty</span>
              <span className="text-xl font-black text-primary italic">{numpadValue || '1'}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'C'].map(btn => (
                  <button 
                    key={btn} 
                    onClick={() => handleNumpadClick(btn)} 
                    className="h-12 bg-white rounded-2xl font-black text-primary shadow-sm active:scale-95 border border-surface-container-high hover:border-primary transition-all text-base flex items-center justify-center"
                  >
                    {btn}
                  </button>
                ))}
              </div>
              <div className="w-24 flex flex-col gap-3">
                <button 
                  onClick={() => handleNumpadClick('⌫')} 
                  className="h-12 bg-surface-container-high rounded-2xl flex items-center justify-center text-primary active:scale-95 transition-all hover:bg-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-2xl">backspace</span>
                </button>
                <button 
                  onClick={handlePlaceOrder} 
                  disabled={cart.length === 0 || isPlacing} 
                  className="flex-1 bg-primary text-secondary rounded-[2rem] flex items-center justify-center shadow-xl active:scale-95 transition-all group disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Checkout Action */}
          <div className="p-10 bg-white border-t border-surface-container-high">
            <div className="flex justify-between items-end mb-8">
              <div><p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-1">Station Total</p><h4 className="text-4xl font-black text-primary tracking-tighter">₹{total.toFixed(2)}</h4></div>
              <div className="text-right opacity-40"><p className="text-[8px] font-bold text-outline uppercase tracking-widest">Incl. 5% GST</p></div>
            </div>
            <button onClick={handlePlaceOrder} disabled={cart.length === 0 || isPlacing} className="w-full bg-secondary text-primary py-6 rounded-[2.2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
              {isPlacing ? 'Syncing...' : 'Validate Ticket'}
              <Plus size={16} strokeWidth={4} />
            </button>
          </div>
        </aside>
      </div>

      {/* Variant Selector Modal */}
      <AnimatePresence>
        {showVariantModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/40 backdrop-blur-md z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl border border-surface-container-high">
              <div className="text-center mb-10">
                <h4 className="text-2xl font-black text-primary tracking-tight italic uppercase">Customize Order</h4>
                <p className="text-outline font-black text-[10px] uppercase tracking-widest mt-2">{showVariantModal.name}</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => addToModalCart(showVariantModal)} className="w-full p-6 rounded-2xl border border-surface-container-high hover:border-primary transition-all flex justify-between items-center bg-surface-container-low/30 group active:scale-95">
                  <span className="font-bold text-primary">Standard</span>
                  <span className="text-xs font-black text-outline">₹{showVariantModal.price.toFixed(2)}</span>
                </button>
                {showVariantModal.variants.map((v: any) => (
                  <button key={v.id} onClick={() => addToModalCart(showVariantModal, v)} className="w-full p-6 rounded-2xl border border-surface-container-high hover:border-primary transition-all flex justify-between items-center group active:scale-95">
                    <span className="font-bold text-primary">{v.name}</span>
                    <span className="text-xs font-black text-secondary">+ ₹{v.extraPrice.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowVariantModal(null)} className="w-full mt-10 text-outline font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center text-white cursor-pointer" onClick={() => setShowSuccess(false)}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[4rem] p-16 w-full max-w-lg text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-4 bg-secondary"></div>
              <CheckCircle size={100} className="text-emerald-500 mx-auto mb-10" />
              <h2 className="text-5xl font-black text-primary tracking-tighter mb-4">Amount Paid</h2>
              <h3 className="text-6xl font-black text-secondary tracking-tighter mb-12">₹{total.toFixed(2)}</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <button className="bg-surface-container-low text-primary py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-surface-container-high flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">mail</span> Email Receipt
                </button>
                <button onClick={() => { setShowSuccess(false); navigate('/floor'); }} className="bg-primary text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl">
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSTerminal;
