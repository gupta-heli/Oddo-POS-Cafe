import { create } from 'zustand';
import type { Floor, Table, Product, OrderItem } from '../types/index.ts';

interface POSState {
  floors: Floor[];
  activeTable: Table | null;
  cart: OrderItem[];
  setFloors: (floors: Floor[]) => void;
  setActiveTable: (table: Table | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
}

export const usePOSStore = create<POSState>((set) => ({
  floors: [],
  activeTable: null,
  cart: [],
  setFloors: (floors) => set({ floors }),
  setActiveTable: (table) => set({ activeTable: table }),
  addToCart: (product, quantity = 1) => set((state) => {
    const existing = state.cart.find(i => i.productId === product.id);
    const qtyToAdd = Math.max(1, quantity);
    
    if (existing) {
      return {
        cart: state.cart.map(i => 
          i.productId === product.id ? { ...i, quantity: i.quantity + qtyToAdd } : i
        )
      };
    }
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      productName: product.name,
      quantity: qtyToAdd,
      price: product.price
    };
    return { cart: [...state.cart, newItem] };
  }),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(i => i.productId !== productId)
  })),
  updateQuantity: (productId, delta) => set((state) => ({
    cart: state.cart.map(i => 
      i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    )
  })),
  clearCart: () => set({ cart: [] }),
}));
