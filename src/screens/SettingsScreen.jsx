import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Inp } from "../components/ui";
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
      <Lbl color={C.purple}>Settings</Lbl>

      {/* AI Name */}
      <Card color={C.cyan}>
        <Lbl color={C.cyan}>Name Your AI</Lbl>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
          Wake word: <span style={{ color: C.cyan }}>"Hey {name}"</span>
        </div>
        <Inp value={name} onChange={e => setName(e.target.value)} placeholder="Name your AI…" style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {NAMES.map(n => (
            <div key={n} onClick={() => setName(n)} style={{
              padding: "3px 10px", borderRadius: 20,
              background: name === n ? `${C.cyan}20` : "rgba(255,255,255,0.03)",
              border: `1px solid ${name === n ? C.cyan + "55" : C.border}`,
              fontSize: 10, color: name === n ? C.cyan : "rgba(255,255,255,0.35)", cursor: "pointer",
            }}>{n}</div>
          ))}
        </div>
        <Btn color={C.cyan} onClick={() => { onNameChange(name); setSaved(true); speakFull(`My name is ${name}. Ready!`); setTimeout(() => setSaved(false), 2500); }} style={{ width: "100%" }}>
          {saved ? `✓ Saved! Say "Hey ${name}"` : "Save Name"}
        </Btn>
      </Card>

      {/* Memory */}
      <Card color={C.gold}>
        <Lbl color={C.gold}>🧠 Memory — What {auraName} Knows About You</Lbl>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12, lineHeight: 1.6 }}>
          Injected into every conversation so {auraName} always knows who you are.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[
            { key: "name", label: "Your Name", ph: "e.g. Ibitoye Oluwasegun Emmanuel" },
            { key: "role", label: "Your Role", ph: "e.g. Founder & CEO of AURA" },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <div style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
              <Inp value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
            </div>
          ))}
          {[
            { key: "preferences", label: "Preferences", ph: "e.g. Speak concisely, mix Yoruba sometimes, address me as CEO Global…", h: 60 },
            { key: "projects",    label: "Active Projects", ph: "e.g. AURA OS, Sell Live app, Nigerian fintech platform…", h: 54 },
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
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>{auraName.toUpperCase()} CURRENTLY KNOWS:</div>
            {profile.name     && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>👤 {profile.name}</div>}
            {profile.role     && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>💼 {profile.role}</div>}
            {profile.projects && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>🚀 {profile.projects.slice(0, 60)}{profile.projects.length > 60 ? "…" : ""}</div>}
          </div>
        )}
      </Card>

      {/* Account */}
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
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Plan</span>
              <span style={{ fontSize: 11, color: session.role === "guest" ? C.gold : C.green, textTransform: "capitalize" }}>
                {session.role === "guest" ? "Guest (Free)" : session.role}
              </span>
            </div>
          </div>
          {onLogout && (
            <Btn color={C.red} outline small onClick={onLogout} style={{ width: "100%" }}>
              🚪 Sign Out
            </Btn>
          )}
        </Card>
      )}

      {/* Admin hint */}
      <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
          API keys, integrations & system status →{" "}
          <span style={{ color: C.red }}>🔐 Admin</span> (top-right button)
        </div>
      </div>
    </div>
  );
}
