import { C } from "../theme/colors";

export function HtmlInlineCard({ code, onExpand }) {
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.purple}44`, margin: "8px 0", cursor: "pointer" }} onClick={onExpand}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: `${C.purple}10` }}>
        <span style={{ fontSize: 11, color: C.purple, fontWeight: 700, flex: 1 }}>💻 Live Preview — tap to open</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>⤢ Expand</span>
      </div>
      <iframe srcDoc={code} title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width: "100%", height: 200, border: "none", display: "block", background: "#fff", pointerEvents: "none" }} />
    </div>
  );
}

export default function ArtifactPanel({ artifact, tab, setTab, onClose }) {
  const isMobile = window.innerWidth < 768;
  if (!artifact) return null;

  const download = () => {
    const blob = new Blob([artifact.code], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aura-design.html";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copy = () => navigator.clipboard?.writeText(artifact.code);

  const panelStyle = isMobile
    ? { position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", background: "#07070f" }
    : { width: "50%", minWidth: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.purple}44`, background: "#07070f", flexShrink: 0 };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${C.purple}22`, flexShrink: 0, background: `${C.purple}08` }}>
        <span style={{ fontSize: 11, color: C.purple, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>💻 {artifact.title || "Live Preview"}</span>
        <button onClick={() => setTab("preview")} style={{ background: tab === "preview" ? `${C.purple}22` : "transparent", border: `1px solid ${tab === "preview" ? C.purple + "55" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "preview" ? C.purple : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Preview</button>
        <button onClick={() => setTab("code")} style={{ background: tab === "code" ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${tab === "code" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "code" ? "#fff" : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Code</button>
        <button onClick={copy} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Copy</button>
        <button onClick={download} style={{ background: `${C.cyan}12`, border: `1px solid ${C.cyan}33`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: C.cyan, fontFamily: "'DM Mono',monospace" }}>⬇</button>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "preview" ? (
          <iframe srcDoc={artifact.code} title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#fff" }} />
        ) : (
          <pre style={{ margin: 0, padding: "14px", overflowY: "auto", height: "100%", boxSizing: "border-box", background: "transparent" }}>
            <code style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#a8ff78", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{artifact.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
