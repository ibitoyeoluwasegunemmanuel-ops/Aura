import { C } from "../../theme/colors";

const Btn = ({ children, color, onClick, style = {}, small, outline, disabled }) => (
  <button disabled={disabled} onClick={onClick} style={{
    padding: small ? "7px 13px" : "11px 20px",
    background: outline ? "transparent" : `linear-gradient(135deg,${color || C.cyan},${color ? color + "bb" : C.purple})`,
    border: outline ? `1px solid ${color || C.cyan}55` : "none",
    borderRadius: 10, color: outline ? (color || C.cyan) : "#000",
    fontSize: small ? 11 : 13, fontWeight: 700, cursor: disabled ? "default" : "pointer",
    fontFamily: "'DM Mono',monospace", letterSpacing: 0.5,
    opacity: disabled ? 0.4 : 1, transition: "all 0.2s",
    boxShadow: outline ? "none" : `0 0 16px ${color || C.cyan}22`, ...style,
  }}>{children}</button>
);

export default Btn;
