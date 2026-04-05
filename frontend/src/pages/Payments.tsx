import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Check, Search, Filter, Equal } from 'lucide-react';
import api from '../services/api';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMethods, setExpandedMethods] = useState<string[]>(['CASH', 'CARD', 'UPI']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const fetchPayments = async () => {
    try {
      // We'll create this endpoint or use existing reports
      const res = await api.get('/pos/payments');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const toggleMethod = (method: string) => {
    setExpandedMethods(prev => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const togglePaymentSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayments(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const groupedPayments = payments.reduce((acc: any, payment: any) => {
    const method = payment.method || 'OTHER';
    if (!acc[method]) acc[method] = { items: [], total: 0 };
    acc[method].items.push(payment);
    acc[method].total += payment.amount;
    return acc;
  }, {});

  const filteredMethods = Object.keys(groupedPayments).filter(method => 
    method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    groupedPayments[method].items.some((p: any) => 
      p.order?.orderNumber?.toString().includes(searchTerm) ||
      p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Loading Payments...</div>;

  return (
    <div className="px-12 py-12 flex flex-col gap-10 animate-fade-in font-manrope bg-background min-h-full">
      <div className="flex justify-between items-end">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-4xl font-black text-primary tracking-tighter italic uppercase">Payments</h2>
              <button className="text-primary hover:bg-surface-container-low p-2 rounded-xl transition-colors">
                <Equal size={24} strokeWidth={3} />
              </button>
            </div>
            <p className="text-[10px] font-black text-outline uppercase tracking-[0.4em] mt-2">Back-end View • Grouped by Method</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm border border-surface-container-high w-80">
              <Search size={18} className="text-outline" />
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-outline/50"
              />
            </div>
            <button className="bg-white p-3 rounded-2xl border border-surface-container-high shadow-sm text-primary hover:bg-surface-container-low transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-surface-container-high overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-10 py-6 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high w-1/2">Payment Method</th>
              <th className="px-10 py-6 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Date</th>
              <th className="px-10 py-6 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {filteredMethods.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-20 text-center text-outline font-bold uppercase tracking-widest opacity-50">No payments found</td>
              </tr>
            ) : filteredMethods.map((method) => (
              <React.Fragment key={method}>
                {/* Group Header */}
                <tr 
                  className="bg-surface-container-low/30 cursor-pointer hover:bg-surface-container-low/50 transition-colors group"
                  onClick={() => toggleMethod(method)}
                >
                  <td className="px-10 py-5 flex items-center gap-4">
                    <div className="text-primary transition-transform duration-300">
                      {expandedMethods.includes(method) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <span className="font-black text-primary italic uppercase tracking-tight text-lg">{method}</span>
                  </td>
                  <td className="px-10 py-5"></td>
                  <td className="px-10 py-5 text-right font-black text-primary text-lg">
                    ₹{groupedPayments[method].total.toLocaleString()}
                  </td>
                </tr>

                {/* Group Items */}
                <AnimatePresence>
                  {expandedMethods.includes(method) && groupedPayments[method].items.map((payment: any) => {
                    const isSelected = selectedPayments.includes(payment.id);
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        key={payment.id} 
                        className={`group hover:bg-surface-container-low/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                      >
                        <td className="px-16 py-4">
                          <div className="flex items-center gap-4">
                            <div 
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/30 text-transparent group-hover:border-primary/50'}`}
                              onClick={(e) => togglePaymentSelection(payment.id, e)}
                            >
                              <Check size={12} strokeWidth={4} className={isSelected ? 'text-secondary' : 'text-transparent'} />
                            </div>
                            <span className="font-bold text-outline text-sm uppercase">Order #{payment.order?.orderNumber || 'N/A'}</span>
                            {payment.transactionId && (
                              <span className="text-[10px] font-black text-outline/40 uppercase tracking-tighter">ID: {payment.transactionId}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-4 text-xs font-bold text-outline uppercase">
                          {new Date(payment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-10 py-4 text-right font-black text-secondary">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-4 mt-4">
        <div className="bg-primary text-white px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/20 flex flex-col items-end">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Total Consolidated</p>
          <h4 className="text-3xl font-black italic tracking-tighter">₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</h4>
        </div>
      </div>
    </div>
  );
};

export default Payments;
