import { useState, useEffect } from "react";
import { C }   from "./theme/colors";
import { CSS }  from "./theme/css";
import { sto }  from "./utils/storage";
import { auth } from "./utils/auth";
import AuthScreen      from "./screens/AuthScreen";
import AdminDashboard  from "./screens/AdminDashboard";
import ChatScreen      from "./screens/ChatScreen";
import SettingsScreen  from "./screens/SettingsScreen";

function makeSid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function initSessions() {
  const saved = sto.get("aura_sessions", []);
  if (saved.length) return saved;
  const id = makeSid();
  const fresh = [{ id, title: "New Chat", preview: "", updatedAt: Date.now() }];
  sto.set("aura_sessions", fresh);
  return fresh;
}

export default function AuraOS() {
  const [session, setSession]       = useState(() => auth.getSession());
  const [auraName, setAuraName]     = useState(() => sto.get("aura_name", "AURA"));
  const [minimized, setMinimized]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions]     = useState(initSessions);
  const [activeSid, setActiveSid]   = useState(() => initSessions()[0].id);
  const [view, setView]             = useState("chat");
  const [time, setTime]             = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleName   = n => { setAuraName(n); sto.set("aura_name", n); };
  const handleLogin  = s => setSession(s);
  const handleLogout = () => { auth.logout(); setSession(null); };

  const newChat = () => {
    const id = makeSid();
    const s = { id, title: "New Chat", preview: "", updatedAt: Date.now() };
    setSessions(prev => { const u = [s, ...prev]; sto.set("aura_sessions", u); return u; });
    setActiveSid(id);
    setView("chat");
    setSidebarOpen(false);
  };

  const selectSession = (id) => {
    setActiveSid(id);
    setView("chat");
    setSidebarOpen(false);
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    sto.remove("msgs_" + id);
    setSessions(prev => {
      const u = prev.filter(s => s.id !== id);
      sto.set("aura_sessions", u);
      if (activeSid === id) {
        if (u.length) { setActiveSid(u[0].id); }
        else { const fresh = makeSid(); setSessions([{ id: fresh, title: "New Chat", preview: "", updatedAt: Date.now() }]); sto.set("aura_sessions", [{ id: fresh, title: "New Chat", preview: "", updatedAt: Date.now() }]); setActiveSid(fresh); }
      }
      return u;
    });
  };

  const updateSession = (id, title, preview) => {
    setSessions(prev => {
      const u = prev.map(s => s.id === id ? { ...s, title, preview, updatedAt: Date.now() } : s)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      sto.set("aura_sessions", u);
      return u;
    });
  };

  const activeTitle = view === "settings" ? "Settings" : view === "admin" ? "Admin" : (sessions.find(s => s.id === activeSid)?.title || auraName);

  if (!session) return (
    <>
      <style>{CSS}</style>
      <AuthScreen onLogin={handleLogin} />
    </>
  );

  if (minimized) return (
    <>
      <style>{CSS}</style>
      <div
        onClick={() => setMinimized(false)}
        style={{ position: "fixed", bottom: 28, right: 20, width: 62, height: 62, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 9999, fontSize: 28, boxShadow: `0 6px 28px ${C.cyan}66`, animation: "pulse 3s ease-in-out infinite" }}
      >◈</div>
    </>
  );

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: "'DM Mono',monospace", color: "#fff", display: "flex", position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.cyan}03 1px,transparent 1px),linear-gradient(90deg,${C.cyan}03 1px,transparent 1px)`, backgroundSize: "44px 44px", zIndex: 0 }} />

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)", zIndex: 40, backdropFilter: "blur(3px)" }} />
      )}

      {/* ── SIDEBAR ── */}
      <div style={{
        position: "fixed", top: 0, bottom: 0,
        left: sidebarOpen ? 0 : -272,
        width: 272, zIndex: 50,
        background: "#04040e",
        borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        transition: "left 0.26s cubic-bezier(.4,0,.2,1)",
      }}>

        {/* Sidebar header */}
        <div style={{ padding: "18px 14px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ position: "relative", width: 30, height: 30 }}>
              <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${C.cyan}66`, borderRadius: "50%", animation: "rotate 8s linear infinite" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.cyan }}>◈</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: C.cyan, letterSpacing: 2 }}>{auraName}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", marginTop: 1 }}>AI OS · LIVE</div>
            </div>
            {session?.name && (
              <div style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.3)", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.name.split(" ")[0]}
              </div>
            )}
          </div>

          {/* New Chat */}
          <button onClick={newChat} style={{ width: "100%", background: `${C.cyan}10`, border: `1px solid ${C.cyan}30`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontSize: 12, color: C.cyan, fontFamily: "'DM Mono',monospace", fontWeight: 700, display: "flex", alignItems: "center", gap: 9, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = `${C.cyan}1a`}
            onMouseLeave={e => e.currentTarget.style.background = `${C.cyan}10`}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Chat
          </button>
        </div>

        {/* Sessions list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
          {sessions.length > 0 && (
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: 2, padding: "0 8px 8px", textTransform: "uppercase" }}>Recent</div>
          )}
          {sessions.map(s => {
            const isActive = s.id === activeSid && view === "chat";
            return (
              <div key={s.id} onClick={() => selectSession(s.id)}
                style={{ padding: "9px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 2, position: "relative", display: "flex", alignItems: "center", gap: 6, background: isActive ? `${C.cyan}0e` : "transparent", border: `1px solid ${isActive ? C.cyan + "25" : "transparent"}`, transition: "all 0.15s", group: true }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.querySelector(".del-btn").style.opacity = "1"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector(".del-btn").style.opacity = "0"; }}
              >
                <span style={{ fontSize: 12, flexShrink: 0, opacity: 0.4 }}>💬</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: isActive ? C.cyan : "rgba(255,255,255,0.72)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  {s.preview && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{s.preview}</div>}
                </div>
                <button className="del-btn" onClick={e => deleteSession(e, s.id)}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 13, padding: "0 2px", flexShrink: 0, opacity: 0, transition: "opacity 0.15s" }}
                >✕</button>
              </div>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div style={{ padding: "10px 8px 20px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          {[
            { id: "settings", icon: "⚙", label: "Settings", color: "rgba(255,255,255,0.6)" },
            { id: "admin",    icon: "🔐", label: "Admin",    color: C.red + "cc" },
          ].map(item => (
            <div key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, cursor: "pointer", background: view === item.id ? "rgba(255,255,255,0.06)" : "transparent", marginBottom: 2, transition: "background 0.15s" }}
              onMouseEnter={e => { if (view !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (view !== item.id) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: item.color }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minWidth: 0, position: "relative", zIndex: 1 }}>

        {/* Top bar */}
        <div style={{ padding: "9px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9, flexShrink: 0, background: `${C.bg}f2`, backdropFilter: "blur(20px)", zIndex: 10, position: "relative" }}>
          <button onClick={() => setSidebarOpen(s => !s)}
            style={{ background: sidebarOpen ? `${C.cyan}12` : "rgba(255,255,255,0.05)", border: `1px solid ${sidebarOpen ? C.cyan + "33" : C.border}`, borderRadius: 9, padding: "6px 10px", cursor: "pointer", color: sidebarOpen ? C.cyan : "rgba(255,255,255,0.4)", fontSize: 17, lineHeight: 1, transition: "all 0.15s" }}
          >≡</button>

          <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeTitle}
          </div>

          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>

          <button onClick={() => setMinimized(true)} title="Minimize"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "5px 9px", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1 }}
          >—</button>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {view === "chat" && (
            <ChatScreen
              key={activeSid}
              auraName={auraName}
              authSession={session}
              chatSessionId={activeSid}
              onSessionUpdate={updateSession}
            />
          )}
          {view === "settings" && (
            <SettingsScreen
              auraName={auraName}
              onNameChange={handleName}
              session={session}
              onLogout={handleLogout}
            />
          )}
          {view === "admin" && (
            <div style={{ height: "100%", overflow: "hidden" }}>
              <AdminDashboard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
