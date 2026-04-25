import { useState, useEffect } from "react";
import { C }   from "./theme/colors";
import { CSS }  from "./theme/css";
import { sto }  from "./utils/storage";
import { auth } from "./utils/auth";
import AuthScreen      from "./screens/AuthScreen";
import AdminDashboard  from "./screens/AdminDashboard";
import ChatScreen      from "./screens/ChatScreen";
import DesignScreen    from "./screens/DesignScreen";
import AutomateScreen  from "./screens/AutomateScreen";
import TranslateScreen from "./screens/TranslateScreen";
import NavigateScreen  from "./screens/NavigateScreen";
import SettingsScreen  from "./screens/SettingsScreen";

const NAV = [
  { id: "chat",      icon: "◈",  label: "AURA"     },
  { id: "automate",  icon: "⚡",  label: "Automate" },
  { id: "design",    icon: "✦",  label: "Design"   },
  { id: "translate", icon: "🌍", label: "Translate" },
  { id: "navigate",  icon: "🗺️", label: "Navigate"  },
  { id: "settings",  icon: "⚙",  label: "Settings" },
];

export default function AuraOS() {
  const [session, setSession]     = useState(() => auth.getSession());
  const [tab, setTab]             = useState("chat");
  const [auraName, setAuraName]   = useState(() => sto.get("aura_name", "AURA"));
  const [showAdmin, setShowAdmin] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [time, setTime]           = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleName   = n => { setAuraName(n); sto.set("aura_name", n); };
  const handleLogin  = s  => { setSession(s); };
  const handleLogout = () => { auth.logout(); setSession(null); setTab("chat"); };

  if (!session) return (
    <>
      <style>{CSS}</style>
      <AuthScreen onLogin={handleLogin} />
    </>
  );

  if (minimized) return (
    <>
      <style>{CSS}</style>
      <div onClick={() => setMinimized(false)}
        style={{ position: "fixed", bottom: 28, right: 20, width: 60, height: 60, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 9999, fontSize: 26, boxShadow: `0 6px 28px ${C.cyan}66`, animation: "pulse 3s ease-in-out infinite" }}>
        ◈
      </div>
    </>
  );

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

      {/* Background grid */}
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
          {session.name && session.role !== "guest" && (
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session.name.split(" ")[0]}
            </div>
          )}
          <button onClick={() => setShowAdmin(true)} style={{ background: `${C.red}15`, border: `1px solid ${C.red}33`, borderRadius: 9, padding: "5px 11px", cursor: "pointer", fontSize: 10, color: C.red, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>🔐 Admin</button>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Active screen */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }} key={tab}>
        {tab === "chat"      && <ChatScreen      auraName={auraName} session={session} />}
        {tab === "automate"  && <AutomateScreen  auraName={auraName} />}
        {tab === "design"    && <DesignScreen    auraName={auraName} />}
        {tab === "translate" && <TranslateScreen />}
        {tab === "navigate"  && <NavigateScreen  auraName={auraName} />}
        {tab === "settings"  && <SettingsScreen  auraName={auraName} onNameChange={handleName} session={session} onLogout={handleLogout} />}
      </div>

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

      {/* Persistent floating chat-head bubble */}
      <div
        onClick={() => setMinimized(true)}
        title="Minimize AURA"
        style={{
          position: "fixed", bottom: 88, right: 14, zIndex: 9999,
          width: 46, height: 46,
          background: `linear-gradient(135deg,${C.cyan}cc,${C.purple}cc)`,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          fontSize: 18, color: "#fff",
          boxShadow: `0 4px 18px ${C.cyan}55`,
          backdropFilter: "blur(10px)",
          animation: "pulse 4s ease-in-out infinite",
          transition: "transform 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        ◈
      </div>
    </div>
  );
}
