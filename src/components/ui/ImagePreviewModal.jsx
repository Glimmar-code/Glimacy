// components/ui/ImagePreviewModal.jsx
// ─── Avatar / Cover image preview with animations ───────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { X, Camera } from "lucide-react";

// ── Avatar gradient palette (must match Avatar.jsx) ─────────────────────────
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

const getGradient = (seed = "U") =>
  AG[((seed.charCodeAt(0) || 0) + (seed.charCodeAt(1) || 0)) % AG.length];

// ── ImagePreviewModal ────────────────────────────────────────────────────────
// Props:
//   isOpen       boolean         – whether modal is visible
//   type         "avatar"|"cover" – which image to preview
//   user         object          – profile data { name, handle, seed }
//   T            theme object    – current theme
//   isOwnProfile boolean         – show change-photo button for own profile
//   onClose      () => void      – called when modal should close
//   onChangePhoto () => void     – called when "Change Photo" is tapped (optional)
// ────────────────────────────────────────────────────────────────────────────
export default function ImagePreviewModal({
  isOpen,
  type = "avatar",
  user,
  T,
  isOwnProfile = false,
  onClose,
  onChangePhoto,
}) {
  const [phase, setPhase] = useState("closed"); // "opening" | "open" | "closing" | "closed"
  const timerRef = useRef(null);

  // Drive the open/close animation states
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (isOpen) {
      setPhase("opening");
      timerRef.current = setTimeout(() => setPhase("open"), 30);
    } else {
      if (phase !== "closed") {
        setPhase("closing");
        timerRef.current = setTimeout(() => setPhase("closed"), 320);
      }
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    setPhase("closing");
    timerRef.current = setTimeout(() => {
      setPhase("closed");
      onClose?.();
    }, 300);
  };

  if (phase === "closed") return null;

  const isEntering = phase === "opening" || phase === "open";
  const seed  = user?.seed || user?.name || "U";
  const name  = user?.name || "Profile";
  const handle = user?.handle || "";
  const initials = (seed || "U").charAt(0).toUpperCase();
  const avatarGrad = getGradient(seed);

  // ── Transition values ────────────────────────────────────────────────────
  const overlayOpacity = isEntering ? 1 : 0;
  const contentScale   = isEntering ? 1 : 0.78;
  const contentOpacity = isEntering ? 1 : 0;
  const contentTY      = isEntering ? 0 : 30;

  const dur = "0.32s";
  const ease = "cubic-bezier(0.34,1.56,0.64,1)";
  const closeDur = "0.28s";
  const closeEase = "ease";

  const isClosingAnim = phase === "closing";
  const transition = isClosingAnim
    ? `opacity ${closeDur} ${closeEase}, transform ${closeDur} ${closeEase}`
    : `opacity ${dur} ${ease}, transform ${dur} ${ease}`;

  return (
    <>
      <style>{`
        @keyframes imgBgIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes imgBgOut { from { opacity: 1 } to { opacity: 0 } }

        @keyframes avatarGlow {
          0%,100% { box-shadow: 0 0 40px rgba(0,210,196,0.35), 0 0 80px rgba(0,210,196,0.15); }
          50%      { box-shadow: 0 0 70px rgba(0,210,196,0.55), 0 0 130px rgba(0,210,196,0.28); }
        }
        @keyframes coverShimmerPrev {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
        @keyframes coverGlowPrev {
          0%,100% { opacity: 0.7 }
          50%      { opacity: 1   }
        }
        @keyframes ringRotate {
          to { transform: rotate(360deg); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0 }
          70%  { transform: scale(1.15) rotate(3deg); opacity: 1 }
          100% { transform: scale(1) rotate(0deg); opacity: 1 }
        }
        @keyframes nameSlideUp {
          from { opacity: 0; transform: translateY(10px) }
          to   { opacity: 1; transform: translateY(0)    }
        }
      `}</style>

      {/* ── Dark overlay (tap to close) ────────────────────────────────── */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.93)",
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
          animation: isClosingAnim ? "imgBgOut 0.3s ease forwards" : "imgBgIn 0.25s ease forwards",
        }}
      />

      {/* ── Modal panel ───────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 501,
          display: "flex", flexDirection: "column",
          opacity: contentOpacity,
          transform: `scale(${contentScale}) translateY(${contentTY}px)`,
          transition,
          pointerEvents: phase === "closing" ? "none" : "all",
        }}
      >
        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 18px 0",
        }}>
          <div>
            <div style={{
              fontWeight: 700, fontSize: 15.5, color: "#fff",
              animation: isEntering ? "nameSlideUp 0.4s ease 0.12s both" : "none"
            }}>
              {name}
            </div>
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.42)", marginTop: 3,
              animation: isEntering ? "nameSlideUp 0.4s ease 0.18s both" : "none"
            }}>
              {type === "avatar" ? "Profile Photo" : "Cover Photo"}
            </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "50%", width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff",
              backdropFilter: "blur(8px)",
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Preview area ─────────────────────────────────────────── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "24px 24px 0",
        }}>

          {type === "avatar" ? (
            /* ─────── AVATAR PREVIEW ─────────────────────────────── */
            <>
              {/* Decorative spinning ring */}
              <div style={{
                position: "relative", width: 270, height: 270,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Outer spinning dashed ring */}
                <div style={{
                  position: "absolute", inset: -6,
                  borderRadius: "50%",
                  border: "2px dashed rgba(0,210,196,0.3)",
                  animation: "ringRotate 8s linear infinite",
                }} />
                {/* Solid glow ring */}
                <div style={{
                  position: "absolute", inset: -3,
                  borderRadius: "50%",
                  border: "2px solid rgba(0,210,196,0.18)",
                }} />

                {/* Avatar circle */}
                <div style={{
                  width: 250, height: 250, borderRadius: "50%",
                  background: avatarGrad,
                  border: "3.5px solid rgba(0,210,196,0.65)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "avatarGlow 3.2s ease-in-out infinite",
                  position: "relative", overflow: "hidden",
                  userSelect: "none",
                }}>
                  {/* Shine overlay */}
                  <div style={{
                    position: "absolute", top: "-20%", left: "-10%",
                    width: "50%", height: "60%",
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "50%",
                    transform: "rotate(-30deg)",
                    pointerEvents: "none",
                  }} />
                  <span style={{
                    fontSize: 90, fontWeight: 800,
                    color: "rgba(0,0,0,0.65)",
                    letterSpacing: "-0.04em", lineHeight: 1,
                    textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                  }}>
                    {initials}
                  </span>
                </div>
              </div>

              {/* Name + handle below avatar */}
              <div style={{ marginTop: 24, textAlign: "center" }}>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: "#fff",
                  animation: isEntering ? "nameSlideUp 0.4s ease 0.25s both" : "none"
                }}>
                  {name}
                </div>
                {handle && (
                  <div style={{
                    fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 5,
                    animation: isEntering ? "nameSlideUp 0.4s ease 0.30s both" : "none"
                  }}>
                    {handle}
                  </div>
                )}
              </div>
            </>

          ) : (
            /* ─────── COVER PREVIEW ───────────────────────────────── */
            <>
              <div style={{
                width: "100%", borderRadius: 18, overflow: "hidden",
                boxShadow: "0 24px 64px rgba(0,0,0,0.75)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                {/* Cover gradient */}
                <div style={{
                  height: 200, position: "relative", overflow: "hidden",
                  background: "linear-gradient(135deg,#0D1B2A,#162540,#0D1B2A,#0D2B3A)",
                  backgroundSize: "800px 200px",
                }}>
                  {/* Moving shimmer sweep */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(0,210,196,0.10) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "coverShimmerPrev 2.8s linear infinite",
                  }} />
                  {/* Radial cyan glow */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse at 38% 55%, rgba(0,210,196,0.22) 0%, transparent 65%)",
                    animation: "coverGlowPrev 3.5s ease-in-out infinite",
                  }} />
                  {/* Secondary glow */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse at 72% 30%, rgba(0,119,182,0.15) 0%, transparent 55%)",
                  }} />
                  {/* Bottom fade */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                    background: "linear-gradient(to top, rgba(11,15,18,0.5), transparent)",
                  }} />
                </div>
              </div>

              {/* Name below cover */}
              <div style={{ marginTop: 22, textAlign: "center" }}>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: "#fff",
                  animation: isEntering ? "nameSlideUp 0.4s ease 0.25s both" : "none"
                }}>
                  {name}
                </div>
                <div style={{
                  fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 5,
                  animation: isEntering ? "nameSlideUp 0.4s ease 0.30s both" : "none"
                }}>
                  Cover Photo
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Bottom action buttons ─────────────────────────────── */}
        <div style={{ padding: "24px 20px 44px", display: "flex", gap: 12 }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.07)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: "pointer", backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
          >
            Close
          </button>

          {isOwnProfile && (
            <button
              onClick={() => { handleClose(); setTimeout(() => onChangePhoto?.(type), 310); }}
              style={{
                flex: 2, padding: "13px 0", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #00D2C4, #0077b6)",
                color: "#0B0F12", fontSize: 14, fontWeight: 700,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 20px rgba(0,210,196,0.35)",
                transition: "opacity 0.2s, transform 0.15s",
              }}
              onMouseOver={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseOut={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Camera size={16} />
              Change {type === "avatar" ? "Photo" : "Cover"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}