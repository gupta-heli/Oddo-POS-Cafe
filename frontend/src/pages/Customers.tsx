import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, Mail, Phone, MapPin, ChevronDown, Plus, Equal, LayoutGrid, List } from 'lucide-react';
import api from '../services/api';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi"
];

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    country: ''
  });

  // Autocomplete state
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [filteredStates, setFilteredStates] = useState<string[]>([]);
  const stateInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/pos/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await api.post('/pos/customers', formData);
      setFormData({
        name: '', email: '', phone: '', street1: '', street2: '', city: '', state: '', country: ''
      });
      setShowNewForm(false);
      fetchCustomers();
    } catch (err) {
      alert('Failed to create customer');
    }
  };

  const handleStateChange = (val: string) => {
    setFormData({ ...formData, state: val });
    if (val) {
      const matches = INDIAN_STATES.filter(s => s.toLowerCase().includes(val.toLowerCase()));
      setFilteredStates(matches);
      setShowStateDropdown(matches.length > 0);
    } else {
      setShowStateDropdown(false);
    }
  };

  const selectState = (state: string) => {
    setFormData({ ...formData, state });
    setShowStateDropdown(false);
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Loading Customers...</div>;

  return (
    <div className="px-12 py-12 flex flex-col gap-10 animate-fade-in font-manrope bg-background min-h-full">
      <div className="flex justify-between items-end">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowNewForm(!showNewForm)}
              className="bg-[#D1B3C4] text-[#4A2E3B] px-6 py-2 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              New
            </button>
            <h2 className="text-3xl font-black text-primary tracking-tighter italic uppercase">Customer</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-2 rounded-full flex items-center gap-3 shadow-sm border border-surface-container-high w-64">
              <Search size={16} className="text-outline" />
              <input 
                type="text" 
                placeholder="Search Customer......"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold w-full placeholder:text-outline/50"
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

      <div className="bg-white rounded-[3rem] shadow-2xl border border-surface-container-high overflow-hidden p-8">
        <AnimatePresence mode="wait">
          {!showNewForm ? (
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {viewMode === 'list' ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Contact</th>
                      <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-20 text-center text-outline font-bold uppercase tracking-widest opacity-50">No customers found</td>
                      </tr>
                    ) : filteredCustomers.map((customer) => {
                      const isSelected = selectedCustomers.includes(customer.id);
                      return (
                        <tr 
                          key={customer.id} 
                          className={`group hover:bg-surface-container-low/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div 
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/30 text-transparent group-hover:border-primary/50'}`}
                                onClick={(e) => toggleSelection(customer.id, e)}
                              >
                                <Check size={12} strokeWidth={4} className={isSelected ? 'text-secondary' : 'text-transparent'} />
                              </div>
                              <span className="font-black text-primary text-sm tracking-tight">{customer.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">
                              {customer.email && (
                                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                  <div className="w-5 h-5 bg-surface-container-low rounded flex items-center justify-center text-[#7C5A6A]">
                                    <Mail size={12} />
                                  </div>
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                  <div className="w-5 h-5 bg-surface-container-low rounded flex items-center justify-center text-[#7C5A6A]">
                                    <Phone size={12} />
                                  </div>
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-primary italic">
                            ${customer.totalSales?.toLocaleString() || '0'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomers.includes(customer.id);
                    return (
                      <motion.div 
                        key={customer.id}
                        whileHover={{ y: -5 }}
                        className={`bg-white p-8 rounded-[2.5rem] border shadow-xl relative group transition-all ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-surface-container-high'}`}
                      >
                        <div 
                          className={`absolute top-6 left-6 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/20 text-transparent group-hover:border-primary/30'}`}
                          onClick={(e) => toggleSelection(customer.id, e)}
                        >
                          <Check size={14} strokeWidth={4} className={isSelected ? 'text-secondary' : 'text-transparent'} />
                        </div>

                        <div className="mt-8 space-y-6">
                          <div>
                            <h3 className="text-2xl font-black text-primary italic uppercase tracking-tighter">{customer.name}</h3>
                            <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mt-1">Customer Record</p>
                          </div>

                          <div className="space-y-3">
                            {customer.email && (
                              <div className="flex items-center gap-3 text-xs font-bold text-outline uppercase tracking-wider">
                                <Mail size={14} className="text-[#7C5A6A]" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-3 text-xs font-bold text-outline uppercase tracking-wider">
                                <Phone size={14} className="text-[#7C5A6A]" />
                                {customer.phone}
                              </div>
                            )}
                            {(customer.city || customer.state) && (
                              <div className="flex items-center gap-3 text-xs font-bold text-outline uppercase tracking-wider">
                                <MapPin size={14} className="text-[#7C5A6A]" />
                                {customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}
                              </div>
                            )}
                          </div>

                          <div className="pt-6 border-t border-surface-container-low flex justify-between items-end">
                            <div>
                              <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Lifetime Value</p>
                              <p className="text-2xl font-black text-secondary italic tracking-tighter">${customer.totalSales?.toLocaleString() || '0'}</p>
                            </div>
                            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Details</button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-8 max-w-2xl"
            >
              <form onSubmit={handleCreateCustomer} className="space-y-10">
                <div className="space-y-6">
                  <div>
                    <input 
                      type="text" 
                      placeholder="e.g Eric Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-transparent border-b border-surface-container-high w-full py-2 text-primary font-bold outline-none focus:border-primary transition-colors placeholder:text-outline/50"
                      required
                    />
                  </div>

                  <div className="space-y-4 w-2/3">
                    <div className="flex items-center gap-4 border-b border-surface-container-high py-2 focus-within:border-primary transition-colors">
                      <div className="w-6 h-6 bg-surface-container-low rounded flex items-center justify-center text-[#7C5A6A]">
                        <Mail size={14} />
                      </div>
                      <input 
                        type="email" 
                        placeholder="eric@odoo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="bg-transparent border-none outline-none w-full text-primary font-bold text-sm placeholder:text-outline/50"
                      />
                    </div>
                    <div className="flex items-center gap-4 border-b border-surface-container-high py-2 focus-within:border-primary transition-colors">
                      <div className="w-6 h-6 bg-surface-container-low rounded flex items-center justify-center text-[#7C5A6A]">
                        <Phone size={14} />
                      </div>
                      <input 
                        type="tel" 
                        placeholder="+91 9898989898"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="bg-transparent border-none outline-none w-full text-primary font-bold text-sm placeholder:text-outline/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline w-16">St, 1</span>
                    <input 
                      type="text" 
                      value={formData.street1}
                      onChange={(e) => setFormData({...formData, street1: e.target.value})}
                      className="bg-transparent border-b border-dashed border-outline/50 flex-1 py-1 text-primary font-bold outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline w-16">St, 2</span>
                    <input 
                      type="text" 
                      value={formData.street2}
                      onChange={(e) => setFormData({...formData, street2: e.target.value})}
                      className="bg-transparent border-b border-dashed border-outline/50 flex-1 py-1 text-primary font-bold outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="flex gap-12">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-outline">City</span>
                      <input 
                        type="text" 
                        placeholder="Gandhinagar"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="bg-transparent border-b border-dashed border-outline/50 flex-1 py-1 text-primary font-bold outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-4 flex-1 relative">
                      <span className="text-[10px] font-black uppercase tracking-widest text-outline">State</span>
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          ref={stateInputRef}
                          placeholder="Gujarat"
                          value={formData.state}
                          onChange={(e) => handleStateChange(e.target.value)}
                          onFocus={() => formData.state && handleStateChange(formData.state)}
                          onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
                          className="bg-transparent border-b border-dashed border-outline/50 w-full py-1 text-primary font-bold outline-none focus:border-primary transition-colors pr-6"
                        />
                        <ChevronDown size={14} className="absolute right-0 bottom-2 text-outline pointer-events-none" />
                        
                        {/* State Autocomplete Dropdown */}
                        <AnimatePresence>
                          {showStateDropdown && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute left-0 right-0 top-full mt-2 bg-white border border-surface-container-high rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto"
                            >
                              {filteredStates.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => selectState(s)}
                                  className="w-full text-left px-6 py-3 text-xs font-bold text-primary hover:bg-surface-container-low transition-colors border-b border-surface-container-low last:border-none"
                                >
                                  {s}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-1/2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline">Country</span>
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="India"
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="bg-transparent border-b border-dashed border-outline/50 w-full py-1 text-primary font-bold outline-none focus:border-primary transition-colors pr-6"
                      />
                      <ChevronDown size={14} className="absolute right-0 bottom-2 text-outline pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 border-t border-surface-container-high">
                  <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                    Save Customer
                  </button>
                  <button type="button" onClick={() => setShowNewForm(false)} className="bg-surface-container-low text-primary px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container transition-all">
                    Discard
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Customers;
