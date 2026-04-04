# Caffino - Smart Cafe POS Pro ☕

A high-fidelity, real-time Restaurant Point of Sale system designed for artisanal cafes. Built with a modern, high-performance tech stack and a premium design system.

## 🌟 Key Features

### 🖥️ Dining Command Center (Dashboard)
- **Unified Operations:** Monitor daily revenue, order counts, and floor capacity.
- **Bento Floor Plan:** Interactive table grid with live status indicators and Guest View access.
- **Analytics Hub:** High-fidelity Sales Trend charts and Category Distribution data.

### 🧾 Pro POS Terminal
- **Integrated Numpad:** Compact on-screen digits for rapid manual entries.
- **Variant Selector:** Support for product attributes (e.g., "Extra Cream") with auto-pricing.
- **Atomic Billing:** Single active bill per table that persists across sessions.
- **Special Instructions:** Item-level notes for kitchen customization.

### 👨‍🍳 Kitchen Master Console
- **Category Filtering:** Sidebar to focus on specific sections (e.g., Coffee vs. Snacks).
- **Real-time Sync:** Orders appear instantly with audible notifications.
- **Granular Progress:** Item strike-throughs that sync live with the Customer Display.

### 📱 Guest Experience
- **Customer Display:** Real-time progress tracking with animated status indicators.
- **QR Self-Ordering:** Dynamic QR generation for mobile ordering at every table.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Framer Motion, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend:** Node.js, Express, Prisma ORM, Socket.io, JWT, Bcrypt.
- **Database:** PostgreSQL (Local & Neon.tech Cloud compatible).

## 🚀 Getting Started

### 1. Backend Setup
1. `cd backend && npm install`
2. Configure `.env` with `DATABASE_URL` and `JWT_SECRET`.
3. `npx prisma migrate dev`
4. `npx prisma db seed`
5. `npm run dev`

### 2. Frontend Setup
1. `cd frontend && npm install`
2. `npm run dev`


---
*Developed for the Odoo POS Cafe Hackathon 2026.*
