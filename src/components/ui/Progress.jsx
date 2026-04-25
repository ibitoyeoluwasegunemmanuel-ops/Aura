import { C } from "../../theme/colors";

const Progress = ({ value = 0, color, label, style = {} }) => (
  <div style={{ ...style }}>
    {label && (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 9, color: color || C.cyan }}>{Math.round(value)}%</span>
      </div>
    )}
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color || C.cyan,
        borderRadius: 2, transition: "width 0.4s ease",
        boxShadow: `0 0 6px ${color || C.cyan}88`,
      }} />
    </div>
  </div>
);

export default Progress;
