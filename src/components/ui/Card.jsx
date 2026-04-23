import { C } from "../../theme/colors";

const Card = ({ children, color, style = {} }) => (
  <div style={{
    background: color ? `${color}08` : C.card,
    border: `1px solid ${color ? color + "22" : C.border}`,
    borderRadius: 14, padding: 14, ...style,
  }}>
    {children}
  </div>
);

export default Card;
