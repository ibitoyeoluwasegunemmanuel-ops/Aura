import { C } from "../../theme/colors";

const Modal = ({ open, onClose, title, children, color, style = {} }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 10px 24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0d0d1a",
          border: `1px solid ${color ? color + "33" : C.border}`,
          borderRadius: 20, padding: 18,
          width: "100%", maxWidth: 480,
          animation: "slideDown 0.22s ease",
          ...style,
        }}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: color || C.cyan, fontFamily: "'DM Mono',monospace" }}>{title}</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
