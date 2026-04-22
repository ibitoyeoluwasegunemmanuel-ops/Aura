# AURA OS — Your Personal AI Operating System

> The Jarvis nobody has built yet. Real. Working. Yours.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ibitoyeoluwasegunemmanuel-ops/Aura)

---

## ✅ What's Inside

| Feature | Status |
|---|---|
| Claude AI Chat Brain | ✅ Live |
| Claude Code Brain (builds apps) | ✅ Live |
| Claude Design Brain (UI/logo/brand) | ✅ Live |
| Image Generator (Pollinations.ai) | ✅ Live |
| Universal Translator (44 languages) | ✅ Live |
| Voice Input + Wake Word | ✅ Live |
| Text-to-Speech (AURA speaks back) | ✅ Live |
| GPS Navigation + AI directions | ✅ Live |
| Admin Dashboard (password-locked) | ✅ Live |
| Copy button on every reply | ✅ Live |
| Stripe + Flutterwave + Paystack | 🔑 Add API key |
| Google Maps Full Routing | 🔑 Add API key |
| Voice Clone (ElevenLabs) | 🔑 Add API key |
| Video Generation | 🚧 Phase 2 |
| AR Glasses Mode | 🚧 Phase 3 |

---

## 🚀 Deploy in 3 Steps

### Step 1 — Clone and Install
```bash
git clone https://github.com/ibitoyeoluwasegunemmanuel-ops/Aura.git
cd Aura
npm install
```

### Step 2 — Add Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key
```

### Step 3 — Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Or connect your GitHub repo at **vercel.com/new** — it deploys automatically.

---

## 🔑 Environment Variables

| Variable | Required | Get It From |
|---|---|---|
| `REACT_APP_ANTHROPIC_API_KEY` | ✅ Yes | console.anthropic.com |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Payments | dashboard.stripe.com |
| `REACT_APP_FLUTTERWAVE_PUBLIC_KEY` | Africa Pay | app.flutterwave.com |
| `REACT_APP_PAYSTACK_PUBLIC_KEY` | Nigeria Pay | dashboard.paystack.com |
| `REACT_APP_GOOGLE_MAPS_KEY` | Full maps | console.cloud.google.com |
| `REACT_APP_ELEVENLABS_KEY` | Voice clone | elevenlabs.io |

---

## 📱 PWA — Install on Phone

1. Open the website on your phone in Chrome
2. Tap the browser menu (⋮)
3. Tap **"Add to Home Screen"**
4. AURA OS installs like a native app
5. The floating bubble works on your phone

---

## 💰 Revenue Model

| Plan | Price | Features |
|---|---|---|
| Starter | $29/mo | Chat, translate, navigate |
| Pro | $99/mo | + Image gen, code builder |
| Elite | $199/mo | + Voice clone, all features |
| Enterprise | $999/mo | Whole company on AURA |

---

## 🏗️ Tech Stack

- **Frontend**: React 18 + CSS-in-JS
- **AI Brain**: Anthropic Claude API
- **Image Gen**: Pollinations.ai (free)
- **Payments**: Stripe + Flutterwave + Paystack
- **Hosting**: Vercel
- **Database**: Supabase (Phase 2)
- **Voice**: Web Speech API + ElevenLabs

---

## 📞 Owner

Built by **Ibitoye Oluwasegun Emmanuel**  
GitHub: [@ibitoyeoluwasegunemmanuel-ops](https://github.com/ibitoyeoluwasegunemmanuel-ops)

---

## 🗺️ Roadmap

**Phase 1 (Now)** — Web app, core AI features, payments  
**Phase 2** — iOS/Android native app, voice clone, smart home  
**Phase 3** — AR glasses, proprietary AI model, $1B target
