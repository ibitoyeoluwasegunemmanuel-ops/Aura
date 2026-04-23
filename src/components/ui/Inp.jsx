import { C } from "../../theme/colors";

const Inp = ({ value, onChange, placeholder, type = "text", onKeyDown, style = {} }) => (
  <input
    type={type} value={value} onChange={onChange}
    onKeyDown={onKeyDown} placeholder={placeholder}
    style={{
      background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "10px 13px", color: "#fff",
      fontSize: 12, fontFamily: "'DM Mono',monospace",
      outline: "none", width: "100%", ...style,
    }}
  />
);

export default Inp;
