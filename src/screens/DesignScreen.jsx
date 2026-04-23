import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Inp } from "../components/ui";
import { callClaude, genImg } from "../utils/api";
import { speakFull } from "../utils/voice";

const STYLES = ["modern minimalist","futuristic dark","glassmorphism","neumorphism","brutalist","luxury gold","neon cyberpunk","clean corporate","playful colorful","African inspired"];
const TYPES  = ["UI Design","Logo","Landing Page","Dashboard","Mobile App","Poster","Social Media","Brand Identity","Infographic","Illustration"];
const EXAMPLES = [
  "AURA OS landing page with dark futuristic theme",
  "Logo for a Nigerian fintech startup called PayFlow",
  "Dashboard for a crypto trading app",
  "Instagram post for a luxury fashion brand",
  "Mobile app UI for a food delivery service in Lagos",
  "Brand identity for an AI company",
];

export default function DesignScreen({ auraName }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle]   = useState("modern minimalist");
  const [type, setType]     = useState("UI Design");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiDesc, setAiDesc]   = useState("");
  const [count, setCount]     = useState(2);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setAiDesc(""); setResults([]);
    const enhanced = await callClaude(
      [{ role: "user", content: `I need a ${type} design: "${prompt}". Style: ${style}. Write a detailed visual description (colors, layout, typography, mood) in 2-3 sentences. Be specific and professional.` }],
      "You are a world-class UI/UX designer and art director. Describe designs with precision."
    );
    setAiDesc(enhanced);
    const imgs = Array.from({ length: count }, (_, i) => ({
      url: genImg(`${type}: ${enhanced}, ${style}, professional design, high quality`, Date.now() + i * 1000),
    }));
    setResults(imgs);
    setLoading(false);
    speakFull(`Generated ${count} ${type} design${count > 1 ? "s" : ""} for you!`);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 24 }}>✦</div>
        <div>
          <Lbl color={C.purple}>Claude Design Brain</Lbl>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: -8 }}>AI-powered design studio</div>
        </div>
        <button onClick={() => window.open("https://claude.ai", "_blank")}
          style={{ marginLeft: "auto", background: `${C.purple}15`, border: `1px solid ${C.purple}44`, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 10, color: C.purple, fontFamily: "'DM Mono',monospace" }}>
          Open Claude.ai ↗
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {EXAMPLES.map((e, i) => (
          <div key={i} onClick={() => setPrompt(e)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}>{e}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <div>
          <Lbl>Design Type</Lbl>
          <select value={type} onChange={e => setType(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
            {TYPES.map(t => <option key={t} style={{ background: "#111" }}>{t}</option>)}
          </select>
        </div>
        <div>
          <Lbl>Style</Lbl>
          <select value={style} onChange={e => setStyle(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
            {STYLES.map(s => <option key={s} style={{ background: "#111" }}>{s}</option>)}
          </select>
        </div>
      </div>

      <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="Describe what you want to design..."
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.purple}33`, borderRadius: 11, padding: "11px 13px", color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", lineHeight: 1.6, height: 75 }} />

      <div style={{ display: "flex", gap: 9 }}>
        <div style={{ flex: 1 }}>
          <Lbl>Variations</Lbl>
          <select value={count} onChange={e => setCount(Number(e.target.value))} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 11px", color: "#fff", fontSize: 11, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}>
            {[1, 2, 4].map(n => <option key={n} style={{ background: "#111" }}>{n} design{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div style={{ flex: 2, display: "flex", alignItems: "flex-end" }}>
          <Btn color={C.purple} onClick={generate} style={{ width: "100%" }} disabled={loading}>
            {loading ? "✦ Designing..." : `✦ Generate ${count} Design${count > 1 ? "s" : ""}`}
          </Btn>
        </div>
      </div>

      {aiDesc && (
        <Card color={C.purple}>
          <Lbl color={C.purple}>Claude's Design Brief</Lbl>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>{aiDesc}</div>
        </Card>
      )}

      {loading && (
        <Card color={C.purple} style={{ textAlign: "center", padding: "24px" }}>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.purple, animation: `pulse ${0.7 + i * 0.15}s infinite` }} />)}
          </div>
          <div style={{ fontSize: 12, color: C.purple }}>Claude is designing your {type}...</div>
        </Card>
      )}

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: count === 1 ? "1fr" : "1fr 1fr", gap: 10 }}>
          {results.map((r, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.purple}33` }}>
              <div style={{ padding: "5px 9px", background: `${C.purple}15`, fontSize: 9, color: C.purple, display: "flex", justifyContent: "space-between" }}>
                <span>✦ Design {i + 1}</span>
                <a href={r.url} target="_blank" rel="noreferrer" style={{ color: C.cyan, textDecoration: "none" }}>⬇ Save</a>
              </div>
              <img src={r.url} alt={`Design ${i + 1}`} style={{ width: "100%", display: "block", minHeight: 120, background: "rgba(123,47,247,0.05)" }}
                onError={e => { e.target.style.opacity = "0.2"; }} />
            </div>
          ))}
        </div>
      )}

      <Card color={C.cyan}>
        <Lbl color={C.cyan}>Claude Code — Build It From This Design</Lbl>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 10 }}>
          Once you have your design, use Claude Code to turn it into real working code — React, HTML, or any framework.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn color={C.cyan} small outline onClick={() => window.open("https://claude.ai", "_blank")}>Open Claude.ai ↗</Btn>
          <Btn color={C.purple} small outline onClick={() => window.open("https://github.com/ibitoyeoluwasegunemmanuel-ops/Aura", "_blank")}>GitHub Repo ↗</Btn>
        </div>
      </Card>
    </div>
  );
}
