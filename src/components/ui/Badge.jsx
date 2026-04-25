const Badge = ({ children, color, dot, style = {} }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 9px", borderRadius: 20,
    background: color ? `${color}18` : "rgba(255,255,255,0.06)",
    border: `1px solid ${color ? color + "44" : "rgba(255,255,255,0.08)"}`,
    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
    color: color || "rgba(255,255,255,0.5)",
    textTransform: "uppercase", ...style,
  }}>
    {dot && (
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: color || "rgba(255,255,255,0.4)",
        boxShadow: color ? `0 0 6px ${color}` : "none",
        animation: "pulse 1.5s ease-in-out infinite",
        flexShrink: 0,
      }} />
    )}
    {children}
  </span>
);

export default Badge;
