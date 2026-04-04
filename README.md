# Odoo POS Cafe Pro - Elegant Barista Edition ☕

A high-fidelity, real-time Restaurant Point of Sale system built for high-end artisanal cafes. This project combines Odoo's professional ERP logic with a modern, high-performance tech stack.

![Elegant Barista Dashboard](https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000)

## 🌟 Key Features

### 🖥️ Dining Command Center (Dashboard)
- **Unified View:** Monitor daily revenue, active order counts, and branch capacity in real-time.
- **Bento Floor Plan:** Interactive table grid with live status indicators (Free, Occupied, Reserved).
- **Integrated Kitchen Feed:** View and manage live preparation tickets directly from the main hub.

### 🧾 Advanced POS Terminal
- **Integrated Menu Pop-out:** Access the full product catalog without leaving the floor plan.
- **Atomic Table Billing:** Tables "remember" their unpaid totals across sessions.
- **Partial Payments:** Support for bill splitting and recording partial settlements.
- **Special Instructions:** Add custom notes (e.g., "Extra shot", "No ice") to individual items.

### 👨‍🍳 Kitchen Master Console
- **Real-time Synchronization:** Orders appear instantly via Socket.io with audible notifications.
- **Three-Stage Workflow:** Track progress through "To Cook", "Preparing", and "Ready".
- **Item Strike-through:** Chefs can mark individual items as prepared for complex order coordination.

### 📱 Self-Ordering & Customer Display
- **Mobile Portal:** Unique table tokens allow customers to order directly from their phones.
- **Live Customer Display:** A dedicated secondary screen showing order progress and payment confirmation for transparency.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Framer Motion (Animations), Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend:** Node.js, Express, Prisma ORM, Socket.io (Real-time), JWT (Auth), Bcrypt.
- **Database:** PostgreSQL (Optimized for Neon.tech / Cloud hosting).

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to the `backend` folder: `cd backend`
2. Install dependencies: `npm install`
3. Configure your `.env` file with your `DATABASE_URL` and `JWT_SECRET`.
4. Sync the database: `npx prisma migrate dev`
5. Seed initial data: `npx prisma db seed`
6. Start the server: `npm run dev`

### 2. Frontend Setup
1. Navigate to the `frontend` folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`

## 👨‍💻 Author
**Heli Gupta** - [GitHub Profile](https://github.com/gupta-heli)

---
*Developed for the Odoo POS Cafe Hackathon 2026.*
