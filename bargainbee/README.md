# 🐝 BargainBee — P2P Voucher & Gift Card Marketplace

> *"Don't let value expire. List it, discover it, redeem it."*

BargainBee is a production-ready peer-to-peer marketplace engineered for buying and selling unused, transferable vouchers and gift cards. Target market: India (UPI, Razorpay, ₹ INR) with multi-currency groundwork.

---

## 🌟 Core Pillars & Business Model

1. **24-Hour Verification SLA**: Every listing undergoes administrative checks for authenticity, remaining balance, and non-duplicate codes.
2. **Escrow Protected Checkout**: Buyer funds are held safely in escrow until the voucher is redeemed and confirmed. Zero risk of bad codes.
3. **Instant Digital Delivery**: The buyer receives the decrypted voucher code and PIN immediately upon payment capture.
4. **Anti-Fraud Protections**: Unique code deduplication algorithm prevents double-selling. Moderated in-app messaging stops off-platform leaks.
5. **Platform Monetization**:
   - 5% commission on completed transactions
   - ₹99 Priority Verification fast-track fee (6-hour SLA)
   - Corporate B2B bulk voucher uploads

---

## 🏗️ Architecture & Tech Stack

```
bargainbee/
├── backend/                  # Node.js + Express + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma     # 11 Relational Models (PostgreSQL)
│   │   └── seed.ts           # Demo seed data (12 vouchers, 4 users, orders)
│   └── src/
│       ├── config/           # Prisma, JWT configuration
│       ├── middleware/       # JWT Auth, Role Guards, Error Handler, Multer
│       ├── routes/           # REST endpoints (auth, listings, orders, admin, chat, etc.)
│       ├── services/         # Razorpay escrow, Nodemailer, Socket.io, Cloud Storage
│       └── app.ts            # Server entrypoint with HTTP + WebSocket
├── frontend/                 # React 18 + Vite + Tailwind CSS + Zustand
│   ├── src/
│   │   ├── api/              # Axios API clients & typed queries
│   │   ├── components/       # VoucherCard, Navbar, Footer, UI Design System
│   │   ├── layouts/          # AppLayout, AuthLayout, DashboardLayout
│   │   ├── pages/            # 17 complete application pages
│   │   ├── store/            # Auth & Toast Zustand stores
│   │   └── types/            # TypeScript interfaces
│   └── tailwind.config.js    # BargainBee brand palette (#F5C518, #1A1A1A)
└── package.json              # Monorepo configuration
```

---

## 👥 Demo Accounts (Seeded)

All demo accounts use password: `Demo1234!`

| Role | Email | Password | What You Can Test |
|---|---|---|---|
| **Admin** | `admin@bargainbee.in` | `Demo1234!` | 24h Verification queue, approve/reject vouchers, GMV analytics, dispute resolution |
| **Seller** | `seller1@demo.com` | `Demo1234!` | List voucher in < 2 mins, earnings dashboard, listing tracker (Pending → Live) |
| **Seller 2** | `seller2@demo.com` | `Demo1234!` | Mixed role account with active listings across Croma, Ajio, Zomato |
| **Buyer** | `buyer1@demo.com` | `Demo1234!` | Browse with filters, checkout with escrow hold, reveal code, confirm & review |

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL (or Supabase / Neon connection URL)

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env

# Run Prisma migrations & seed demo dataset
npx prisma db push
npx ts-node prisma/seed.ts

# Start backend dev server (runs on port 4000)
npm run dev
```

### 2. Frontend Setup

```bash
cd ../frontend
npm install

# Start Vite dev server (runs on port 5173)
npm run dev
```

Visit `http://localhost:5173` in your browser!

---

## 📱 Pages Implemented

- **Landing Page (`/`)**: High-converting hero, problem stats (43% unused vouchers, $23B unspent), featured deals, 5-step lifecycle.
- **How It Works (`/how-it-works`)**: Full deep-dive into the 5-step lifecycle and escrow guarantees.
- **Why BargainBee (`/why-bargainbee`)**: Direct comparison matrix against informal resale (OLX, Telegram, Reddit).
- **Browse Marketplace (`/browse`)**: Live search, category chips, discount %, price sliders, sorting, pagination.
- **Voucher Detail (`/listing/:id`)**: Discount badges, urgency timers, seller reputation, escrow purchase modal, seller chat.
- **Create Listing (`/sell`)**: Under 2-minute flow with auto-calculated discount %, file uploads, and ₹99 priority verification option.
- **Seller Dashboard (`/dashboard/seller`)**: Real-time earnings card, active listings, status tracker (Pending → Verified → Live → Sold).
- **Buyer Dashboard (`/dashboard/buyer`)**: Order tracking, escrow statuses (Held / Released / Refunded), action links.
- **Order Details (`/orders/:id`)**: Decrypted digital voucher code copy box, "Confirm Received" escrow release, dispute reporting.
- **Admin Verification Queue (`/dashboard/admin/queue`)**: 24h SLA review queue, approval & rejection with custom feedback notes.
- **Admin Analytics (`/dashboard/admin/analytics`)**: GMV metrics, take rate calculation, category breakdown.
- **In-App Moderated Chat (`/chat/:roomId`)**: Real-time WebSocket messaging with safety warning banners against off-platform scams.
- **Wishlist & Alerts (`/wishlist`)**: Set brand price drop alerts.
- **Public Seller Profile (`/profile/:id`)**: Seller reputation score, badges, and verified buyer reviews.
