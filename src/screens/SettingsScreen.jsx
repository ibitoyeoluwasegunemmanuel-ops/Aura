import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Inp, Progress } from "../components/ui";
import { speakFull } from "../utils/voice";
import { sto } from "../utils/storage";

const NAMES = ["AURA","JARVIS","NOVA","ZARA","APEX","IRIS","NEXUS","ARIA","ZEUS","LUNA"];
const LANGS = [
  { code: "en-US", label: "English (US)"   },
  { code: "en-GB", label: "English (UK)"   },
  { code: "yo",    label: "Yoruba"          },
  { code: "fr",    label: "French"          },
  { code: "es",    label: "Spanish"         },
  { code: "pt",    label: "Portuguese"      },
  { code: "de",    label: "German"          },
  { code: "ar",    label: "Arabic"          },
  { code: "zh",    label: "Chinese"         },
  { code: "hi",    label: "Hindi"           },
];

const Section = ({ title, children, color }) => (
  <div>
    <div style={{ fontSize: 11, color: color || "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingLeft: 2 }}>{title}</div>
    {children}
  </div>
);

export default function SettingsScreen({ auraName, onNameChange, session, onLogout }) {
  const [name, setName]   = useState(auraName);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState(() => sto.get("user_profile", { name: "", role: "", preferences: "", projects: "" }));
  const [profSaved, setProfSaved] = useState(false);
  const [cleared, setCleared]     = useState(false);
  const [lang, setLang]           = useState(() => sto.get("aura_lang", "en-US"));
  const [langSaved, setLangSaved] = useState(false);

  const saveProfile = () => {
    sto.set("user_profile", profile);
    setProfSaved(true);
    speakFull(`Got it${profile.name ? `, ${profile.name}` : ""}. I'll remember you.`);
    setTimeout(() => setProfSaved(false), 2500);
  };

  const clearMemory = () => {
    const empty = { name: "", role: "", preferences: "", projects: "" };
    sto.set("user_profile", empty);
    setProfile(empty);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const saveLang = () => {
    sto.set("aura_lang", lang);
    setLangSaved(true);
    speakFull("Language updated.");
    setTimeout(() => setLangSaved(false), 2000);
  };

  const planLabel = session?.role === "guest" ? "Free" : session?.role === "user" ? "User" : (session?.role || "Free");
  const isPro = session?.role === "pro" || session?.role === "admin";

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24, height: "100%", overflowY: "auto" }}>

      {/* ── ACCOUNT CARD ── */}
      {session && (
        <Section title="Account">
          <Card color={C.cyan}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#000", flexShrink: 0 }}>
                {session.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.name}</div>
                {session.email && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.email}</div>}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, padding: "2px 10px", borderRadius: 20, background: isPro ? `${C.gold}20` : `${C.green}15`, border: `1px solid ${isPro ? C.gold + "44" : C.green + "33"}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: isPro ? C.gold : C.green }} />
                  <span style={{ fontSize: 11, color: isPro ? C.gold : C.green, fontWeight: 700 }}>{planLabel} Plan</span>
                </div>
              </div>
            </div>

            {/* Usage bar */}
            <div style={{ marginBottom: 14 }}>
              <Progress value={isPro ? 28 : 65} color={isPro ? C.gold : C.cyan} label="Usage this month" />
            </div>

            {!isPro && (
              <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}22`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 4 }}>Upgrade to Pro</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 10 }}>Unlimited conversations, priority voice, advanced AI models, and more.</div>
                <Btn color={C.gold} style={{ width: "100%" }}>✦ Upgrade Plan</Btn>
              </div>
            )}

            {onLogout && (
              <Btn color={C.red} outline onClick={onLogout} style={{ width: "100%" }}>🚪 Sign Out</Btn>
            )}
          </Card>
        </Section>
      )}

      {/* ── LANGUAGE ── */}
      <Section title="Language & Voice">
        <Card>
          <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginBottom: 4 }}>Response Language</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>The language {auraName} speaks and understands.</div>
          <select value={lang} onChange={e => setLang(e.target.value)}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, fontFamily: "'DM Mono',monospace", outline: "none", marginBottom: 12 }}>
            {LANGS.map(l => <option key={l.code} value={l.code} style={{ background: "#111" }}>{l.label}</option>)}
          </select>
          <Btn color={C.cyan} onClick={saveLang} style={{ width: "100%" }}>
            {langSaved ? "✓ Saved" : "Save Language"}
          </Btn>
        </Card>
      </Section>

      {/* ── AI NAME ── */}
      <Section title="AI Personality">
        <Card color={C.purple}>
          <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginBottom: 4 }}>Name Your AI</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
            Wake word: <span style={{ color: C.cyan }}>"Hey {name}"</span> · Say it to activate voice
          </div>
          <Inp value={name} onChange={e => setName(e.target.value)} placeholder="Name your AI…" style={{ marginBottom: 12, fontSize: 14 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {NAMES.map(n => (
              <div key={n} onClick={() => setName(n)} style={{ padding: "5px 13px", borderRadius: 20, background: name === n ? `${C.purple}22` : "rgba(255,255,255,0.03)", border: `1px solid ${name === n ? C.purple + "55" : C.border}`, fontSize: 12, color: name === n ? C.purple : "rgba(255,255,255,0.4)", cursor: "pointer" }}>{n}</div>
            ))}
          </div>
          <Btn color={C.purple} onClick={() => { onNameChange(name); setSaved(true); speakFull(`My name is ${name}. Ready!`); setTimeout(() => setSaved(false), 2500); }} style={{ width: "100%" }}>
            {saved ? `✓ Saved! Say "Hey ${name}"` : "Save Name"}
          </Btn>
        </Card>
      </Section>

      {/* ── MEMORY ── */}
      <Section title="Memory">
        <Card color={C.gold}>
          <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginBottom: 4 }}>What {auraName} Knows About You</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 16 }}>
            Injected into every conversation so {auraName} always knows who you are.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "name", label: "Your Name", ph: "e.g. Ibitoye Oluwasegun Emmanuel" },
              { key: "role", label: "Your Role", ph: "e.g. Founder & CEO of AURA" },
            ].map(({ key, label, ph }) => (
              <div key={key}>
                <div style={{ fontSize: 12, color: C.gold, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
                <Inp value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={{ fontSize: 13 }} />
              </div>
            ))}
            {[
              { key: "preferences", label: "Preferences", ph: "e.g. Speak concisely, mix Yoruba sometimes, address me as CEO Global…", h: 70 },
              { key: "projects",    label: "Active Projects", ph: "e.g. AURA OS, Sell Live app, Nigerian fintech platform…", h: 64 },
            ].map(({ key, label, ph, h }) => (
              <div key={key}>
                <div style={{ fontSize: 12, color: C.gold, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
                <textarea value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,215,0,0.2)`, borderRadius: 10, padding: "11px 13px", color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", width: "100%", height: h, lineHeight: 1.5, boxSizing: "border-box" }} />
              </div>
            ))}
          </div>

          {(profile.name || profile.role) && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: `${C.gold}08`, border: `1px solid ${C.gold}22`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>{auraName.toUpperCase()} KNOWS:</div>
              {profile.name     && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>👤 {profile.name}</div>}
              {profile.role     && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>💼 {profile.role}</div>}
              {profile.projects && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>🚀 {profile.projects.slice(0, 60)}{profile.projects.length > 60 ? "…" : ""}</div>}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn color={C.gold} onClick={saveProfile} style={{ flex: 1 }}>{profSaved ? "✓ Saved!" : "💾 Save Memory"}</Btn>
            <Btn color={C.red} outline small onClick={clearMemory}>{cleared ? "✓ Done" : "🗑 Clear"}</Btn>
          </div>
        </Card>
      </Section>

      {/* ── ABOUT ── */}
      <Section title="About">
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Product",  value: "AURA OS" },
              { label: "Version",  value: "2.0" },
              { label: "Creator",  value: "CEO Global · Ibitoye Oluwasegun Emmanuel" },
              { label: "AI Engine", value: "Claude (Anthropic)" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                <span style={{ fontSize: 13, color: "#fff", textAlign: "right", maxWidth: "58%" }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Admin</span>
              <span style={{ fontSize: 13, color: C.red }}>🔐 via Sidebar</span>
            </div>
          </div>
        </Card>
      </Section>

      <div style={{ height: 20 }} />
    </div>
  );
}
