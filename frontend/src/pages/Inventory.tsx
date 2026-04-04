import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, Layers, Coffee, X, Check } from 'lucide-react';

const Inventory: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'category'>('product');
  
  // Refined Form Data
  const [formData, setFormData] = useState<any>({ 
    name: '', 
    price: '', 
    categoryId: '', 
    unit: 'pcs', 
    sendToKitchen: true 
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/pos/products');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'product') {
        const payload = {
          name: formData.name,
          price: parseFloat(formData.price),
          categoryId: formData.categoryId,
          unit: formData.unit || 'pcs'
        };
        await api.post('/pos/products', payload);
      } else {
        const payload = {
          name: formData.name,
          sendToKitchen: formData.sendToKitchen,
          icon: 'category'
        };
        await api.post('/pos/categories', payload);
      }
      setShowModal(false);
      setFormData({ name: '', price: '', categoryId: '', unit: 'pcs', sendToKitchen: true });
      fetchData();
    } catch (err) {
      alert("Failed to save. Ensure Category is selected and Name is provided.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      await api.delete(`/pos/products/${id}`);
      fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const allProducts = categories.flatMap(c => c.products.map((p: any) => ({ ...p, categoryName: c.name })));
  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse">Loading Catalog...</div>;

  return (
    <div className="px-12 py-12 flex flex-col gap-10 min-h-full animate-fade-in font-manrope">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black text-primary tracking-tighter italic uppercase">Master Catalog</h2>
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.4em]">Inventory & Product Management</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-full shadow-sm border border-surface-container-high">
          <button onClick={() => setActiveTab('products')} className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'}`}>Products</button>
          <button onClick={() => setActiveTab('categories')} className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-primary text-white shadow-lg' : 'text-outline hover:text-primary'}`}>Categories</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-surface-container-high overflow-hidden flex flex-col flex-1">
        <div className="p-8 border-b border-surface-container-low flex justify-between items-center bg-surface-container-low/30">
          <div className="bg-white px-6 py-3 rounded-full flex items-center gap-4 shadow-inner border border-surface-container-high w-96">
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none font-bold text-primary w-full text-sm placeholder:text-outline/30" />
          </div>
          <button 
            onClick={() => { setModalType(activeTab === 'products' ? 'product' : 'category'); setShowModal(true); }}
            className="btn-primary-elegant flex items-center gap-3"
          >
            <Plus size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Create {activeTab === 'products' ? 'Product' : 'Category'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'products' ? (
              <motion.div key="prod-list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="px-6 text-[10px] font-black text-outline uppercase tracking-widest">Product Info</th>
                      <th className="px-6 text-[10px] font-black text-outline uppercase tracking-widest">Category</th>
                      <th className="px-6 text-[10px] font-black text-outline uppercase tracking-widest">Price</th>
                      <th className="px-6 text-[10px] font-black text-outline uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p: any) => (
                      <tr key={p.id} className="group transition-all">
                        <td className="bg-surface-container-low/50 px-6 py-5 rounded-l-3xl border-y border-l border-surface-container-high group-hover:bg-surface-container-low transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-surface-container-high">
                              <Coffee size={20} />
                            </div>
                            <span className="font-black text-primary italic">{p.name}</span>
                          </div>
                        </td>
                        <td className="bg-surface-container-low/50 px-6 py-5 border-y border-surface-container-high group-hover:bg-surface-container-low transition-colors">
                          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{p.categoryName}</span>
                        </td>
                        <td className="bg-surface-container-low/50 px-6 py-5 border-y border-surface-container-high group-hover:bg-surface-container-low transition-colors">
                          <span className="font-black text-primary">₹{p.price.toFixed(2)}</span>
                        </td>
                        <td className="bg-surface-container-low/50 px-6 py-5 rounded-r-3xl border-y border-r border-surface-container-high group-hover:bg-surface-container-low transition-colors text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDeleteProduct(p.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-error hover:bg-error hover:text-white shadow-sm transition-all"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.div key="cat-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="bg-surface-container-low/50 p-8 rounded-[2.5rem] border border-surface-container-high group hover:bg-white transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-secondary shadow-sm border border-surface-container-high group-hover:bg-secondary group-hover:text-white transition-all">
                        <Layers size={24} />
                      </div>
                      <span className="text-[10px] font-black text-outline uppercase tracking-widest">{cat.products?.length || 0} Products</span>
                    </div>
                    <h4 className="text-xl font-black text-primary italic uppercase mb-2">{cat.name}</h4>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Kitchen: {cat.sendToKitchen ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl border border-surface-container-high relative">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-primary tracking-tight italic uppercase">New {modalType}</h3>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-outline"><X size={20}/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2 ml-2">Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10" placeholder="Enter name..." />
                </div>

                {modalType === 'product' ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2 ml-2">Price (₹)</label>
                        <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2 ml-2">Category</label>
                        <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl py-4 px-6 font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10">
                          <option value="">Select...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-4 bg-surface-container-low p-6 rounded-2xl">
                    <input type="checkbox" id="k-toggle" checked={formData.sendToKitchen} onChange={e => setFormData({...formData, sendToKitchen: e.target.checked})} className="w-5 h-5 accent-primary" />
                    <label htmlFor="k-toggle" className="text-xs font-black text-primary uppercase tracking-widest">Send items to kitchen display</label>
                  </div>
                )}

                <button type="submit" className="w-full bg-primary text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl mt-6 flex items-center justify-center gap-3">
                  <Check size={18} /> Save Entry
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
