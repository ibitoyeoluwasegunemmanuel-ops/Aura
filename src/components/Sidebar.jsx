import { useState } from "react";
import { C } from "../theme/colors";

const EMOJIS = ["📁","💼","🚀","🎨","⌨️","🔬","🧠","🌍","💡","🔥"];

export default function Sidebar({
  auraName, session, sidebarOpen, theme, view, chatMode, agentMode,
  activeSid, sessions, projects, activeProjectId, darkMode, modes,
  onClose, onNewChat, onSwitchMode, onSelectSession, onDeleteSession,
  onRenameSession, onShowProfile, onSetView, onToggleDark,
  onProjectSelect, onProjectCreate, onProjectDelete,
}) {
  const [renamingId, setRenamingId]     = useState(null);
  const [renameVal, setRenameVal]       = useState("");
  const [showNewProj, setShowNewProj]   = useState(false);
  const [projName, setProjName]         = useState("");
  const [projInstr, setProjInstr]       = useState("");
  const [projEmoji, setProjEmoji]       = useState("📁");

  const SB = (active) => ({
    width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "9px 12px",
    borderRadius: 8, cursor: "pointer", border: "none", fontFamily: "'DM Mono',monospace",
    background: active ? theme.hover : "transparent", transition: "background 0.12s", textAlign: "left",
  });

  const commitRename = (id) => {
    const v = renameVal.trim();
    if (v) onRenameSession(id, v);
    setRenamingId(null);
  };

  const handleCreate = () => {
    if (!projName.trim()) return;
    onProjectCreate({ name: projName.trim(), emoji: projEmoji, instructions: projInstr.trim() });
    setProjName(""); setProjInstr(""); setProjEmoji("📁"); setShowNewProj(false);
  };

  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: sidebarOpen ? 0 : -280, width: 280, zIndex: 50, background: theme.sidebar, borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", transition: "left 0.25s cubic-bezier(.4,0,.2,1)", boxShadow: sidebarOpen ? "4px 0 32px rgba(0,0,0,0.35)" : "none" }}>

      {/* Header */}
      <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, border: `1.5px solid ${C.cyan}55`, borderRadius: "50%", animation: "rotate 8s linear infinite" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.cyan }}>◈</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900, color: C.cyan, letterSpacing: 2, lineHeight: 1 }}>{auraName}</div>
            <div style={{ fontSize: 9, color: theme.textFaint, marginTop: 2 }}>AI OS · LIVE</div>
          </div>
          {session?.name && (
            <div onClick={onShowProfile} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "4px 8px", borderRadius: 20, background: theme.hover, transition: "background 0.12s", flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = theme.inputBg}
              onMouseLeave={e => e.currentTarget.style.background = theme.hover}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#000", flexShrink: 0 }}>{session.name[0].toUpperCase()}</div>
              <span style={{ fontSize: 11, color: theme.textDim, maxWidth: 55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.name.split(" ")[0]}</span>
            </div>
          )}
        </div>
        <button onClick={() => { onNewChat(); onClose(); }}
          style={{ width: "100%", background: `${C.cyan}12`, border: `1px solid ${C.cyan}28`, borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontSize: 12, color: C.cyan, fontFamily: "'DM Mono',monospace", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, transition: "background 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.background = `${C.cyan}20`}
          onMouseLeave={e => e.currentTarget.style.background = `${C.cyan}12`}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>✎</span> New Chat
        </button>
      </div>

      {/* Modes */}
      <div style={{ padding: "10px 10px 6px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: theme.textFaint, letterSpacing: 2, padding: "0 4px 6px", textTransform: "uppercase", fontWeight: 700 }}>Modes</div>
        {modes.map(mode => {
          const active = chatMode === mode.id && !agentMode && view === "chat";
          return (
            <button key={mode.id} onClick={() => onSwitchMode(mode)}
              style={{ ...SB(active), background: active ? `${mode.color}14` : "transparent", borderLeft: active ? `3px solid ${mode.color}` : "3px solid transparent", borderRadius: 0, borderTopRightRadius: 7, borderBottomRightRadius: 7, paddingLeft: 10, marginBottom: 1 }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = theme.hover; e.currentTarget.style.borderLeftColor = `${mode.color}44`; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = "transparent"; } }}>
              <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: "center" }}>{mode.icon}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, color: active ? mode.color : theme.text, fontWeight: active ? 700 : 400, lineHeight: 1.2 }}>{mode.name}</div>
                <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 1 }}>{mode.label}</div>
              </div>
              {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: mode.color, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Projects */}
      <div style={{ padding: "8px 10px 4px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 9, color: theme.textFaint, letterSpacing: 2, padding: "0 4px", textTransform: "uppercase", fontWeight: 700 }}>Projects</div>
          <button onClick={() => setShowNewProj(s => !s)}
            style={{ background: `${C.gold}14`, border: `1px solid ${C.gold}28`, borderRadius: 6, width: 22, height: 22, cursor: "pointer", color: C.gold, fontSize: 14, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        {showNewProj && (
          <div style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}22`, borderRadius: 10, padding: "10px 10px 8px", marginBottom: 6 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select value={projEmoji} onChange={e => setProjEmoji(e.target.value)}
                style={{ background: theme.inputBg, border: `1px solid ${C.gold}33`, borderRadius: 6, padding: "4px", color: theme.text, fontSize: 16, outline: "none", width: 44, cursor: "pointer" }}>
                {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <input value={projName} onChange={e => setProjName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNewProj(false); }}
                placeholder="Project name…"
                style={{ flex: 1, background: theme.inputBg, border: `1px solid ${C.gold}33`, borderRadius: 6, padding: "4px 8px", color: theme.text, fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none" }} />
            </div>
            <textarea value={projInstr} onChange={e => setProjInstr(e.target.value)}
              placeholder="Custom instructions…"
              style={{ width: "100%", background: theme.inputBg, border: `1px solid ${C.gold}22`, borderRadius: 6, padding: "6px 8px", color: theme.text, fontSize: 11, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", height: 52, lineHeight: 1.5, boxSizing: "border-box" }} />
            <button onClick={handleCreate}
              style={{ marginTop: 6, width: "100%", background: `${C.gold}18`, border: `1px solid ${C.gold}44`, borderRadius: 6, padding: "6px", cursor: "pointer", fontSize: 11, color: C.gold, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
              Create Project
            </button>
          </div>
        )}
        {projects.map(p => (
          <div key={p.id} onClick={() => { onProjectSelect(p.id); onClose(); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, cursor: "pointer", marginBottom: 1, background: activeProjectId === p.id ? `${C.gold}10` : "transparent", borderLeft: activeProjectId === p.id ? `3px solid ${C.gold}88` : "3px solid transparent" }}
            onMouseEnter={e => { if (activeProjectId !== p.id) e.currentTarget.style.background = theme.hover; e.currentTarget.querySelector(".proj-del").style.opacity = "1"; }}
            onMouseLeave={e => { if (activeProjectId !== p.id) e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector(".proj-del").style.opacity = "0"; }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{p.emoji}</span>
            <span style={{ fontSize: 12, color: activeProjectId === p.id ? C.gold : theme.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            <button className="proj-del" onClick={e => { e.stopPropagation(); onProjectDelete(p.id); }}
              style={{ background: "none", border: "none", color: theme.textFaint, cursor: "pointer", fontSize: 11, padding: "2px 3px", opacity: 0, transition: "opacity 0.12s", flexShrink: 0 }}>✕</button>
          </div>
        ))}
        {projects.length === 0 && !showNewProj && (
          <div style={{ fontSize: 10, color: theme.textFaint, padding: "4px 4px 2px", lineHeight: 1.5 }}>No projects yet.</div>
        )}
      </div>

      {/* Sessions */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {sessions.length > 0 && <div style={{ fontSize: 9, color: theme.textFaint, letterSpacing: 2, padding: "4px 4px 6px", textTransform: "uppercase", fontWeight: 700 }}>Recent</div>}
        {sessions.map(s => {
          const isActive = s.id === activeSid && view === "chat";
          const isRenaming = renamingId === s.id;
          return (
            <div key={s.id} onClick={() => { if (!isRenaming) { onSelectSession(s.id); onClose(); } }}
              style={{ padding: "7px 8px", borderRadius: 8, cursor: "pointer", marginBottom: 1, display: "flex", alignItems: "center", gap: 6, background: isActive ? `${C.cyan}0c` : "transparent", borderLeft: isActive ? `3px solid ${C.cyan}88` : "3px solid transparent", borderTopRightRadius: 7, borderBottomRightRadius: 7, transition: "all 0.12s" }}
              onMouseEnter={e => { if (!isActive && !isRenaming) { e.currentTarget.style.background = theme.hover; e.currentTarget.querySelector(".sess-actions").style.opacity = "1"; } }}
              onMouseLeave={e => { if (!isActive && !isRenaming) { e.currentTarget.style.background = "transparent"; const a = e.currentTarget.querySelector(".sess-actions"); if (a) a.style.opacity = "0"; } }}>
              {isRenaming ? (
                <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                  onBlur={() => commitRename(s.id)}
                  onKeyDown={e => { if (e.key === "Enter") commitRename(s.id); if (e.key === "Escape") setRenamingId(null); }}
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, background: theme.inputBg, border: `1px solid ${C.cyan}44`, borderRadius: 6, padding: "4px 8px", color: theme.text, fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none" }} />
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: isActive ? C.cyan : theme.text, fontWeight: isActive ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  {s.preview && <div style={{ fontSize: 10, color: theme.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{s.preview.replace(/\*\*/g, "")}</div>}
                </div>
              )}
              <div className="sess-actions" style={{ display: "flex", gap: 2, flexShrink: 0, opacity: isActive ? 1 : 0, transition: "opacity 0.12s" }}>
                <button onClick={e => { e.stopPropagation(); setRenamingId(s.id); setRenameVal(s.title); }} style={{ background: "none", border: "none", color: theme.textFaint, cursor: "pointer", fontSize: 11, padding: "2px 3px", lineHeight: 1 }}>✎</button>
                <button onClick={e => { e.stopPropagation(); onDeleteSession(s.id); }} style={{ background: "none", border: "none", color: theme.textFaint, cursor: "pointer", fontSize: 11, padding: "2px 3px", lineHeight: 1 }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer nav */}
      <div style={{ padding: "8px 10px 16px", borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {[
          { id: "agents",   icon: "🤖", label: "AI Agents", color: C.cyan },
          { id: "settings", icon: "⚙️",  label: "Settings",  color: theme.textDim },
          { id: "admin",    icon: "🔐", label: "Admin",     color: C.red + "cc" },
        ].map(item => (
          <button key={item.id} onClick={() => { onSetView(item.id); onClose(); }}
            style={{ ...SB(view === item.id), marginBottom: 1, background: view === item.id ? theme.hover : "transparent" }}
            onMouseEnter={e => { if (view !== item.id) e.currentTarget.style.background = theme.hover; }}
            onMouseLeave={e => { if (view !== item.id) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: item.color, fontWeight: view === item.id ? 700 : 400 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={onToggleDark}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", marginTop: 4, borderRadius: 8, cursor: "pointer", border: `1px solid ${theme.border}`, background: theme.hover, fontFamily: "'DM Mono',monospace", transition: "background 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.background = theme.inputBg}
          onMouseLeave={e => e.currentTarget.style.background = theme.hover}>
          <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{darkMode ? "☀️" : "🌙"}</span>
          <span style={{ fontSize: 12, color: theme.textDim }}>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </div>
  );
}
