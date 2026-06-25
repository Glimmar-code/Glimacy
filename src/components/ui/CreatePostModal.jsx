/**
 * CreatePostModal.jsx
 * ---------------------------------------------------------------------------
 * This file did not exist in your upload, but App.jsx imports it from
 * "./components/ui/CreatePostModal" and it is the direct cause of bug #1
 * ("why can't I post / posts vanish on refresh"). Place this file there.
 *
 * Design: this component is UI-only. It never talks to Supabase directly.
 * It hands the composed post up to `onPost(draft)`, and App.jsx's
 * `handleCreatePost` (see App.jsx) decides what to do with it:
 *   - verified user  -> uploads image (if any) to Supabase Storage, inserts
 *                       a row into `posts`, prepends the real DB row to feed
 *   - unverified user -> saves the draft into IndexedDB only (this device),
 *                       never reaches Supabase, never visible to anyone else
 * That keeps exactly one place in the app responsible for persistence,
 * which is what was missing before.
 *
 * UI PASS: added premium, smooth motion throughout — staggered entrance,
 * spring sheet rise, animated avatar/badge, focus-lift on the textarea,
 * pop-in image preview, micro-interactions on every action button, an
 * animated character counter, and a polished posting state. No logic,
 * props, or persistence behaviour changed.
 * ---------------------------------------------------------------------------
 */
import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Video, Smile, Globe2, Lock, Loader2 } from "lucide-react";

const accent = (T) => (T.isDark ? "#00D2C4" : "#0F766E");

export function CreatePostFAB({ T, onClick }) {
  return (
    <button
      onClick={onClick}
      className="cpm-fab"
      style={{
        position: "fixed", bottom: 92, right: 18, zIndex: 35,
        width: 54, height: 54, borderRadius: "50%", border: "none",
        background: accent(T), color: T.isDark ? "#0B0F12" : "#fff",
        fontSize: 26, fontWeight: 300, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer",
        boxShadow: `0 8px 24px ${accent(T)}55`,
      }}
      aria-label="Create post"
    >
      <style>{`
        @keyframes cpm-fab-in { from { transform: scale(0) rotate(-90deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
        .cpm-fab {
          animation: cpm-fab-in 0.45s cubic-bezier(.34,1.56,.64,1) both;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease;
        }
        .cpm-fab:hover { transform: scale(1.08) rotate(90deg); box-shadow: 0 12px 30px ${accent(T)}77; }
        .cpm-fab:active { transform: scale(0.9) rotate(90deg); }
      `}</style>
      +
    </button>
  );
}

