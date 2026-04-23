import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "./theme/colors";
import { CSS } from "./theme/css";
import { Card, Btn, Tag, Lbl, Inp } from "./components/ui";
import { FOUNDER_SYSTEM_BLOCK } from "./data/founder";

// ── CLAUDE API (proxied via /api/claude to keep key server-side) ──────────────
async function callClaude(messages, system = "", maxTokens = 1024) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

// ── IMAGE GENERATION (Pollinations.ai — free, no key needed) ─────────────────
const genImg = (prompt, seed = Date.now()) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=600&height=400&nologo=true&seed=${seed}`;

// ── TEXT TO SPEECH ────────────────────────────────────────────────────────────
function getVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(x => x.name.includes("Google") && x.lang.startsWith("en"))
      || voices.find(x => x.lang.startsWith("en"));
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#`[\]]/g, "").trim();
  const u = new SpeechSynthesisUtterance(clean.slice(0, 300));
  u.rate = 1.05; u.pitch = 1.1;
  const v = getVoice(); if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// Speaks the full text with no character limit by chaining sentences
function speakFull(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#`[\]]/g, "").trim();
  const sentences = clean.match(/[^.!?\n]+[.!?\n]*/g) || [clean];
  let i = 0;
  const next = () => {
    if (i >= sentences.length) return;
    const u = new SpeechSynthesisUtterance(sentences[i].trim());
    u.rate = 1.05; u.pitch = 1.1;
    const v = getVoice(); if (v) u.voice = v;
    u.onend = () => { i++; next(); };
    window.speechSynthesis.speak(u);
  };
  next();
}

// ── LOCAL STORAGE ─────────────────────────────────────────────────────────────
const sto = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("aura_" + k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("aura_" + k, JSON.stringify(v)); } catch {} },
};

