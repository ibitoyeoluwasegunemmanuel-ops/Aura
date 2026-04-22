# AURA OS — Full Stack Tech Blueprint
## Your Personal AI Operating System

---

## PROJECT STRUCTURE

```
aura-os/
├── frontend/                   # React / Next.js
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   ├── components/
│   │   │   ├── chat/           # AURA chat interface
│   │   │   ├── navigate/       # Maps & routing
│   │   │   ├── translate/      # Language translation
│   │   │   ├── build/          # Code builder
│   │   │   ├── finance/        # Finance tracker
│   │   │   ├── dream/          # Dream mode
│   │   │   ├── shield/         # Security
│   │   │   ├── admin/          # Admin dashboard
│   │   │   └── subscription/   # Stripe billing
│   │   ├── lib/
│   │   │   ├── claude.ts       # Claude API client
│   │   │   ├── supabase.ts     # Database client
│   │   │   └── stripe.ts       # Payment client
│   │   └── styles/
├── backend/                    # Node.js / Express
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── claude.ts
│   │   ├── stripe.ts
│   │   ├── admin.ts
│   │   └── users.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rateLimit.ts
│   └── server.ts
├── database/
│   ├── schema.sql              # Full Supabase schema
│   └── migrations/
└── docs/
    ├── API.md
    └── DEPLOYMENT.md
```

---

## TECH STACK

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS + Custom CSS
- **State**: Zustand
- **Auth**: Supabase Auth
- **Fonts**: Orbitron, DM Mono, Exo 2

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis (Upstash)
- **Queue**: BullMQ

### AI & APIs
- **Core AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Voice Input**: Web Speech API + Whisper AI
- **Voice Clone**: ElevenLabs API
- **Maps**: Google Maps API + Mapbox
- **Translation**: Claude multilingual + DeepL fallback
- **Vision**: Claude Vision API

### Payments
- **Subscriptions**: Stripe
- **Africa Payments**: Paystack
- **Webhooks**: Stripe webhooks → Supabase

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway or Render
- **Database**: Supabase
- **CDN**: Cloudflare
- **Monitoring**: Sentry + PostHog

---

## ENVIRONMENT VARIABLES

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# ElevenLabs (voice clone)
ELEVENLABS_API_KEY=...

# Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## DATABASE SCHEMA (Supabase SQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','elite','enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB DEFAULT '[]',
  brain TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory (AURA remembers everything)
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT, -- 'person', 'preference', 'fact', 'event'
  importance INTEGER DEFAULT 5,
  embedding vector(1536), -- for semantic search
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT,
  status TEXT, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  feature TEXT, -- 'chat', 'translate', 'build', 'navigate'
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin metrics (cached)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_key TEXT UNIQUE,
  metric_value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## CLAUDE API INTEGRATION

```typescript
// lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AURA_SYSTEM_PROMPT = `
You are AURA — a brilliant personal AI Operating System.
You are like a genius best friend: smart, direct, casual, witty.
You remember everything the user has told you.
You can build full apps and websites, write production code in any language,
translate between 23+ languages, navigate and give travel tips,
track finances, detect security threats, and control devices.
Always be helpful, sharp, and personable.
Use emojis occasionally. Keep responses focused and real.
`;

export async function chat(
  messages: { role: string; content: string }[],
  userContext: string = "",
  stream = false
) {
  return await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: AURA_SYSTEM_PROMPT + "\n\nUser context: " + userContext,
    messages: messages as any,
    stream,
  });
}

export async function buildCode(prompt: string) {
  return await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: "You are AURA Code Brain. Build complete, production-ready code. Always include full files, proper structure, and comments. Make it actually work.",
    messages: [{ role: "user", content: prompt }],
  });
}

export async function translateText(text: string, from: string, to: string) {
  return await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: "You are a professional translator. Return ONLY the translation, nothing else.",
    messages: [{ role: "user", content: `Translate from ${from} to ${to}: "${text}"` }],
  });
}
```

---

