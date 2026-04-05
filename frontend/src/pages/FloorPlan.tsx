import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { usePOSStore } from '../stores/posStore';
import type { Floor, Table, Category, Branch } from '../types/index.ts';
import { ShoppingBag, Utensils, X, CheckCircle, CreditCard, Wallet, QrCode, PlusCircle, CreditCard as PayIcon } from 'lucide-react';

const FloorPlan: React.FC = () => {
  const [floors, setFloors] = useState<any[]>([]);
  const [activeFloorIdx, setActiveFloorIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Selection Logic
  const [showActionModal, setShowActionModal] = useState<any | null>(null);
  const [showPOSModal, setShowPOSModal] = useState<any | null>(null);
  const [showVariantModal, setShowVariantModal] = useState<any | null>(null);
  
  // Menu/POS States
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);
  
  // Payment States
  const [showPayment, setShowPayment] = useState(false);
  const [showUPI, setShowUPI] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settings, setSettings] = useState<Branch | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Numpad State
  const [numpadValue, setNumpadValue] = useState('');

  const { user, token } = useAuthStore();
  const setActiveTable = usePOSStore((state) => state.setActiveTable);
  const navigate = useNavigate();

  const handleNumpadClick = (val: string) => {
    if (val === 'C') setNumpadValue('');
    else if (val === '⌫') setNumpadValue(prev => prev.slice(0, -1));
    else setNumpadValue(prev => prev + val);
  };

  const fetchFloors = async () => {
    try {
      const res = await api.get('/pos/floors');
      setFloors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
    const fetchMenu = async () => {
      const [prodRes, setRes] = await Promise.all([api.get('/pos/products'), api.get('/pos/settings')]);
      setCategories(prodRes.data);
      setSettings(setRes.data);
      if (prodRes.data.length > 0) setActiveCategory(prodRes.data[0].id);
    };
    fetchMenu();

    const socket = io('http://localhost:5000');
    if (user?.branchId) socket.emit('join-branch', user.branchId);
    socket.on('table-status-updated', () => fetchFloors());
    socket.on('new-order', () => fetchFloors());
    socket.on('order-status-updated', () => fetchFloors());

    return () => { socket.disconnect(); };
  }, [token, user?.branchId]);

  const handleTableClick = (table: any) => {
    if (table.activeTotal > 0) {
      setShowActionModal(table);
    } else {
      openOrderMenu(table);
    }
  };

  const openOrderMenu = (table: any) => {
    setActiveTable(table);
    setShowPOSModal(table);
    setCart([]);
    setShowPayment(false);
    setShowActionModal(null);
  };

  const openPaymentHub = async (table: any) => {
    try {
      const res = await api.get(`/pos/tables/${table.id}/active-order`);
      if (res.data?.id) {
        setCurrentOrderId(res.data.id);
        setActiveTable(table);
        setShowPOSModal(table);
        setCart([]);
        setShowPayment(true);
        setShowActionModal(null);
      }
    } catch (err) {
      alert("Error finding active order");
    }
  };

  const addToModalCart = (product: any, variant?: any) => {
    const itemPrice = product.price + (variant?.extraPrice || 0);
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    const itemName = variant ? `${product.name} (${variant.name})` : product.name;
    const qty = parseInt(numpadValue) || 1;

    setCart(prev => {
      const exists = prev.find(i => i.productId === itemId);
      if (exists) return prev.map(i => i.productId === itemId ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { productId: itemId, productName: itemName, price: itemPrice, quantity: qty }];
    });
    setShowVariantModal(null);
    setNumpadValue('');
  };

  const removeFromModalCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const handleProductClick = (product: any) => {
    if (product.variants?.length > 0) {
      setShowVariantModal(product);
    } else {
      addToModalCart(product);
    }
  };

  const handlePushToKitchen = async () => {
    if (!showPOSModal || cart.length === 0) return;
    setIsPlacing(true);
    try {
      const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.05;
      const res = await api.post('/pos/orders', {
        tableId: showPOSModal.id,
        items: cart,
        totalAmount: total,
        orderType: 'DINE_IN'
      });
      setCurrentOrderId(res.data.id);
      alert('Items sent to kitchen!');
      fetchFloors();
      setShowPayment(true);
    } catch (err) {
      alert('Order Failed.');
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePay = async (method: string) => {
    if (!currentOrderId) return;
    try {
      const amount = showPayment && !cart.length ? showPOSModal.activeTotal : (cart.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.05);
      await api.post(`/pos/orders/${currentOrderId}/payment`, { amount, method });
      setShowPayment(false);
      setShowUPI(false);
      setShowPOSModal(null);
      setShowSuccess(true);
      fetchFloors();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('Payment failed');
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Syncing Floor...</div>;

  const currentFloor = floors[activeFloorIdx];

  return (
    <div className="px-12 py-8 animate-fade-in font-manrope h-full overflow-y-auto relative">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-primary tracking-tight italic uppercase">Dining Command Center</h2>
        <div className="flex bg-surface-container-low p-1.5 rounded-[1.5rem] border border-surface-container-high shadow-sm">
          {floors.map((f: any, i: number) => (
            <button key={f.id} onClick={() => setActiveFloorIdx(i)} className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${activeFloorIdx === i ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'}`}>{f.name}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {floors[activeFloorIdx]?.tables.map((table: any) => {
          const isOccupied = table.activeTotal > 0;
          return (
            <motion.div key={table.id} whileHover={{ y: -5 }} onClick={() => handleTableClick(table)} className={`relative h-48 rounded-[2.5rem] p-8 cursor-pointer border-b-4 transition-all flex flex-col justify-between ${isOccupied ? 'bg-surface-container-highest border-secondary/30 shadow-md' : 'bg-white border-outline-variant/10 shadow-sm opacity-60 hover:opacity-100'}`}>
              <div className="flex justify-between items-start">
                <span className={`text-2xl font-black ${isOccupied ? 'text-primary' : 'text-outline'}`}>T{table.tableNumber.toString().padStart(2, '0')}</span>
                {isOccupied && <div className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(115,92,0,0.4)]"></div>}
              </div>
              <div className="mt-auto">
                <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Unpaid Balance</p>
                <p className={`text-2xl font-black tracking-tighter ${isOccupied ? 'text-primary' : 'text-outline/20 italic'}`}>₹{table.activeTotal?.toFixed(2) || '0.00'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Selector Modal */}
      <AnimatePresence>
        {showActionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/40 backdrop-blur-md z-[90] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[4rem] p-16 shadow-2xl border border-surface-container-high max-w-2xl w-full">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-black text-primary tracking-tighter italic uppercase">Active Table T{showActionModal.tableNumber}</h3>
                <p className="text-outline font-black text-[10px] uppercase tracking-[0.4em] mt-2">Running Total: ₹{showActionModal.activeTotal.toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <button onClick={() => openOrderMenu(showActionModal)} className="bg-surface-container-low p-10 rounded-[3rem] border border-surface-container-high hover:border-primary transition-all group flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all"><PlusCircle size={40}/></div>
                  <span className="font-black text-xs uppercase tracking-[0.2em] text-primary">Add More Items</span>
                </button>
                <button onClick={() => openPaymentHub(showActionModal)} className="bg-primary p-10 rounded-[3rem] border border-primary hover:opacity-90 transition-all group flex flex-col items-center gap-6 shadow-xl shadow-primary/20">
                  <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-white backdrop-blur-sm"><PayIcon size={40}/></div>
                  <span className="font-black text-xs uppercase tracking-[0.2em] text-white">Settle Bill</span>
                </button>
              </div>
              <button onClick={() => setShowActionModal(null)} className="w-full mt-12 text-outline font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all">Dismiss</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POS & Menu Modal */}
      <AnimatePresence>
        {showPOSModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/20 backdrop-blur-md z-[100] flex items-center justify-end p-6">
            <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }} className="bg-background w-full max-w-5xl h-full rounded-[3rem] shadow-2xl border border-surface-container-high flex overflow-hidden">
              {!showPayment ? (
                <>
                  <div className="flex-1 flex flex-col p-10 gap-8 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="text-3xl font-black text-primary tracking-tight italic uppercase">Select Menu <span className="text-secondary opacity-40 ml-2 italic">T{showPOSModal.tableNumber}</span></h3>
                      <div className="flex gap-2 p-1 bg-surface-container-low rounded-2xl">
                        {categories.filter(c => c.products.length > 0).map(cat => (
                          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'}`}>{cat.name}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-6 scrollbar-hide">
                      {categories.find(c => c.id === activeCategory)?.products.map((p: any) => (
                        <div key={p.id} onClick={() => handleProductClick(p)} className="bg-white p-6 rounded-[2rem] border border-surface-container-high hover:border-primary cursor-pointer transition-all text-center group shadow-sm">
                          <div className="w-16 h-16 bg-surface-container-low rounded-full mx-auto mb-4 flex items-center justify-center text-primary/20 group-hover:bg-primary group-hover:text-white transition-all duration-500"><Utensils size={24}/></div>
                          <h5 className="font-bold text-primary text-sm mb-1">{p.name}</h5>
                          <p className="text-secondary font-black text-xs">₹{p.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-[380px] bg-white border-l border-surface-container-high flex flex-col">
                    <div className="p-10 border-b border-surface-container-low flex justify-between items-center bg-surface-container-low/30 text-center uppercase tracking-tighter">
                      <h4 className="text-xl font-black text-primary flex items-center gap-2 italic"><ShoppingBag size={20}/> New Ticket</h4>
                      <button onClick={() => setShowPOSModal(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-outline shadow-sm hover:text-error transition-all"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 italic font-black uppercase text-xs tracking-widest text-center px-4 leading-relaxed">Ready for selection</div>
                      ) : (
                        cart.map(item => (
                          <div key={item.productId} className="flex justify-between items-center group animate-fade-in gap-4 bg-surface-container-low/20 p-4 rounded-2xl hover:bg-surface-container-low transition-all">
                            <div className="flex-1 flex flex-col gap-1">
                              <h5 className="font-bold text-primary text-sm tracking-tight">{item.productName}</h5>
                              <div className="flex items-center gap-2"><span className="text-[8px] font-black text-secondary uppercase tracking-widest">₹{item.price} each</span><div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black">{item.quantity}</div></div>
                            </div>
                            <button 
                              onClick={() => removeFromModalCart(item.productId)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-outline/30 hover:text-error hover:shadow-lg transition-all border border-transparent hover:border-error/10"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-10 bg-surface-container-low/50 space-y-6 border-t border-surface-container-high">
                      {/* Numpad Display */}
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">Next Item Qty</span>
                        <span className="text-xl font-black text-primary italic">{numpadValue || '1'}</span>
                      </div>

                      {/* Numpad Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {['1', '2', '3', '⌫', '4', '5', '6', 'C', '7', '8', '9', '0'].map(btn => (
                          <button 
                            key={btn} 
                            onClick={() => handleNumpadClick(btn)}
                            className={`h-10 rounded-xl font-black text-sm flex items-center justify-center transition-all active:scale-95
                              ${btn === '⌫' || btn === 'C' ? 'bg-surface-container-high text-primary' : 'bg-white text-primary shadow-sm border border-surface-container-high hover:border-primary'}`}
                          >
                            {btn === '⌫' ? <span className="material-symbols-outlined text-base">backspace</span> : btn}
                          </button>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-2xl font-black text-primary pt-4 tracking-tighter italic">
                        <span className="uppercase text-[10px] font-black tracking-[0.2em] not-italic">New Total</span>
                        <span className="text-secondary">₹{(cart.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.05).toFixed(2)}</span>
                      </div>
                      <button onClick={handlePushToKitchen} disabled={cart.length === 0 || isPlacing} className="w-full bg-primary text-on-primary py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 transition-all disabled:opacity-20 active:scale-95">{isPlacing ? 'Syncing...' : 'Push to Kitchen'}</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 gap-10 bg-surface-container-low/10">
                  <div className="text-center">
                    <h3 className="text-4xl font-black text-primary tracking-tighter italic uppercase">Payment Hub</h3>
                    <p className="text-outline font-black text-[10px] uppercase tracking-[0.4em] mt-2">Settle Table T{showPOSModal.tableNumber}</p>
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-surface-container-high flex items-center gap-10">
                     <div className="text-left">
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Amount to Pay</p>
                        <h4 className="text-5xl font-black text-primary tracking-tighter">₹{(showPOSModal.activeTotal > 0 && cart.length === 0 ? showPOSModal.activeTotal : (cart.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.05)).toFixed(2)}</h4>
                     </div>
                     <div className="w-px h-16 bg-surface-container-high"></div>
                     <span className="material-symbols-outlined text-secondary text-5xl">receipt_long</span>
                  </div>
                  <div className="grid grid-cols-3 gap-8 w-full max-w-3xl">
                    <button onClick={() => handlePay('CASH')} className="bg-white p-10 rounded-[3rem] border border-surface-container-high hover:border-emerald-500 transition-all group flex flex-col items-center gap-4 shadow-sm hover:shadow-xl"><div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all"><Wallet size={32}/></div><span className="font-black text-[10px] uppercase tracking-widest">Cash</span></button>
                    <button onClick={() => handlePay('CARD')} className="bg-white p-10 rounded-[3rem] border border-surface-container-high hover:border-indigo-500 transition-all group flex flex-col items-center gap-4 shadow-sm hover:shadow-xl"><div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all"><CreditCard size={32}/></div><span className="font-black text-[10px] uppercase tracking-widest">Card</span></button>
                    <button onClick={() => setShowUPI(true)} className="bg-white p-10 rounded-[3rem] border border-surface-container-high hover:border-secondary transition-all group flex flex-col items-center gap-4 shadow-sm hover:shadow-xl"><div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-3xl flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all"><QrCode size={32}/></div><span className="font-black text-[10px] uppercase tracking-widest">UPI QR</span></button>
                  </div>
                  <button onClick={() => setShowPOSModal(null)} className="text-outline font-black text-[10px] uppercase tracking-widest mt-10 hover:text-primary transition-all underline underline-offset-8 decoration-2">Close Without Paying</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Variant Selector Modal */}
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

        {showUPI && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-primary/40 backdrop-blur-xl z-[130] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[4rem] p-16 text-center shadow-2xl max-w-sm w-full">
              <h4 className="text-2xl font-black text-primary tracking-tighter italic uppercase mb-8">Scan to Pay</h4>
              <div className="bg-surface-container-low p-8 rounded-[3rem] inline-block mb-10 border border-surface-container-high">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=cafe@ybl&am=100&cu=INR`)}`} alt="QR" className="w-48 h-48 mix-blend-multiply opacity-80" />
              </div>
              <button onClick={() => handlePay('UPI')} className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">Confirmed</button>
              <button onClick={() => setShowUPI(false)} className="mt-6 text-outline font-black text-[10px] uppercase tracking-widest">Cancel</button>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-emerald-500 z-[200] flex flex-col items-center justify-center text-white cursor-pointer" onClick={() => setShowSuccess(false)}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}><CheckCircle size={150} strokeWidth={3} className="mb-10" /></motion.div>
            <h2 className="text-6xl font-black tracking-tighter mb-4 text-center">Success!</h2>
            <p className="text-xl font-bold opacity-80 uppercase tracking-widest italic">Order finalized & table released</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloorPlan;
