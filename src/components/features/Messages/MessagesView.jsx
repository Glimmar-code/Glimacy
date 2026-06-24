/**
 * MessagesView.jsx  — Updated
 * ─ No online status in conversation list
 * ─ Press-and-hold context menu (Delete · React · Share · Copy · Reply)
 * ─ Swipe-right on a bubble to reply (WhatsApp style)
 * ─ Tap user avatar → full rich profile (all details, verified, stats, posts)
 * ─ Profile chaining: tap post-author avatars inside profile → deep-stack
 * ─ Dark-purple Spotify-style brand colours
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart, MessageCircle, Bookmark, BookmarkCheck, Share2, Eye,
  ArrowLeft, X, Copy, Trash2, CornerUpLeft, Smile, Send,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────
// BRAND HELPERS  (Spotify: near-black + purple + white)
// ─────────────────────────────────────────────────
const PURPLE     = "#8B5CF6";
const PURPLE_LT  = "#A78BFA";
const PURPLE_DIM = "rgba(139,92,246,0.15)";
const PURPLE_BD  = "rgba(139,92,246,0.30)";

const getAccent       = () => PURPLE;
const getAccentDim    = () => PURPLE_DIM;
const getAccentBorder = () => PURPLE_BD;

// ─────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────
const USERS = {
  1: {
    id: 1, name: "Sarah Johnson", handle: "@sarah_j", verified: true, ini: "SJ", c: "#7c3aed",
    online: true, lastSeen: "Active now",
    cover:  "https://picsum.photos/seed/sarah_cover/600/200",
    avatar: "https://picsum.photos/seed/sarah_av/200/200",
    school: "Federal University of Technology, Akure",
    faculty: "SEMS", gender: "Female", relationship: "Single",
    bio: "Product Designer · She/Her 🎨",
    gmail: "sarah.johnson@gmail.com",
    hobby: "UI Design, Photography",
    worldRank: 142, campusRank: 12,
    followers: 3400, following: 280,
    postIds: ["p1"], likedPostIds: ["p3", "p4"],
    tokens: 320, score: 4200,
  },
  2: {
    id: 2, name: "Alex Rivera", handle: "@arivera", verified: true, ini: "AR", c: "#0891b2",
    online: false, lastSeen: "2 hours ago",
    cover:  "https://picsum.photos/seed/alex_cover/600/200",
    avatar: null,
    school: "University of Lagos", faculty: "Engineering",
    gender: "Male", relationship: "Taken",
    bio: "Full Stack Engineer · He/Him 💻",
    gmail: "arivera@gmail.com",
    hobby: "Open Source, Gaming",
    worldRank: 89, campusRank: 4,
    followers: 7200, following: 410,
    postIds: ["p3"], likedPostIds: ["p1"],
    tokens: 810, score: 9100,
  },
  3: {
    id: 3, name: "Mia Chen", handle: "@mia_art", verified: false, ini: "MC", c: "#dc2626",
    online: true, lastSeen: "Active now",
    cover:  "https://picsum.photos/seed/mia_cover/600/200",
    avatar: "https://picsum.photos/seed/mia_av/200/200",
    school: "Obafemi Awolowo University", faculty: "Fine Arts",
    gender: "Female", relationship: "Single",
    bio: "Artist & Content Creator 🎨✨",
    gmail: "mia.chen@gmail.com",
    hobby: "Digital Art, Travel",
    worldRank: 412, campusRank: 55,
    followers: 1850, following: 192,
    postIds: ["p4"], likedPostIds: [],
    tokens: 140, score: 1700,
  },
};

const GLOBAL_POSTS = {
  p1: {
    id: "p1", authorId: 1,
    text: "Just finished the new wireframes for the campus app! So excited for everyone to see this ✨🚀",
    time: "2h ago", likes: 142, views: 1240,
    comments: [
      { id: "c1", authorId: 2, authorName: "Alex Rivera", text: "Looks incredible Sarah! Can't wait to build this.", time: "1h ago" },
    ],
  },
  p3: {
    id: "p3", authorId: 2,
    text: "Finally pushed the backend updates. Node.js is running smooth. Time for a coffee break ☕💻",
    time: "5h ago", likes: 304, views: 2100, comments: [],
  },
  p4: {
    id: "p4", authorId: 3,
    text: "Working on a new digital portrait today. Drop your favorite colors below! 👇🎨",
    time: "1d ago", likes: 89, views: 780,
    comments: [
      { id: "c2", authorId: 1, authorName: "Sarah Johnson", text: "Cyan and deep purple! 💜💙", time: "20h ago" },
    ],
  },
};

const CONVS_INIT = [
  { id: 1, uid: 1, lastMsg: "Can you send me the files?",       time: "2:45 PM", unread: 3 },
  { id: 2, uid: 2, lastMsg: "The build is ready for review! 🚀", time: "1:30 PM", unread: 1 },
  { id: 3, uid: 3, lastMsg: "Check out my new artwork 🎨",       time: "12:15 PM", unread: 0 },
];

const MSGS_INIT = {
  1: [
    { id: "m1", from: "me", text: "Hey Sarah! How's the new project going?",     time: "2:28 PM", reactions: [] },
    { id: "m2", from: 1,    text: "It's going amazing! Just finished wireframes.", time: "2:29 PM", reactions: [] },
    { id: "m6", from: 1,    text: "Can you send me the original files?",           time: "2:45 PM", reactions: [] },
  ],
  2: [
    { id: "m7", from: 2, text: "Hey! Just pushed the latest changes.",   time: "1:20 PM", reactions: [] },
    { id: "m9", from: 2, text: "The build is ready for review! 🚀",     time: "1:30 PM", reactions: [] },
  ],
  3: [
    { id: "m10", from: 3, text: "Just finished a new piece! Took me 3 days.", time: "12:10 PM", reactions: [] },
    { id: "m12", from: 3, text: "Check out my new artwork 🎨",               time: "12:15 PM", reactions: [] },
  ],
};

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "🔥"];

// ─────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; user-select: none; }
::-webkit-scrollbar { display: none; }
input, textarea { user-select: text; }

@keyframes slideInRight { from { transform: translateX(102%); } to { transform: translateX(0); } }
@keyframes slideInUp    { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp       { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes convIn       { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
@keyframes ctxPop       { from { opacity: 0; transform: scale(.88) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes onPulse      { 0%,100% { opacity:1; } 50% { opacity:.4; } }
@keyframes reactionPop  { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }

.slide-right  { animation: slideInRight .32s cubic-bezier(.25,.46,.45,.94) both; }
.fade-in      { animation: fadeIn .22s ease both; }
.fade-up      { animation: fadeUp .28s ease-out both; }
.ctx-pop      { animation: ctxPop .22s ease both; }
.rx-pop       { animation: reactionPop .28s ease both; }

button { border: none; cursor: pointer; font-family: inherit; }
`;

// ─────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────
function Av({ u, T, sz = 44, onClick, dot = false, ring = false, imgStyle = {} }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative", flexShrink: 0,
        width: sz, height: sz, borderRadius: "50%",
        background: u?.avatar ? "transparent" : `linear-gradient(145deg,${u?.c || "#555"}99,${u?.c || "#555"})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: sz * 0.34, fontWeight: 800, color: "#fff", letterSpacing: 0.4,
        cursor: onClick ? "pointer" : "default",
        boxShadow: ring
          ? `0 0 0 3px ${T.bg},0 0 0 5px ${u?.c || "#555"}88,0 0 16px ${u?.c || "#555"}55`
          : `0 2px 12px ${u?.c || "#555"}44`,
        transition: "transform .16s",
        ...imgStyle,
      }}
    >
      {u?.avatar
        ? <img src={u.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        : (u?.ini || "?")}
      {dot && u?.online && (
        <div style={{
          position: "absolute", bottom: sz > 40 ? 2 : 1, right: sz > 40 ? 2 : 1,
          width: sz * 0.265, height: sz * 0.265, borderRadius: "50%",
          background: "#22c55e", border: `2.5px solid ${T.bg}`,
          animation: "onPulse 2.4s ease-in-out infinite",
        }} />
      )}
    </div>
  );
}

function VerifiedBadge({ type = "blue" }) {
  const bg = type === "white"
    ? "linear-gradient(135deg,#fff,#e0e0e0)"
    : "linear-gradient(135deg,#00d4ff,#6c63ff)";
  const shadow = type === "white"
    ? "0 0 7px rgba(255,255,255,.55)"
    : "0 0 7px rgba(0,212,255,.55)";
  const color = type === "white" ? "#444" : "#fff";
  return (
    <div title={type === "white" ? "White Verified (Campus Elite)" : "Blue Verified (Premium/Pro)"} style={{
      width: 15, height: 15, borderRadius: "50%", flexShrink: 0,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, color, fontWeight: 900, boxShadow: shadow,
    }}>✓</div>
  );
}

function InfoRow({ icon, label, color, T }) {
  if (!label) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: color || T?.muted }}>
      <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: "center" }}>{icon}</span>
      <span style={{ lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

function StatPill({ value, label, T }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// SOCIAL POST CARD (inside profile views)
// ─────────────────────────────────────────────────
function SocialPostCard({ post, T, onOpenProfile }) {
  const accent = getAccent();
  const author = USERS[post.authorId];
  const [liked,        setLiked]        = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments,     setComments]     = useState(post.comments || []);
  const [commentText,  setCommentText]  = useState("");

  const handleLike    = () => { setLikeCount(c => liked ? c - 1 : c + 1); setLiked(v => !v); };
  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments(prev => [...prev, { id: `c${Date.now()}`, authorName: "You", text: commentText.trim(), time: "Just now" }]);
    setCommentText("");
  };

  return (
    <div style={{ border: `1px solid ${T.divider}`, borderRadius: 16, overflow: "hidden", background: T.bg, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px 10px" }}>
        <Av u={author} T={T} sz={38} onClick={() => onOpenProfile && onOpenProfile(author.id)} dot />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span onClick={() => onOpenProfile && onOpenProfile(author.id)}
              style={{ fontWeight: 700, fontSize: 14, color: T.text, cursor: "pointer" }}>
              {author.name}
            </span>
            {author.verified && <VerifiedBadge />}
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>{post.time}</div>
        </div>
      </div>
      <p style={{ margin: 0, padding: "0 14px 12px", fontSize: 14, lineHeight: 1.6, color: T.text }}>{post.text}</p>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px 10px", fontSize: 12, color: T.muted }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} /> {(post.views || 0).toLocaleString()} views</span>
        <div style={{ display: "flex", gap: 12 }}>
          <span>{likeCount.toLocaleString()} likes</span>
          <span>{comments.length} comments</span>
        </div>
      </div>
      <div style={{ height: 1, background: T.divider }} />
      <div style={{ display: "flex" }}>
        {[
          { icon: liked ? <Heart size={15} fill="#ec4899" color="#ec4899" /> : <Heart size={15} color={T.muted} />, label: liked ? "Liked" : "Like", action: handleLike, active: liked, activeColor: "#ec4899" },
          { icon: <MessageCircle size={15} color={showComments ? accent : T.muted} />, label: "Comment", action: () => setShowComments(v => !v), active: showComments, activeColor: accent },
          { icon: saved ? <BookmarkCheck size={15} fill={accent} color={accent} /> : <Bookmark size={15} color={T.muted} />, label: saved ? "Saved" : "Save", action: () => setSaved(v => !v), active: saved, activeColor: accent },
          { icon: <Share2 size={15} color={T.muted} />, label: "Share", action: () => {}, active: false, activeColor: accent },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: "none", border: "none", padding: "9px 0", color: btn.active ? btn.activeColor : T.muted, fontSize: 12, fontWeight: btn.active ? 700 : 500, cursor: "pointer" }}>
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>
      {showComments && (
        <div className="fade-up" style={{ borderTop: `1px solid ${T.divider}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.length === 0 && <p style={{ margin: 0, fontSize: 13, color: T.muted, textAlign: "center" }}>No comments yet.</p>}
          {comments.map(c => {
            const cAuthor = USERS[c.authorId] || { name: c.authorName || "You", ini: (c.authorName || "Y")[0], c: accent };
            return (
              <div key={c.id} style={{ display: "flex", gap: 8 }}>
                <Av u={cAuthor} T={T} sz={28} onClick={() => c.authorId && onOpenProfile && onOpenProfile(c.authorId)} />
                <div style={{ flex: 1 }}>
                  <div style={{ background: T.inputBg, borderRadius: 12, padding: "8px 12px", border: `1px solid ${T.inputBorder}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 2 }}>{cAuthor.name}</div>
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.4 }}>{c.text}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 3, paddingLeft: 6 }}>{c.time}</div>
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
              placeholder="Write a comment…"
              style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10, padding: "8px 12px", color: T.text, outline: "none", fontSize: 13 }} />
            <button onClick={handleComment} style={{ width: 34, height: 34, borderRadius: 10, background: commentText.trim() ? accent : T.inputBg, color: commentText.trim() ? "#fff" : T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// CHAT PROFILE VIEW  (rich — no Edit/Verify)
// ─────────────────────────────────────────────────
function ChatProfileView({ user, T, onBack, onChatWith, onOpenProfile }) {
  const [tab, setTab] = useState("posts");
  const accent = getAccent();

  const userPosts  = (user.postIds      || []).map(id => GLOBAL_POSTS[id]).filter(Boolean);
  const likedPosts = (user.likedPostIds || []).map(id => GLOBAL_POSTS[id]).filter(Boolean);
  const displayedPosts = tab === "posts" ? userPosts : likedPosts;

  return (
    <div className="slide-right" style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg, overflowY: "auto" }}>

      {/* Cover */}
      <div style={{
        height: 190, flexShrink: 0, position: "relative",
        backgroundImage: user.cover ? `url(${user.cover})` : `linear-gradient(145deg,${user.c}55 0%,${T.surface||T.bg} 100%)`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(0,0,0,0.45),transparent 50%,rgba(0,0,0,0.55))" }} />
        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16, width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
      </div>

      {/* Avatar overlapping cover */}
      <div style={{ padding: "0 16px", marginTop: -48, position: "relative", zIndex: 10 }}>
        <Av u={user} T={T} sz={92} ring dot imgStyle={{ border: `4px solid ${T.bg}` }} />

        {/* Name + Handle + Verified */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>{user.name}</h2>
            {user.verified && <VerifiedBadge type="blue" />}
          </div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{user.handle}</div>
        </div>

        {/* Action Buttons — Message + Follow */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onChatWith} style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: accent, color: "#fff", fontSize: 14, fontWeight: 700, border: "none" }}>
            💬 Message
          </button>
          <button style={{ width: 46, height: 46, borderRadius: 12, background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>📞</button>
          <button style={{ width: 46, height: 46, borderRadius: 12, background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>📹</button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", marginTop: 20, paddingTop: 16, paddingBottom: 16, borderTop: `1px solid ${T.divider}`, borderBottom: `1px solid ${T.divider}` }}>
          <StatPill value={userPosts.length}    label="Posts"     T={T} />
          <div style={{ width: 1, background: T.divider }} />
          <StatPill value={user.followers || 0} label="Followers" T={T} />
          <div style={{ width: 1, background: T.divider }} />
          <StatPill value={user.following || 0} label="Following" T={T} />
          <div style={{ width: 1, background: T.divider }} />
          <StatPill value={userPosts.reduce((s, p) => s + (p.likes || 0), 0)} label="Likes" T={T} />
        </div>

        {/* Bio */}
        {user.bio && <p style={{ margin: "16px 0 0", fontSize: 14, color: T.text, lineHeight: 1.55 }}>{user.bio}</p>}

        {/* Info list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 16 }}>
          {user.school       && <InfoRow icon="🎓" label={user.school} T={T} />}
          {user.faculty      && <InfoRow icon="🏛️" label={`Faculty of ${user.faculty}`} T={T} />}
          {user.gender       && <InfoRow icon={user.gender === "Female" ? "👩" : "👨"} label={user.gender} T={T} />}
          {user.relationship && <InfoRow icon={user.relationship === "Single" ? "💛" : "❤️"} label={user.relationship} T={T} color={user.relationship !== "Single" ? "#ec4899" : undefined} />}
          {user.hobby        && <InfoRow icon="🎯" label={user.hobby} T={T} />}
          {user.gmail        && <InfoRow icon="📧" label={user.gmail} T={T} />}
          <InfoRow icon={user.online ? "🟢" : "⚫"} label={user.online ? "Active now" : `Last seen: ${user.lastSeen}`} T={T} color={user.online ? "#22c55e" : undefined} />
        </div>

        {/* Token + Score badge */}
        {(user.tokens || user.score) && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {user.tokens && (
              <div style={{ flex: 1, background: PURPLE_DIM, border: `1px solid ${PURPLE_BD}`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>🪙</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: PURPLE }}>{user.tokens.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: T.muted }}>Tokens</div>
              </div>
            )}
            {user.score && (
              <div style={{ flex: 1, background: PURPLE_DIM, border: `1px solid ${PURPLE_BD}`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>⭐</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: PURPLE }}>{user.score.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: T.muted }}>Score</div>
              </div>
            )}
          </div>
        )}

        {/* Rank cards */}
        {(user.worldRank || user.campusRank) && (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {user.worldRank && (
              <div style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>🌍</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: -1 }}>#{user.worldRank}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>World Rank</div>
                {user.school && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{user.school.split("(")[0].trim()}</div>}
              </div>
            )}
            {user.campusRank && (
              <div style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>🏫</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: -1 }}>#{user.campusRank}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>Campus Rank</div>
                {user.faculty && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{user.faculty}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderTop: `1px solid ${T.divider}`, borderBottom: `1px solid ${T.divider}`, marginTop: 20, background: T.bg }}>
        {["posts", "liked"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "13px 0", background: "none", border: "none", borderBottom: tab === t ? `2.5px solid ${accent}` : "2.5px solid transparent", color: tab === t ? accent : T.muted, fontWeight: tab === t ? 700 : 500, fontSize: 13.5, cursor: "pointer" }}>
            {t === "posts" ? "📝 Posts" : "❤️ Liked"}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14, background: T.bg }}>
        {displayedPosts.length === 0 ? (
          <div style={{ textAlign: "center", color: T.muted, padding: "30px 20px" }}>
            <p style={{ margin: 0, fontSize: 28 }}>{tab === "posts" ? "📝" : "❤️"}</p>
            <p style={{ margin: "10px 0 0", fontSize: 14 }}>No {tab} posts yet.</p>
          </div>
        ) : (
          displayedPosts.map(p => <SocialPostCard key={p.id} post={p} T={T} onOpenProfile={onOpenProfile} />)
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// FEED VIEW  (conversation list — NO status shown)
// ─────────────────────────────────────────────────
function FeedView({ convs, onChat, onProfile, T }) {
  const accent = getAccent();
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "18px 16px 14px", background: T.surface || T.bg, borderBottom: `1px solid ${T.divider}` }}>
        <h2 style={{ margin: 0, flex: 1, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>Messages</h2>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: PURPLE_DIM, border: `1px solid ${PURPLE_BD}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <span style={{ fontSize: 18 }}>✏️</span>
        </div>
      </div>

      {/* List — status indicator removed */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {convs.map((c, i) => {
          const u = USERS[c.uid];
          return (
            <div
              key={c.id}
              onClick={() => onChat(c)}
              style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", cursor: "pointer", borderBottom: `1px solid ${T.divider}`, animation: `convIn .32s ease-out ${i * 0.07}s both` }}
            >
              {/* Avatar — no online dot */}
              <Av u={u} T={T} sz={50} onClick={e => { e.stopPropagation(); onProfile(u.id); }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 14.5, fontWeight: c.unread > 0 ? 700 : 500, color: T.text }}>{u.name}</span>
                    {u.verified && <VerifiedBadge />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: c.unread > 0 ? 600 : 400, color: c.unread > 0 ? accent : T.muted }}>{c.time}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: c.unread > 0 ? T.text : T.muted, fontWeight: c.unread > 0 ? 500 : 400 }}>{c.lastMsg}</span>
                  {c.unread > 0 && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: accent, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                      {c.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// MESSAGE BUBBLE  — with swipe-to-reply + long-press menu
// ─────────────────────────────────────────────────
function Bubble({ msg, T, onReply, onDelete, onAddReaction, convUser }) {
  const isMe = msg.from === "me";
  const accent = getAccent();

  const [swipeX,     setSwipeX]     = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showCtx,    setShowCtx]    = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const startX  = useRef(null);
  const holdRef = useRef(null);
  const MAX_SWIPE = 72;

  // ── Pointer events for swipe-to-reply ──────────
  const onPointerDown = (e) => {
    startX.current = e.clientX;
    // long-press: 600 ms
    holdRef.current = setTimeout(() => {
      setShowCtx(true);
      navigator.vibrate && navigator.vibrate(30);
    }, 600);
  };
  const onPointerMove = (e) => {
    if (startX.current === null) return;
    clearTimeout(holdRef.current);
    const dx = e.clientX - startX.current;
    if (!isMe && dx > 6) {
      setIsDragging(true);
      setSwipeX(Math.min(dx, MAX_SWIPE));
    }
    if (isMe && dx < -6) {
      setIsDragging(true);
      setSwipeX(Math.max(dx, -MAX_SWIPE));
    }
  };
  const onPointerUp = () => {
    clearTimeout(holdRef.current);
    if (Math.abs(swipeX) >= MAX_SWIPE * 0.6) {
      onReply(msg);
      navigator.vibrate && navigator.vibrate(20);
    }
    setSwipeX(0);
    setIsDragging(false);
    startX.current = null;
  };

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", padding: "3px 12px", position: "relative" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Reply-arrow hint */}
        {isDragging && (
          <div style={{
            position: "absolute",
            left: isMe ? "auto" : 12,
            right: isMe ? 12 : "auto",
            top: "50%", transform: "translateY(-50%)",
            opacity: Math.min(1, Math.abs(swipeX) / 40),
            transition: "opacity 0.1s",
          }}>
            <CornerUpLeft size={18} color={accent} />
          </div>
        )}

        <div style={{
          background: isMe ? accent : T.recvBg || T.inputBg,
          borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          padding: "9px 13px 7px",
          color: isMe ? "#fff" : T.recvText || T.text,
          fontSize: 13.5, lineHeight: 1.5,
          boxShadow: T.cardShadow || "0 2px 8px rgba(0,0,0,0.08)",
          border: isMe ? "none" : `1px solid ${T.inputBorder}`,
          maxWidth: "78%",
          transform: `translateX(${swipeX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(.25,.46,.45,.94)",
        }}>
          {/* Reply preview */}
          {msg.replyTo && (
            <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 8, padding: "5px 8px", marginBottom: 6, borderLeft: `3px solid rgba(255,255,255,0.6)` }}>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>{msg.replyTo.from === "me" ? "You" : convUser?.name}</div>
              <div style={{ fontSize: 11, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{msg.replyTo.text}</div>
            </div>
          )}
          {msg.text}
          {/* Reactions */}
          {(msg.reactions || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5 }}>
              {msg.reactions.map((r, i) => (
                <span key={i} className="rx-pop" style={{ fontSize: 13, lineHeight: 1, background: "rgba(0,0,0,0.18)", borderRadius: 99, padding: "2px 5px" }}>{r}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <span style={{ fontSize: 10, opacity: 0.6 }}>{msg.time}</span>
          </div>
        </div>
      </div>

      {/* Context menu overlay */}
      {showCtx && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => { setShowCtx(false); setShowEmojis(false); }}>
          <div className="ctx-pop" onClick={e => e.stopPropagation()} style={{ background: T.isDark ? "#1A1030" : "#fff", border: `1px solid ${PURPLE_BD}`, borderRadius: 20, padding: 16, width: 280, boxShadow: `0 8px 40px rgba(0,0,0,0.5),0 0 0 1px ${PURPLE_BD}` }}>
            {/* Quick reactions row */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14 }}>
              {REACTION_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { onAddReaction(msg.id, emoji); setShowCtx(false); }}
                  style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", padding: "4px 2px", transition: "transform 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.35)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >{emoji}</button>
              ))}
            </div>
            <div style={{ height: 1, background: T.divider, marginBottom: 8 }} />
            {[
              { icon: <CornerUpLeft size={16} />, label: "Reply",     action: () => { onReply(msg); setShowCtx(false); } },
              { icon: <Copy size={16} />,         label: "Copy",      action: () => { navigator.clipboard?.writeText(msg.text); setShowCtx(false); } },
              { icon: <Share2 size={16} />,       label: "Share",     action: () => setShowCtx(false) },
              ...(isMe ? [{ icon: <Trash2 size={16} />, label: "Delete", danger: true, action: () => { onDelete(msg.id); setShowCtx(false); } }] : []),
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "none", border: "none", borderRadius: 12, color: item.danger ? "#ef4444" : T.text, fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────
// CHAT VIEW
// ─────────────────────────────────────────────────
function ChatView({ conv, user, msgs, T, onBack, onProfile, onAddMsg, onDeleteMsg, onAddReaction }) {
  const [text,      setText]      = useState("");
  const [replyTo,   setReplyTo]   = useState(null);
  const bottomRef = useRef(null);
  const accent = getAccent();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    if (!text.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    onAddMsg(conv.id, { id: `m${Date.now()}`, from: "me", text: text.trim(), time, replyTo: replyTo || null, reactions: [] });
    setText(""); setReplyTo(null);
  };

  return (
    <div className="slide-right" style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 12px 10px", background: `linear-gradient(180deg,${T.surface || T.bg} 0%,${T.bg} 100%)`, borderBottom: `1px solid ${T.divider}` }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: T.inputBg, color: T.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${T.inputBorder}` }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, cursor: "pointer" }} onClick={onProfile}>
          <Av u={user} T={T} sz={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
              {user.verified && <VerifiedBadge />}
            </div>
            {/* show online status ONLY inside the chat header */}
            <div style={{ fontSize: 11, color: user.online ? "#22c55e" : T.muted }}>
              {user.online ? "● Active now" : `Last seen ${user.lastSeen}`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ width: 38, height: 38, borderRadius: 11, background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text, display: "flex", alignItems: "center", justifyContent: "center" }}>📞</button>
          <button style={{ width: 38, height: 38, borderRadius: 11, background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text, display: "flex", alignItems: "center", justifyContent: "center" }}>📹</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {msgs.map(msg => (
          <Bubble
            key={msg.id} msg={msg} T={T}
            convUser={user}
            onReply={setReplyTo}
            onDelete={id => onDeleteMsg(conv.id, id)}
            onAddReaction={(id, emoji) => onAddReaction(conv.id, id, emoji)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div style={{ display: "flex", alignItems: "center", padding: "8px 14px", background: PURPLE_DIM, borderTop: `1px solid ${PURPLE_BD}`, gap: 8 }}>
          <CornerUpLeft size={14} color={PURPLE} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE }}>{replyTo.from === "me" ? "You" : user.name}</div>
            <div style={{ fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.text}</div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, padding: "8px 12px 14px", background: T.surface || T.bg, borderTop: `1px solid ${T.divider}` }}>
        <div style={{ flex: 1, minHeight: 40, background: T.inputBg, borderRadius: 14, display: "flex", alignItems: "center", padding: "8px 12px", border: `1px solid ${T.inputBorder}` }}>
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Message…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 13.5 }}
          />
        </div>
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: 12, background: text.trim() ? accent : T.inputBg, color: text.trim() ? "#fff" : T.muted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", border: `1px solid ${T.inputBorder}` }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// EXPORT — MAIN ENTRY
// ─────────────────────────────────────────────────
export default function MessagesView({ T, user: loggedInUser }) {
  const [activeConv,   setActiveConv]   = useState(null);
  const [convs,        setConvs]        = useState(CONVS_INIT);
  const [messages,     setMessages]     = useState(MSGS_INIT);
  const [profileStack, setProfileStack] = useState([]);

  const handleAddMsg = (convId, newMsg) => {
    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), newMsg] }));
    setConvs(prev => prev.map(c => c.id === convId ? { ...c, lastMsg: newMsg.text, time: newMsg.time } : c));
  };

  const handleDeleteMsg = (convId, msgId) => {
    setMessages(prev => ({ ...prev, [convId]: (prev[convId] || []).filter(m => m.id !== msgId) }));
  };

  const handleAddReaction = (convId, msgId, emoji) => {
    setMessages(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).map(m =>
        m.id === msgId
          ? { ...m, reactions: (m.reactions || []).includes(emoji) ? (m.reactions || []).filter(r => r !== emoji) : [...(m.reactions || []), emoji] }
          : m
      ),
    }));
  };

  const handleOpenProfile = (userId) => setProfileStack(prev => [...prev, userId]);
  const handleBackProfile  = ()       => setProfileStack(prev => prev.slice(0, -1));

  // Deep-stack profile view (chaining)
  if (profileStack.length > 0) {
    const viewingUser = USERS[profileStack[profileStack.length - 1]];
    if (!viewingUser) { handleBackProfile(); return null; }
    return (
      <>
        <style>{CSS}</style>
        <ChatProfileView
          user={viewingUser} T={T}
          onBack={handleBackProfile}
          onChatWith={() => {
            setProfileStack([]);
            setActiveConv({ id: viewingUser.id, uid: viewingUser.id });
          }}
          onOpenProfile={handleOpenProfile}
        />
      </>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", background: T.bg }}>
      <style>{CSS}</style>
      {activeConv ? (
        <ChatView
          conv={activeConv}
          user={USERS[activeConv.uid]}
          msgs={messages[activeConv.id] || []}
          onBack={() => setActiveConv(null)}
          onProfile={() => handleOpenProfile(activeConv.uid)}
          onAddMsg={handleAddMsg}
          onDeleteMsg={handleDeleteMsg}
          onAddReaction={handleAddReaction}
          T={T}
        />
      ) : (
        <FeedView convs={convs} onChat={setActiveConv} onProfile={handleOpenProfile} T={T} />
      )}
    </div>
  );
}