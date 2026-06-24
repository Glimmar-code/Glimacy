import React from "react";
import { CheckCircle2 } from "lucide-react";

export const VerifiedBadge = () => (
  <CheckCircle2 size={13} color="#00D2C4" strokeWidth={2.5}
    style={{ display:"inline-block", flexShrink:0, marginTop:1 }} />
);

export const Tag = ({ emoji, label, T }) => (
  <span style={{
    fontSize: 11, background: "rgba(255,255,255,0.04)",
    padding: "4px 9px", borderRadius: 8, border: `1px solid ${T.divider}`,
    display: "inline-flex", alignItems: "center", gap: 4
  }}>
    {emoji} {label}
  </span>
);

export const EmptyState = ({ emoji, title, sub, T }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}>
    <div style={{ fontSize: 40, marginBottom: 10 }}>{emoji}</div>
    <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13 }}>{sub}</div>
  </div>
);

/** Pill button used for Get Verified & Earn Token */
export const ActionBadgeBtn = ({ icon: Icon, label, accentColor, dimColor, borderColor, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "9px 10px", borderRadius: 22, fontSize: 12, fontWeight: 700,
      background: dimColor,
      border: `1px solid ${borderColor}`,
      color: accentColor, cursor: "pointer",
      transition: "all 0.18s",
      whiteSpace: "nowrap",
    }}
    onMouseOver={e => { e.currentTarget.style.background = borderColor; }}
    onMouseOut={e => { e.currentTarget.style.background = dimColor; }}
  >
    <Icon size={13} strokeWidth={2.5} />
    {label}
  </button>
);