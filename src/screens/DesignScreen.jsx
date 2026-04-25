import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Spinner, Badge } from "../components/ui";
import { callClaude, genImg } from "../utils/api";
import { speakFull } from "../utils/voice";

const EXAMPLES = [
  "Fintech app dashboard for Nigeria",
  "Logo for an AI startup called AURA",
  "Landing page for a productivity tool",
  "Instagram post for a luxury fashion brand",
  "Mobile food delivery app UI",
  "Crypto trading dashboard, dark theme",
];

export default function DesignScreen({ auraName }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const brief = await callClaude(
      [{ role: "user", content: `Design request: "${prompt}". Write a 2-sentence visual description covering colors, layout, typography, and mood. Be specific and professional.` }],
      `You are a world-class UI/UX designer and art director. Respond with only the design description — no preamble.`
    );

    const imageUrl = genImg(`${prompt}, ${brief}, professional design, ultra high quality`, Date.now());
    setResult({ brief, imageUrl });
    setLoading(false);
    speakFull(`Design ready. ${brief.split(".")[0]}.`);
  };

  const reset = () => { setResult(null); setPrompt(""); };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, height: "100%", overflowY: "auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 22, color: C.purple }}>✦</div>
        <div>
          <Lbl color={C.purple}>Design Brain</Lbl>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: -6 }}>
            Describe what you want — {auraName} does the rest
          </div>
        </div>
      </div>

      {/* Example chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {EXAMPLES.map((e, i) => (
          <div key={i} onClick={() => setPrompt(e)}
            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 10, color: "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={el => { el.currentTarget.style.color = "rgba(255,255,255,0.75)"; el.currentTarget.style.borderColor = C.purple + "55"; }}
            onMouseLeave={el => { el.currentTarget.style.color = "rgba(255,255,255,0.4)"; el.currentTarget.style.borderColor = C.border; }}>
            {e}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
          placeholder={`What do you want to design? (e.g. "fintech mobile app for Nigeria")`}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1.5px solid ${prompt.trim() ? C.purple + "66" : C.purple + "20"}`,
            borderRadius: 14, padding: "14px 16px",
            color: "#fff", fontSize: 13, fontFamily: "'DM Mono',monospace",
            resize: "none", outline: "none", lineHeight: 1.6, height: 90,
            transition: "border-color 0.2s",
          }}
        />
        <Btn color={C.purple} onClick={generate} disabled={loading || !prompt.trim()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading ? <><Spinner color="#000" size={14} /> Designing…</> : "✦ Generate Design"}
        </Btn>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "20px 0" }}>
          <Spinner color={C.purple} size={22} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>{auraName} IS DESIGNING…</div>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <Card color={C.purple}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: C.purple, letterSpacing: 2 }}>DESIGN BRIEF</div>
              <Badge color={C.green} dot>Ready</Badge>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.75 }}>{result.brief}</div>
          </Card>

          <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.purple}44` }}>
            <div style={{ padding: "7px 12px", background: `${C.purple}15`, fontSize: 10, color: C.purple, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>✦ {prompt.length > 44 ? prompt.slice(0, 44) + "…" : prompt}</span>
              <a href={result.imageUrl} target="_blank" rel="noreferrer" style={{ color: C.cyan, textDecoration: "none" }}>⬇ Save</a>
            </div>
            <img
              src={result.imageUrl}
              alt={prompt}
              style={{ width: "100%", display: "block", minHeight: 160, background: "rgba(123,47,247,0.06)" }}
              onError={e => { e.target.style.opacity = "0.25"; }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn color={C.purple} small onClick={generate} style={{ flex: 1 }}>↻ Regenerate</Btn>
            <Btn color={C.cyan} small outline onClick={reset}>✕ New design</Btn>
          </div>
        </>
      )}
    </div>
  );
}