## STRIPE SUBSCRIPTION SETUP

```typescript
// routes/stripe.ts
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Price IDs (create these in Stripe dashboard)
export const PRICE_IDS = {
  starter: "price_starter_monthly",
  pro:     "price_pro_monthly",
  elite:   "price_elite_monthly",
};

// Create subscription
export async function createSubscription(userId: string, plan: string) {
  const user = await getUser(userId);
  
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
    await updateUser(userId, { stripe_customer_id: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.APP_URL}/app?upgraded=true`,
    cancel_url: `${process.env.APP_URL}/pricing`,
    metadata: { userId, plan },
  });

  return session.url;
}

// Webhook handler
export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.CheckoutSession;
      await updateUser(session.metadata!.userId, { plan: session.metadata!.plan });
      break;
    case "customer.subscription.deleted":
      // Downgrade to free
      break;
  }
}
```

---

## ADMIN DASHBOARD ROUTES

```typescript
// routes/admin.ts (protected — isAdmin only)

// GET /admin/metrics
export async function getMetrics() {
  return {
    mrr: await db.query("SELECT SUM(price) FROM subscriptions WHERE status='active'"),
    users: await db.query("SELECT COUNT(*) FROM users"),
    activeUsers: await db.query("SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL '7 days'"),
    churn: await calculateChurnRate(),
    topFeatures: await db.query("SELECT feature, COUNT(*) FROM usage GROUP BY feature ORDER BY COUNT DESC"),
  };
}

// GET /admin/users
export async function getUsers(page = 1, limit = 50) {
  return await db.query(`
    SELECT u.*, s.plan, s.status as sub_status
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, (page-1)*limit]);
}

// POST /admin/users/:id/ban
// POST /admin/users/:id/upgrade
// GET  /admin/revenue/chart
// GET  /admin/system/health
```

---

## DEPLOYMENT (Vercel + Railway)

```bash
# 1. Clone and install
git clone https://github.com/your-repo/aura-os
cd aura-os
npm install

# 2. Set up Supabase
# - Create project at supabase.com
# - Run schema.sql in SQL editor
# - Copy env vars

# 3. Set up Stripe
# - Create products/prices in dashboard
# - Set up webhook endpoint
# - Copy API keys

# 4. Deploy frontend to Vercel
vercel deploy

# 5. Deploy backend to Railway
railway deploy

# 6. Set all environment variables
# Done. AURA is live.
```

---

## CLAUDE CODE HANDOFF PROMPT

Copy and paste this into Claude Code to continue building:

```
I am building AURA OS — a full-stack AI Operating System web app.

TECH STACK:
- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: Supabase (PostgreSQL)
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- Payments: Stripe subscriptions
- Auth: Supabase Auth
- Deployment: Vercel (frontend) + Railway (backend)

WHAT I NEED YOU TO BUILD:

1. Set up the Next.js project with the full folder structure from README.md
2. Implement the Claude API integration (lib/claude.ts)
3. Build the Supabase schema and run migrations
4. Set up Stripe subscription checkout with 3 plans ($29, $99, $199)
5. Build the admin dashboard with user management and revenue metrics
6. Implement the full AURA chat interface with streaming responses
7. Build the real-time translator (23 languages via Claude)
8. Build the code builder (Claude Code Brain)
9. Set up authentication with Supabase Auth
10. Deploy to Vercel with all environment variables

The app has a floating bubble widget, bottom navigation, and these screens:
- Landing page with pricing
- Auth (login/signup)
- Main chat (real Claude API, streaming)
- Code builder (builds real apps)
- Translator (23 languages)
- Navigator (maps + AI tips)
- Finance tracker
- Admin dashboard (metrics, users, revenue, system health)
- Subscription page (Stripe checkout)

Design language: Dark (#02020a bg), cyan (#00ffe5) primary, 
Orbitron font for headings, DM Mono for body.
Futuristic, Iron Man HUD aesthetic.

Start with: npx create-next-app@latest aura-os --typescript --tailwind --app
```
