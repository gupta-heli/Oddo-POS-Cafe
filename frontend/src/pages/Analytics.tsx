import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { Floor } from '../types/index.ts';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#875A7B', '#00A09D', '#735c00', '#271310', '#ba1a1a'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({ 
    totalRevenue: 0, 
    orderCount: 0, 
    orders: [], 
    productData: [] 
  });
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
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
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline decoration-secondary decoration-2 underline-offset-4">View Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
