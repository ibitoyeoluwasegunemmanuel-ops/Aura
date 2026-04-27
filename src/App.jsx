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
import Sidebar         from "./components/Sidebar";

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
  const [darkMode, setDarkMode]       = useState(() => sto.get("aura_dark_mode", true));
  const [projects, setProjects]               = useState(() => sto.get("aura_projects", []));
  const [activeProjectId, setActiveProjectId] = useState(null);
  const touchStartX = useRef(0);

  const theme = darkMode ? {
    bg: "#02020a", sidebar: "#04040e", topbar: "#02020af2",
    text: "#fff", textDim: "rgba(255,255,255,0.45)", textFaint: "rgba(255,255,255,0.18)",
    border: "rgba(255,255,255,0.07)", hover: "rgba(255,255,255,0.05)",
    inputBg: "rgba(255,255,255,0.04)",
  } : {
    bg: "#f0f2f8", sidebar: "#ffffff", topbar: "#f0f2f8",
    text: "#0f0f1a", textDim: "rgba(0,0,0,0.55)", textFaint: "rgba(0,0,0,0.3)",
    border: "rgba(0,0,0,0.09)", hover: "rgba(0,0,0,0.04)",
    inputBg: "rgba(0,0,0,0.04)",
  };

  const toggleDark = () => { const v = !darkMode; setDarkMode(v); sto.set("aura_dark_mode", v); };

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

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  const createProject = ({ name, emoji, instructions }) => {
    const p = { id: makeSid(), name, emoji, instructions };
    const updated = [...projects, p];
    setProjects(updated);
    sto.set("aura_projects", updated);
    setActiveProjectId(p.id);
    newChat();
  };

  const deleteProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    sto.set("aura_projects", updated);
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const renameSession = (id, title) => {
    setSessions(prev => {
      const u = prev.map(s => s.id === id ? { ...s, title } : s);
      sto.set("aura_sessions", u);
      return u;
    });
  };

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

  const deleteSession = (id) => {
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
      <div onClick={() => setMinimized(false)} style={{ position: "fixed", bottom: 28, right: 20, width: 62, height: 62, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 9999, fontSize: 28, boxShadow: `0 6px 28px ${C.cyan}66`, animation: "pulse 3s ease-in-out infinite" }}>◈</div>
    </>
  );

  return (
    <div style={{ height: "100dvh", minHeight: "-webkit-fill-available", background: theme.bg, fontFamily: "'DM Mono',monospace", color: theme.text, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>

      {darkMode && <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.cyan}03 1px,transparent 1px),linear-gradient(90deg,${C.cyan}03 1px,transparent 1px)`, backgroundSize: "44px 44px", zIndex: 0 }} />}

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40, backdropFilter: "blur(4px)" }} />}

      <Sidebar
        auraName={auraName} session={session} sidebarOpen={sidebarOpen} theme={theme}
        view={view} chatMode={chatMode} agentMode={agentMode} activeSid={activeSid}
        sessions={sessions} projects={projects} activeProjectId={activeProjectId}
        darkMode={darkMode} modes={MODES}
        onClose={() => setSidebarOpen(false)}
        onNewChat={newChat}
        onSwitchMode={switchMode}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onShowProfile={() => setShowProfile(true)}
        onSetView={setView}
        onToggleDark={toggleDark}
        onProjectSelect={setActiveProjectId}
        onProjectCreate={createProject}
        onProjectDelete={deleteProject}
      />

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, position: "relative", zIndex: 1 }}>

        {/* Top bar */}
        <div style={{ padding: "8px 12px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: theme.topbar, backdropFilter: "blur(20px)", zIndex: 10 }}>
          {(() => {
            const isBack = view !== "chat" || !!agentMode;
            return (
              <button onClick={() => { if (view !== "chat") goBack(); else if (agentMode) setView("agents"); else setSidebarOpen(s => !s); }}
                style={{ background: `${C.cyan}14`, border: `1px solid ${C.cyan}33`, borderRadius: 8, padding: "6px 11px", cursor: "pointer", color: C.cyan, fontSize: isBack ? 19 : 20, lineHeight: 1, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s", minWidth: 40, flexShrink: 0 }}
              >{isBack ? "←" : "≡"}</button>
            );
          })()}
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeTitle}</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: theme.textFaint }}>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          <button onClick={() => setMinimized(true)} style={{ background: theme.hover, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontSize: 13, color: theme.textFaint, lineHeight: 1 }}>—</button>
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
              projectPrompt={activeProject?.instructions || ""}
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
