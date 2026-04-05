# Odoo Cafe POS

A modern, full-stack Point of Sale (POS) system designed for restaurants and cafes. Built with React, Node.js, Express, PostgreSQL, and Prisma ORM.

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Core Features](#core-features)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Real-time Events](#real-time-events)
- [Database Schema](#database-schema)

## Overview
Odoo Cafe POS is a comprehensive restaurant management system that provides real-time order tracking, inventory management, kitchen display integration, and detailed analytics. The system supports multiple branches, terminals, and floor layouts with live synchronization across all connected devices.

## Technology Stack
### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Framer Motion for animations
- Socket.IO client for real-time updates
- Zustand for state management
- React Router for navigation

### Backend
- Node.js with Express
- PostgreSQL database
- Prisma ORM
- Socket.IO for real-time communication
- JWT authentication
- Bcrypt for password hashing

## Core Features

### 1. Authentication and User Management
**Login System**
- Secure JWT-based authentication
- Password hashing with bcrypt
- Session persistence with token storage
- Role-based access control

**User Roles**
- **Admin**: Full system configuration access
- **Staff**: POS operations and order management
- **Kitchen**: Kitchen display and order preparation

### 2. Point of Sale (POS) Interface
**Table Management**
- Visual floor plan with table status indicators
- Real-time table availability (Free, Occupied, Reserved)
- Multi-floor support with floor selector
- Click-to-select table for order creation

**Order Creation**
- Product browsing with category filters
- Search functionality for quick product lookup
- Quantity adjustment and item customization
- Order notes and special instructions
- Order type selection (Dine-in, Takeaway)

**Order Management**
- View all active orders
- Order status tracking (Created, In Progress, Ready, Completed)
- Modify existing orders
- Split bills and partial payments
- Print receipts

### 3. Kitchen Display System
**Order Tickets**
- Real-time order notifications
- Visual order cards with item details
- Status-based color coding (Red for To Cook, Orange for Preparing, Green for Completed)
- Table number display
- Customer name or walk-in indicator
- Order notes visibility

**Order Workflow**
- One-click status advancement
- Click order to start cooking (Created to In Progress)
- Click again to mark as ready (In Progress to Ready)
- Automatic table release when order is ready
- Real-time updates across all connected displays

### 4. Floor and Table Configuration
- Create multiple floors/dining areas (e.g., "Ground Floor")
- Edit floor names and manage terminal assignments
- Add/manage tables via backend list view
- Bulk table operations (duplicate, delete)
- Active/inactive table status toggle

### 5. Inventory Management
- **Products**: Create/Edit menu items with variants (Attribute, Value, Unit, Extra Price)
- **Categories**: Organize products with custom colors and drag-and-drop reordering
- **UOM**: Manage different units of measure (Unit, Liter, KG)
- **Taxation**: Support for multiple tax brackets (5%, 18%, 28%)

### 6. Reports and Analytics
- **KPI Cards**: Real-time tracking of revenue, order count, and occupancy
- **Sales Trend**: Visual charts for revenue performance
- **Top Categories**: Product distribution analytics
- **Transaction History**: Detailed list of recent orders with drill-down views

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create `.env` file:
   ```env
   PORT=5000
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_jwt_secret
   ```
4. Run migrations: `npx prisma migrate dev`
5. Seed database: `npx prisma db seed`
6. Start server: `npm run dev`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Access at `http://localhost:5173`

## Configuration
- **Database**: Managed via Prisma in `backend/prisma/schema.prisma`
- **Environment**: Backend URL is configured in `frontend/src/services/api.ts`

## Default Credentials
- **Email**: admin@odoo-cafe.com
- **Password**: password123

## API Endpoints
### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### POS Operations
- `GET /api/pos/orders` - Get all orders
- `POST /api/pos/orders` - Create new order
- `GET /api/pos/tables/:id/active-order` - Find active order for table
- `POST /api/pos/orders/:id/payment` - Process payment

### Management
- `GET /api/pos/products` - Get catalog
- `POST /api/pos/products` - Create product with variants
- `GET /api/pos/customers` - Manage customer database
- `GET /api/pos/reports/analytics` - Fetch business stats

## Real-time Events (Socket.IO)
- `new-order`: Notifications for kitchen
- `order-status-updated`: Sync between POS, Kitchen, and Displays
- `table-status-updated`: Live floor plan updates

## Database Schema
- **User**: Authentication and profiles
- **Branch**: Multi-location support
- **Terminal**: POS configuration per station
- **Floor & Table**: Physical layout mapping
- **Category & Product**: Menu structure
- **Variant**: Item customizations
- **Order & OrderItem**: Transaction records
- **Payment**: Financial history
- **Customer**: CRM records
