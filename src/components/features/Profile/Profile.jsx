/**
 * Profile.jsx
 * ---------------------------------------------------------------------------
 * FIXED: this component's signature used to be
 *   ({ T, isOwner = true, profileUser = null, onBack, onMessage })
 * while App.jsx actually calls it with `isOwnProfile`, `onEdit`, `feedPosts`,
 * `myVideoPosts`, `onUpdateAvatar`, `onUpdateCover`, `isFollowing`,
 * `onToggleFollow`, `onImagePreview` — none of which were ever received.
 * That meant `isOwner` defaulted to `true` ALWAYS (so visiting someone
 * else's profile still showed Edit/Verify buttons), and it rendered
 * hardcoded sample posts instead of your real ones. Both are fixed below by
 * matching the real contract from App.jsx.
 *
 * It also used to embed its own EditProfileModal + local `ownUser` state,
 * completely disconnected from the modal App.jsx already renders. That
 * duplicate modal has been removed — "Edit Profile" now calls `onEdit()`,
 * which opens the SAME modal App.jsx manages, against the SAME user state.
 * ---------------------------------------------------------------------------
 */
import React, { useState } from "react";
import {
  ArrowLeft, CheckCircle, X, Heart, MessageCircle,
  Bookmark, BookmarkCheck, Share2, Eye, Trash2,
  UserCheck, UserPlus, Sparkles,
} from "lucide-react";
import { supabase } from "../../../services/supabaseClient";

const getAccent = (T) => (T?.isDark ? "#00D2C4" : "#0F766E");

