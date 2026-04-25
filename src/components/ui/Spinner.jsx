import { C } from "../../theme/colors";

const Spinner = ({ color, size = 20, style = {} }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    border: `2px solid ${color ? color + "22" : "rgba(255,255,255,0.08)"}`,
    borderTopColor: color || C.cyan,
    animation: "rotate 0.75s linear infinite",
    ...style,
  }} />
);

export default Spinner;
