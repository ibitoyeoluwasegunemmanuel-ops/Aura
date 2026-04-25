import { useState } from "react";
import { C } from "../theme/colors";
import { Card, Btn, Lbl, Inp } from "../components/ui";
import { callClaude } from "../utils/api";
import { speakFull } from "../utils/voice";

export default function NavigateScreen({ auraName }) {
  const [dest, setDest]   = useState("");
  const [query, setQuery] = useState("");
  const [loc, setLoc]     = useState(null);
  const [tip, setTip]     = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    if (!dest.trim()) return;
    const q = dest.trim();
    setQuery(q);
    setLoading(true);
    setTip("");
    const t = await callClaude(
      [{ role: "user", content: `Short travel tip for "${q}". 1-2 sentences, friendly.` }]
    );
    setTip(t);
    setLoading(false);
    speakFull(`Navigating to ${q}. ${t.split(".")[0]}.`);
  };

  const mapSrc = query
    ? `https://maps.google.com/maps?q=${encodeURIComponent(query)}${loc ? `&near=${loc.lat},${loc.lng}` : ""}&output=embed`
    : null;

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11, height: "100%", overflowY: "auto" }}>
      <Lbl color={C.cyan}>Navigator · Real-Time Maps</Lbl>

      {/* GPS */}
      <Card color={loc ? C.green : C.gold} style={{ padding: "11px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{loc ? "📍" : "🔍"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
              {loc ? `${loc.lat}, ${loc.lng}` : "Location not detected"}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
              {loc ? "GPS active" : "Tap Detect for your GPS location"}
            </div>
          </div>
          <Btn
            color={loc ? C.green : C.gold}
            small outline
            onClick={() =>
              navigator.geolocation?.getCurrentPosition(p =>
                setLoc({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) })
              )
            }
          >
            {loc ? "↺" : "Detect"}
          </Btn>
        </div>
      </Card>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 7 }}>
        <Inp
          value={dest}
          onChange={e => setDest(e.target.value)}
          onKeyDown={e => e.key === "Enter" && go()}
          placeholder="Where to? City, landmark, address…"
          style={{ flex: 1 }}
        />
        <Btn color={C.cyan} small onClick={go} disabled={loading || !dest.trim()}>
          {loading ? "…" : "Go"}
        </Btn>
      </div>

      {/* Google Maps iframe */}
      {mapSrc ? (
        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${C.cyan}33`, flexShrink: 0 }}>
          <div style={{ padding: "7px 12px", background: `${C.cyan}12`, fontSize: 10, color: C.cyan, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>🗺️ {query.length > 44 ? query.slice(0, 44) + "…" : query}</span>
            <button
              onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(query)}`, "_blank")}
              style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 10, padding: 0 }}
            >
              Open ↗
            </button>
          </div>
          <iframe
            title="map"
            src={mapSrc}
            width="100%"
            height="320"
            style={{ border: "none", display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div style={{ height: 180, background: "rgba(0,255,229,0.03)", border: `1px solid ${C.cyan}22`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 32 }}>🗺️</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Enter a destination above</div>
        </div>
      )}

      {/* AI tip */}
      {tip && (
        <Card color={C.gold}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
            <span style={{ color: C.gold, fontWeight: 700 }}>{auraName}:</span> {tip}
          </div>
        </Card>
      )}

      {/* Open in Google Maps */}
      <Btn
        color={C.blue}
        outline
        onClick={() => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(dest || query)}`, "_blank")}
        style={{ width: "100%" }}
        disabled={!dest.trim() && !query}
      >
        🗺️ Open in Google Maps
      </Btn>
    </div>
  );
}
