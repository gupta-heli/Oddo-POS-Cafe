import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, ChevronRight, Utensils, Trash2, Plus, Minus, X, CheckCircle, Wallet } from 'lucide-react';
import api from '../services/api';
import { usePOSStore } from '../stores/posStore';
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
  
  // Partial Payment State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState(0);

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, activeTable } = usePOSStore();

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  const activeProducts = categories.find(c => c.id === activeCategory)?.products || [];
  const filteredProducts = activeProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  useEffect(() => {
    setPaymentAmount(total.toFixed(2));
    setRemainingAmount(total);
  }, [total, showPayment]);

  const handleUpdateNotes = (productId: string, notes: string) => {
    setItemNotes(prev => ({ ...prev, [productId]: notes }));
  };

  const addToModalCart = (product: any, variant?: any) => {
    const itemPrice = product.price + (variant?.extraPrice || 0);
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    const itemName = variant ? `${product.name} (${variant.name})` : product.name;

    addToCart({ ...product, id: itemId, name: itemName, price: itemPrice });
    setShowVariantModal(null);
  };

  const handleProductClick = (product: any) => {
    if (product.variants?.length > 0) {
      setShowVariantModal(product);
    } else {
      addToCart(product);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isPlacing) return;
    setIsPlacing(true);
    try {
      const res = await api.post('/pos/orders', {
        tableId: activeTable?.id,
        items: cart.map(item => ({
          ...item,
          productId: item.productId || item.id,
          notes: itemNotes[item.productId || item.id] || ''
        })),
        totalAmount: total,
        orderType: 'DINE_IN'
      });
      setCurrentOrderId(res.data.id);
      setShowPayment(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to place order. Make sure you opened a session!');
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePay = async (method: string) => {
    if (!currentOrderId) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || amount > remainingAmount + 0.01) {
      alert("Invalid payment amount");
      return;
    }

    try {
      const res = await api.post(`/pos/orders/${currentOrderId}/payment`, { 
        amount, 
        method 
      });
      
      if (res.data.isFullyPaid) {
        setShowPayment(false);
        setShowUPI(false);
        setShowSuccess(true);
        clearCart();
        setItemNotes({});
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setRemainingAmount(res.data.remaining);
        setPaymentAmount(res.data.remaining.toFixed(2));
        alert(`Partial payment successful! Remaining: ₹${res.data.remaining.toFixed(2)}`);
      }
    } catch (err) {
      alert('Payment failed');
    }
  };

  if (loading) return <div className="p-10 text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse text-center">Curating Menu...</div>;

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in relative bg-background font-manrope">
      <POSTopMenu />
      
      <div className="flex-1 flex gap-8 px-12 py-8 overflow-hidden relative">
        {/* Product Area */}
        <div className="flex-1 flex flex-col gap-8 overflow-hidden">
          <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-surface-container-high">
            <div className="flex items-center gap-4 flex-1 px-4">
              <span className="material-symbols-outlined text-outline text-xl">search</span>
              <input 
                type="text" 
                placeholder="Search menu..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-primary w-full placeholder:text-outline/50" 
              />
            </div>
            <div className="flex gap-2 p-1 bg-surface-container-low rounded-[1.5rem]">
              {categories.filter(c => c.products.length > 0).map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                    ${activeCategory === cat.id ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pr-2 scrollbar-hide">
            {filteredProducts.map((p: any) => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -5 }}
                onClick={() => handleProductClick(p)}
                className="bg-white p-6 rounded-[2rem] border border-surface-container-high hover:border-primary cursor-pointer transition-all text-center group shadow-sm hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-16 h-16 bg-surface-container-low rounded-full mx-auto mb-4 flex items-center justify-center text-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <Utensils size={24}/>
                </div>
                <h5 className="font-bold text-primary text-sm mb-1">{p.name}</h5>
                <p className="text-secondary font-black text-xs">₹{p.price.toFixed(2)}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <aside className="w-[420px] flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-xl shadow-primary/5 border border-surface-container-high">
            <div className="p-8 border-b border-surface-container-low flex justify-between items-center bg-surface-container-low/30">
              <div>
                <h3 className="text-xl font-black text-primary tracking-tight">Active Order</h3>
                <p className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">
                  {activeTable ? `Table T${activeTable.tableNumber.toString().padStart(2, '0')}` : 'Quick Takeaway'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-outline/30 italic py-20">
                  <span className="material-symbols-outlined text-6xl mb-4">shopping_basket</span>
                  <p className="font-black uppercase tracking-[0.2em] text-xs">Your basket is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-4 group animate-fade-in">
                    <div className="flex-1">
                      <h5 className="font-bold text-sm text-primary tracking-tight">{item.productName}</h5>
                      <input 
                        type="text" 
                        placeholder="Add notes..." 
                        value={itemNotes[item.productId] || ''}
                        className="text-[10px] font-medium text-outline bg-transparent border-none outline-none w-full placeholder:opacity-50"
                        onChange={(e) => handleUpdateNotes(item.productId, e.target.value)}
                      />
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-0.5">₹{item.price} per unit</p>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-surface-container-high">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-outline hover:text-error transition-colors"><span className="material-symbols-outlined text-sm font-black">remove</span></button>
                      <span className="font-black text-xs w-5 text-center text-primary">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-outline hover:text-secondary transition-colors"><span className="material-symbols-outlined text-sm font-black">add</span></button>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="w-8 h-8 text-outline/30 hover:text-error hover:bg-error/5 rounded-full transition-all flex items-center justify-center"><span className="material-symbols-outlined text-lg">delete</span></button>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 bg-surface-container-low/50 space-y-6 border-t border-surface-container-high">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                  <span>Subtotal</span>
                  <span className="text-primary">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                  <span>Tax (GST 5%)</span>
                  <span className="text-primary">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-primary pt-4 border-t border-surface-container-high tracking-tighter">
                  <span>Total</span>
                  <span className="text-secondary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || isPlacing}
                className="w-full bg-primary text-on-primary py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-2xl shadow-primary/20 disabled:opacity-50"
              >
                {isPlacing ? 'Processing...' : 'Send to Kitchen'}
                <span className="material-symbols-outlined">chef_hat</span>
              </button>
            </div>
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

      {/* Payment Overlays */}
      <AnimatePresence>
        {showPayment && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-surface-container-high"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-primary tracking-tight">Checkout</h3>
                <button onClick={() => setShowPayment(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-outline"><X size={20}/></button>
              </div>

              <div className="bg-surface-container-low p-6 rounded-2xl mb-8 border border-surface-container-high">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-outline uppercase tracking-widest">Remaining Balance</span>
                  <span className="text-xl font-black text-primary">₹{remainingAmount.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <label className="block text-[8px] font-black text-outline uppercase tracking-widest mb-2 ml-1">Payment Amount</label>
                  <input 
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-white border border-surface-container-high rounded-xl py-4 px-6 text-lg font-black text-primary outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {settings?.enableCash && (
                  <button onClick={() => handlePay('CASH')} className="w-full flex items-center gap-6 p-6 rounded-3xl border border-surface-container-high hover:border-primary transition-all group">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all"><span className="material-symbols-outlined text-3xl">payments</span></div>
                    <div className="text-left"><h4 className="font-black text-primary">CASH</h4><p className="text-[10px] font-bold text-outline uppercase tracking-widest">In-store currency</p></div>
                  </button>
                )}
                {settings?.enableDigital && (
                  <button onClick={() => handlePay('DIGITAL')} className="w-full flex items-center gap-6 p-6 rounded-3xl border border-surface-container-high hover:border-primary transition-all group">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all"><span className="material-symbols-outlined text-3xl">credit_card</span></div>
                    <div className="text-left"><h4 className="font-black text-primary">DIGITAL</h4><p className="text-[10px] font-bold text-outline uppercase tracking-widest">Card or Bank Transfer</p></div>
                  </button>
                )}
                {settings?.enableUPI && (
                  <button onClick={() => setShowUPI(true)} className="w-full flex items-center gap-6 p-6 rounded-3xl border border-surface-container-high hover:border-primary transition-all group">
                    <div className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all"><span className="material-symbols-outlined text-3xl">qr_code_2</span></div>
                    <div className="text-left"><h4 className="font-black text-primary">UPI QR</h4><p className="text-[10px] font-bold text-outline uppercase tracking-widest">Instant Mobile Pay</p></div>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showUPI && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-xl z-[110] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-12 text-center shadow-2xl"
            >
              <h4 className="text-xl font-black text-primary tracking-tight">Scan to Pay</h4>
              <p className="text-secondary font-black text-2xl mt-2 mb-8">₹{parseFloat(paymentAmount).toFixed(2)}</p>
              
              <div className="bg-white p-6 rounded-[2.5rem] border-4 border-surface-container-low inline-block mb-10">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${settings?.upiId}&pn=${settings?.name}&am=${paymentAmount}&cu=INR`)}`} 
                  alt="UPI QR"
                  className="w-48 h-48"
                />
              </div>

              <div className="space-y-4">
                <button onClick={() => handlePay('UPI')} className="w-full bg-emerald-500 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-100">CONFIRMED</button>
                <button onClick={() => setShowUPI(false)} className="w-full text-outline font-black text-[10px] uppercase tracking-widest py-2">CANCEL</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-500 z-[200] flex flex-col items-center justify-center text-white cursor-pointer"
            onClick={() => { setShowSuccess(false); navigate('/floor'); }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
              <CheckCircle size={120} strokeWidth={3} className="mb-8" />
            </motion.div>
            <h2 className="text-5xl font-black tracking-tighter mb-4 text-center px-6">Payment Confirmed!</h2>
            <p className="text-lg font-bold opacity-80 uppercase tracking-widest mb-12">Order successfully processed</p>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 animate-pulse">Tap anywhere to return</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSTerminal;
