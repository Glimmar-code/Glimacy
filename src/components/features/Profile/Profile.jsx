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
    <div className="flex items-center gap-3 text-sm py-1.5" style={{ color: color || T?.muted }}>
      <span className="flex-shrink-0 w-6 flex justify-center text-lg drop-shadow-sm">{icon}</span>
      <span className="leading-relaxed font-medium">{label}</span>
    </div>
  );
}

function StatBox({ value, label, T }) {
  return (
    <div className="text-center flex-1 py-3 group cursor-pointer transition-all hover:scale-105">
      <div className="text-2xl font-bold tracking-tight" style={{ color: T?.text }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: T?.mutedMid }}>{label}</div>
    </div>
  );
}

function RankCard({ icon, value, label, T }) {
  if (!value) return null;
  return (
    <div 
      className="flex-1 rounded-2xl p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 backdrop-blur-md"
      style={{ background: T?.inputBg, border: `1px solid ${T?.inputBorder}` }}
    >
      <div className="text-3xl mb-2 drop-shadow-md">{icon}</div>
      <div className="text-3xl font-black tracking-tighter" style={{ color: T?.text }}>#{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: T?.mutedMid }}>{label}</div>
    </div>
  );
}

function MiniAvatar({ name, avatarUrl, accentColor, size = 36 }) {
  return (
    <div 
      className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold shadow-sm"
      style={{
        width: size, height: size,
        background: avatarUrl ? "transparent" : accentColor,
        fontSize: size * 0.38,
      }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        : (name || "U")[0].toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// POST CARD
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
    <div 
      className="rounded-3xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl group"
      style={{ border: `1px solid ${T?.divider}`, background: T?.bg, boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <MiniAvatar name={authorName} avatarUrl={authorAvatarUrl} accentColor={accentColor} size={42} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[15px]" style={{ color: T?.text }}>{authorName}</span>
              {authorVerified && (
                <div className="w-[16px] h-[16px] rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-black shadow-sm">✓</div>
              )}
              {post.isLocal && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md ml-1" style={{ color: T?.mutedMid, border: `1px solid ${T?.inputBorder}` }}>On this device</span>
              )}
            </div>
            <div className="text-xs font-medium" style={{ color: T?.mutedMid }}>{post.time}</div>
          </div>
        </div>
        {isOwner && onDeletePost && (
          <button 
            onClick={() => onDeletePost(post)} 
            className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <p className="px-4 py-2 text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: T?.text }}>
        {post.content}
      </p>

      {post.type === "image" && post.imageUrl && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl overflow-hidden shadow-sm relative group-hover:shadow-md transition-shadow">
            <img src={post.imageUrl} alt="" className="w-full max-h-[320px] object-cover block transition-transform duration-500 hover:scale-105" />
          </div>
        </div>
      )}

      <div className="flex justify-between px-5 pb-3 text-xs font-medium" style={{ color: T?.mutedMid }}>
        <span className="flex items-center gap-1.5 bg-black/5 px-2 py-1 rounded-lg"><Eye size={14} /> {(post.views || 0).toLocaleString()} views</span>
        <div className="flex gap-4 items-center">
          <span>{likeCount.toLocaleString()} likes</span>
          <span>{comments.length} comments</span>
        </div>
      </div>

      <div className="h-[1px] w-full" style={{ background: T?.divider }} />

      <div className="flex px-2 py-1">
        {[
          { icon: liked ? <Heart size={18} fill="#ec4899" color="#ec4899" /> : <Heart size={18} />, label: liked ? "Liked" : "Like", action: handleLike, activeColor: "#ec4899", active: liked },
          { icon: <MessageCircle size={18} color={showComments ? accentColor : undefined} />, label: "Comment", action: () => setShowComments(v => !v), activeColor: accentColor, active: showComments },
          { icon: saved ? <BookmarkCheck size={18} fill={accentColor} color={accentColor} /> : <Bookmark size={18} />, label: saved ? "Saved" : "Save", action: handleSave, activeColor: accentColor, active: saved },
          { icon: <Share2 size={18} />, label: "Share", action: () => {}, activeColor: accentColor, active: false },
        ].map((btn, i) => (
          <button 
            key={i} 
            onClick={btn.action} 
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 hover:bg-black/5"
            style={{ 
              color: btn.active ? btn.activeColor : T?.muted, 
              fontSize: 13, 
              fontWeight: btn.active ? 700 : 500
            }}
          >
            {btn.icon}<span className="hidden sm:inline">{btn.label}</span>
          </button>
        ))}
      </div>

      {showComments && (
        <div className="p-4 flex flex-col gap-4" style={{ borderTop: `1px solid ${T?.divider}` }}>
          {comments.length === 0 && <p className="text-sm text-center italic py-2" style={{ color: T?.mutedMid }}>No comments yet. Be the first!</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <MiniAvatar name={c.name} accentColor={accentColor} size={32} />
              <div className="flex-1">
                <div className="rounded-2xl rounded-tl-none px-4 py-2 shadow-sm" style={{ background: T?.inputBg, border: `1px solid ${T?.inputBorder}` }}>
                  <div className="text-[13px] font-bold mb-1" style={{ color: T?.text }}>{c.name}</div>
                  <div className="text-[14px] leading-relaxed" style={{ color: T?.text }}>{c.text}</div>
                </div>
                <div className="flex gap-3 text-xs mt-1.5 ml-2 font-medium" style={{ color: T?.mutedMid }}>
                  <span>{c.time}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-3 items-center mt-2">
            <MiniAvatar name="You" accentColor={accentColor} size={36} />
            <div className="flex-1 flex gap-2 items-center relative">
              <input
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Write a comment..."
                className="flex-1 py-2.5 pl-4 pr-12 rounded-full text-[14px] shadow-sm transition-all focus:ring-2"
                style={{ 
                  background: T?.inputBg, border: `1px solid ${T?.inputBorder}`, color: T?.text, 
                  outline: "none", "--tw-ring-color": accentColor
                }}
              />
              {commentText.trim() && (
                <button 
                  onClick={handleComment} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-[14px] px-3 py-1 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: accentColor }}
                >
                  Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoTile({ post, T, isOwner, onDeletePost }) {
  return (
    <div 
      className="rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
      style={{ border: `1px solid ${T?.divider}`, background: T?.bg }}
    >
      <img src={post.thumbnail} alt="" className="w-full h-[220px] object-cover block transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
        <Eye size={12} /> {(post.views || 0).toLocaleString()}
      </div>
      
      {isOwner && onDeletePost && (
        <button 
          onClick={() => onDeletePost(post)} 
          className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 text-white/90 hover:text-red-400 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="m-0 text-[13px] font-medium text-white/90 leading-snug line-clamp-2 drop-shadow-md">{post.caption}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN PROFILE COMPONENT
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

  const ownTextPosts = feedPosts.filter((p) => p.authorId === user.id);
  const ownVideoPosts = myVideoPosts.filter((p) => p.authorId === user.id);
  const allOwnPosts = [...ownTextPosts, ...ownVideoPosts].sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

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
    <div className="min-h-full pb-16 font-sans antialiased" style={{ background: T?.bg, color: T?.text }}>
      {/* ══ STICKY HEADER ══ */}
      <div 
        className="sticky top-0 px-4 py-3 flex items-center gap-4 z-20 backdrop-blur-xl bg-opacity-80 shadow-sm"
        style={{ background: `${T?.bg}cc`, borderBottom: `1px solid ${T?.divider}` }}
      >
        <button 
          onClick={goBack} 
          className="p-2 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={22} color={T?.text} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[18px] font-extrabold truncate">{user.name}</h2>
          <p className="m-0 text-[12px] font-medium" style={{ color: T?.mutedMid }}>{allOwnPosts.length} posts</p>
        </div>
      </div>

      {/* ══ COVER + AVATAR ══ */}
      <div 
        className="relative h-[240px] flex-shrink-0 w-full"
        style={{ background: user.coverUrl ? undefined : `linear-gradient(135deg, ${accentColor}44, ${T?.surface})` }}
      >
        {user.coverUrl && (
          <img 
            src={user.coverUrl} alt="Cover" 
            className="w-full h-full object-cover cursor-pointer block transition-transform duration-700 hover:scale-[1.02]"
            onClick={() => { setViewingImage(user.coverUrl); onImagePreview?.({ type: "cover", user }); }} 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/60" />

        <div className="absolute -bottom-14 left-5">
          <div
            onClick={() => { if (user.avatarUrl) { setViewingImage(user.avatarUrl); onImagePreview?.({ type: "avatar", user }); } }}
            className="w-[110px] h-[110px] rounded-full overflow-hidden cursor-pointer flex items-center justify-center text-white text-4xl font-black transition-transform duration-300 hover:scale-105 z-10 relative"
            style={{
              border: `5px solid ${hasActiveStory ? accentColor : T?.bg}`,
              boxShadow: hasActiveStory ? `0 0 0 3px ${accentColor}55, 0 8px 30px rgba(0,0,0,0.3)` : "0 8px 30px rgba(0,0,0,0.3)",
              background: user.avatarUrl ? "transparent" : `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
            }}
          >
            {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : (user.name || "U")[0].toUpperCase()}
          </div>
          {user.isOnline && (
            <div 
              className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 z-20 shadow-sm"
              style={{ border: `4px solid ${T?.bg}` }} 
            />
          )}
          {hasActiveStory && (
            <button
              onClick={onOpenStory}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3.5 py-1 rounded-full whitespace-nowrap cursor-pointer z-20 transition-transform hover:scale-110 border-2"
              style={{ 
                background: accentColor, color: T?.isDark ? "#0B0F12" : "#fff", 
                boxShadow: `0 4px 12px ${accentColor}88`, borderColor: T?.bg 
              }}
            >
              View status
            </button>
          )}
        </div>
      </div>

      {/* ══ PROFILE INFO ══ */}
      <div className="px-5 pt-[70px] pb-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="m-0 text-[26px] font-black tracking-tight drop-shadow-sm">{user.name}</h1>
              {user.isVerified && (
                <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-black shadow-md flex-shrink-0">✓</div>
              )}
            </div>
            <p className="m-0 mt-1 text-[14px] font-medium" style={{ color: T?.mutedMid }}>{user.handle}</p>
          </div>

          <div className="flex gap-2 flex-shrink-0 mt-1">
            {isOwnProfile ? (
              <>
                <button 
                  onClick={onEdit} 
                  className="px-4 py-2 rounded-xl text-[14px] font-bold cursor-pointer transition-all hover:bg-black/5 hover:scale-105 active:scale-95 shadow-sm"
                  style={{ border: `1.5px solid ${T?.inputBorder}`, background: T?.bg, color: T?.text }}
                >
                  Edit Profile
                </button>
                {!user.isVerified && (
                  <button 
                    onClick={() => setVerifyStep(1)} 
                    className="px-4 py-2 rounded-xl border-none text-white text-[14px] font-bold cursor-pointer flex items-center gap-1.5 transition-all hover:opacity-90 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md"
                    style={{ background: accentColor }}
                  >
                    <Sparkles size={16} /> Get Verified
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  onClick={() => onViewProfile ? null : null} 
                  className="px-5 py-2 rounded-xl border-none text-white text-[14px] font-bold cursor-pointer transition-all hover:opacity-90 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md"
                  style={{ background: accentColor }}
                >
                  💬 Message
                </button>
                <button
                  onClick={onToggleFollow}
                  className="px-4 py-2 rounded-xl text-[14px] font-bold cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm"
                  style={{
                    border: `1.5px solid ${isFollowing ? T?.inputBorder : accentColor}`,
                    background: isFollowing ? "transparent" : accentColor, 
                    color: isFollowing ? T?.text : "#fff",
                  }}
                >
                  {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
                </button>
              </>
            )}
          </div>
        </div>

        {user.bio && <p className="mt-4 text-[15px] leading-relaxed font-medium" style={{ color: T?.text }}>{user.bio}</p>}

        <div className="flex mt-6 py-2 rounded-2xl shadow-sm" style={{ background: T?.inputBg, border: `1px solid ${T?.divider}` }}>
          <StatBox value={allOwnPosts.length} label="Posts" T={T} />
          <div className="w-[1px] my-4 opacity-50" style={{ background: T?.divider }} />
          <StatBox value={user.followersCount || 0} label="Followers" T={T} />
          <div className="w-[1px] my-4 opacity-50" style={{ background: T?.divider }} />
          <StatBox value={user.followingCount || 0} label="Following" T={T} />
          <div className="w-[1px] my-4 opacity-50" style={{ background: T?.divider }} />
          <StatBox value={totalLikes} label="Likes" T={T} />
        </div>

        <div className="flex flex-col gap-1 mt-6 px-2">
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
          <div className="flex gap-4 mt-8">
            {user.worldRank > 0 && <RankCard icon="🌍" value={user.worldRank} label="World Rank" T={T} />}
            {user.campusRank > 0 && <RankCard icon="🏫" value={user.campusRank} label="Campus Rank" T={T} />}
          </div>
        )}
      </div>

      <div className="h-2 w-full" style={{ background: T?.divider }} />

      <div className="flex sticky top-[62px] z-10 backdrop-blur-xl bg-opacity-90 shadow-sm" style={{ borderBottom: `1px solid ${T?.divider}`, background: `${T?.bg}ee` }}>
        {tabs.map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className="flex-1 py-4 bg-transparent border-none text-[14px] cursor-pointer transition-all duration-300 relative"
            style={{ 
              color: activeTab === tab ? accentColor : T?.muted, 
              fontWeight: activeTab === tab ? 800 : 600, 
            }}
          >
            {tab === "posts" ? "📝 Posts" : tab === "liked" ? "❤️ Liked" : "🔖 Saved"}
            {activeTab === tab && (
              <div 
                className="absolute bottom-0 left-[20%] right-[20%] h-[3px] rounded-t-full shadow-[0_-2px_10px_rgba(0,0,0,0.2)] transition-all"
                style={{ background: accentColor }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ══ FEED ══ */}
      <div className="p-4 pt-6">
        {postsForTab.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4" style={{ background: T?.inputBg }}>
              {activeTab === "liked" ? "🤍" : activeTab === "saved" ? "🔖" : "📝"}
            </div>
            <p className="text-[15px] font-semibold" style={{ color: T?.mutedMid }}>
              No {activeTab} yet.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 gap-4">
            {postsForTab.map((post) => (
              <div key={post.id} className="break-inside-avoid mb-4">
                {post.type === "video" ? (
                  <VideoTile post={post} T={T} isOwner={isOwnProfile} onDeletePost={deletePost} />
                ) : (
                  <PostCard post={post} T={T} isOwner={isOwnProfile} authorUser={user} allPosts={postsForTab} setAllPosts={setFeedPosts} onDeletePost={deletePost} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen Image Viewer */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewingImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setViewingImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={viewingImage} alt="" 
            className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* Verify Modal */}
      {verifyStep === 1 && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div 
            className="w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            style={{ background: T?.surface || T?.bg, border: `1px solid ${T?.divider}` }}
          >
            <div className="w-12 h-1.5 rounded-full mb-6 opacity-30" style={{ background: T?.text }} />
            
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-[0_10px_30px_rgba(124,58,237,0.4)]">
              <Sparkles size={36} />
            </div>
            
            <h2 className="text-2xl font-black mb-3 tracking-tight" style={{ color: T?.text }}>Get Verified</h2>
            <p className="text-[15px] leading-relaxed font-medium mb-8" style={{ color: T?.muted }}>
              Stand out with a verified badge! Requires either <span className="font-bold text-purple-500">₦2,500</span> OR <span className="font-bold text-purple-500">10,000 tokens</span> + 20 verified followers.
            </p>
            
            <button
              onClick={handleCompleteVerification}
              disabled={verifying}
              className="w-full py-4 rounded-2xl text-white font-bold text-[16px] transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`, opacity: verifying ? 0.7 : 1 }}
            >
              {verifying ? "Processing..." : "Continue"} <ArrowLeft className="rotate-180" size={18} />
            </button>
            
            <button 
              onClick={() => setVerifyStep(0)} 
              className="w-full mt-4 py-3 font-bold text-[15px] opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: T?.text }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}