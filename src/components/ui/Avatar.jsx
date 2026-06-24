import React from "react";

// Avatar Gradient Palette
const AG = [
  "linear-gradient(135deg,#00D2C4,#0077b6)",
  "linear-gradient(135deg,#7c3aed,#00D2C4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#0ea5e9)",
  "linear-gradient(135deg,#e879f9,#6366f1)",
  "linear-gradient(135deg,#f97316,#facc15)",
  "linear-gradient(135deg,#06b6d4,#8b5cf6)",
  "linear-gradient(135deg,#84cc16,#14b8a6)",
];

export const Avatar = ({ size=40, seed="U", glow=false, ring=null, T=null, onClick=null }) => {
  const idx = ((seed.charCodeAt(0)||0)+(seed.charCodeAt(1)||0)) % AG.length;
  const ab = T ? (T.isDark ? "rgba(0,210,196,0.22)" : "rgba(15,118,110,0.30)") : "rgba(0,210,196,0.22)";
  const ag = T ? (T.isDark ? "rgba(0,210,196,0.38)" : "rgba(15,118,110,0.25)") : "rgba(0,210,196,0.38)";
  
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      border: ring ? `2px solid ${ring}` : glow ? `1.5px solid ${ab}` : "1.5px solid rgba(255,255,255,0.06)",
      boxShadow: ring ? `0 0 10px ${ring}88,0 0 24px ${ring}44` : glow ? `0 0 18px ${ag}` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: AG[idx], overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseOver={e => { if (onClick) { e.currentTarget.style.transform = "scale(1.07)"; } }}
      onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <span style={{ fontSize: Math.round(size*0.36), fontWeight:700, color:"#0B0F12", letterSpacing:"-0.02em" }}>
        {(seed||"U").charAt(0).toUpperCase()}
      </span>
    </div>
  );
};