import { useState, useEffect, useRef } from "react";
import { C }   from "./theme/colors";
import { CSS }  from "./theme/css";
import { sto }  from "./utils/storage";
import { auth } from "./utils/auth";
import { Modal, Progress } from "./components/ui";
import AuthScreen      from "./screens/AuthScreen";
import AdminDashboard  from "./screens/AdminDashboard";
import ChatScreen      from "./screens/ChatScreen";
import SettingsScreen  from "./screens/SettingsScreen";
import AgentsScreen    from "./screens/AgentsScreen";

const MODES = [
  { id: "chat",     icon: "💬", name: "AURA Chat",    label: "General AI",    color: C.cyan,    prompt: "" },
  { id: "code",     icon: "⌨️",  name: "AURA Code",    label: "Dev & Debug",   color: "#4ade80", prompt: "You are AURA Code — an expert software engineer. Prioritise clean, working code. Always show code blocks. Explain your reasoning briefly." },
  { id: "design",   icon: "🎨", name: "AURA Design",  label: "UI & Creative", color: C.purple,  prompt: "You are AURA Design — a world-class UI/UX designer and creative director. Think visually, suggest layouts, colours, and user experiences. Be specific and inspiring." },
  { id: "research", icon: "🔬", name: "AURA Research", label: "Deep Analysis", color: C.gold,    prompt: "You are AURA Research — a rigorous analyst and researcher. Provide detailed, sourced, well-structured answers. Use bullet points and section headers. Be thorough." },
];

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
  const [showProfile, setShowProfile] = useState(false);
  const [agentMode, setAgentMode]     = useState(null);
  const [chatMode, setChatMode]       = useState(() => sto.get("aura_chat_mode", "chat"));
  const touchStartX = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Android back button support
  useEffect(() => {
    if (view !== "chat") window.history.pushState({ view }, "");
  }, [view]);
  useEffect(() => {
    const onPop = () => setView("chat");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // iOS swipe-right from left edge to go back
  useEffect(() => {
    const onStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onEnd   = (e) => {
      if (e.changedTouches[0].clientX - touchStartX.current > 72 && touchStartX.current < 36 && view !== "chat") {
        setView("chat");
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend",   onEnd,   { passive: true });
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [view]);

  const goBack = () => setView("chat");

  const handleName   = n => { setAuraName(n); sto.set("aura_name", n); };
  const handleLogin  = s => setSession(s);
  const handleLogout = () => { auth.logout(); setSession(null); };

  const switchMode = (mode) => {
    setChatMode(mode.id);
    sto.set("aura_chat_mode", mode.id);
    const id = makeSid();
    const s = { id, title: mode.id === "chat" ? "New Chat" : mode.name, preview: mode.label, updatedAt: Date.now() };
    setSessions(prev => { const u = [s, ...prev]; sto.set("aura_sessions", u); return u; });
    setActiveSid(id);
    setAgentMode(null);
    setView("chat");
    setSidebarOpen(false);
  };

  const newChat = () => {
    const id = makeSid();
    const s = { id, title: "New Chat", preview: "", updatedAt: Date.now() };
    setSessions(prev => { const u = [s, ...prev]; sto.set("aura_sessions", u); return u; });
    setActiveSid(id);
    setAgentMode(null);
    setView("chat");
    setSidebarOpen(false);
  };

  const launchAgent = (agent) => {
    const id = makeSid();
    const s = { id, title: agent.name, preview: agent.description, updatedAt: Date.now() };
    setSessions(prev => { const u = [s, ...prev]; sto.set("aura_sessions", u); return u; });
    setActiveSid(id);
    setAgentMode(agent);
    setView("chat");
    setSidebarOpen(false);
  };

  const selectSession = (id) => {
    setActiveSid(id);
    setAgentMode(null);
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

  const activeTitle = view === "settings" ? "Settings" : view === "admin" ? "Admin" : view === "agents" ? "AI Agents" : (sessions.find(s => s.id === activeSid)?.title || auraName);

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
    <div style={{ height: "100dvh", minHeight: "-webkit-fill-available", background: C.bg, fontFamily: "'DM Mono',monospace", color: "#fff", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
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
              <div onClick={() => setShowProfile(true)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "4px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              >
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#000", flexShrink: 0 }}>
                  {session.name[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.name.split(" ")[0]}</span>
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

        {/* AURA Modes */}
        <div style={{ padding: "10px 8px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: 2, padding: "0 8px 8px", textTransform: "uppercase" }}>Modes</div>
          {MODES.map(mode => {
            const active = chatMode === mode.id && !agentMode && view === "chat";
            return (
              <button key={mode.id} onClick={() => switchMode(mode)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, cursor: "pointer", background: active ? `${mode.color}18` : "transparent", border: `1px solid ${active ? mode.color + "33" : "transparent"}`, marginBottom: 2, fontFamily: "'DM Mono',monospace", transition: "all 0.15s", textAlign: "left" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? `${mode.color}18` : "transparent"; }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{mode.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: active ? mode.color : "rgba(255,255,255,0.8)", fontWeight: active ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mode.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{mode.label}</div>
                </div>
              </button>
            );
          })}
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
            { id: "agents",   icon: "🤖", label: "Agents",   color: C.cyan },
            { id: "settings", icon: "⚙", label: "Settings", color: "rgba(255,255,255,0.7)" },
            { id: "admin",    icon: "🔐", label: "Admin",    color: C.red },
          ].map(item => (
            <button key={item.id}
              onClick={() => { setView(item.id); setSidebarOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", borderRadius: 10, cursor: "pointer", background: view === item.id ? "rgba(255,255,255,0.08)" : "transparent", marginBottom: 2, border: "none", fontFamily: "'DM Mono',monospace", transition: "background 0.15s" }}
              onMouseEnter={e => { if (view !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (view !== item.id) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: item.color, fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, position: "relative", zIndex: 1 }}>

        {/* Top bar */}
        <div style={{ padding: "9px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9, flexShrink: 0, background: `${C.bg}f2`, backdropFilter: "blur(20px)", zIndex: 10, position: "relative" }}>

          {/* ≡ menu OR ← back button */}
          {(() => {
            const isBack = view !== "chat" || !!agentMode;
            return (
              <button
                onClick={() => {
                  if (view !== "chat") { goBack(); }
                  else if (agentMode) { setView("agents"); }
                  else { setSidebarOpen(s => !s); }
                }}
                style={{ background: isBack ? `${C.cyan}10` : `${C.cyan}18`, border: `1px solid ${C.cyan}44`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: C.cyan, fontSize: isBack ? 20 : 22, lineHeight: 1, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", minWidth: 44, flexShrink: 0 }}
              >
                {isBack ? "←" : "≡"}
              </button>
            );
          })()}

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
              agentMode={agentMode}
              modePrompt={agentMode ? "" : (MODES.find(m => m.id === chatMode)?.prompt || "")}
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
          {view === "agents" && (
            <AgentsScreen onLaunch={launchAgent} />
          )}
        </div>
      </div>

      {/* ── PROFILE POPUP ── */}
      <Modal open={showProfile} onClose={() => setShowProfile(false)} color={C.cyan} title="Your Profile">
        {session && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#000", flexShrink: 0 }}>
                {session.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{session.name}</div>
                {session.email && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{session.email}</div>}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, padding: "2px 10px", borderRadius: 20, background: `${C.green}15`, border: `1px solid ${C.green}33` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
                  <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>{session.role === "guest" ? "Free" : session.role || "User"} Plan</span>
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, overflow: "hidden" }}>
              {[
                { label: "Plan",     value: session.role === "guest" ? "Free" : (session.role || "User"), color: C.green },
                { label: "AI Model", value: "Claude Sonnet 4",     color: C.cyan   },
                { label: "Voice",    value: "Enabled",              color: C.purple },
                { label: "Memory",   value: "Active",               color: C.gold   },
              ].map(({ label, value, color }, i, arr) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{label}</span>
                  <span style={{ fontSize: 13, color, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>Usage this month</div>
              <Progress value={42} color={C.cyan} label="Conversations" />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowProfile(false); setView("settings"); setSidebarOpen(false); }}
                style={{ flex: 1, background: `${C.cyan}12`, border: `1px solid ${C.cyan}33`, borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 12, color: C.cyan, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
                ⚙ Settings
              </button>
              <button onClick={() => { handleLogout(); setShowProfile(false); }}
                style={{ flex: 1, background: `${C.red}12`, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 12, color: C.red, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
