import { C } from "../../theme/colors";

const Toggle = ({ on, onToggle, color, label, desc, style = {} }) => (
  <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", ...style }}>
    <div style={{ flex: 1 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 700, color: on ? (color || C.cyan) : "#fff", transition: "color 0.2s" }}>
          {label}
        </div>
      )}
      {desc && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{desc}</div>
      )}
    </div>
    <div style={{
      width: 44, height: 24, flexShrink: 0,
      background: on ? (color || C.cyan) : "rgba(255,255,255,0.08)",
      borderRadius: 12, position: "relative", transition: "background 0.2s",
      boxShadow: on ? `0 0 10px ${color || C.cyan}55` : "none",
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: on ? "#000" : "rgba(255,255,255,0.35)",
        transition: "left 0.2s",
      }} />
    </div>
  </div>
);

export default Toggle;
