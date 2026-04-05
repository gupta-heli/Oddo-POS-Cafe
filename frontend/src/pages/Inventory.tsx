import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, Layers, Coffee, X, Check, ChevronDown, Archive, MoreHorizontal, GripVertical, LayoutGrid } from 'lucide-react';

const CATEGORY_COLORS = [
  "#FFFFFF", // Default White
  "#FFADAD", // Pastel Red
  "#FFD6A5", // Pastel Orange
  "#FDFFB6", // Pastel Yellow
  "#CAFFBF", // Pastel Green
  "#9BF6FF", // Pastel Blue
  "#A0C4FF", // Pastel Indigo
  "#BDB2FF", // Pastel Purple
  "#FFC6FF", // Pastel Pink
];

const Inventory: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Inline Category Creation State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  // Modal States for Products
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'general' | 'variant'>('general');
  
  // Form Data for Products
  const [formData, setFormData] = useState<any>({ 
    name: '', 
    description: '',
    price: '', 
    categoryId: '', 
    unit: 'Unit', 
    tax: 5.0,
    sendToKitchen: true,
    variants: []
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/pos/products');
      // Sort categories by sequence on the client side
      const sorted = (res.data || []).sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));
      setCategories(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        tax: parseFloat(formData.tax),
        variants: formData.variants.map((v: any) => ({
          ...v,
          extraPrice: parseFloat(v.extraPrice || 0)
        }))
      };
      await api.post('/pos/products', payload);
      setShowModal(false);
      resetProductForm();
      fetchData();
    } catch (err) {
      alert("Failed to save product.");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/pos/categories', { 
        name: newCategoryName,
        sequence: categories.length
      });
      setNewCategoryName('');
      setIsAddingCategory(false);
      fetchData();
    } catch (err) {
      alert("Failed to create category");
    }
  };

  const handleUpdateCategory = async (id: string, updates: any) => {
    try {
      await api.put(`/pos/categories/${id}`, updates);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category? Products in it won't be deleted but will lose their category.")) return;
    try {
      await api.delete(`/pos/categories/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  const handleReorder = async (newOrder: any[]) => {
    setCategories(newOrder);
    try {
      const orders = newOrder.map((cat, index) => ({ id: cat.id, sequence: index }));
      await api.post('/pos/categories/reorder', { orders });
    } catch (err) {
      console.error("Failed to save order", err);
    }
  };

  const resetProductForm = () => {
    setFormData({ 
      name: '', description: '', price: '', categoryId: '', 
      unit: 'Unit', tax: 5.0, sendToKitchen: true, variants: [] 
    });
    setModalTab('general');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: 'delete' | 'archive') => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`${action === 'delete' ? 'Delete' : 'Archive'} ${selectedIds.length} items?`)) {
      try {
        for (const id of selectedIds) {
          if (action === 'delete') await api.delete(`/pos/products/${id}`);
        }
        setSelectedIds([]);
        setShowActionMenu(false);
        fetchData();
      } catch (err) {
        alert("Bulk action partially failed");
      }
    }
  };

  const getCategoryBadgeColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('food')) return 'bg-blue-100 text-blue-800';
    if (n.includes('drink')) return 'bg-orange-100 text-orange-800';
    if (n.includes('pastries') || n.includes('bakery')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const allProducts = categories.flatMap(c => (c.products || []).map((p: any) => ({ ...p, categoryName: c.name })));
  const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-[0.4em] text-outline animate-pulse font-manrope">Syncing Catalog...</div>;

  return (
    <div className="px-12 py-12 flex flex-col gap-10 min-h-full animate-fade-in font-manrope bg-background">
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
          <div className="flex items-center gap-6">
             <button 
              onClick={() => {
                if (activeTab === 'products') {
                  resetProductForm();
                  setShowModal(true);
                } else {
                  setIsAddingCategory(true);
                }
              }}
              className="bg-[#D1B3C4] text-[#4A2E3B] px-8 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> New
            </button>
            <h3 className="text-2xl font-black text-primary italic uppercase tracking-tighter">
              {activeTab === 'products' ? 'Products' : 'Product Cataegory'}
            </h3>
          </div>

          <div className="flex items-center gap-4">
            {selectedIds.length > 0 && activeTab === 'products' && (
              <div className="relative">
                <button 
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg transition-all"
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
              <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none font-bold text-primary w-full text-xs placeholder:text-outline/30" />
            </div>
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'text-primary bg-surface-container-low' : 'text-secondary bg-primary shadow-lg'}`}
              title={viewMode === 'list' ? "Switch to Grid View" : "Switch to List View"}
            >
              {viewMode === 'list' ? <EqualIcon size={24} strokeWidth={3} /> : <LayoutGrid size={24} strokeWidth={3} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'products' ? (
              viewMode === 'list' ? (
                <motion.div key="prod-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Product</th>
                        <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Sale Prices</th>
                        <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Tax</th>
                        <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">UOM</th>
                        <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {filteredProducts.map((p: any) => {
                        const isSelected = selectedIds.includes(p.id);
                        return (
                          <tr key={p.id} className={`group hover:bg-surface-container-low/20 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div 
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/30 text-transparent group-hover:border-primary/50'}`}
                                  onClick={() => toggleSelection(p.id)}
                                >
                                  <Check size={12} strokeWidth={4} />
                                </div>
                                <span className="font-black text-primary italic text-sm">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 font-black text-primary text-sm">₹{p.price.toFixed(2)}</td>
                            <td className="px-8 py-5 font-black text-outline text-xs">{p.tax}%</td>
                            <td className="px-8 py-5 font-black text-outline text-xs uppercase">{p.unit}</td>
                            <td className="px-8 py-5">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${getCategoryBadgeColor(p.categoryName)}`}>
                                {p.categoryName}
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
                  key="prod-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-outline font-bold uppercase tracking-widest opacity-50">No products found</div>
                  ) : filteredProducts.map((p: any) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <motion.div 
                        key={p.id}
                        whileHover={{ y: -5 }}
                        className={`bg-white p-8 rounded-[2.5rem] border shadow-xl relative group transition-all cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-surface-container-high'}`}
                        onClick={() => toggleSelection(p.id)}
                      >
                        <div 
                          className={`absolute top-6 left-6 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline/20 text-transparent group-hover:border-primary/30'}`}
                        >
                          <Check size={14} strokeWidth={4} className={isSelected ? 'text-secondary' : 'text-transparent'} />
                        </div>

                        <div className="mt-8 space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-2xl font-black text-primary italic uppercase tracking-tighter">{p.name}</h3>
                              <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm ${getCategoryBadgeColor(p.categoryName)}`}>
                                {p.categoryName}
                              </span>
                            </div>
                            <div className="bg-surface-container-low p-3 rounded-2xl">
                              <Coffee size={24} className="text-primary" />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-outline uppercase tracking-wider">
                              <span>Tax</span>
                              <span className="text-primary">{p.tax}%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-outline uppercase tracking-wider">
                              <span>Unit</span>
                              <span className="text-primary uppercase">{p.unit}</span>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-surface-container-low flex justify-between items-end">
                            <div>
                              <p className="text-[8px] font-black text-outline uppercase tracking-[0.3em] mb-1">Sale Price</p>
                              <p className="text-2xl font-black text-secondary italic tracking-tighter">₹{p.price.toFixed(2)}</p>
                            </div>
                            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Edit</button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )
            ) : (
              <motion.div key="cat-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high w-1/2">Product Category</th>
                      <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high">Color</th>
                      <th className="px-8 py-5 text-[10px] font-black text-outline uppercase tracking-widest border-b border-surface-container-high text-right"></th>
                    </tr>
                  </thead>
                  <Reorder.Group axis="y" values={categories} onReorder={handleReorder} as="tbody" className="divide-y divide-surface-container-low">
                    {/* Inline adding row */}
                    <AnimatePresence>
                      {isAddingCategory && (
                        <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-primary/5">
                          <td className="px-8 py-5 flex items-center gap-4">
                            <div className="w-[18px]" /> {/* Spacer for grip icon */}
                            <input 
                              autoFocus 
                              value={newCategoryName} 
                              onChange={e => setNewCategoryName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                              placeholder="Type Category Name..."
                              className="bg-transparent border-b-2 border-primary/30 outline-none font-bold text-primary italic w-full"
                            />
                          </td>
                          <td className="px-8 py-5">
                            <div className="w-6 h-6 rounded-full border-2 border-outline/30 bg-white" />
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={handleCreateCategory} className="text-primary hover:text-secondary"><Check size={20}/></button>
                              <button onClick={() => setIsAddingCategory(false)} className="text-outline hover:text-error"><X size={20}/></button>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>

                    {categories.map((cat) => (
                      <Reorder.Item key={cat.id} value={cat} as="tr" className="group hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <GripVertical size={18} className="text-outline/30 cursor-grab active:cursor-grabbing" />
                            {editingCategoryId === cat.id ? (
                              <input 
                                autoFocus
                                value={cat.name}
                                onChange={e => {
                                  const newCats = [...categories];
                                  const idx = newCats.findIndex(c => c.id === cat.id);
                                  newCats[idx].name = e.target.value;
                                  setCategories(newCats);
                                }}
                                onBlur={() => {
                                  handleUpdateCategory(cat.id, { name: cat.name });
                                  setEditingCategoryId(null);
                                }}
                                onKeyDown={e => e.key === 'Enter' && setEditingCategoryId(null)}
                                className="bg-transparent border-b border-primary outline-none font-bold text-primary italic"
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingCategoryId(cat.id)}
                                className="font-black text-primary italic text-sm cursor-pointer hover:underline underline-offset-4"
                              >
                                {cat.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 relative">
                          <div 
                            onClick={() => setActiveColorPicker(activeColorPicker === cat.id ? null : cat.id)}
                            className="w-6 h-6 rounded-full border-2 border-surface-container-high cursor-pointer shadow-sm hover:scale-110 transition-transform"
                            style={{ backgroundColor: cat.color || '#FFFFFF' }}
                          />
                          
                          <AnimatePresence>
                            {activeColorPicker === cat.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveColorPicker(null)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                  className="absolute left-8 top-12 bg-white border border-surface-container-high rounded-2xl shadow-2xl p-4 z-50 flex gap-2"
                                >
                                  {CATEGORY_COLORS.map(color => (
                                    <div 
                                      key={color}
                                      onClick={() => {
                                        handleUpdateCategory(cat.id, { color });
                                        setActiveColorPicker(null);
                                      }}
                                      className="w-6 h-6 rounded-full cursor-pointer border hover:scale-125 transition-transform"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Product Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-primary/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3.5rem] shadow-2xl border border-surface-container-high max-w-2xl w-full overflow-hidden">
              <div className="bg-primary p-10 flex justify-between items-center text-white">
                <div className="flex items-center gap-6">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Products</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-black text-[10px] uppercase tracking-widest opacity-60">New</span>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"><X size={24}/></button>
              </div>

              <div className="flex border-b border-surface-container-low px-10 bg-surface-container-low/30">
                <button onClick={() => setModalTab('general')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${modalTab === 'general' ? 'border-secondary text-primary' : 'border-transparent text-outline'}`}>General Info</button>
                <button onClick={() => setModalTab('variant')} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${modalTab === 'variant' ? 'border-secondary text-primary' : 'border-transparent text-outline'}`}>Varint</button>
              </div>

              <div className="p-12 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <form onSubmit={handleSaveProduct} className="space-y-10">
                  {modalTab === 'general' ? (
                    <div className="space-y-10">
                      <div>
                        <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">Product</p>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b-2 border-surface-container-high py-2 font-bold text-primary text-xl outline-none focus:border-primary transition-all placeholder:text-outline/30" placeholder="e.g Eric Smith" />
                      </div>

                      <div className="grid grid-cols-2 gap-12">
                         <div className="space-y-6">
                            <div>
                              <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-4">Category</p>
                              <div className="relative group">
                                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-transparent border-b-2 border-dashed border-surface-container-high py-2 font-bold text-primary outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                                  <option value="">Select Category...</option>
                                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-0 bottom-3 text-outline pointer-events-none" />
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-4">Product Description</p>
                              <textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-transparent border-b-2 border-dashed border-surface-container-high py-2 font-bold text-primary outline-none focus:border-primary transition-all h-20 resize-none"
                                placeholder="e.g Burger with chees"
                              />
                            </div>
                         </div>

                         <div className="space-y-8">
                            <div>
                              <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-4">Prices</p>
                              <div className="flex items-end gap-4">
                                <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="flex-1 bg-transparent border-b-2 border-dashed border-surface-container-high py-2 font-bold text-primary outline-none focus:border-primary transition-all" />
                                <div className="relative">
                                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="bg-transparent border-b-2 border-dashed border-surface-container-high py-2 font-bold text-primary text-xs pr-6 outline-none appearance-none cursor-pointer">
                                    <option>Unit</option>
                                    <option>Liter</option>
                                    <option>KG</option>
                                  </select>
                                  <ChevronDown size={12} className="absolute right-0 bottom-3 text-outline pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-4">Tax</p>
                              <div className="relative">
                                <select value={formData.tax} onChange={e => setFormData({...formData, tax: parseFloat(e.target.value)})} className="w-full bg-transparent border-b-2 border-dashed border-surface-container-high py-2 font-bold text-primary outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                                  <option value="5">5%</option>
                                  <option value="18">18%</option>
                                  <option value="28">28%</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-0 bottom-3 text-outline pointer-events-none" />
                              </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-surface-container-low">
                            <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">Attributes</th>
                            <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">Value</th>
                            <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">Unit</th>
                            <th className="py-4 text-[10px] font-black text-outline uppercase tracking-widest">Extra Prices</th>
                            <th className="py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                          {formData.variants.map((v: any, index: number) => (
                            <tr key={index}>
                              <td className="py-4 pr-4">
                                <input type="text" value={v.name} onChange={e => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].name = e.target.value;
                                  setFormData({...formData, variants: newVariants});
                                }} placeholder="e.g. Pack" className="w-full bg-transparent border-b border-dashed border-outline/30 py-1 font-bold text-primary text-xs outline-none focus:border-primary" />
                              </td>
                              <td className="py-4 pr-4">
                                <input type="text" value={v.value} onChange={e => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].value = e.target.value;
                                  setFormData({...formData, variants: newVariants});
                                }} placeholder="6" className="w-full bg-transparent border-b border-dashed border-outline/30 py-1 font-bold text-primary text-xs outline-none focus:border-primary text-center" />
                              </td>
                              <td className="py-4 pr-4">
                                <div className="relative">
                                  <select value={v.unit} onChange={e => {
                                    const newVariants = [...formData.variants];
                                    newVariants[index].unit = e.target.value;
                                    setFormData({...formData, variants: newVariants});
                                  }} className="w-full bg-transparent border-b border-dashed border-outline/30 py-1 font-bold text-primary text-[10px] uppercase outline-none appearance-none pr-4">
                                    <option>Unit</option>
                                    <option>Liter</option>
                                    <option>KG</option>
                                  </select>
                                  <ChevronDown size={10} className="absolute right-0 bottom-2 text-outline" />
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <input type="number" step="0.01" value={v.extraPrice} onChange={e => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index].extraPrice = e.target.value;
                                  setFormData({...formData, variants: newVariants});
                                }} className="w-full bg-transparent border-b border-dashed border-outline/30 py-1 font-bold text-primary text-xs outline-none focus:border-primary" />
                              </td>
                              <td className="py-4 text-right">
                                <button type="button" onClick={() => {
                                  setFormData({...formData, variants: formData.variants.filter((_: any, i: number) => i !== index)});
                                }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-error hover:bg-error/10 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, variants: [...formData.variants, { name: '', value: '', unit: 'Unit', extraPrice: 0 }]})} 
                        className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2 hover:underline"
                      >
                        <Plus size={14} /> New
                      </button>
                    </div>
                  )}

                  <div className="flex gap-4 pt-8 border-t border-surface-container-low">
                    <button type="submit" className="bg-primary text-secondary px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                      Save Entry
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="bg-surface-container-low text-primary px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container transition-all">
                      Discard
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EqualIcon = ({ size, strokeWidth }: { size: number, strokeWidth: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="5" y1="15" x2="19" y2="15" />
  </svg>
);

export default Inventory;
