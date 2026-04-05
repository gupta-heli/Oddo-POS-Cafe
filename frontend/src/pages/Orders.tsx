import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Check, Search, ChevronDown, Archive, Trash2, X, FileText, Info, Equal, MoreVertical, LayoutGrid, Calendar, User, CreditCard } from 'lucide-react';
import api from '../services/api';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'product' | 'extra'>('product');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/pos/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update search term if URL param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);

  const handleOrderClick = async (orderId: string) => {
    try {
      const res = await api.get(`/pos/orders/${orderId}`);
      setSelectedOrder(res.data);
      setDetailTab('product');
    } catch (err) {
      alert('Failed to load order details');
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`${action === 'archive' ? 'Archive' : 'Delete'} ${selectedIds.length} orders?`)) {
      try {
        for (const id of selectedIds) {
          if (action === 'archive') await api.patch(`/pos/orders/${id}/archive`);
          if (action === 'delete') {
            const order = orders.find(o => o.id === id);
            if (order?.status === 'CREATED') {
              await api.delete(`/pos/orders/${id}`);
            }
          }
        }
        setSelectedIds([]);
        setShowActionMenu(false);
        fetchOrders();
      } catch (err) {
        alert('Bulk action failed');
      }
    }
  };

  const filteredOrders = orders.filter(o => {
    const search = searchTerm.toLowerCase();
    const formattedNum = o.orderNumber.toString().padStart(3, '0');
    return (
      formattedNum.includes(search) ||
      o.orderNumber.toString().includes(search) ||
      o.customer?.name?.toLowerCase().includes(search) ||
      o.paymentMethod?.toLowerCase().includes(search)
    );
  });

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Syncing Orders...</div>;

  return (
    <div className="px-12 py-12 flex flex-col gap-10 animate-fade-in font-manrope bg-background min-h-full">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-black text-primary tracking-tighter italic uppercase">Orders</h2>
            <p className="text-[10px] font-black text-outline uppercase tracking-[0.4em]">Back-end View • Manage Status & Lifecycle</p>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedIds.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg"
                >
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[8px]">{selectedIds.length} Selected</span>
                  * Action <ChevronDown size={14} />
                </button>
                <AnimatePresence>
                  {showActionMenu && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 bg-white border border-surface-container-high rounded-2xl shadow-2xl z-50 w-48 overflow-hidden">
                      <button onClick={() => handleBulkAction('archive')} className="w-full text-left px-6 py-4 text-xs font-bold text-primary hover:bg-surface-container-low flex items-center gap-3 border-b border-surface-container-low">
                        <Archive size={14} className="text-secondary" /> Archived
                      </button>
                      <button onClick={() => handleBulkAction('delete')} className="w-full text-left px-6 py-4 text-xs font-bold text-error hover:bg-error/5 flex items-center gap-3">
                        <Trash2 size={14} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="bg-white px-6 py-2.5 rounded-full flex items-center gap-4 shadow-inner border border-surface-container-high w-80">
              <Search size={18} className="text-outline" />
              <input 
                type="text" 
                placeholder="Search orders..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="bg-transparent border-none outline-none font-bold text-primary w-full text-xs placeholder:text-outline/30" 
              />
            </div>
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'text-primary bg-surface-container-low' : 'text-secondary bg-primary shadow-lg'}`}
              title={viewMode === 'list' ? "Switch to Grid View" : "Switch to List View"}
            >
              {viewMode === 'list' ? <Equal size={24} strokeWidth={3} /> : <LayoutGrid size={24} strokeWidth={3} />}
            </button>
          </div>
        </div>
      </div>

      {/* LIST/GRID VIEW */}
      <div className={`${viewMode === 'list' ? 'bg-white rounded-[3rem] shadow-2xl border border-surface-container-high overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Order No</th>
                    <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Session</th>
                    <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Total</th>
                    <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Customer</th>
                    <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-outline font-bold uppercase tracking-widest opacity-50">No orders found</td>
                    </tr>
                  ) : filteredOrders.map((order) => {
                    const isSelected = selectedIds.includes(order.id);
                    const isPaid = order.status === 'COMPLETED';
                    
                    return (
                      <tr 
                        key={order.id} 
                        onClick={() => handleOrderClick(order.id)}
                        className={`group hover:bg-surface-container-low/20 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div 
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/30 text-transparent group-hover:border-primary/50'}`}
                              onClick={(e) => toggleSelection(order.id, e)}
                            >
                              <Check size={12} strokeWidth={4} />
                            </div>
                            <span className="font-black text-primary italic text-sm">#{order.orderNumber.toString().padStart(3, '0')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 font-black text-outline text-xs uppercase">{order.session?.terminal?.name || '01'}</td>
                        <td className="px-8 py-5 text-xs font-bold text-outline uppercase">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-5 font-black text-primary italic text-sm">₹{order.totalAmount.toLocaleString()}</td>
                        <td className="px-8 py-5 font-bold text-primary text-xs uppercase">{order.customer?.name || 'Walk-in'}</td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${isPaid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {isPaid ? 'Paid' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredOrders.length === 0 ? (
                <div className="col-span-full py-20 text-center text-outline font-bold uppercase tracking-widest opacity-50">No orders found</div>
              ) : filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                const isPaid = order.status === 'COMPLETED';
                
                return (
                  <motion.div 
                    key={order.id}
                    whileHover={{ y: -5 }}
                    onClick={() => handleOrderClick(order.id)}
                    className={`bg-white p-8 rounded-[2.5rem] border shadow-xl relative group transition-all cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-surface-container-high'}`}
                  >
                    <div 
                      className={`absolute top-6 left-6 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/20 text-transparent group-hover:border-primary/30'}`}
                      onClick={(e) => toggleSelection(order.id, e)}
                    >
                      <Check size={14} strokeWidth={4} />
                    </div>

                    <div className="mt-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black text-primary italic uppercase tracking-tighter">Order #{order.orderNumber.toString().padStart(3, '0')}</h3>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm ${isPaid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {isPaid ? 'Paid' : 'Draft'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Session</p>
                          <p className="font-bold text-primary text-xs uppercase">{order.session?.terminal?.name || '01'}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs font-bold text-outline uppercase tracking-wider">
                          <User size={14} className="text-secondary" />
                          {order.customer?.name || 'Walk-in'}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-outline uppercase tracking-wider">
                          <Calendar size={14} className="text-secondary" />
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {order.paymentMethod && (
                          <div className="flex items-center gap-3 text-xs font-bold text-outline uppercase tracking-wider">
                            <CreditCard size={14} className="text-secondary" />
                            {order.paymentMethod}
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-surface-container-low flex justify-between items-end">
                        <div>
                          <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Total Amount</p>
                          <p className="text-2xl font-black text-primary italic tracking-tighter">₹{order.totalAmount.toLocaleString()}</p>
                        </div>
                        <button className="text-[10px] font-black text-secondary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">View Detail</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3.5rem] shadow-2xl border border-surface-container-high max-w-4xl w-full overflow-hidden">
              {/* Modal Header */}
              <div className="bg-primary p-10 flex justify-between items-center text-white">
                <div className="flex items-center gap-8">
                  <div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Order #{selectedOrder.orderNumber.toString().padStart(3, '0')}</h3>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex border border-white/20 rounded-xl overflow-hidden">
                    <button className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedOrder.status === 'CREATED' ? 'bg-secondary text-primary' : 'bg-transparent text-white/60'}`}>Draft</button>
                    <button className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedOrder.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-transparent text-white/60'}`}>Paid</button>
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={24}/></button>
              </div>

              {/* Info Header Area */}
              <div className="p-10 bg-surface-container-low/30 grid grid-cols-4 gap-8 border-b border-surface-container-low">
                <div>
                  <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Order number</p>
                  <p className="font-bold text-primary text-sm">#{selectedOrder.orderNumber.toString().padStart(3, '0')}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Date</p>
                  <p className="font-bold text-primary text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Session</p>
                  <p className="font-bold text-primary text-sm">{selectedOrder.session?.terminal?.name || '01'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Customer</p>
                  <p className="font-bold text-secondary text-sm italic">{selectedOrder.customer?.name || 'Walk-in'}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-surface-container-low px-10">
                <button onClick={() => setDetailTab('product')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-3 ${detailTab === 'product' ? 'border-secondary text-primary' : 'border-transparent text-outline'}`}>
                  <FileText size={14} /> Product
                </button>
                <button onClick={() => setDetailTab('extra')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-3 ${detailTab === 'extra' ? 'border-transparent text-outline' : ''}`}>
                  <Info size={14} /> Extra Info
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-10 max-h-[50vh] overflow-y-auto scrollbar-hide">
                {detailTab === 'product' ? (
                  <div className="space-y-8">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-surface-container-low">
                          <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">Product</th>
                          <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">QTY</th>
                          <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">Amount</th>
                          <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">Tax</th>
                          <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low">
                        {selectedOrder.items?.map((item: any) => (
                          <tr key={item.id}>
                            <td className="py-4">
                              <span className="font-bold text-blue-600 hover:underline cursor-pointer italic">{item.product?.name} --&gt;</span>
                            </td>
                            <td className="py-4 font-black text-primary text-sm">{item.quantity}</td>
                            <td className="py-4 font-bold text-outline text-sm">₹{item.price.toLocaleString()}</td>
                            <td className="py-4 font-bold text-outline text-xs">{item.product?.tax || 5}%</td>
                            <td className="py-4 text-right font-black text-primary text-sm">₹{(item.price * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex flex-col items-end gap-2 pt-8 border-t border-surface-container-low">
                      <div className="flex justify-between w-64 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-outline">Total w/t:</span>
                        <span className="text-primary">₹{(selectedOrder.totalAmount * 0.95).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between w-64 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-outline">Tax:</span>
                        <span className="text-primary">₹{(selectedOrder.totalAmount * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between w-64 text-xl font-black italic uppercase tracking-tighter pt-4 border-t border-surface-container-low mt-2">
                        <span className="text-primary">Final Total:</span>
                        <span className="text-secondary">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-surface-container-low p-8 rounded-3xl space-y-4">
                      <h4 className="text-xs font-black text-primary uppercase tracking-widest italic">Order Notes</h4>
                      <p className="text-sm font-bold text-outline leading-relaxed">{selectedOrder.notes || 'No special instructions provided for this order.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-surface-container-low p-8 rounded-3xl">
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest italic mb-4">Payment Method</h4>
                        <p className="text-sm font-bold text-secondary uppercase tracking-widest">{selectedOrder.paymentMethod || 'PENDING'}</p>
                      </div>
                      <div className="bg-surface-container-low p-8 rounded-3xl">
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest italic mb-4">Order Type</h4>
                        <p className="text-sm font-bold text-outline uppercase tracking-widest">{selectedOrder.orderType || 'DINE IN'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