// ─────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, T, color }) {
  if (!label) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: color || T?.muted }}>
      <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: "center" }}>{icon}</span>
      <span style={{ lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

function StatBox({ value, label, T }) {
  return (
    <div style={{ textAlign: "center", flex: 1, padding: "10px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: T?.text, letterSpacing: -0.5 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 11, color: T?.mutedMid, marginTop: 3, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function RankCard({ icon, value, label, T }) {
  if (!value) return null;
  return (
    <div style={{ flex: 1, background: T?.inputBg, border: `1px solid ${T?.inputBorder}`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: T?.text, letterSpacing: -1 }}>#{value}</div>
      <div style={{ fontSize: 11, color: T?.mutedMid, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function MiniAvatar({ name, avatarUrl, accentColor, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarUrl ? "transparent" : accentColor,
      flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.38, fontWeight: 700,
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : (name || "U")[0].toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// POST CARD — lifted state (allPosts/setAllPosts) so liking/saving a post
// here stays in sync with the SAME post shown on Home/Search, and persists
// to Supabase in the background (this is also what feeds the leaderboard's
// reciprocity score — see schema.sql).
// ─────────────────────────────────────────────────────────────────
function PostCard({ post, T, isOwner, authorUser, allPosts, setAllPosts, onDeletePost }) {
  const accentColor = getAccent(T);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const liked = !!post.liked;
  const saved = !!post.saved;
  const likeCount = post.likes || 0;
  const comments = post.comments || [];

  const patchPost = (patch) => setAllPosts?.(prev => prev.map(p => (p.id === post.id ? { ...p, ...patch } : p)));

  const handleLike = () => {
    const nextLiked = !liked;
    patchPost({ liked: nextLiked, likes: nextLiked ? likeCount + 1 : likeCount - 1 });
    if (!post.isLocal) {
      const fn = nextLiked
        ? supabase.from("post_likes").insert({ post_id: post.id, user_id: authorUser?.authUserId })
        : supabase.from("post_likes").delete().match({ post_id: post.id, user_id: authorUser?.authUserId });
      fn.then?.(({ error }) => error && console.error("like sync failed:", error.message));
    }
  };

  const handleSave = () => {
    const nextSaved = !saved;
    patchPost({ saved: nextSaved, saves: nextSaved ? (post.saves || 0) + 1 : Math.max(0, (post.saves || 0) - 1) });
    if (!post.isLocal) {
      const fn = nextSaved
        ? supabase.from("post_saves").insert({ post_id: post.id, user_id: authorUser?.authUserId })
        : supabase.from("post_saves").delete().match({ post_id: post.id, user_id: authorUser?.authUserId });
      fn.then?.(({ error }) => error && console.error("save sync failed:", error.message));
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const newComment = { id: `local-${Date.now()}`, name: "You", text: commentText.trim(), time: "Just now" };
    patchPost({ comments: [...comments, newComment] });
    if (!post.isLocal) {
      supabase.from("post_comments")
        .insert({ post_id: post.id, author_id: authorUser?.authUserId, content: commentText.trim() })
        .then(({ error }) => error && console.error("comment sync failed:", error.message));
    }
    setCommentText("");
  };

  const authorName = authorUser?.name || "Unknown";
  const authorAvatarUrl = authorUser?.avatarUrl || null;
  const authorVerified = authorUser?.isVerified ?? false;

  return (
    <div style={{ border: `1px solid ${T?.divider}`, borderRadius: 16, overflow: "hidden", background: T?.bg, boxShadow: "0 2px 12px rgba(0,0,0,0.055)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 15px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MiniAvatar name={authorName} avatarUrl={authorAvatarUrl} accentColor={accentColor} size={38} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: T?.text }}>{authorName}</span>
              {authorVerified && (
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "linear-gradient(135deg,#00d4ff,#6c63ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, color: "#fff", fontWeight: 900 }}>✓</div>
              )}
              {post.isLocal && (
                <span style={{ fontSize: 9.5, color: T?.mutedMid, border: `1px solid ${T?.inputBorder}`, borderRadius: 8, padding: "1px 6px" }}>On this device</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: T?.mutedMid }}>{post.time}</div>
          </div>
        </div>
        {isOwner && onDeletePost && (
          <button onClick={() => onDeletePost(post)} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "#ef4444", borderRadius: 8, display: "flex", alignItems: "center" }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <p style={{ margin: 0, padding: "2px 15px 14px", fontSize: 14, lineHeight: 1.6, color: T?.text, whiteSpace: "pre-wrap" }}>
        {post.content}
      </p>

      {post.type === "image" && post.imageUrl && (
        <div style={{ margin: "0 15px 12px", borderRadius: 10, overflow: "hidden" }}>
          <img src={post.imageUrl} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 15px 10px", fontSize: 12, color: T?.mutedMid }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={13} /> {(post.views || 0).toLocaleString()} views</span>
        <div style={{ display: "flex", gap: 14 }}>
          <span>{likeCount.toLocaleString()} likes</span>
          <span>{comments.length} comments</span>
        </div>
      </div>

      <div style={{ height: 1, background: T?.divider }} />

      <div style={{ display: "flex" }}>
        {[
          { icon: liked ? <Heart size={16} fill="#ec4899" color="#ec4899" /> : <Heart size={16} color={T?.muted} />, label: liked ? "Liked" : "Like", action: handleLike, activeColor: "#ec4899", active: liked },
          { icon: <MessageCircle size={16} color={showComments ? accentColor : T?.muted} />, label: "Comment", action: () => setShowComments(v => !v), activeColor: accentColor, active: showComments },
          { icon: saved ? <BookmarkCheck size={16} fill={accentColor} color={accentColor} /> : <Bookmark size={16} color={T?.muted} />, label: saved ? "Saved" : "Save", action: handleSave, activeColor: accentColor, active: saved },
          { icon: <Share2 size={16} color={T?.muted} />, label: "Share", action: () => {}, activeColor: accentColor, active: false },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "none", border: "none", padding: "10px 0", color: btn.active ? btn.activeColor : T?.muted, fontSize: 12.5, fontWeight: btn.active ? 700 : 500, cursor: "pointer", transition: "color 0.18s" }}>
            {btn.icon}{btn.label}
          </button>
        ))}
      </div>

      {showComments && (
        <div style={{ borderTop: `1px solid ${T?.divider}`, padding: "12px 15px", display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.length === 0 && <p style={{ margin: 0, fontSize: 13, color: T?.mutedMid, textAlign: "center" }}>No comments yet. Be the first!</p>}
          {comments.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 8 }}>
              <MiniAvatar name={c.name} accentColor={accentColor} size={30} />
              <div style={{ flex: 1 }}>
                <div style={{ background: T?.inputBg, borderRadius: 12, padding: "8px 12px", border: `1px solid ${T?.inputBorder}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T?.text, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: T?.text, lineHeight: 1.45 }}>{c.text}</div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: T?.mutedMid, marginTop: 3, paddingLeft: 6 }}>
                  <span>{c.time}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            <MiniAvatar name="You" accentColor={accentColor} size={30} />
            <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Write a comment..."
                style={{ flex: 1, padding: "9px 14px", borderRadius: 20, background: T?.inputBg, border: `1px solid ${T?.inputBorder}`, color: T?.text, outline: "none", fontSize: 13 }}
              />
              {commentText.trim() && <button onClick={handleComment} style={{ background: "none", border: "none", color: accentColor, fontWeight: 700, fontSize: 13.5, padding: "0 4px", cursor: "pointer" }}>Post</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact card for video posts (kept lightweight — full playback controls
// live in the dedicated VideoPostCard exported from App.jsx; duplicating
// that entire component here isn't worth the divergence risk).
function VideoTile({ post, T, isOwner, onDeletePost }) {
  return (
    <div style={{ border: `1px solid ${T?.divider}`, borderRadius: 16, overflow: "hidden", background: T?.bg, position: "relative" }}>
      <img src={post.thumbnail} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}>
        <Eye size={11} /> {(post.views || 0).toLocaleString()}
      </div>
      {isOwner && onDeletePost && (
        <button onClick={() => onDeletePost(post)} style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 8, padding: 6, color: "#fff", cursor: "pointer" }}>
          <Trash2 size={14} />
        </button>
      )}
      <p style={{ margin: 0, padding: "10px 12px", fontSize: 13, color: T?.text, lineHeight: 1.45 }}>{post.caption}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PROFILE COMPONENT — signature now matches what App.jsx sends.
// ─────────────────────────────────────────────────────────────────
export default function Profile({
  T,
  profileUser,
  isOwnProfile,
  onBack,
  onEdit,
  onVerify,
  myVideoPosts = [],
  feedPosts = [],
  setFeedPosts,
  setMyVideoPosts,
  onViewProfile,
  isFollowing,
  onToggleFollow,
  onImagePreview,
  onUpdateAvatar,
  onUpdateCover,
  hasActiveStory = false,
  onOpenStory,
}) {
  const accentColor = getAccent(T);
  const [viewingImage, setViewingImage] = useState(null);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const user = profileUser || {};
  const goBack = () => (onBack ? onBack() : null);

  // Real posts belonging to this profile, pulled from the SAME pools Home
  // renders from — not a separate sample/mock list.
  const ownTextPosts = feedPosts.filter((p) => p.authorId === user.id);
  const ownVideoPosts = myVideoPosts.filter((p) => p.authorId === user.id);
  const allOwnPosts = [...ownTextPosts, ...ownVideoPosts].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

  // "Liked"/"Saved" reflect this session's local interaction flags. We only
  // expose them for your OWN profile — there's no reliable way to know what
  // posts a DIFFERENT user liked/saved from data available on the client.
  const likedPosts = isOwnProfile ? [...feedPosts, ...myVideoPosts].filter((p) => p.liked) : [];
  const savedPosts = isOwnProfile ? [...feedPosts, ...myVideoPosts].filter((p) => p.saved) : [];

  const tabs = isOwnProfile ? ["posts", "liked", "saved"] : ["posts"];
  const postsForTab = activeTab === "posts" ? allOwnPosts : activeTab === "liked" ? likedPosts : savedPosts;

  const totalLikes = allOwnPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

  const deletePost = async (post) => {
    if (post.type === "video") setMyVideoPosts?.((prev) => prev.filter((p) => p.id !== post.id));
    else setFeedPosts?.((prev) => prev.filter((p) => p.id !== post.id));
    if (!post.isLocal) {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) console.error("Failed to delete post:", error.message);
    }
  };

  const handleCompleteVerification = async () => {
    setVerifying(true);
    try {
      await onVerify?.();
    } finally {
      setVerifying(false);
      setVerifyStep(0);
    }
  };

  return (
    <div style={{ background: T?.bg, minHeight: "100%", color: T?.text, paddingBottom: 50 }}>
      {/* ══ STICKY HEADER ══ */}
      <div style={{ position: "sticky", top: 0, background: T?.bg, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, zIndex: 10, borderBottom: `1px solid ${T?.divider}` }}>
        <ArrowLeft size={22} color={T?.text} onClick={goBack} style={{ cursor: "pointer", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</h2>
          <p style={{ margin: 0, fontSize: 11, color: T?.mutedMid }}>{allOwnPosts.length} posts</p>
        </div>
      </div>

      {/* ══ COVER + AVATAR ══ */}
      <div style={{ position: "relative", height: 195, flexShrink: 0, background: user.coverUrl ? undefined : `linear-gradient(135deg, ${accentColor}33, ${T?.surface})` }}>
        {user.coverUrl && (
          <img src={user.coverUrl} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer", display: "block" }}
            onClick={() => { setViewingImage(user.coverUrl); onImagePreview?.({ type: "cover", user }); }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45))" }} />

        <div style={{ position: "absolute", bottom: -46, left: 18 }}>
          <div
            onClick={() => { if (user.avatarUrl) { setViewingImage(user.avatarUrl); onImagePreview?.({ type: "avatar", user }); } }}
            style={{
              width: 90, height: 90, borderRadius: "50%",
              border: `4px solid ${hasActiveStory ? accentColor : T?.bg}`,
              boxShadow: hasActiveStory ? `0 0 0 2px ${accentColor}66, 0 4px 20px rgba(0,0,0,0.18)` : "0 4px 20px rgba(0,0,0,0.18)",
              overflow: "hidden", cursor: "pointer", background: user.avatarUrl ? "transparent" : `linear-gradient(135deg, ${accentColor}99, ${accentColor})`,
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 700,
            }}
          >
            {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.name || "U")[0].toUpperCase()}
          </div>
          {user.isOnline && (
            <div style={{ position: "absolute", bottom: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: "#22c55e", border: `3px solid ${T?.bg}` }} />
          )}
          {hasActiveStory && (
            <button
              onClick={onOpenStory}
              style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, border: "none", background: accentColor, color: T?.isDark ? "#0B0F12" : "#fff", whiteSpace: "nowrap", cursor: "pointer", boxShadow: `0 2px 8px ${accentColor}66` }}
            >
              View status
            </button>
          )}
        </div>
      </div>

      {/* ══ PROFILE INFO ══ */}
      <div style={{ padding: "56px 18px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{user.name}</h1>
              {user.isVerified && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#00d4ff,#6c63ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 900, flexShrink: 0 }}>✓</div>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: T?.mutedMid }}>{user.handle}</p>
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 2 }}>
            {isOwnProfile ? (
              <>
                <button onClick={onEdit} style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${T?.inputBorder}`, background: T?.bg, color: T?.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Edit Profile
                </button>
                {!user.isVerified && (
                  <button onClick={() => setVerifyStep(1)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: accentColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <Sparkles size={13} /> Get Verified
                  </button>
                )}
              </>
            ) : (
              <>
                <button onClick={() => onViewProfile ? null : null} onClickCapture={() => {}} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: accentColor, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  💬 Message
                </button>
                <button
                  onClick={onToggleFollow}
                  style={{
                    padding: "8px 12px", borderRadius: 10,
                    border: `1.5px solid ${isFollowing ? T?.inputBorder : accentColor}`,
                    background: "transparent", color: isFollowing ? T?.text : accentColor,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                </button>
              </>
            )}
          </div>
        </div>

        {user.bio && <p style={{ margin: "13px 0 0", fontSize: 14, lineHeight: 1.55, color: T?.text }}>{user.bio}</p>}

        <div style={{ display: "flex", marginTop: 18, borderTop: `1px solid ${T?.divider}`, borderBottom: `1px solid ${T?.divider}` }}>
          <StatBox value={allOwnPosts.length} label="Posts" T={T} />
          <div style={{ width: 1, background: T?.divider }} />
          <StatBox value={user.followersCount || 0} label="Followers" T={T} />
          <div style={{ width: 1, background: T?.divider }} />
          <StatBox value={user.followingCount || 0} label="Following" T={T} />
          <div style={{ width: 1, background: T?.divider }} />
          <StatBox value={totalLikes} label="Likes" T={T} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18 }}>
          {user.university && <InfoRow icon="🎓" label={user.university} T={T} />}
          {user.faculty && <InfoRow icon="🏛️" label={`Faculty of ${user.faculty}`} T={T} />}
          {user.gender && <InfoRow icon={user.gender === "Female" ? "👩" : "👨"} label={user.gender} T={T} />}
          {user.relationshipStatus && (
            <InfoRow icon={user.relationshipStatus === "Single" ? "💛" : "❤️"} label={user.relationshipStatus} T={T} color={user.relationshipStatus !== "Single" ? "#ec4899" : undefined} />
          )}
          {user.hobby && <InfoRow icon="🎯" label={user.hobby} T={T} />}
          <InfoRow icon={user.isOnline ? "🟢" : "⚫"} label={user.isOnline ? "Active now" : user.lastSeen ? `Last seen ${user.lastSeen}` : "Offline"} T={T} color={user.isOnline ? "#22c55e" : undefined} />
        </div>

        {(user.worldRank > 0 || user.campusRank > 0) && (
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {user.worldRank > 0 && <RankCard icon="🌍" value={user.worldRank} label="World Rank" T={T} />}
            {user.campusRank > 0 && <RankCard icon="🏫" value={user.campusRank} label="Campus Rank" T={T} />}
          </div>
        )}
      </div>

      <div style={{ height: 8, background: T?.divider }} />

      <div style={{ display: "flex", borderBottom: `1px solid ${T?.divider}`, background: T?.bg }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "13px 0", background: "none", border: "none", borderBottom: activeTab === tab ? `2.5px solid ${accentColor}` : "2.5px solid transparent", color: activeTab === tab ? accentColor : T?.muted, fontWeight: activeTab === tab ? 700 : 500, fontSize: 13.5, cursor: "pointer", transition: "all 0.2s" }}>
            {tab === "posts" ? "📝 Posts" : tab === "liked" ? "❤️ Liked" : "🔖 Saved"}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {postsForTab.length === 0 ? (
          <div style={{ textAlign: "center", padding: "44px 20px", color: T?.mutedMid }}>
            <p style={{ margin: 0, fontSize: 36 }}>{activeTab === "posts" ? "📝" : activeTab === "liked" ? "❤️" : "🔖"}</p>
            <p style={{ margin: "10px 0 0", fontSize: 14 }}>No {activeTab} posts yet.</p>
          </div>
        ) : (
          postsForTab.map((post) =>
            post.type === "video" ? (
              <VideoTile key={post.id} post={post} T={T} isOwner={isOwnProfile && activeTab === "posts"} onDeletePost={deletePost} />
            ) : (
              <PostCard
                key={post.id} post={post} T={T} isOwner={isOwnProfile && activeTab === "posts"}
                authorUser={user} allPosts={feedPosts} setAllPosts={setFeedPosts} onDeletePost={deletePost}
              />
            )
          )
        )}
      </div>

      {/* ══ VERIFY POPUP — Step 1 ══ */}
      {isOwnProfile && verifyStep === 1 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", padding: 16 }}>
          <div style={{ background: T?.cardBg, backdropFilter: "blur(18px)", border: `1px solid ${T?.cardBorder}`, boxShadow: T?.cardShadow, width: 310, padding: 28, borderRadius: 20, textAlign: "center", position: "relative" }}>
            <button type="button" onClick={() => setVerifyStep(0)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", padding: 6, cursor: "pointer", color: "#fff" }}><X size={16} /></button>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: T?.text }}>Get Verified</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: T?.muted, lineHeight: 1.5 }}>
              A verified badge shows your account is authentic — and lets your posts publish to everyone instead of staying on this device.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" disabled={verifying} onClick={handleCompleteVerification} style={{ padding: "13px", borderRadius: 12, border: "none", background: accentColor, color: "#fff", fontWeight: 700, fontSize: 14, cursor: verifying ? "default" : "pointer", opacity: verifying ? 0.7 : 1 }}>
                {verifying ? "Verifying…" : "💳 Pay with Card"}
              </button>
              <button type="button" onClick={() => setVerifyStep(2)} style={{ padding: "13px", borderRadius: 12, border: `1.5px solid ${T?.inputBorder}`, background: T?.bg, color: T?.text, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                🪙 Earn a Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ VERIFY POPUP — Step 2 (Token) ══ */}
      {isOwnProfile && verifyStep === 2 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", padding: 16 }}>
          <div style={{ background: T?.cardBg, backdropFilter: "blur(18px)", border: `1px solid ${T?.cardBorder}`, boxShadow: T?.cardShadow, width: 310, padding: 28, borderRadius: 20, textAlign: "center", position: "relative" }}>
            <button type="button" onClick={() => setVerifyStep(0)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", padding: 6, cursor: "pointer", color: "#fff" }}><X size={16} /></button>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🪙</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: T?.text }}>Earn Token</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: T?.muted, lineHeight: 1.5 }}>Complete one of these actions to earn your verification token</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" disabled={verifying} onClick={handleCompleteVerification} style={{ padding: "13px", borderRadius: 12, border: `1.5px solid ${T?.inputBorder}`, background: T?.bg, color: T?.text, fontWeight: 600, fontSize: 14, cursor: verifying ? "default" : "pointer", opacity: verifying ? 0.7 : 1 }}>
                {verifying ? "Verifying…" : "🔄 Swap Token"}
              </button>
              <button type="button" disabled={verifying} onClick={handleCompleteVerification} style={{ padding: "13px", borderRadius: 12, border: `1.5px solid ${T?.inputBorder}`, background: T?.bg, color: T?.text, fontWeight: 600, fontSize: 14, cursor: verifying ? "default" : "pointer", opacity: verifying ? 0.7 : 1 }}>
                📺 Watch Ad
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingImage && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.85)", padding: 16 }} onClick={() => setViewingImage(null)}>
          <img src={viewingImage} alt="Preview" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}