import React from "react";
import { Search, Settings } from "lucide-react";

export default function Header({ T, user, onAvatarClick, onSearchClick, onSettingsClick, children }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderBottom: `1px solid ${T.divider}`,
      background: T.isDark ? "rgba(11,15,18,0.92)" : "rgba(255,255,255,0.92)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      {/* Clickable user profile avatar trigger */}
      <div onClick={onAvatarClick} style={{ cursor: "pointer" }}>
        {children}
      </div>

      {/* User meta data info block */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: T.muted }}>{user.handle}</div>
      </div>

      {/* Functional action items */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Search
          size={19}
          color={T.muted}
          style={{ cursor: "pointer", transition: "transform 0.1s" }}
          onClick={onSearchClick}
          onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        />
        <Settings
          size={19}
          color={T.muted}
          style={{ cursor: "pointer", transition: "transform 0.15s" }}
          onClick={onSettingsClick}
          onMouseDown={e => e.currentTarget.style.transform = "rotate(30deg) scale(0.9)"}
          onMouseUp={e => e.currentTarget.style.transform = "rotate(0deg) scale(1)"}
        />
      </div>
    </div>
  );
}