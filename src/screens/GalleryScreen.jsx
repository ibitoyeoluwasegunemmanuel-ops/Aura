import { useState } from "react";
import { C } from "../theme/colors";
import { sto } from "../utils/storage";

export default function GalleryScreen() {
  const sessions = sto.get("aura_sessions", []);
  const images = sessions.flatMap(s => {
    const msgs = sto.get("msgs_" + s.id, []);
    return msgs
      .filter(m => m.type === "image" && m.imageUrl)
      .map(m => ({ url: m.imageUrl, caption: m.caption || "", session: s.title }));
  });

  const [selected, setSelected] = useState(null);

  if (images.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 56, opacity: 0.4 }}>🖼️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>No Images Yet</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.7, maxWidth: 260 }}>
          Ask AURA to generate an image and it will appear here automatically.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
        {images.length} image{images.length !== 1 ? "s" : ""} generated
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setSelected(img)}
            style={{ borderRadius: 12, overflow: "hidden", cursor: "pointer", border: `1px solid rgba(255,255,255,0.07)`, aspectRatio: "1/1", background: "#0d0d1a", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${C.cyan}44`; e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.transition = "all 0.15s"; }}
            onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "scale(1)"; }}>
            <img src={img.url} alt={img.caption} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.style.opacity = "0.2"; }} />
            {img.caption && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", padding: "16px 8px 6px", fontSize: 9, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                {img.caption.slice(0, 40)}{img.caption.length > 40 ? "…" : ""}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(12px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "min(600px, 90vw)", width: "100%" }}>
            <img src={selected.url} alt={selected.caption} style={{ width: "100%", borderRadius: 18, objectFit: "contain", maxHeight: "70vh", display: "block" }} />
            <div style={{ marginTop: 14, textAlign: "center" }}>
              {selected.caption && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 6 }}>{selected.caption}</div>}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>from: {selected.session}</div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button onClick={() => { const a = document.createElement("a"); a.href = selected.url; a.download = "aura-image.png"; a.target = "_blank"; a.click(); }}
                style={{ background: `${C.cyan}18`, border: `1px solid ${C.cyan}44`, borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontSize: 11, color: C.cyan, fontFamily: "'DM Mono',monospace" }}>
                ⬇ Download
              </button>
              <button onClick={() => setSelected(null)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono',monospace" }}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
