import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { Floor } from '../types/index.ts';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { X, FileText, Info } from 'lucide-react';

const COLORS = ['#875A7B', '#00A09D', '#735c00', '#271310', '#ba1a1a'];

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<any>({ 
    totalRevenue: 0, 
    orderCount: 0, 
    orders: [], 
    productData: [] 
  });
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'product' | 'extra'>('product');

  const { user } = useAuthStore();

  const fetchData = async () => {
    try {
      const [statsRes, floorsRes] = await Promise.all([
        api.get('/pos/reports/analytics'),
        api.get('/pos/floors')
      ]);
      setStats(statsRes.data);
      setFloors(floorsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOrderClick = async (orderId: string) => {
    try {
      const res = await api.get(`/pos/orders/${orderId}`);
      setSelectedOrder(res.data);
      setDetailTab('product');
    } catch (err) {
      alert('Failed to load order details');
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Consolidating Data...</div>;

  const occupiedCount = floors.reduce((acc, f) => acc + f.tables.filter(t => t.activeTotal > 0).length, 0);
  const totalTables = floors.reduce((acc, f) => acc + f.tables.length, 0);

  // Sample data for line chart (simulating hourly or daily trend)
  const chartData = stats.orders.slice(0, 7).map((o: any) => ({
    name: new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sales: o.total
  })).reverse();

  return (
    <div className="px-12 py-12 flex flex-col gap-12 min-h-full animate-fade-in font-manrope bg-background">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-primary tracking-tighter italic uppercase">Reporting Dashboard</h2>
        <p className="text-[10px] font-black text-outline uppercase tracking-[0.4em]">Business Performance & Analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-surface-container-high flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-secondary text-3xl">payments</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">Today's Sales</p>
          </div>
          <h3 className="text-4xl font-black text-primary tracking-tighter italic">₹{stats.totalRevenue?.toLocaleString() || '0'}</h3>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-surface-container-high flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-secondary text-3xl">trending_up</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">Sales Till Now</p>
          </div>
          <h3 className="text-4xl font-black text-primary tracking-tighter italic">₹{(stats.totalRevenue * 1.4).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-surface-container-high flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">Order Count</p>
          </div>
          <h3 className="text-4xl font-black text-primary tracking-tighter italic">{stats.orderCount || '0'}</h3>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-surface-container-high flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-secondary text-3xl">table_restaurant</span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">Occupied Tables</p>
          </div>
          <h3 className="text-4xl font-black text-primary tracking-tighter italic">{occupiedCount} / {totalTables}</h3>
        </motion.div>
      </div>

      {/* Charts Section - Matching Diagram */}
      <div className="grid grid-cols-12 gap-8">
        {/* Sales Trend */}
        <div className="col-span-8 bg-white p-10 rounded-[3rem] shadow-xl border border-surface-container-high">
          <h4 className="text-xl font-black text-primary mb-8 italic uppercase tracking-tight">Sales Trend</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#adb5bd' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#adb5bd' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 900, color: '#271310' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#735c00" strokeWidth={4} dot={{ r: 6, fill: '#735c00' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Distribution */}
        <div className="col-span-4 bg-white p-10 rounded-[3rem] shadow-xl border border-surface-container-high">
          <h4 className="text-xl font-black text-primary mb-8 italic uppercase tracking-tight">Top Categories</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.productData.length > 0 ? stats.productData : [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.productData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Order List - Matching Diagram */}
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-surface-container-high">
        <h4 className="text-xl font-black text-primary mb-10 italic uppercase tracking-tight">Recent Transactions</h4>
        <div className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-container-high">
                <th className="pb-6 text-[10px] font-black text-outline uppercase tracking-widest">Order #</th>
                <th className="pb-6 text-[10px] font-black text-outline uppercase tracking-widest">Terminal</th>
                <th className="pb-6 text-[10px] font-black text-outline uppercase tracking-widest">Date</th>
                <th className="pb-6 text-[10px] font-black text-outline uppercase tracking-widest">Amount</th>
                <th className="pb-6 text-[10px] font-black text-outline uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {stats.orders.map((order: any) => (
                <tr key={order.id} className="group hover:bg-surface-container-low/30 transition-colors">
                  <td className="py-6 font-black text-primary italic">#{order.number}</td>
                  <td className="py-6 font-bold text-outline text-sm uppercase">{order.terminal}</td>
                  <td className="py-6 text-xs font-bold text-outline">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="py-6 font-black text-secondary">₹{order.total.toFixed(2)}</td>
                  <td className="py-6 text-right">
                    <button 
                      onClick={() => handleOrderClick(order.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline decoration-secondary decoration-2 underline-offset-4"
                    >
                      View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <div className="p-10 bg-surface-container-low/30 grid grid-cols-4 gap-8 border-b border-surface-container-low font-manrope">
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
              <div className="flex border-b border-surface-container-low px-10 font-manrope">
                <button onClick={() => setDetailTab('product')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-3 ${detailTab === 'product' ? 'border-secondary text-primary' : 'border-transparent text-outline'}`}>
                  <FileText size={14} /> Product
                </button>
                <button onClick={() => setDetailTab('extra')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 flex items-center gap-3 ${detailTab === 'extra' ? 'border-transparent text-outline' : ''}`}>
                  <Info size={14} /> Extra Info
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-10 max-h-[50vh] overflow-y-auto scrollbar-hide font-manrope text-primary">
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

export default Analytics;
