export type Role = 'ADMIN' | 'STAFF' | 'KITCHEN';

export type OrderStatus = 'CREATED' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string;
  branchName?: string;
}

export interface Branch {
  id: string;
  name: string;
  location?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
}

export interface Floor {
  id: string;
  name: string;
  tables: Table[];
}

export interface Table {
  id: string;
  tableNumber: number;
  seats: number;
  status: TableStatus;
  floorId: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  tableId?: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  orderType: 'DINE_IN' | 'TAKEAWAY';
}
