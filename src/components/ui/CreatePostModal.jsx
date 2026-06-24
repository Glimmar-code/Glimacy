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
 * ---------------------------------------------------------------------------
 */
import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Video, Smile, Globe2, Lock, Loader2 } from "lucide-react";

const accent = (T) => (T.isDark ? "#00D2C4" : "#0F766E");

export function CreatePostFAB({ T, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed", bottom: 92, right: 18, zIndex: 35,
        width: 54, height: 54, borderRadius: "50%", border: "none",
        background: accent(T), color: T.isDark ? "#0B0F12" : "#fff",
        fontSize: 26, fontWeight: 300, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer",
        boxShadow: `0 8px 24px ${accent(T)}55`,
        transition: "transform 0.15s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      aria-label="Create post"
    >
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
  const fileInputRef = useRef(null);

  const isVerified = !!user?.isVerified || !!user?.is_verified;
  const canPost = (content.trim().length > 0 || imageFile) && !posting;

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
      style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end",
        justifyContent: "center", animation: "cpm-fade 0.2s ease both",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes cpm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cpm-rise { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: T.isDark ? "#10161B" : "#fff",
          borderRadius: "20px 20px 0 0", padding: 18, boxSizing: "border-box",
          animation: "cpm-rise 0.28s cubic-bezier(.25,.46,.45,.94) both",
          maxHeight: "88vh", overflowY: "auto", border: `1px solid ${T.cardBorder}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>Create post</h3>
          <div onClick={onClose} style={{ cursor: "pointer", padding: 4, color: T.muted }}>
            <X size={20} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div
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

        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening on campus?"
          rows={4}
          maxLength={500}
          style={{
            width: "100%", boxSizing: "border-box", resize: "none", border: "none", outline: "none",
            background: "none", color: T.text, fontSize: 15, lineHeight: 1.5, fontFamily: "inherit",
            marginBottom: 10,
          }}
        />

        {imagePreview && (
          <div style={{ position: "relative", marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
            <img src={imagePreview} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
            <div
              onClick={() => { setImageFile(null); setImagePreview(null); }}
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
          <div style={{ fontSize: 12.5, color: "#ef4444", marginBottom: 10 }}>{error}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePickImage} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: T.inputBg, color: accent(T), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label="Add photo"
            >
              <ImageIcon size={17} />
            </button>
            <button
              disabled
              style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: T.inputBg, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "not-allowed", opacity: 0.5 }}
              aria-label="Add video (coming soon)"
              title="Coming soon"
            >
              <Video size={17} />
            </button>
            <button
              disabled
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
            style={{
              padding: "9px 22px", borderRadius: 20, border: "none", fontWeight: 700, fontSize: 13.5,
              display: "flex", alignItems: "center", gap: 6,
              background: canPost ? accent(T) : T.divider,
              color: canPost ? (T.isDark ? "#0B0F12" : "#fff") : T.muted,
              cursor: canPost ? "pointer" : "default", transition: "all 0.2s",
            }}
          >
            {posting && <Loader2 size={14} className="cpm-spin" style={{ animation: "cpm-spin 0.8s linear infinite" }} />}
            <style>{`@keyframes cpm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}