export default function CreatePostModal({ T, user, onClose, onPost }) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef(null);

  const isVerified = !!user?.isVerified || !!user?.is_verified;
  const canPost = (content.trim().length > 0 || imageFile) && !posting;
  const remaining = 500 - content.length;

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!canPost) return;
    setPosting(true);
    setError("");
    try {
      await onPost({
        content: content.trim(),
        imageFile,
        type: imageFile ? "image" : "text",
      });
      onClose();
    } catch (err) {
      console.error("Failed to create post:", err);
      setError(err?.message || "Couldn't post that. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      className="cpm-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes cpm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cpm-blur-in { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); } }
        @keyframes cpm-rise { from { transform: translateY(60px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes cpm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes cpm-pop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.04); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes cpm-avatar-in { from { transform: scale(0.4) rotate(-20deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes cpm-shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-5px); } 40%,80% { transform: translateX(5px); } }
        @keyframes cpm-row-in { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .cpm-overlay { animation: cpm-blur-in 0.28s ease both; }
        .cpm-sheet { animation: cpm-rise 0.4s cubic-bezier(.22,1,.36,1) both; }
        .cpm-stagger > * { animation: cpm-row-in 0.45s cubic-bezier(.22,1,.36,1) both; }
        .cpm-stagger > *:nth-child(1) { animation-delay: 0.06s; }
        .cpm-stagger > *:nth-child(2) { animation-delay: 0.12s; }
        .cpm-stagger > *:nth-child(3) { animation-delay: 0.18s; }
        .cpm-stagger > *:nth-child(4) { animation-delay: 0.24s; }
        .cpm-stagger > *:nth-child(5) { animation-delay: 0.30s; }

        .cpm-avatar { animation: cpm-avatar-in 0.5s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .cpm-badge { transition: transform 0.2s ease; }
        .cpm-textarea-wrap { transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease; border: 1px solid transparent; border-radius: 14px; }
        .cpm-preview { animation: cpm-pop 0.35s cubic-bezier(.34,1.56,.64,1) both; }
        .cpm-error { animation: cpm-shake 0.4s ease both; }
        .cpm-close { transition: transform 0.2s ease, background 0.2s ease; border-radius: 50%; }
        .cpm-close:hover { transform: rotate(90deg); background: ${T.inputBg}; }

        .cpm-tool { transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), background 0.2s ease, color 0.2s ease; }
        .cpm-tool:not(:disabled):hover { transform: translateY(-3px) scale(1.06); }
        .cpm-tool:not(:disabled):active { transform: translateY(0) scale(0.92); }

        .cpm-post {
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease, filter 0.2s ease;
          position: relative; overflow: hidden;
        }
        .cpm-post.cpm-post-active:hover { transform: translateY(-2px); filter: brightness(1.05); box-shadow: 0 10px 24px ${accent(T)}55; }
        .cpm-post.cpm-post-active:active { transform: translateY(0) scale(0.96); }

        .cpm-img-remove { transition: transform 0.18s ease, background 0.2s ease; }
        .cpm-img-remove:hover { transform: scale(1.12) rotate(90deg); background: rgba(0,0,0,0.75); }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="cpm-sheet"
        style={{
          width: "100%", maxWidth: 480, background: T.isDark ? "#10161B" : "#fff",
          borderRadius: "20px 20px 0 0", padding: 18, boxSizing: "border-box",
          maxHeight: "88vh", overflowY: "auto", border: `1px solid ${T.cardBorder}`,
        }}
      >
        <div className="cpm-stagger" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Create post</h3>
            <div onClick={onClose} className="cpm-close" style={{ cursor: "pointer", padding: 4, color: T.muted, display: "flex" }}>
              <X size={20} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div
              className="cpm-avatar"
              style={{
                width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(145deg, ${accent(T)}99, ${accent(T)})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 14, overflow: "hidden",
              }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user?.seed || user?.name || "U").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: T.text }}>{user?.name || "You"}</div>
              <div
                className="cpm-badge"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2,
                  fontSize: 11, color: isVerified ? accent(T) : T.muted,
                  background: isVerified ? `${accent(T)}1A` : T.inputBg,
                  border: `1px solid ${isVerified ? accent(T) + "44" : T.inputBorder}`,
                  borderRadius: 20, padding: "2px 8px",
                }}
              >
                {isVerified ? <Globe2 size={11} /> : <Lock size={11} />}
                {isVerified ? "Visible to everyone" : "Saved to this device only"}
              </div>
            </div>
          </div>

          {!isVerified && (
            <div
              style={{
                fontSize: 12, color: T.muted, background: T.inputBg, border: `1px solid ${T.inputBorder}`,
                borderRadius: 10, padding: "8px 10px", marginBottom: 10, lineHeight: 1.45,
              }}
            >
              Only verified accounts publish posts to the public feed. Yours will be saved privately on
              this device — get verified from your profile to start publishing to everyone.
            </div>
          )}

          <div
            className="cpm-textarea-wrap"
            style={{
              marginBottom: 10,
              padding: focused ? 10 : 0,
              borderColor: focused ? `${accent(T)}66` : "transparent",
              boxShadow: focused ? `0 0 0 4px ${accent(T)}1f` : "none",
              background: focused ? T.inputBg : "transparent",
            }}
          >
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="What's happening on campus?"
              rows={4}
              maxLength={500}
              style={{
                width: "100%", boxSizing: "border-box", resize: "none", border: "none", outline: "none",
                background: "none", color: T.text, fontSize: 15, lineHeight: 1.5, fontFamily: "inherit",
              }}
            />
            <div
              style={{
                textAlign: "right", fontSize: 11, fontWeight: 600,
                color: remaining <= 50 ? "#ef4444" : T.mutedMid,
                opacity: content.length > 0 ? 1 : 0,
                transform: content.length > 0 ? "translateY(0)" : "translateY(-4px)",
                transition: "opacity 0.25s ease, transform 0.25s ease, color 0.25s ease",
              }}
            >
              {remaining}
            </div>
          </div>
        </div>

        {imagePreview && (
          <div className="cpm-preview" style={{ position: "relative", marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
            <img src={imagePreview} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
            <div
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="cpm-img-remove"
              style={{
                position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
                background: "rgba(0,0,0,0.55)", color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer",
              }}
            >
              <X size={15} />
            </div>
          </div>
        )}

        {error && (
          <div className="cpm-error" style={{ fontSize: 12.5, color: "#ef4444", marginBottom: 10 }}>{error}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePickImage} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="cpm-tool"
              style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: T.inputBg, color: accent(T), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label="Add photo"
            >
              <ImageIcon size={17} />
            </button>
            <button
              disabled
              className="cpm-tool"
              style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: T.inputBg, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "not-allowed", opacity: 0.5 }}
              aria-label="Add video (coming soon)"
              title="Coming soon"
            >
              <Video size={17} />
            </button>
            <button
              disabled
              className="cpm-tool"
              style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: T.inputBg, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "not-allowed", opacity: 0.5 }}
              aria-label="Add emoji (coming soon)"
              title="Coming soon"
            >
              <Smile size={17} />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canPost}
            className={`cpm-post ${canPost ? "cpm-post-active" : ""}`}
            style={{
              padding: "9px 22px", borderRadius: 20, border: "none", fontWeight: 700, fontSize: 13.5,
              display: "flex", alignItems: "center", gap: 6,
              background: canPost ? accent(T) : T.divider,
              color: canPost ? (T.isDark ? "#0B0F12" : "#fff") : T.muted,
              cursor: canPost ? "pointer" : "default",
            }}
          >
            {posting && <Loader2 size={14} style={{ animation: "cpm-spin 0.8s linear infinite" }} />}
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