// ── LANGUAGES ─────────────────────────────────────────────────────────────────
const LANGS = [
  "English","Pidgin (Nigerian)","Yoruba","Igbo","Hausa","Efik","Tiv",
  "French","Spanish","Arabic","Mandarin","Hindi","Swahili","Portuguese",
  "Russian","Japanese","Korean","German","Italian","Turkish","Zulu",
  "Xhosa","Amharic","Somali","Twi","Wolof","Lingala","Bengali",
  "Vietnamese","Thai","Tagalog","Malay","Indonesian","Persian","Urdu",
  "Dutch","Polish","Ukrainian","Romanian","Greek","Hebrew","Swedish","Finnish","Afrikaans",
];

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN GATE
// ══════════════════════════════════════════════════════════════════════════════
function AdminGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  const check = () => {
    const stored = sto.get("admin_pw", null);
    if (!stored) { onUnlock(); return; }
    if (pw === stored) {
      onUnlock();
    } else {
      setErr(true); setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setErr(false), 2000);
      setPw("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
      <div style={{ width: 70, height: 70, borderRadius: "50%", background: `${C.red}15`, border: `2px solid ${C.red}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 24, boxShadow: `0 0 30px ${C.red}22` }}>🔐</div>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, color: C.red, fontWeight: 900, marginBottom: 6, letterSpacing: 2 }}>ADMIN ACCESS</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 28, textAlign: "center" }}>Owner-only. Enter your password.</div>
      <div style={{ width: "100%", maxWidth: 300, animation: shake ? "shake 0.5s ease" : "none" }}>
        <Inp type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
          placeholder="Admin password..." style={{ textAlign: "center", fontSize: 16, marginBottom: 12, border: `1px solid ${err ? C.red + "66" : C.border}` }} />
        {err && <div style={{ color: C.red, fontSize: 11, textAlign: "center", marginBottom: 10 }}>Wrong password.</div>}
        <Btn color={C.red} onClick={check} style={{ width: "100%" }}>🔐 Unlock</Btn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("overview");
  const [prices, setPrices] = useState(() => sto.get("prices", { starter: 29, pro: 99, elite: 199, enterprise: 999 }));
  const [pSaved, setPSaved] = useState(false);
  const [keys, setKeys] = useState(() => sto.get("admin_keys", { anthropic: "", googlemaps: "", stripe: "", flutterwave: "", paystack: "", elevenlabs: "", github: "", figma: "" }));
  const [kSaved, setKSaved] = useState(false);
  const [showKey, setShowKey] = useState({});
  const [newPw, setNewPw] = useState(""); const [pwSaved, setPwSaved] = useState(false);

  if (!unlocked) return <AdminGate onUnlock={() => setUnlocked(true)} />;

  const API_SERVICES = [
    { key: "anthropic", name: "Anthropic — Claude AI", icon: "🤖", color: C.cyan, ph: "sk-ant-api03-...", desc: "Powers AURA's brain. Required.", url: "https://console.anthropic.com/settings/keys" },
    { key: "googlemaps", name: "Google Maps", icon: "🗺️", color: C.blue, ph: "AIzaSy...", desc: "Full routing & search.", url: "https://console.cloud.google.com/apis/credentials" },
    { key: "stripe", name: "Stripe", icon: "💳", color: "#635bff", ph: "sk_live_...", desc: "Global card payments.", url: "https://dashboard.stripe.com/apikeys" },
    { key: "flutterwave", name: "Flutterwave", icon: "🌊", color: C.gold, ph: "FLWSECK_TEST-...", desc: "Africa payments — NG, GH, KE...", url: "https://app.flutterwave.com/settings/apis" },
    { key: "paystack", name: "Paystack", icon: "🟢", color: C.green, ph: "sk_live_...", desc: "Nigeria & Africa payments.", url: "https://dashboard.paystack.com/#/settings/developers" },
    { key: "elevenlabs", name: "ElevenLabs — Voice Clone", icon: "🎙", color: C.pink, ph: "sk_...", desc: "AURA sounds exactly like you.", url: "https://elevenlabs.io/app/settings/api-keys" },
    { key: "github", name: "GitHub", icon: "🐙", color: "#fff", ph: "ghp_...", desc: "Push code, open repos.", url: "https://github.com/settings/tokens/new" },
    { key: "figma", name: "Figma", icon: "🎨", color: "#ff7262", ph: "figd_...", desc: "Open designs, export assets.", url: "https://www.figma.com/settings" },
  ];

  const USERS = [
    { name: "Marcus J.", email: "marcus@x.com", plan: "Elite", rev: prices.elite, active: true, flag: "🇳🇬", s: 847 },
    { name: "Aisha W.", email: "aisha@x.com", plan: "Pro", rev: prices.pro, active: true, flag: "🇿🇦", s: 523 },
    { name: "David C.", email: "david@x.com", plan: "Starter", rev: prices.starter, active: true, flag: "🇨🇳", s: 201 },
    { name: "Fatima H.", email: "fatima@x.com", plan: "Elite", rev: prices.elite, active: true, flag: "🇬🇭", s: 634 },
    { name: "James O.", email: "james@x.com", plan: "Pro", rev: prices.pro, active: false, flag: "🇳🇬", s: 89 },
  ];
  const MRR = USERS.reduce((s, u) => s + u.rev, 0);

  const TABS = ["overview", "users", "prices", "payments", "system", "security"];

  return (
    <div style={{ padding: 14, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Tag c={C.red}>⚡ ADMIN</Tag>
        <div style={{ flex: 1, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>OWNER CONTROL</div>
        <button onClick={() => setUnlocked(false)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>🔒 Lock</button>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 14, background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 3, overflowX: "auto" }}>
        {TABS.map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: "center", padding: "7px 4px", background: tab === t ? `${C.red}12` : "transparent", borderRadius: 8, cursor: "pointer", fontSize: 9, color: tab === t ? C.red : "rgba(255,255,255,0.22)", fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? `2px solid ${C.red}` : "2px solid transparent", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1 }}>{t}</div>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 12 }}>
            {[{ l: "MRR", v: `$${MRR}`, c: C.gold, i: "💰" }, { l: "Users", v: `${USERS.filter(u => u.active).length}/${USERS.length}`, c: C.cyan, i: "👥" }, { l: "Images", v: "14.8k", c: C.pink, i: "🎨" }, { l: "Designs", v: "3,210", c: C.purple, i: "✦" }, { l: "Translates", v: "8,441", c: C.green, i: "🌍" }, { l: "Churn", v: "1.8%", c: C.red, i: "📉" }].map((m, i) => (
              <Card key={i} color={m.c} style={{ padding: "11px 13px" }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4 }}><span style={{ fontSize: 14 }}>{m.i}</span><div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{m.l}</div></div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: m.c, fontWeight: 900 }}>{m.v}</div>
              </Card>
            ))}
          </div>
          <Card>
            <Lbl>Revenue Trend</Lbl>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 60 }}>
              {[42, 58, 71, 63, 88, 95, MRR / 10].map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", borderRadius: "3px 3px 0 0", background: `linear-gradient(to top,${C.cyan}44,${C.cyan})`, height: `${(v / 100) * 60}px` }} />
                  <div style={{ fontSize: 7, color: "rgba(255,255,255,0.2)" }}>{["A","S","O","N","D","J","F"][i]}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {USERS.map((u, i) => (
            <Card key={i} color={u.active ? C.cyan : undefined} style={{ padding: "11px 13px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.cyan}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.cyan, flexShrink: 0 }}>{u.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{u.flag} {u.name}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{u.email} · {u.s} sessions</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Tag c={u.plan === "Elite" ? C.gold : u.plan === "Pro" ? C.orange : C.cyan}>{u.plan}</Tag>
                  <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginTop: 3 }}>${u.rev}/mo</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "prices" && (
        <Card color={C.gold}>
          <Lbl color={C.gold}>Set Plan Prices</Lbl>
          {Object.entries(prices).map(([plan, price]) => (
            <div key={plan} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 80, fontSize: 11, fontWeight: 700, color: plan === "elite" ? C.gold : plan === "pro" ? C.orange : plan === "enterprise" ? C.red : C.cyan, textTransform: "uppercase" }}>{plan}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px" }}>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>$</span>
                <input type="number" value={price} onChange={e => setPrices(p => ({ ...p, [plan]: Number(e.target.value) }))}
                  style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 18, fontWeight: 900, fontFamily: "'Orbitron',sans-serif", outline: "none", width: 60 }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>/mo</span>
              </div>
            </div>
          ))}
          <Btn color={C.gold} onClick={() => { sto.set("prices", prices); setPSaved(true); setTimeout(() => setPSaved(false), 2000); }} style={{ width: "100%" }}>
            {pSaved ? "✓ Prices Saved!" : "💾 Save Prices"}
          </Btn>
        </Card>
      )}

      {tab === "payments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { n: "Stripe", l: "💳", r: "Global", c: "#635bff", k: keys.stripe },
            { n: "Flutterwave", l: "🌊", r: "Africa-first", c: C.gold, k: keys.flutterwave },
            { n: "Paystack", l: "🟢", r: "Nigeria/Africa", c: C.green, k: keys.paystack },
          ].map((p, i) => (
            <Card key={i} color={p.c} style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{p.l}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{p.n}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.r}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.k ? C.green : "rgba(255,255,255,0.15)", boxShadow: p.k ? `0 0 8px ${C.green}` : "none" }} />
                  <Tag c={p.k ? C.green : C.gold}>{p.k ? "ACTIVE" : "Needs key → System"}</Tag>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Card color={C.cyan}>
            <Lbl color={C.cyan}>API Keys — Paste & Save</Lbl>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.6 }}>
              Paste each key below. Click Get Key ↗ to open the provider's dashboard. Save when done.
            </div>
          </Card>

          {API_SERVICES.map((api) => {
            const hasKey = keys[api.key]?.length > 0;
            return (
              <Card key={api.key} color={hasKey ? C.green : api.color}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{api.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{api.name}</div>
                      {hasKey && <Tag c={C.green}>✓ ACTIVE</Tag>}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{api.desc}</div>
                  </div>
                  <button onClick={() => window.open(api.url, "_blank")} style={{ background: `${api.color}15`, border: `1px solid ${api.color}44`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 10, color: api.color, flexShrink: 0, fontFamily: "'DM Mono',monospace" }}>Get Key ↗</button>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", background: "rgba(0,0,0,0.3)", border: `1px solid ${hasKey ? C.green + "44" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, overflow: "hidden" }}>
                    <input type={showKey[api.key] ? "text" : "password"} value={keys[api.key]}
                      onChange={e => setKeys(k => ({ ...k, [api.key]: e.target.value }))}
                      placeholder={`Paste ${api.name} key here...`}
                      style={{ flex: 1, background: "none", border: "none", padding: "9px 12px", color: hasKey ? C.green : "rgba(255,255,255,0.55)", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none" }} />
                    <button onClick={() => setShowKey(s => ({ ...s, [api.key]: !s[api.key] }))}
                      style={{ background: "none", border: "none", borderLeft: "1px solid rgba(255,255,255,0.07)", padding: "9px 10px", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                      {showKey[api.key] ? "🙈" : "👁"}
                    </button>
                  </div>
                  {hasKey && <button onClick={() => setKeys(k => ({ ...k, [api.key]: "" }))} style={{ background: `${C.red}15`, border: `1px solid ${C.red}33`, borderRadius: 9, padding: "8px 10px", cursor: "pointer", fontSize: 11, color: C.red }}>✕</button>}
                </div>
              </Card>
            );
          })}

          <Btn color={C.cyan} onClick={() => { sto.set("admin_keys", keys); setKSaved(true); setTimeout(() => setKSaved(false), 2500); }} style={{ width: "100%" }}>
            {kSaved ? "✓ All Keys Saved & Active!" : "💾 Save All API Keys"}
          </Btn>

          <Card>
            <Lbl>Live Status</Lbl>
            {[
              { l: "Claude AI (Brain)", s: "live", c: C.green },
              { l: "Image Generator", s: "live", c: C.green },
              { l: "Voice + Wake Word", s: "live", c: C.green },
              { l: "Translator", s: "live", c: C.green },
              { l: "GPS Navigation", s: "live", c: C.green },
              { l: "Claude Design", s: "live", c: C.green },
              { l: "Claude Code", s: "live", c: C.green },
              { l: "Google Maps Full", s: keys.googlemaps ? "active" : "add key", c: keys.googlemaps ? C.green : C.gold },
              { l: "Stripe", s: keys.stripe ? "active" : "add key", c: keys.stripe ? C.green : C.gold },
              { l: "Flutterwave", s: keys.flutterwave ? "active" : "add key", c: keys.flutterwave ? C.green : C.gold },
              { l: "Paystack", s: keys.paystack ? "active" : "add key", c: keys.paystack ? C.green : C.gold },
              { l: "Voice Clone", s: keys.elevenlabs ? "active" : "add key", c: keys.elevenlabs ? C.green : C.gold },
              { l: "Video Generation", s: "Phase 2", c: C.orange },
              { l: "AR Glasses", s: "Phase 3", c: C.purple },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: i < 13 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.c, boxShadow: `0 0 6px ${s.c}`, animation: s.c === C.green ? "pulse 2s infinite" : "none", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 11, color: "#fff" }}>{s.l}</div>
                <Tag c={s.c}>{s.s}</Tag>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "security" && (
        <Card color={C.red}>
          <Lbl color={C.red}>Change Admin Password</Lbl>
          <Inp type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 4 chars)..." style={{ marginBottom: 10 }} />
          <Btn color={C.red} onClick={() => { if (newPw.length >= 4) { sto.set("admin_pw", newPw); setNewPw(""); setPwSaved(true); setTimeout(() => setPwSaved(false), 2000); } }} style={{ width: "100%" }}>
            {pwSaved ? "✓ Password Updated!" : "🔐 Update Password"}
          </Btn>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLAUDE DESIGN SCREEN — full AI design studio powered by Claude
// ══════════════════════════════════════════════════════════════════════════════
function DesignScreen({ auraName }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("modern minimalist");
  const [type, setType] = useState("UI Design");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiDesc, setAiDesc] = useState("");
  const [count, setCount] = useState(2);

  const STYLES = ["modern minimalist", "futuristic dark", "glassmorphism", "neumorphism", "brutalist", "luxury gold", "neon cyberpunk", "clean corporate", "playful colorful", "African inspired"];
  const TYPES = ["UI Design", "Logo", "Landing Page", "Dashboard", "Mobile App", "Poster", "Social Media", "Brand Identity", "Infographic", "Illustration"];

  const EXAMPLES = [
    "AURA OS landing page with dark futuristic theme",
    "Logo for a Nigerian fintech startup called PayFlow",
    "Dashboard for a crypto trading app",
    "Instagram post for a luxury fashion brand",
    "Mobile app UI for a food delivery service in Lagos",
    "Brand identity for an AI company",
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setAiDesc(""); setResults([]);

    // Step 1: Claude enhances the design brief
    const enhanced = await callClaude(
      [{ role: "user", content: `I need a ${type} design: "${prompt}". Style: ${style}. Write a detailed visual description (colors, layout, typography, mood) in 2-3 sentences. Be specific and professional.` }],
      "You are a world-class UI/UX designer and art director. Describe designs with precision."
    );
    setAiDesc(enhanced);

    // Step 2: Generate images from enhanced description
    const imgs = Array.from({ length: count }, (_, i) => ({
      url: genImg(`${type}: ${enhanced}, ${style}, professional design, high quality`, Date.now() + i * 1000),
      seed: i,
    }));
    setResults(imgs);
    setLoading(false);
    speak(`Generated ${count} ${type} design${count > 1 ? "s" : ""} for you!`);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 24 }}>✦</div>
        <div>
          <Lbl color={C.purple}>Claude Design Brain</Lbl>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: -8 }}>AI-powered design studio</div>
        </div>
        <button onClick={() => window.open("https://claude.ai", "_blank")}
          style={{ marginLeft: "auto", background: `${C.purple}15`, border: `1px solid ${C.purple}44`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 10, color: C.purple, fontFamily: "'DM Mono',monospace" }}>
          Open Claude.ai ↗
        </button>
      </div>

      {/* Quick examples */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {EXAMPLES.map((e, i) => (
          <div key={i} onClick={() => setPrompt(e)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}>{e}</div>
        ))}
      </div>

      {/* Type + style */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <div>
          <Lbl>Design Type</Lbl>
          <select value={type} onChange={e => setType(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
            {TYPES.map(t => <option key={t} style={{ background: "#111" }}>{t}</option>)}
          </select>
        </div>
        <div>
          <Lbl>Style</Lbl>
          <select value={style} onChange={e => setStyle(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
            {STYLES.map(s => <option key={s} style={{ background: "#111" }}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Prompt */}
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="Describe what you want to design..."
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.purple}33`, borderRadius: 11, padding: "11px 13px", color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", lineHeight: 1.6, height: 75 }} />

      <div style={{ display: "flex", gap: 9 }}>
        <div style={{ flex: 1 }}>
          <Lbl>Variations</Lbl>
          <select value={count} onChange={e => setCount(Number(e.target.value))} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
            {[1, 2, 4].map(n => <option key={n} style={{ background: "#111" }}>{n} design{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div style={{ flex: 2, display: "flex", alignItems: "flex-end" }}>
          <Btn color={C.purple} onClick={generate} style={{ width: "100%" }} disabled={loading}>
            {loading ? "✦ Designing..." : `✦ Generate ${count} Design${count > 1 ? "s" : ""}`}
          </Btn>
        </div>
      </div>

      {/* Claude's design brief */}
      {aiDesc && (
        <Card color={C.purple}>
          <Lbl color={C.purple}>Claude's Design Brief</Lbl>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>{aiDesc}</div>
        </Card>
      )}

      {/* Generated designs */}
      {loading && (
        <Card color={C.purple} style={{ textAlign: "center", padding: "24px" }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.purple, animation: `pulse ${0.7 + i * 0.15}s infinite` }} />)}
          </div>
          <div style={{ fontSize: 12, color: C.purple }}>Claude is designing your {type}...</div>
        </Card>
      )}

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: count === 1 ? "1fr" : "1fr 1fr", gap: 10 }}>
          {results.map((r, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.purple}33`, position: "relative" }}>
              <div style={{ padding: "5px 9px", background: `${C.purple}15`, fontSize: 9, color: C.purple, display: "flex", justifyContent: "space-between" }}>
                <span>✦ Design {i + 1}</span>
                <a href={r.url} target="_blank" rel="noreferrer" style={{ color: C.cyan, textDecoration: "none" }}>⬇ Save</a>
              </div>
              <img src={r.url} alt={`Design ${i + 1}`} style={{ width: "100%", display: "block", minHeight: 120, background: "rgba(123,47,247,0.05)" }}
                onError={e => { e.target.style.opacity = "0.2"; }} />
            </div>
          ))}
        </div>
      )}

      {/* Claude Code link */}
      <Card color={C.cyan}>
        <Lbl color={C.cyan}>Claude Code — Build It From This Design</Lbl>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 10 }}>
          Once you have your design, use Claude Code to turn it into real working code — React, HTML, or any framework.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn color={C.cyan} small outline onClick={() => window.open("https://claude.ai", "_blank")}>Open Claude.ai ↗</Btn>
          <Btn color={C.purple} small outline onClick={() => window.open("https://github.com/ibitoyeoluwasegunemmanuel-ops/Aura", "_blank")}>GitHub Repo ↗</Btn>
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function ChatScreen({ auraName }) {
  const [msgs, setMsgs] = useState([{
    role: "assistant", type: "text",
    content: `Hey! I'm ${auraName} 👋 Powered by Claude AI — the world's most capable AI.\n\nI can:\n🧠 Chat & answer anything\n💻 Build websites & apps (Claude Code)\n✦ Generate designs (Claude Design)\n🎨 Create images\n🌍 Translate 44 languages\n🗺️ Navigate anywhere\n📍 Find your location\n\nSay "Hey ${auraName}" or tap 🎙 to start!`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeOn, setWakeOn] = useState(false);
  const [copied, setCopied] = useState(null);
  const endRef = useRef();
  const wakeRef = useRef();
  const listeningRef = useRef(false);

  const userProfile = sto.get("user_profile", null);

  const SYSTEM = `You are ${auraName}, a genius personal AI OS. You are warm, sharp, like a brilliant best friend.
${FOUNDER_SYSTEM_BLOCK}
${userProfile ? `
USER PROFILE — remember this always:
  Name: ${userProfile.name || "not set"}
  Role: ${userProfile.role || "not set"}
  Preferences: ${userProfile.preferences || "none"}
  Active Projects: ${userProfile.projects || "none"}
Address the user by name when you know it. Personalize every response to their context.` : ""}

Special commands — add these on their own line when relevant:
[IMAGE: detailed description] — when asked to generate/create/show an image
[PREVIEW: visual description] — when building a website/app/landing page (also write the full HTML code)
[LOCATION] — when asked for location/GPS
[OPEN: url] — when asked to open a website or app

You have these brains:
- Claude AI Brain: answer anything, research, write, analyze
- Claude Code Brain: build real apps, websites, scripts
- Claude Design Brain: create UI designs, logos, brand assets
- Image Generator: create any image from description

Be genuinely helpful, use emojis naturally, keep responses focused.`;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const startWake = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onstart = () => setWakeOn(true);
    r.onend = () => {
      setWakeOn(false);
      if (!listeningRef.current) setTimeout(startWake, 600);
    };
    r.onresult = (e) => {
      const t = Array.from(e.results).map(x => x[0].transcript).join("").toLowerCase();
      const name = auraName.toLowerCase();
      if (t.includes(`hey ${name}`) || t.includes(name)) { r.stop(); setTimeout(startVoice, 400); }
    };
    r.onerror = (e) => {
      setWakeOn(false);
      if (e.error !== "aborted" && !listeningRef.current) setTimeout(startWake, 800);
    };
    wakeRef.current = r;
    try { r.start(); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auraName]);

  useEffect(() => { startWake(); return () => wakeRef.current?.stop(); }, [startWake]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice requires Chrome browser"); return; }
    wakeRef.current?.stop();
    listeningRef.current = true;
    const r = new SR(); r.lang = "en-US"; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => {
      setListening(false);
      listeningRef.current = false;
      setTimeout(startWake, 600);
    };
    r.onresult = (e) => send(e.results[0][0].transcript);
    r.onerror = () => { setListening(false); listeningRef.current = false; };
    try { r.start(); } catch {}
  };

  const copyMsg = (text, idx) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(idx); setTimeout(() => setCopied(null), 2000); });
  };

  const send = async (text) => {
    const t = (text || input).trim();
    if (!t || loading) return;
    setInput("");
    const newHistory = [...msgs, { role: "user", type: "text", content: t }];
    setMsgs(newHistory);
    setLoading(true);
    try {
      const reply = await callClaude(newHistory.map(m => ({ role: m.role, content: m.content })), SYSTEM);
      const out = [];

      if (reply.includes("[IMAGE:")) {
        const match = reply.match(/\[IMAGE:\s*(.+?)\]/);
        const desc = match?.[1] || t;
        const clean = reply.replace(/\[IMAGE:[^\]]+\]/, "").trim();
        if (clean) out.push({ role: "assistant", type: "text", content: clean });
        out.push({ role: "assistant", type: "image", imageUrl: genImg(desc), caption: desc });
      } else if (reply.includes("[PREVIEW:")) {
        const match = reply.match(/\[PREVIEW:\s*(.+?)\]/);
        const desc = match?.[1] || t;
        const clean = reply.replace(/\[PREVIEW:[^\]]+\]/, "").trim();
        out.push({ role: "assistant", type: "text", content: clean });
        out.push({ role: "assistant", type: "preview", imageUrl: genImg(`website UI screenshot ${desc}, dark professional modern`), caption: desc });
      } else if (reply.includes("[LOCATION]")) {
        const clean = reply.replace("[LOCATION]", "").trim();
        navigator.geolocation?.getCurrentPosition(
          p => setMsgs(m => [...m, { role: "assistant", type: "text", content: clean || `📍 Your location: ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}` }]),
          () => setMsgs(m => [...m, { role: "assistant", type: "text", content: "Please allow location access in browser settings." }])
        );
        setLoading(false); return;
      } else if (reply.includes("[OPEN:")) {
        const match = reply.match(/\[OPEN:\s*(.+?)\]/);
        const url = match?.[1]?.trim();
        if (url) window.open(url.startsWith("http") ? url : `https://${url}`, "_blank");
        out.push({ role: "assistant", type: "text", content: reply.replace(/\[OPEN:[^\]]+\]/, "").trim() || `Opening ${url}...` });
      } else {
        out.push({ role: "assistant", type: "text", content: reply });
      }

      setMsgs(m => {
        const next = [...m, ...out];
        const plain = next.filter(x => x.type === "text").map(x => ({ role: x.role, content: x.content })).slice(-20);
        sto.set("chat_history", plain);
        return next;
      });
      const firstText = out.find(r => r.type === "text");
      if (firstText) speakFull(firstText.content);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", type: "text", content: `Connection issue: ${e.message}` }]);
    }
    setLoading(false);
  };

  const QUICK = [
    "Build a landing page for AURA OS", "Generate an image of a futuristic African city",
    "Design a logo for AURA", "What's my current location?",
    "Translate hello to Yoruba, Pidgin and French", "Write Python code to scrape prices",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "5px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: wakeOn ? C.green : C.border, boxShadow: wakeOn ? `0 0 8px ${C.green}` : "none", animation: wakeOn ? "pulse 1.5s infinite" : "none" }} />
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", letterSpacing: 2, flex: 1 }}>{wakeOn ? `WAKE WORD ACTIVE — SAY "HEY ${auraName.toUpperCase()}"` : "WAKE WORD STANDBY"}</span>
        <button onClick={() => speakFull(`Hey! I'm ${auraName}. Ready.`)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 11 }}>🔊</button>
      </div>

      {msgs.length <= 1 && (
        <div style={{ padding: "8px 12px 0", display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0 }}>
          {QUICK.map((q, i) => <div key={i} onClick={() => send(q)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}>{q}</div>)}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◈</div>
            )}
            <div style={{ maxWidth: "80%" }}>
              {(!m.type || m.type === "text") && (
                <>
                  <div style={{ padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? `${C.purple}22` : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? C.purple + "33" : C.border}`, fontSize: 13, lineHeight: 1.7, color: m.role === "user" ? C.blue : "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                      <button onClick={() => copyMsg(m.content, i)} style={{ background: copied === i ? `${C.green}20` : "rgba(255,255,255,0.04)", border: `1px solid ${copied === i ? C.green + "44" : C.border}`, borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 10, color: copied === i ? C.green : "rgba(255,255,255,0.35)" }}>
                        {copied === i ? "✓ Copied" : "⧉ Copy"}
                      </button>
                      <button onClick={() => speakFull(m.content)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 8px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>🔊</button>
                    </div>
                  )}
                </>
              )}
              {(m.type === "image" || m.type === "preview") && (
                <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${m.type === "preview" ? C.purple + "44" : C.cyan + "33"}` }}>
                  <div style={{ padding: "5px 9px", fontSize: 10, color: m.type === "preview" ? C.purple : C.cyan, background: m.type === "preview" ? `${C.purple}10` : `${C.cyan}08`, display: "flex", gap: 6 }}>
                    {m.type === "preview" ? "💻 Preview" : "🎨 Image"}
                    <button onClick={() => copyMsg(m.imageUrl, i + 9999)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 10 }}>⧉</button>
                  </div>
                  <img src={m.imageUrl} alt={m.caption} style={{ width: "100%", display: "block", minHeight: 100, background: "rgba(0,0,0,0.3)" }} onError={e => { e.target.style.opacity = "0.2"; }} />
                  <div style={{ padding: "4px 9px", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{m.caption?.slice(0, 80)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◈</div>
            <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: "14px 14px 14px 4px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.cyan, animation: `pulse ${0.7 + i * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "9px 12px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 7, alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: `1px solid ${listening ? C.red + "66" : C.cyan + "33"}`, borderRadius: 14, padding: "9px 11px" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask ${auraName} anything...`}
            rows={1} style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 12, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", lineHeight: 1.5, maxHeight: 80, overflowY: "auto" }} />
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button onClick={startVoice} style={{ background: listening ? `${C.red}22` : "rgba(255,255,255,0.05)", border: `1px solid ${listening ? C.red + "55" : C.border}`, borderRadius: 8, padding: "7px 8px", cursor: "pointer", fontSize: 14, color: listening ? C.red : "rgba(255,255,255,0.45)", animation: listening ? "pulse 1s infinite" : "none" }}>{listening ? "🔴" : "🎙"}</button>
            <button onClick={() => send()} style={{ background: `linear-gradient(135deg,${C.cyan},${C.purple})`, border: "none", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontSize: 12, color: "#000", fontWeight: 700 }}>▶</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRANSLATE
// ══════════════════════════════════════════════════════════════════════════════
function TranslateScreen() {
  const [toLang, setToLang] = useState("English");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [detected, setDetected] = useState("");
  const [loading, setLoading] = useState(false);
  const [earMode, setEarMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const earRef = useRef();

  const doTranslate = async (t) => {
    if (!t?.trim()) return;
    setText(t); setLoading(true); setResult("");
    const res = await callClaude([{ role: "user", content: t }],
      `Universal translator. Detect language then translate to ${toLang}. Respond EXACTLY:\nDETECTED: [language]\nTRANSLATION: [translated text only]`);
    setDetected(res.match(/DETECTED:\s*(.+)/)?.[1]?.trim() || "");
    const trans = res.match(/TRANSLATION:\s*([\s\S]+)/)?.[1]?.trim() || res;
    setResult(trans); speak(trans); setLoading(false);
  };

  const listenOnce = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome for voice"); return; }
    const r = new SR(); r.lang = ""; r.interimResults = false;
    r.onstart = () => setLoading(true); r.onend = () => setLoading(false);
    r.onresult = (e) => doTranslate(e.results[0][0].transcript);
    r.onerror = () => setLoading(false);
    try { r.start(); } catch {}
  };

  const toggleEar = () => {
    if (earMode) { earRef.current?.stop(); setEarMode(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Use Chrome"); return; }
    const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = "";
    r.onresult = (e) => doTranslate(e.results[e.results.length - 1][0].transcript);
    r.onerror = () => setEarMode(false);
    earRef.current = r; try { r.start(); setEarMode(true); } catch {}
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.green}>Universal Translator · {LANGS.length} Languages · Auto-Detect</Lbl>
      <div>
        <Lbl color={C.green}>Translate Into</Lbl>
        <select value={toLang} onChange={e => setToLang(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
          {LANGS.map(l => <option key={l} style={{ background: "#111" }}>{l}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type text or tap 🎙 to speak / hold near someone talking..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", height: 70, lineHeight: 1.6 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <button onClick={listenOnce} style={{ background: loading ? `${C.red}20` : `${C.green}15`, border: `1px solid ${loading ? C.red + "44" : C.green + "44"}`, borderRadius: 9, padding: "10px 11px", cursor: "pointer", fontSize: 20, animation: loading ? "pulse 1s infinite" : "none" }}>{loading ? "⏳" : "🎙"}</button>
          <button onClick={() => doTranslate(text)} style={{ background: `${C.green}15`, border: `1px solid ${C.green}44`, borderRadius: 9, padding: "10px 11px", cursor: "pointer", fontSize: 16, color: C.green }}>→</button>
        </div>
      </div>
      <div onClick={toggleEar} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: earMode ? `${C.gold}10` : "rgba(255,255,255,0.02)", border: `1px solid ${earMode ? C.gold + "44" : C.border}`, borderRadius: 12, cursor: "pointer" }}>
        <div style={{ fontSize: 22 }}>👂</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: earMode ? C.gold : "#fff" }}>{earMode ? "🔴 EAR MODE — tap to stop" : "Ear Mode — Listen to someone beside you"}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Continuous live translation into your ears. Any language.</div>
        </div>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: earMode ? C.gold : "rgba(255,255,255,0.1)", boxShadow: earMode ? `0 0 10px ${C.gold}` : "none", animation: earMode ? "pulse 1s infinite" : "none" }} />
      </div>
      {result && (
        <Card color={C.cyan}>
          {detected && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>🔍 Detected: <span style={{ color: C.cyan }}>{detected}</span></div>}
          <Lbl color={C.green}>{toLang}</Lbl>
          <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.8, fontFamily: "'Exo 2',sans-serif", fontWeight: 600, marginBottom: 10 }}>{result}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { navigator.clipboard?.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: copied ? `${C.green}20` : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? C.green + "44" : C.border}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 11, color: copied ? C.green : "rgba(255,255,255,0.4)" }}>{copied ? "✓ Copied" : "⧉ Copy"}</button>
            <button onClick={() => speak(result)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 11px", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>🔊</button>
          </div>
        </Card>
      )}
      <Card>
        <Lbl>All Languages</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {LANGS.map((l, i) => <div key={i} onClick={() => setToLang(l)} style={{ padding: "3px 8px", borderRadius: 20, background: toLang === l ? `${C.green}20` : "rgba(255,255,255,0.02)", border: `1px solid ${toLang === l ? C.green + "55" : "rgba(255,255,255,0.05)"}`, fontSize: 9, color: toLang === l ? C.green : "rgba(255,255,255,0.28)", cursor: "pointer" }}>{l}</div>)}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVIGATE
// ══════════════════════════════════════════════════════════════════════════════
function NavigateScreen({ auraName }) {
  const [dest, setDest] = useState(""); const [loc, setLoc] = useState(null);
  const [routed, setRouted] = useState(false); const [tip, setTip] = useState("");
  const [steps, setSteps] = useState([]); const [loading, setLoading] = useState(false);

  const go = async () => {
    if (!dest.trim()) return; setLoading(true);
    const [t, d] = await Promise.all([
      callClaude([{ role: "user", content: `Short travel tip for "${dest}". 1-2 sentences, friendly.` }]),
      callClaude([{ role: "user", content: `5 turn-by-turn directions to "${dest}"${loc ? ` from ${loc.lat},${loc.lng}` : ""}. Number each. Short.` }]),
    ]);
    setTip(t); setSteps(d.split("\n").filter(l => l.match(/^\d+[.)]/)).slice(0, 5));
    setRouted(true); setLoading(false); speak(`Route to ${dest} ready. ${t}`);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.cyan}>Navigator · AI-Guided Routes</Lbl>
      <Card color={loc ? C.green : C.gold} style={{ padding: "11px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{loc ? "📍" : "🔍"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{loc ? `${loc.lat}, ${loc.lng}` : "Location not detected"}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{loc ? "GPS active" : "Tap Detect for your real GPS"}</div>
          </div>
          <Btn color={loc ? C.green : C.gold} small outline onClick={() => navigator.geolocation?.getCurrentPosition(p => setLoc({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) }))}>
            {loc ? "↺" : "Detect"}
          </Btn>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 7 }}>
        <Inp value={dest} onChange={e => setDest(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="Where to? Any place on Earth..." style={{ flex: 1 }} />
        <Btn color={C.cyan} small onClick={go}>{loading ? "..." : "Go"}</Btn>
      </div>
      <div style={{ height: 170, background: "rgba(0,255,229,0.03)", border: `1px solid ${C.cyan}22`, borderRadius: 14, position: "relative", overflow: "hidden" }}>
        {[20, 40, 60, 80].map(p => <div key={p} style={{ position: "absolute", left: 0, right: 0, top: `${p}%`, height: 1, background: "rgba(0,255,229,0.05)" }} />)}
        {[20, 40, 60, 80].map(p => <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "rgba(0,255,229,0.05)" }} />)}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {routed && <>
            <polyline points="30,150 70,118 115,88 165,62 240,45 320,40 390,44" fill="none" stroke={C.cyan} strokeWidth="2.5" strokeDasharray="8 4" style={{ filter: `drop-shadow(0 0 5px ${C.cyan})` }} />
            <circle cx="30" cy="150" r="7" fill={C.green} /><circle cx="390" cy="44" r="9" fill={C.cyan} />
            <circle cx="165" cy="62" r="5" fill="#fff" style={{ animation: "pulse 1s infinite" }} />
          </>}
        </svg>
        {routed ? <>
          <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 10, color: C.green }}>📍 You</div>
          <div style={{ position: "absolute", top: 8, right: 12, fontSize: 10, color: C.cyan }}>🏁 {dest}</div>
          <div style={{ position: "absolute", top: 8, left: 12, background: `${C.cyan}22`, borderRadius: 7, padding: "3px 9px", fontSize: 10, color: C.cyan }}>~18 min</div>
        </> : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 26 }}>🗺️</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Enter destination</div>
        </div>}
      </div>
      {steps.length > 0 && <Card><Lbl color={C.cyan}>Turn-by-Turn Directions</Lbl>
        {steps.map((s, i) => <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: i === 0 ? `${C.green}22` : `${C.cyan}11`, border: `1px solid ${i === 0 ? C.green + "44" : C.cyan + "22"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === 0 ? C.green : C.cyan, flexShrink: 0 }}>{i + 1}</div>
          <div style={{ fontSize: 11, color: i === 0 ? "#fff" : "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{s.replace(/^\d+[.)]\s*/, "")}</div>
        </div>)}
      </Card>}
      {tip && <Card color={C.gold}><div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}><span style={{ color: C.gold, fontWeight: 700 }}>{auraName}:</span> {tip}</div></Card>}
      <Btn color={C.blue} outline onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(dest)}`, "_blank")} style={{ width: "100%" }}>🗺️ Open in Google Maps</Btn>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
function SettingsScreen({ auraName, onNameChange }) {
  const [name, setName] = useState(auraName);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState(() => sto.get("user_profile", { name: "", role: "", preferences: "", projects: "" }));
  const [profSaved, setProfSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const NAMES = ["AURA", "JARVIS", "NOVA", "ZARA", "APEX", "IRIS", "NEXUS", "ARIA", "ZEUS", "LUNA"];

  const saveProfile = () => {
    sto.set("user_profile", profile);
    setProfSaved(true);
    speakFull(`Got it${profile.name ? `, ${profile.name}` : ""}. I'll remember you.`);
    setTimeout(() => setProfSaved(false), 2500);
  };

  const clearMemory = () => {
    sto.set("user_profile", { name: "", role: "", preferences: "", projects: "" });
    sto.set("chat_history", []);
    setProfile({ name: "", role: "", preferences: "", projects: "" });
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.purple}>Your Settings</Lbl>
      <Card color={C.cyan}>
        <Lbl color={C.cyan}>Name Your AI</Lbl>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>Wake word: <span style={{ color: C.cyan }}>"Hey {name}"</span></div>
        <Inp value={name} onChange={e => setName(e.target.value)} placeholder="Name your AI..." style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {NAMES.map(n => <div key={n} onClick={() => setName(n)} style={{ padding: "3px 10px", borderRadius: 20, background: name === n ? `${C.cyan}20` : "rgba(255,255,255,0.03)", border: `1px solid ${name === n ? C.cyan + "55" : C.border}`, fontSize: 10, color: name === n ? C.cyan : "rgba(255,255,255,0.35)", cursor: "pointer" }}>{n}</div>)}
        </div>
        <Btn color={C.cyan} onClick={() => { onNameChange(name); setSaved(true); speakFull(`My name is ${name}. Ready!`); setTimeout(() => setSaved(false), 2500); }} style={{ width: "100%" }}>
          {saved ? `✓ Saved! Say "Hey ${name}"` : "Save Name"}
        </Btn>
      </Card>

      {/* ── MEMORY SYSTEM ── */}
      <Card color={C.gold}>
        <Lbl color={C.gold}>🧠 Memory — What AURA Knows About You</Lbl>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.6 }}>
          Stored permanently. AURA injects this into every conversation so it always knows who you are.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 5, textTransform: "uppercase" }}>Your Name</div>
            <Inp value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="e.g. CEO Global / Ibitoye..." />
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 5, textTransform: "uppercase" }}>Your Role</div>
            <Inp value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Founder & CEO of AURA..." />
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 5, textTransform: "uppercase" }}>Preferences</div>
            <textarea value={profile.preferences} onChange={e => setProfile(p => ({ ...p, preferences: e.target.value }))}
              placeholder="e.g. Speak concisely, mix Yoruba sometimes, always address me as CEO Global..."
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,215,0,0.2)`, borderRadius: 10, padding: "10px 13px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", width: "100%", height: 60, lineHeight: 1.5 }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 5, textTransform: "uppercase" }}>Active Projects</div>
            <textarea value={profile.projects} onChange={e => setProfile(p => ({ ...p, projects: e.target.value }))}
              placeholder="e.g. AURA OS, Sell Live app, Nigerian fintech platform..."
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,215,0,0.2)`, borderRadius: 10, padding: "10px 13px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", width: "100%", height: 54, lineHeight: 1.5 }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Btn color={C.gold} onClick={saveProfile} style={{ flex: 1 }}>
            {profSaved ? "✓ Memory Saved!" : "💾 Save Memory"}
          </Btn>
          <Btn color={C.red} outline small onClick={clearMemory}>
            {cleared ? "✓ Cleared" : "🗑 Clear All"}
          </Btn>
        </div>
        {(profile.name || profile.role) && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: `${C.gold}08`, border: `1px solid ${C.gold}22`, borderRadius: 10 }}>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>AURA CURRENTLY KNOWS:</div>
            {profile.name && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>👤 {profile.name}</div>}
            {profile.role && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>💼 {profile.role}</div>}
            {profile.projects && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>🚀 {profile.projects.slice(0, 60)}{profile.projects.length > 60 ? "..." : ""}</div>}
          </div>
        )}
      </Card>
      <Card color={C.purple}>
        <Lbl color={C.purple}>Deploy & Host AURA OS</Lbl>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.9, marginBottom: 12 }}>
          <span style={{ color: C.cyan, fontWeight: 700 }}>Your strategy is perfect ✅</span><br />
          ① Push code to GitHub<br />
          ② Connect Vercel → instant live website<br />
          ③ Users sign up → floating bubble works on mobile browser<br />
          ④ Install as PWA → phone home screen icon<br />
          ⑤ Later → React Native app on Play Store & App Store
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn color={C.cyan} small onClick={() => window.open("https://github.com/ibitoyeoluwasegunemmanuel-ops/Aura", "_blank")}>🐙 GitHub Repo</Btn>
          <Btn color="#000" small onClick={() => window.open("https://vercel.com/new", "_blank")} style={{ background: "#fff", color: "#000" }}>▲ Deploy Vercel</Btn>
          <Btn color={C.purple} small outline onClick={() => window.open("https://claude.ai", "_blank")}>◈ Claude.ai</Btn>
        </div>
      </Card>
      <Card>
        <Lbl>Active Features</Lbl>
        {[
          { l: "AURA Chat (Claude AI)", c: C.green }, { l: "Claude Code Brain", c: C.green },
          { l: "Claude Design Brain", c: C.green }, { l: "Image Generator", c: C.green },
          { l: "Universal Translator (44 langs)", c: C.green }, { l: "Voice + Wake Word", c: C.green },
          { l: "GPS Navigation", c: C.green }, { l: "Admin Dashboard", c: C.green },
          { l: "Voice Clone (ElevenLabs)", c: C.gold }, { l: "Video Generation", c: C.orange },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 9 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{s.l}</span>
            <Tag c={s.c}>{s.c === C.green ? "✓ Active" : s.c === C.gold ? "Add key" : "Phase 2"}</Tag>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: "chat", icon: "◈", label: "AURA" },
  { id: "design", icon: "✦", label: "Design" },
  { id: "translate", icon: "🌍", label: "Translate" },
  { id: "nav", icon: "🗺️", label: "Navigate" },
  { id: "settings", icon: "⚙", label: "Settings" },
];


