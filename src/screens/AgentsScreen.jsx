import { useState, useMemo } from "react";
import { C } from "../theme/colors";
import { AGENTS, AGENT_CATEGORIES } from "../data/agents";

export default function AgentsScreen({ onLaunch }) {
  const [search, setSearch]   = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return AGENTS.filter(a => {
      const matchCat = category === "All" || a.industry === category;
      const matchQ   = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [search, category]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "16px 16px 0", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>AI Agents Library</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 14 }}>
          <span style={{ color: C.cyan }}>{AGENTS.length}</span> Specialist Agents
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents…"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px 11px 36px", color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none", boxSizing: "border-box" }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}>✕</button>
          )}
        </div>

        {/* Category chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {AGENT_CATEGORIES.map(cat => {
            const active = category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, border: `1px solid ${active ? C.cyan + "66" : C.border}`, background: active ? `${C.cyan}18` : "rgba(255,255,255,0.03)", color: active ? C.cyan : "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: "pointer", fontWeight: active ? 700 : 400, transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div style={{ padding: "0 16px 8px", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          {filtered.length} agent{filtered.length !== 1 ? "s" : ""}{category !== "All" ? ` in ${category}` : ""}
        </span>
      </div>

      {/* Agent grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            No agents found for "{search}"
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {filtered.map(agent => (
              <AgentCard key={agent.id} agent={agent} onLaunch={onLaunch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent, onLaunch }) {
  const INDUSTRY_COLORS = {
    Healthcare: C.green, Finance: C.gold, Education: C.cyan,
    Legal: C.purple, Cybersecurity: C.red, "Customer Service": "#4ecdc4",
    HR: "#f7971e", Retail: "#f953c6", "E-commerce": "#f953c6",
    Entertainment: "#f953c6", "Real Estate": "#a8ff78", Agriculture: "#a8ff78",
    Energy: C.gold, Travel: C.cyan, Gaming: C.purple, Manufacturing: "#ff6b6b",
    "Supply Chain": "#f7971e", Transportation: C.cyan, Marketing: "#f953c6",
    Research: C.purple, Productivity: C.cyan,
  };
  const color = INDUSTRY_COLORS[agent.industry] || C.cyan;

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8, transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = color + "33"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = C.border; }}
    >
      <div style={{ fontSize: 28, lineHeight: 1 }}>{agent.emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.35 }}>{agent.name}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: color + "18", border: `1px solid ${color}33`, width: "fit-content" }}>
        <span style={{ fontSize: 10, color, fontWeight: 700 }}>{agent.industry}</span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.55, flex: 1 }}>{agent.description}</div>
      <button
        onClick={() => onLaunch(agent)}
        style={{ width: "100%", background: `${color}15`, border: `1px solid ${color}44`, borderRadius: 10, padding: "9px", cursor: "pointer", fontSize: 12, color, fontFamily: "'DM Mono',monospace", fontWeight: 700, transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.background = `${color}28`; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}15`; }}
      >
        ⚡ Launch
      </button>
    </div>
  );
}
