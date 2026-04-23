export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Orbitron:wght@700;900&family=Exo+2:wght@300;400;600;800&display=swap');
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.38}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  @keyframes giftFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-140px) scale(1.5)}}
  @keyframes giftBoom{0%{opacity:0;transform:scale(0.2) rotate(-10deg)}40%{opacity:1;transform:scale(1.25) rotate(3deg)}70%{transform:scale(0.95)}100%{opacity:0;transform:scale(0.8)}}
  @keyframes ultraFlash{0%,100%{opacity:0;transform:scale(0.95)}8%,92%{opacity:1;transform:scale(1)}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes heartPop{0%{transform:scale(0)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
  @keyframes entrySlide{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;overflow:hidden;}
  ::-webkit-scrollbar{width:3px;background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(0,255,229,0.12);border-radius:3px;}
  textarea::placeholder,input::placeholder{color:rgba(255,255,255,0.18);}
  select option{background:#111;color:#fff;}
`;
