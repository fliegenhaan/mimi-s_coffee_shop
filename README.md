# Kopi Kita Coffee Shop CRM ☕

AI-powered Customer Relationship Management system for coffee shops. Transform customer data into actionable marketing campaigns with intelligent automation.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 🚀 What Makes This Unique

### 🤖 Dual-Stage AI Marketing Pipeline
- **Stage 1**: Creative generation (temp 0.7) - analyzes trends, generates 2-3 campaign ideas
- **Stage 2**: Quality refinement (temp 0.3) - polishes for persuasiveness and clarity
- **Triple Fallback**: Template generator → Review fallback → Keyword matching
- **Result**: 100% reliability, never leaves users stranded

### 🎯 RAG-Powered Chatbot
- Live CRM context injection (customers, trends, campaigns)
- Conversation history for contextual responses
- Graceful fallback to static shop info
- Actually useful business intelligence

### 📊 Coffee Shop Specific
- Track favorite products & flavor interests
- Many-to-many tagging system
- Visual trend analysis with Recharts
- Time-based filtering (all time, 7d, 30d)
- Campaign history with batch tracking

### 🎨 Beautiful UI
- 50+ Radix UI components
- Custom-designed, not generic
- Responsive, polished interactions
- Professional dashboard

## ✨ Features

- **Customer Management**: Full CRUD, search, tag filtering, pagination
- **AI Campaign Generation**: One-click creation, data-driven insights, ready-to-send messages
- **Dashboard**: Total customers, top interests chart, latest campaigns
- **AI Chatbot**: CRM knowledge, shop info, context-aware responses
- **Security**: NextAuth, rate limiting (Upstash Redis), input validation (Zod)

## 🛠 Tech Stack

**Frontend**: Next.js 16.1.6, React 19.2.3, TypeScript 5.x, Tailwind CSS 4

**UI**: Radix UI (50+ components), Lucide React, Recharts, Sonner

**Backend**: Next.js Route Handlers, NextAuth 4.24.13, Zod 4.3.6

**Database**: Supabase (PostgreSQL), Upstash Redis

**AI**: Google Gemini 2.5 Flash, Vercel AI SDK 6.0.111

## 🚀 Quick Start

```bash
# Install
npm install

# Setup .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password
NEXTAUTH_SECRET=your_secret
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Setup database
# Run migrations in Supabase SQL Editor:
# - supabase/migrations/001_create_table.sql
# - supabase/migrations/002_seed_data.sql

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

**Customers**: Add, edit, delete, search by name, filter by tags

**Campaigns**: Select time period → Click "Generate Campaigns" → Copy messages for WhatsApp/SMS/DM

**Chatbot**: Ask about customers, trends, campaigns, hours, menu, WiFi

## 📊 API Endpoints

```
POST   /api/auth/[...nextauth]         # Auth
GET/POST /api/customers                # Customer CRUD
PUT/DELETE /api/customers/:id
GET    /api/tags                       # List tags
GET/POST /api/campaigns                # Campaign history
POST   /api/campaigns/generate         # Generate AI campaigns
GET    /api/campaigns/latest           # Latest batch
GET    /api/dashboard                  # Analytics
POST   /api/chat                       # AI chatbot
```

## 🚀 Deploy

**Vercel** (recommended):
1. Push to GitHub
2. Import in Vercel (Next.js preset)
3. Add env vars
4. Deploy

**Database**: Create Supabase project, run migrations

## 🔒 Security

- Single admin user with secure sessions
- Rate limiting: 20 req/10s (standard), 10 req/60s (AI)
- Input validation via Zod
- SQL injection protection via Supabase

## 📝 License

Proprietary software. All rights reserved.

---

Built with ☕ by Raihaan for Kopi Kita Coffee Shop
