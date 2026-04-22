const Tag = ({ c, children }) => (
  <span style={{
    background: `${c}15`, border: `1px solid ${c}33`,
    borderRadius: 20, padding: "2px 8px", fontSize: 9,
    color: c, letterSpacing: 1,
  }}>
    {children}
  </span>
);

export default Tag;
