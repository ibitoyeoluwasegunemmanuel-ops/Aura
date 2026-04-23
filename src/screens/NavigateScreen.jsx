import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Inp } from "../components/ui";
import { callClaude } from "../utils/api";
import { speakFull } from "../utils/voice";

export default function NavigateScreen({ auraName }) {
  const [dest, setDest]     = useState("");
  const [loc, setLoc]       = useState(null);
  const [routed, setRouted] = useState(false);
  const [tip, setTip]       = useState("");
  const [steps, setSteps]   = useState([]);
  const [loading, setLoading] = useState(false);

  const go = async () => {
    if (!dest.trim()) return;
    setLoading(true);
    const [t, d] = await Promise.all([
      callClaude([{ role: "user", content: `Short travel tip for "${dest}". 1-2 sentences, friendly.` }]),
      callClaude([{ role: "user", content: `5 turn-by-turn directions to "${dest}"${loc ? ` from ${loc.lat},${loc.lng}` : ""}. Number each. Short.` }]),
    ]);
    setTip(t);
    setSteps(d.split("\n").filter(l => l.match(/^\d+[.)]/)).slice(0, 5));
    setRouted(true);
    setLoading(false);
    speakFull(`Route to ${dest} ready. ${t}`);
  };

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.cyan}>Navigator · AI-Guided Routes</Lbl>

      <Card color={loc ? C.green : C.gold} style={{ padding: "11px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{loc ? "📍" : "🔍"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{loc ? `${loc.lat}, ${loc.lng}` : "Location not detected"}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{loc ? "GPS active" : "Tap Detect for your real GPS"}</div>
          </div>
          <Btn color={loc ? C.green : C.gold} small outline onClick={() => navigator.geolocation?.getCurrentPosition(p => setLoc({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) }))}>
            {loc ? "↺" : "Detect"}
          </Btn>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 7 }}>
        <Inp value={dest} onChange={e => setDest(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="Where to? Any place on Earth..." style={{ flex: 1 }} />
        <Btn color={C.cyan} small onClick={go}>{loading ? "..." : "Go"}</Btn>
      </div>

      <div style={{ height: 170, background: "rgba(0,255,229,0.03)", border: `1px solid ${C.cyan}22`, borderRadius: 14, position: "relative", overflow: "hidden" }}>
        {[20, 40, 60, 80].map(p => <div key={p} style={{ position: "absolute", left: 0, right: 0, top: `${p}%`, height: 1, background: "rgba(0,255,229,0.05)" }} />)}
        {[20, 40, 60, 80].map(p => <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "rgba(0,255,229,0.05)" }} />)}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {routed && <>
            <polyline points="30,150 70,118 115,88 165,62 240,45 320,40 390,44" fill="none" stroke={C.cyan} strokeWidth="2.5" strokeDasharray="8 4" style={{ filter: `drop-shadow(0 0 5px ${C.cyan})` }} />
            <circle cx="30"  cy="150" r="7" fill={C.green} />
            <circle cx="390" cy="44"  r="9" fill={C.cyan} />
            <circle cx="165" cy="62"  r="5" fill="#fff" style={{ animation: "pulse 1s infinite" }} />
          </>}
        </svg>
        {routed ? <>
          <div style={{ position: "absolute", bottom: 8, left: 12, fontSize: 10, color: C.green }}>📍 You</div>
          <div style={{ position: "absolute", top: 8, right: 12, fontSize: 10, color: C.cyan }}>🏁 {dest}</div>
          <div style={{ position: "absolute", top: 8, left: 12, background: `${C.cyan}22`, borderRadius: 7, padding: "3px 9px", fontSize: 10, color: C.cyan }}>~18 min</div>
        </> : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 26 }}>🗺️</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Enter destination</div>
          </div>
        )}
      </div>

      {steps.length > 0 && (
        <Card>
          <Lbl color={C.cyan}>Turn-by-Turn Directions</Lbl>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: i === 0 ? `${C.green}22` : `${C.cyan}11`, border: `1px solid ${i === 0 ? C.green + "44" : C.cyan + "22"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === 0 ? C.green : C.cyan, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 11, color: i === 0 ? "#fff" : "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{s.replace(/^\d+[.)]\s*/, "")}</div>
            </div>
          ))}
        </Card>
      )}

      {tip && (
        <Card color={C.gold}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            <span style={{ color: C.gold, fontWeight: 700 }}>{auraName}:</span> {tip}
          </div>
        </Card>
      )}

      <Btn color={C.blue} outline onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(dest)}`, "_blank")} style={{ width: "100%" }}>
        🗺️ Open in Google Maps
      </Btn>
    </div>
  );
}
