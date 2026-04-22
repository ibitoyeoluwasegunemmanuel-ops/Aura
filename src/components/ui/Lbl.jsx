const Lbl = ({ children, color }) => (
  <div style={{
    fontSize: 8, letterSpacing: 5,
    color: color || "rgba(255,255,255,0.2)",
    textTransform: "uppercase", marginBottom: 10,
  }}>
    {children}
  </div>
);

export default Lbl;
