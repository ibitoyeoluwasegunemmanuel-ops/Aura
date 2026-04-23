import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Tag, Lbl, Inp } from "../components/ui";
import { speakFull } from "../utils/voice";
import { sto } from "../utils/storage";

const NAMES = ["AURA","JARVIS","NOVA","ZARA","APEX","IRIS","NEXUS","ARIA","ZEUS","LUNA"];

export default function SettingsScreen({ auraName, onNameChange, session, onLogout }) {
  const [name, setName]   = useState(auraName);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState(() => sto.get("user_profile", { name: "", role: "", preferences: "", projects: "" }));
  const [profSaved, setProfSaved] = useState(false);
  const [cleared, setCleared]     = useState(false);

  const saveProfile = () => {
    sto.set("user_profile", profile);
    setProfSaved(true);
    speakFull(`Got it${profile.name ? `, ${profile.name}` : ""}. I'll remember you.`);
    setTimeout(() => setProfSaved(false), 2500);
  };

  const clearMemory = () => {
    const empty = { name: "", role: "", preferences: "", projects: "" };
    sto.set("user_profile", empty);
    sto.set("chat_history", []);
    setProfile(empty);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.purple}>Your Settings</Lbl>

      {/* AI Name */}
      <Card color={C.cyan}>
        <Lbl color={C.cyan}>Name Your AI</Lbl>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>Wake word: <span style={{ color: C.cyan }}>"Hey {name}"</span></div>
        <Inp value={name} onChange={e => setName(e.target.value)} placeholder="Name your AI..." style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {NAMES.map(n => (
            <div key={n} onClick={() => setName(n)} style={{ padding: "3px 10px", borderRadius: 20, background: name === n ? `${C.cyan}20` : "rgba(255,255,255,0.03)", border: `1px solid ${name === n ? C.cyan + "55" : C.border}`, fontSize: 10, color: name === n ? C.cyan : "rgba(255,255,255,0.35)", cursor: "pointer" }}>{n}</div>
          ))}
        </div>
        <Btn color={C.cyan} onClick={() => { onNameChange(name); setSaved(true); speakFull(`My name is ${name}. Ready!`); setTimeout(() => setSaved(false), 2500); }} style={{ width: "100%" }}>
          {saved ? `✓ Saved! Say "Hey ${name}"` : "Save Name"}
        </Btn>
      </Card>

      {/* Memory System */}
      <Card color={C.gold}>
        <Lbl color={C.gold}>🧠 Memory — What AURA Knows About You</Lbl>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.6 }}>
          Stored permanently. AURA injects this into every conversation so it always knows who you are.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[
            { key: "name",        label: "Your Name",     ph: "e.g. CEO Global / Ibitoye...", multi: false },
            { key: "role",        label: "Your Role",     ph: "e.g. Founder & CEO of AURA...", multi: false },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <div style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
              <Inp value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
            </div>
          ))}
          {[
            { key: "preferences", label: "Preferences",    ph: "e.g. Speak concisely, mix Yoruba sometimes, address me as CEO Global...", h: 60 },
            { key: "projects",    label: "Active Projects", ph: "e.g. AURA OS, Sell Live app, Nigerian fintech platform...", h: 54 },
          ].map(({ key, label, ph, h }) => (
            <div key={key}>
              <div style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
              <textarea value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,215,0,0.2)`, borderRadius: 10, padding: "10px 13px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", width: "100%", height: h, lineHeight: 1.5 }} />
            </div>
          ))}
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
            {profile.name     && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>👤 {profile.name}</div>}
            {profile.role     && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>💼 {profile.role}</div>}
            {profile.projects && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>🚀 {profile.projects.slice(0, 60)}{profile.projects.length > 60 ? "..." : ""}</div>}
          </div>
        )}
      </Card>

      {/* Account card */}
      {session && (
        <Card color={C.cyan}>
          <Lbl color={C.cyan}>👤 Your Account</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Name</span>
              <span style={{ fontSize: 11, color: "#fff" }}>{session.name}</span>
            </div>
            {session.email && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Email</span>
                <span style={{ fontSize: 11, color: "#fff" }}>{session.email}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Role</span>
              <span style={{ fontSize: 11, color: session.role === "guest" ? C.gold : C.green, textTransform: "capitalize" }}>{session.role}</span>
            </div>
          </div>
          {onLogout && (
            <Btn color={C.red} outline small onClick={onLogout} style={{ width: "100%" }}>
              🚪 Sign Out
            </Btn>
          )}
        </Card>
      )}

      {/* Deploy card */}
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

      {/* Active Features — updated */}
      <Card>
        <Lbl>Active Features</Lbl>
        {[
          { l: "AURA Chat (Claude AI)",            c: C.green  },
          { l: "Auth System (Login / Register)",  c: C.green  },
          { l: "Founder Identity Lock (CEO Global)", c: C.green },
          { l: "Memory System (persistent)",      c: C.green  },
          { l: "Streaming Responses",             c: C.green  },
          { l: "Voice AI — speakFull (no cutoff)", c: C.green },
          { l: "Wake Word (auto-restart)",        c: C.green  },
          { l: "Automation Engine (6 workflows)", c: C.green  },
          { l: "WhatsApp Quick Send",             c: C.green  },
          { l: "Tasks & Reminders",               c: C.green  },
          { l: "Claude Code Brain",               c: C.green  },
          { l: "Claude Design Brain",             c: C.green  },
          { l: "Image Generator",                 c: C.green  },
          { l: "Universal Translator (44 langs)", c: C.green  },
          { l: "GPS Navigation",                  c: C.green  },
          { l: "Admin Dashboard",                 c: C.green  },
          { l: "Voice Clone (ElevenLabs)",        c: C.gold   },
          { l: "WhatsApp Business API",           c: C.gold   },
          { l: "Payment System (Flutterwave)",    c: C.gold   },
          { l: "Firebase Real Database",          c: C.gold   },
          { l: "Email Automation",                c: C.orange },
          { l: "Social Media API",                c: C.orange },
          { l: "Video Generation",                c: C.orange },
          { l: "AR Glasses",                      c: C.purple },
        ].map((s, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{s.l}</span>
            <Tag c={s.c}>{s.c === C.green ? "✓ Active" : s.c === C.gold ? "Add key" : s.c === C.orange ? "Phase 2" : "Phase 3"}</Tag>
          </div>
        ))}
      </Card>
    </div>
  );
}
