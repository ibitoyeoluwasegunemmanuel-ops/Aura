import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Tag, Lbl, Inp } from "../components/ui";
import { sto } from "../utils/storage";

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

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("overview");
  const [prices, setPrices] = useState(() => sto.get("prices", { starter: 29, pro: 99, elite: 199, enterprise: 999 }));
  const [pSaved, setPSaved] = useState(false);
  const [keys, setKeys] = useState(() => sto.get("admin_keys", { anthropic: "", googlemaps: "", stripe: "", flutterwave: "", paystack: "", elevenlabs: "", github: "", figma: "" }));
  const [kSaved, setKSaved] = useState(false);
  const [showKey, setShowKey] = useState({});
  const [newPw, setNewPw] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  if (!unlocked) return <AdminGate onUnlock={() => setUnlocked(true)} />;

  const API_SERVICES = [
    { key: "anthropic",   name: "Anthropic — Claude AI",      icon: "🤖", color: C.cyan,    desc: "Powers AURA's brain. Required.",        url: "https://console.anthropic.com/settings/keys" },
    { key: "googlemaps",  name: "Google Maps",                 icon: "🗺️", color: C.blue,    desc: "Full routing & search.",                url: "https://console.cloud.google.com/apis/credentials" },
    { key: "stripe",      name: "Stripe",                      icon: "💳", color: "#635bff", desc: "Global card payments.",                  url: "https://dashboard.stripe.com/apikeys" },
    { key: "flutterwave", name: "Flutterwave",                 icon: "🌊", color: C.gold,    desc: "Africa payments — NG, GH, KE...",       url: "https://app.flutterwave.com/settings/apis" },
    { key: "paystack",    name: "Paystack",                    icon: "🟢", color: C.green,   desc: "Nigeria & Africa payments.",             url: "https://dashboard.paystack.com/#/settings/developers" },
    { key: "elevenlabs",  name: "ElevenLabs — Voice Clone",    icon: "🎙", color: C.pink,    desc: "AURA sounds exactly like you.",          url: "https://elevenlabs.io/app/settings/api-keys" },
    { key: "github",      name: "GitHub",                      icon: "🐙", color: "#fff",    desc: "Push code, open repos.",                url: "https://github.com/settings/tokens/new" },
    { key: "figma",       name: "Figma",                       icon: "🎨", color: "#ff7262", desc: "Open designs, export assets.",           url: "https://www.figma.com/settings" },
  ];

  const USERS = [
    { name: "Marcus J.",  email: "marcus@x.com", plan: "Elite",   rev: prices.elite,   active: true,  flag: "🇳🇬", s: 847 },
    { name: "Aisha W.",   email: "aisha@x.com",  plan: "Pro",     rev: prices.pro,     active: true,  flag: "🇿🇦", s: 523 },
    { name: "David C.",   email: "david@x.com",  plan: "Starter", rev: prices.starter, active: true,  flag: "🇨🇳", s: 201 },
    { name: "Fatima H.",  email: "fatima@x.com", plan: "Elite",   rev: prices.elite,   active: true,  flag: "🇬🇭", s: 634 },
    { name: "James O.",   email: "james@x.com",  plan: "Pro",     rev: prices.pro,     active: false, flag: "🇳🇬", s: 89  },
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
            {[
              { l: "MRR",       v: `$${MRR}`,                               c: C.gold,   i: "💰" },
              { l: "Users",     v: `${USERS.filter(u => u.active).length}/${USERS.length}`, c: C.cyan,   i: "👥" },
              { l: "Images",    v: "14.8k",                                  c: C.pink,   i: "🎨" },
              { l: "Designs",   v: "3,210",                                  c: C.purple, i: "✦"  },
              { l: "Translates",v: "8,441",                                  c: C.green,  i: "🌍" },
              { l: "Churn",     v: "1.8%",                                   c: C.red,    i: "📉" },
            ].map((m, i) => (
              <Card key={i} color={m.c} style={{ padding: "11px 13px" }}>
                <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{m.i}</span>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{m.l}</div>
                </div>
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
            { n: "Stripe",      l: "💳", r: "Global",         c: "#635bff", k: keys.stripe },
            { n: "Flutterwave", l: "🌊", r: "Africa-first",   c: C.gold,    k: keys.flutterwave },
            { n: "Paystack",    l: "🟢", r: "Nigeria/Africa", c: C.green,   k: keys.paystack },
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
              { l: "Claude AI (Brain)",    s: "live",    c: C.green  },
              { l: "Founder Identity Lock",s: "live",    c: C.green  },
              { l: "Memory System",        s: "live",    c: C.green  },
              { l: "Image Generator",      s: "live",    c: C.green  },
              { l: "Voice AI (speakFull)", s: "live",    c: C.green  },
              { l: "Wake Word",            s: "live",    c: C.green  },
              { l: "Translator",           s: "live",    c: C.green  },
              { l: "GPS Navigation",       s: "live",    c: C.green  },
              { l: "Claude Design",        s: "live",    c: C.green  },
              { l: "Claude Code",          s: "live",    c: C.green  },
              { l: "Google Maps Full",     s: keys.googlemaps  ? "active" : "add key", c: keys.googlemaps  ? C.green : C.gold },
              { l: "Stripe",               s: keys.stripe      ? "active" : "add key", c: keys.stripe      ? C.green : C.gold },
              { l: "Flutterwave",          s: keys.flutterwave ? "active" : "add key", c: keys.flutterwave ? C.green : C.gold },
              { l: "Paystack",             s: keys.paystack    ? "active" : "add key", c: keys.paystack    ? C.green : C.gold },
              { l: "Voice Clone",          s: keys.elevenlabs  ? "active" : "add key", c: keys.elevenlabs  ? C.green : C.gold },
              { l: "Video Generation",     s: "Phase 2", c: C.orange },
              { l: "AR Glasses",           s: "Phase 3", c: C.purple },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
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