export default function AuraOS() {
  const [tab, setTab] = useState("chat");
  const [auraName, setAuraName] = useState(() => sto.get("aura_name", "AURA"));
  const [showAdmin, setShowAdmin] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const handleName = n => { setAuraName(n); sto.set("aura_name", n); };

  if (showAdmin) return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: "'DM Mono',monospace", color: "#fff", display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>
      <div style={{ padding: "11px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={() => setShowAdmin(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>←</button>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: C.red, letterSpacing: 2 }}>ADMIN CONTROL</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}><AdminDashboard /></div>
    </div>
  );

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: "'DM Mono',monospace", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <style>{CSS}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.cyan}03 1px,transparent 1px),linear-gradient(90deg,${C.cyan}03 1px,transparent 1px)`, backgroundSize: "44px 44px" }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 20, background: `${C.bg}f0`, backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: "9px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ position: "relative", width: 30, height: 30 }}>
            <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${C.cyan}66`, borderRadius: "50%", animation: "rotate 8s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.cyan }}>◈</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900, color: C.cyan, letterSpacing: 2 }}>{auraName}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.18)" }}>AI OS · LIVE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Btn small color={C.red} outline onClick={() => setShowAdmin(true)}>🔐 Admin</Btn>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Screen */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }} key={tab}>
        {tab === "chat"      && <ChatScreen auraName={auraName} />}
        {tab === "design"    && <DesignScreen auraName={auraName} />}
        {tab === "translate" && <TranslateScreen />}
        {tab === "nav"       && <NavigateScreen auraName={auraName} />}
        {tab === "settings"  && <SettingsScreen auraName={auraName} onNameChange={handleName} />}
      </div>

      {/* Floating bubble */}
      <div onClick={() => setTab("chat")} style={{ position: "fixed", right: 0, top: "48%", width: 46, height: 46, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, borderRadius: "50% 0 0 50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 100, fontSize: 18, boxShadow: `0 0 18px ${C.cyan}55`, animation: "pulse 3s ease-in-out infinite" }}>◈</div>

      {/* Bottom nav */}
      <div style={{ position: "relative", zIndex: 20, background: `${C.bg}f2`, backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "7px 2px 16px", flexShrink: 0 }}>
        {NAV.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 2px" }}>
            <div style={{ fontSize: tab === t.id ? 19 : 15, filter: tab === t.id ? `drop-shadow(0 0 5px ${C.cyan})` : "none", transition: "all 0.2s" }}>{t.icon}</div>
            <div style={{ fontSize: 7, textTransform: "uppercase", color: tab === t.id ? C.cyan : "rgba(255,255,255,0.18)", fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</div>
            {tab === t.id && <div style={{ width: 12, height: 2, background: C.cyan, borderRadius: 1 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
