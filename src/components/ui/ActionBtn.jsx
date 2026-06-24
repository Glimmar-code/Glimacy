import React from "react";

export const ActionBtn = ({ onClick, Icon, label, active=false, activeColor="#00D2C4", fillWhenActive=false, anim="none", T }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
    background: "none", border: "none", cursor: "pointer",
    color: active ? activeColor : T ? T.muted : "#5C6370",
    fontSize: 12, fontWeight: active ? 600 : 400,
    transition: "color 0.2s", animation: anim
  }}>
    <Icon size={16}
      fill={active && fillWhenActive ? activeColor : "none"}
      strokeWidth={active ? 2.5 : 2}
      style={{ transition: "all 0.2s" }}
    />
    <span>{label}</span>
  </button>
);