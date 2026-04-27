import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Spinner } from "../components/ui";
import { callClaudeStream } from "../utils/api";
import { speakFull } from "../utils/voice";

const EXAMPLES = [
  "Fintech app dashboard",
  "Landing page for a productivity tool",
  "Mobile food delivery app UI",
  "Crypto trading dashboard",
  "SaaS pricing page",
  "Portfolio website",
  "E-commerce product page",
  "Admin analytics dashboard",
];

const DESIGN_SYSTEM = `You are AURA Design — a world-class UI/UX engineer who generates pixel-perfect, interactive HTML/CSS.
Output ONLY a complete self-contained HTML document. No explanation. No markdown. No code fences.
Design standards to follow STRICTLY:
- Dark background: #0a0a0f or similar deep dark
- Glassmorphism cards: backdrop-filter blur, semi-transparent borders
- Color palette: #00ffe5 (cyan), #7b2ff7 (purple), #f5c842 (gold) as accents
- Typography: Import from Google Fonts (Inter, DM Mono, or Orbitron)
- Animations: subtle entrance animations (CSS keyframes), hover micro-interactions
- Layout: CSS Grid + Flexbox, mobile-responsive (use media queries)
- Real content: fill with realistic placeholder data, not lorem ipsum
- Quality bar: Stripe / Linear / Vercel level visual quality
- Include interactive elements (buttons, toggles, tabs) with JS where appropriate
- Sidebar or nav if it makes sense for the UI type`;

export default function DesignScreen({ auraName }) {
  const [prompt, setPrompt]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [html, setHtml]         = useState("");
  const [streaming, setStreaming] = useState("");
  const [tab, setTab]           = useState("preview");
  const [copied, setCopied]     = useState(false);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setHtml("");
    setStreaming("");
    setTab("preview");

    let full = "";
    try {
      await callClaudeStream(
        [{ role: "user", content: `Design request: ${prompt.trim()}\n\nGenerate a complete, stunning HTML page for this. Output ONLY the raw HTML — no markdown, no code fences, no explanation.` }],
        DESIGN_SYSTEM,
        (chunk) => {
          full += chunk;
          setStreaming(full);
        }
      );
      const cleaned = full.trim().replace(/^```html?\s*/i, "").replace(/```\s*$/i, "");
      setHtml(cleaned);
      setStreaming("");
      speakFull(`Design ready: ${prompt.split(" ").slice(0, 5).join(" ")}.`);
    } catch (e) {
      setStreaming(`<!-- Error: ${e.message} -->`);
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard?.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = prompt.slice(0, 32).replace(/\s+/g, "-").toLowerCase() + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const reset = () => { setHtml(""); setStreaming(""); setPrompt(""); setTab("preview"); };

  const hasResult = html || (streaming && loading);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Input panel */}
      {!hasResult && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 22, color: "#b57bee" }}>✦</div>
            <div>
              <Lbl color="#b57bee">Design Brain</Lbl>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: -6 }}>
                Describe it — {auraName} builds the real thing
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {EXAMPLES.map((e, i) => (
              <div key={i} onClick={() => setPrompt(e)}
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 10, color: "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={el => { el.currentTarget.style.color = "rgba(255,255,255,0.75)"; el.currentTarget.style.borderColor = "#b57bee55"; }}
                onMouseLeave={el => { el.currentTarget.style.color = "rgba(255,255,255,0.4)"; el.currentTarget.style.borderColor = C.border; }}>
                {e}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
              placeholder={`Describe the UI you want built (e.g. "dark fintech dashboard with charts and sidebar")`}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${prompt.trim() ? "#b57bee66" : "#b57bee20"}`,
                borderRadius: 14, padding: "14px 16px",
                color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace",
                resize: "none", outline: "none", lineHeight: 1.6, height: 90,
                transition: "border-color 0.2s",
              }}
            />
            <Btn color="#b57bee" onClick={generate} disabled={loading || !prompt.trim()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <><Spinner color="#fff" size={14} /> Building…</> : "✦ Build Design"}
            </Btn>
          </div>

          <Card color="#b57bee" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#b57bee", fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>WHAT THIS DOES</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              AURA Design generates a <strong style={{ color: "#fff" }}>live, interactive HTML/CSS/JS page</strong> — not an image.
              You get real code you can preview, copy, and deploy.
              Stripe / Linear quality output.
            </div>
          </Card>
        </div>
      )}

      {/* Loading stream */}
      {loading && streaming && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <Spinner color="#b57bee" size={14} />
            <span style={{ fontSize: 11, color: "#b57bee", fontWeight: 700 }}>{auraName} IS DESIGNING…</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{streaming.length} chars</span>
          </div>
          <pre style={{ flex: 1, overflowY: "auto", margin: 0, padding: "12px 16px", fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.4)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {streaming.slice(-2000)}
          </pre>
        </div>
      )}

      {/* Result */}
      {html && !loading && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderBottom: "1px solid rgba(181,123,238,0.2)", flexShrink: 0, background: "rgba(181,123,238,0.05)" }}>
            <span style={{ fontSize: 11, color: "#b57bee", fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ✦ {prompt.length > 40 ? prompt.slice(0, 40) + "…" : prompt}
            </span>
            <button onClick={() => setTab("preview")} style={{ background: tab === "preview" ? "rgba(181,123,238,0.2)" : "transparent", border: `1px solid ${tab === "preview" ? "#b57bee55" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "preview" ? "#b57bee" : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Preview</button>
            <button onClick={() => setTab("code")} style={{ background: tab === "code" ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${tab === "code" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: tab === "code" ? "#fff" : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>Code</button>
            <button onClick={copy} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: copied ? C.green : "rgba(255,255,255,0.4)", fontFamily: "'DM Mono',monospace" }}>{copied ? "✓" : "Copy"}</button>
            <button onClick={download} style={{ background: `${C.cyan}12`, border: `1px solid ${C.cyan}33`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: C.cyan, fontFamily: "'DM Mono',monospace" }}>⬇</button>
            <button onClick={() => generate()} style={{ background: "rgba(181,123,238,0.12)", border: "1px solid rgba(181,123,238,0.3)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 10, color: "#b57bee", fontFamily: "'DM Mono',monospace" }}>↻</button>
            <button onClick={reset} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>✕</button>
          </div>

          {/* Preview / Code */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {tab === "preview"
              ? <iframe srcDoc={html} title="design-preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#fff" }} />
              : <pre style={{ margin: 0, padding: "14px", overflowY: "auto", height: "100%", boxSizing: "border-box", background: "transparent" }}>
                  <code style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#a8ff78", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{html}</code>
                </pre>
            }
          </div>
        </div>
      )}
    </div>
  );
}
