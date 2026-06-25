/**
 * App.jsx  — Glimacy v2 (Full Rewrite)
 * Colors: BLACK · DEEP PURPLE · WHITE (Spotify Feel)
 * Verified Badges:
 * — Blue tick: Premium/Pro flow
 * — White tick: Campus Elite requirements met
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Home, Users, Trophy, Bell, Send, Search,
  Heart, MessageCircle, Repeat2, Bookmark, Eye,
  MoreHorizontal, ArrowLeft, X, UserPlus, UserCheck,
  Camera, Share2, Copy, Video, Play, Flag, CornerUpLeft,
  ShieldCheck, Coins, Trash2, Sun, Moon, Monitor, ChevronRight,
  Plus, Flame, RefreshCw, Image as ImageIcon, Type as TypeIcon,
  Megaphone, CreditCard, PlayCircle, CheckCircle2, Zap, Target,
  TrendingUp, UserCheck2, Radio, MessageSquare, Settings, Gift,
} from "lucide-react";

import { Avatar }                                    from "./components/ui/Avatar";
import { ActionBtn }                                 from "./components/ui/ActionBtn";
import { VerifiedBadge, Tag, EmptyState, ActionBadgeBtn } from "./components/ui/Shared";
import Login                                         from "./components/ui/Login";
import Header                                        from "./components/ui/Header";
import { supabase }                                  from "./services/supabaseClient";
import EditProfileModal                              from "./components/features/Profile/EditProfileModal";
import CreatePostModal, { CreatePostFAB }            from "./components/ui/CreatePostModal";
import ConnectHubView                                from "./components/features/Connect/ConnectHubView";
import NotificationsView                             from "./components/features/Notifications/NotificationsView";
import Leaderboard                                   from "./components/features/leaderboard/Leaderboard";
import LeaderboardHeader                             from "./components/features/leaderboard/LeaderboardHeader";
import MessagesView                                  from "./components/features/Messages/MessagesView";
import ProfileView                                   from "./components/features/Profile/Profile";

// ─── BRAND CONFIGURATION ─────────────────────────────────────────────────────
export const PURPLE       = "#7C3AED";   // deep purple (primary accent)
export const PURPLE_DIM   = "rgba(124,58,237,0.14)";
export const PURPLE_BD    = "rgba(124,58,237,0.32)";
export const PURPLE_GLOW  = "rgba(124,58,237,0.50)";
export const BLACK        = "#000000";
export const OFF_BLACK    = "#0A0012";   // near-black with subtle purple hint
export const CARD_BLACK   = "#110020";   // card surface
export const WHITE        = "#FFFFFF";
export const OFF_WHITE    = "#EDE8FF";   // slightly warm white for text

export const GOLD         = PURPLE;
export const GOLD_BRIGHT  = "#9B5BFA";
export const GOLD_DIM     = PURPLE_DIM;
export const GOLD_BORDER  = PURPLE_BD;
export const GOLD_GLOW    = PURPLE_GLOW;
export const BRAND_GRAD   = `linear-gradient(135deg, ${PURPLE}, #5B21B6)`;

export const accent       = () => PURPLE;
export const accentDim    = () => PURPLE_DIM;
export const accentBorder = () => PURPLE_BD;
export const accentGlow   = () => PURPLE_GLOW;

export const C = {
  gold: PURPLE, goldBright: GOLD_BRIGHT, goldGlow: PURPLE_GLOW,
  silver: "#C0C0C0", bronze: "#CD7F32",
  online: "#22c55e", danger: "#ef4444", pink: "#ef4444",
  facebook: "#1877F2",
};

export const TOKEN_ECONOMY = {
  tokensPerAd:       25,
  nairaPerTenTokens: 20,
  tokensToVerify:    500,
  cardVerifyPrice:   500,
  whiteTokenCost:    10000,
  whiteNairaCost:    2500,
  whiteMinFollowers: 20,
  whiteMinPosts:     50,
};

// ─── THEMES ──────────────────────────────────────────────────────────────────
const THEMES = {
  glimacy: {
    id: "glimacy", label: "Dark Mode",
    bg: OFF_BLACK, surface: CARD_BLACK,
    cardBg: "rgba(124,58,237,0.07)",
    cardBorder: PURPLE_BD,
    cardShadow: "0 4px 32px rgba(0,0,0,0.75), inset 0 1px 0 rgba(124,58,237,0.08)",
    text: OFF_WHITE, muted: "#7B6E99", mutedMid: "#A089C8",
    inputBg: "rgba(124,58,237,0.09)", inputBorder: "rgba(124,58,237,0.22)",
    pillBorder: "rgba(124,58,237,0.14)", divider: "rgba(124,58,237,0.12)",
    hoverBg: "rgba(124,58,237,0.10)", sentBg: PURPLE, sentText: "#fff",
    recvBg: "rgba(255,255,255,0.06)", recvText: OFF_WHITE,
    coverGrad: `linear-gradient(135deg, ${OFF_BLACK}, #1A0030, ${OFF_BLACK})`,
    isDark: true,
  },
  light: {
    id: "light", label: "Light Mode",
    bg: "#F0EEFF", surface: "#ffffff",
    cardBg: "rgba(255,255,255,0.96)",
    cardBorder: "rgba(124,58,237,0.12)",
    cardShadow: "0 2px 12px rgba(124,58,237,0.10)",
    text: "#0A0012", muted: "#7B6E99", mutedMid: "#8B7DAA",
    inputBg: "rgba(124,58,237,0.06)", inputBorder: "rgba(124,58,237,0.20)",
    pillBorder: "rgba(124,58,237,0.14)", divider: "rgba(124,58,237,0.10)",
    hoverBg: "rgba(124,58,237,0.06)", sentBg: PURPLE, sentText: "#fff",
    recvBg: "rgba(0,0,0,0.05)", recvText: "#0A0012",
    coverGrad: "linear-gradient(135deg, #F0EEFF, #DDD4FF, #F0EEFF)",
    isDark: false,
  },
};

export const glass = (T, extra = {}) => ({
  background: T.cardBg,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: `1px solid ${T.cardBorder}`,
  boxShadow: T.cardShadow,
  ...extra,
});

// ─── CONSTANTS & MOCK DATA ───────────────────────────────────────────────────
const FUTA_FACULTIES = ["SESE","SIMME","SLS","SOC","SPS","SAAT","SBMS","SLIT","SEMS","SET"];

const MOCK_USER = {
  id: "me", name: "Glimacy Dev", handle: "@glimacy.dev", verified: false,
  verifiedType: null,
  bio: "Building the future, one commit at a time 🚀",
  university: "Federal University of Technology, Akure (FUTA)",
  faculty: "SLIT", gender: "Male", tokens: 520,
  posts: 54, followers_count: 24, following_count: 18,
  worldRank: 47, campusRank: 12, score: 2100,
  isOnline: true, lastSeen: null,
  relationshipStatus: "Single",
  phone: "8012345678",
  website: "https://glimacy.com",
  hobby: "Coding and interface modeling",
  seed: "GD", avatarUrl: null, coverUrl: null,
};

const MOCK_PROFILES = [
  { id:"u1", name:"Chinedu Okafor", handle:"@chinedu_dev", seed:"CO",
    university:"Federal University of Technology, Akure (FUTA)", faculty:"SET",
    bio:"Full-stack dev & open source contributor 👨‍💻🚀", verified:true, verifiedType:"blue",
    followers_count:1100, following_count:312, posts:64, gender:"Male",
    relationshipStatus:"Single", hobby:"I love building open source tools",
    avatarUrl:null, coverUrl:null },
  { id:"u2", name:"Amina Yusuf", handle:"@amina_tech", seed:"AY",
    university:"University of Lagos, Akoka (UNILAG)", faculty:"Engineering",
    bio:"AI researcher. STEM advocate. Lagos techie 🤖✨", verified:true, verifiedType:"white",
    followers_count:3200, following_count:210, posts:89, gender:"Female",
    relationshipStatus:"Taken", hobby:"I love machine learning and art",
    avatarUrl:null, coverUrl:null },
];

const MY_VIDEO_POSTS = [
  { id:"vp1", authorId:"me", author:"Glimacy Dev", handle:"@glimacy.dev", time:"2h", type:"video",
    thumbnail:"https://picsum.photos/seed/vid1/400/300",
    caption:"Quick demo of the new campus feed feature 🔥 #FUTA #Tech #Dev",
    likes:142, likedBy:[], comments:[], reposts:17, saves:8, views:1240, saved:false, liked:false, reposted:false },
  { id:"vp2", authorId:"me", author:"Glimacy Dev", handle:"@glimacy.dev", time:"1d", type:"video",
    thumbnail:"https://picsum.photos/seed/vid2/400/300",
    caption:"Night coding session hits different ☕💻 who else? #NightOwl #SLIT",
    likes:309, likedBy:[], comments:[], reposts:44, saves:21, views:4780, saved:false, liked:false, reposted:false },
];

const INITIAL_FEED_POSTS = [
  { id:"fp1", authorId:"u1", author:"Chinedu Okafor", handle:"@chinedu_dev",
    seed:"CO", time:"3h", type:"text",
    content:"Building in public is the fastest way to level up. Ship early, iterate fast 🚀 #OpenSource",
    likes:319, likedBy: ["Amina Yusuf"], comments:[], reposts:44, saves:12, views:2100, liked:false, saved:false, reposted:false },
  { id:"fp2", authorId:"u2", author:"Amina Yusuf", handle:"@amina_tech",
    seed:"AY", time:"5h", type:"text",
    content:"AI is not replacing you. A human using AI is. Stay ahead, keep learning 🤖✨ #UNILAG #Tech",
    likes:512, likedBy: ["Chinedu Okafor"], comments:[], reposts:88, saves:34, views:4100, liked:false, saved:false, reposted:false },
];

const MOCK_NOTIFICATIONS = [
  { id:"n1", type:"like",    user:{ name:"Chinedu Okafor", id:"u1", avatar:null }, timestamp:"10m ago" },
  { id:"n2", type:"comment", user:{ name:"Amina Yusuf", id:"u2", avatar:null }, previewText:"This campus feed feature is exactly what FUTA needed! 🔥", timestamp:"1h ago" },
  { id:"n3", type:"follow",  user:{ name:"New Fresher", id:"u3", avatar:null }, timestamp:"3h ago" },
];

const BOTTOM_NAV = [
  { id:"home",    Icon:Home,      label:"Home"   },
  { id:"connect", Icon:Users,     label:"Connect"},
  { id:"ranking", Icon:Trophy,    label:"Ranking"},
  { id:"notifs",  Icon:Bell,      label:"Notifs" },
  { id:"ads",     Icon:Megaphone, label:"Ads"    },
];

const AD_TIERS = [
  { people:100,   days:1,  price:499,   label:"Starter",  starterOnly:true },
  { people:250,   days:3,  price:999,   label:"Basic"    },
  { people:500,   days:5,  price:1999,  label:"Standard" },
  { people:1000,  days:7,  price:3999,  label:"Pro"      },
  { people:2500,  days:14, price:9999,  label:"Growth"   },
  { people:5000,  days:21, price:24999, label:"Premium"  },
  { people:10000, days:30, price:49999, label:"Elite"    },
];

const tokenCost  = (naira) => Math.ceil(naira / 2);
let _uidN = 0;
const uid = (prefix = "id") => `${prefix}_${Date.now()}_${_uidN++}`;
const STATUS_BG_PRESETS = [
  `linear-gradient(135deg, ${PURPLE}, #3B0090)`,
  "linear-gradient(135deg, #000000, #1A0030)",
  "linear-gradient(135deg, #1A0030, #4C1D95)",
  "linear-gradient(135deg, #000000, #2D0050)",
  `linear-gradient(135deg, #5B21B6, ${PURPLE})`,
];

const POINT_ACTIONS = {
  LIKE_POST:     3,
  COMMENT:       5,
  REPOST:        4,
  POST_CREATED:  10,
  VIEW_STATUS:   1,
  FOLLOW:        2,
  LIKE_STATUS:   2,
};

const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── 1. GLIMACY BADGE & ACTION BANNER BUTTONS ────────────────────────────────
export const GlimacyBadge = ({ type = "blue", size = 15 }) => {
  const isWhite = type === "white";
  return (
    <div
      title={isWhite ? "White Verified — Campus Elite" : "Blue Verified — Premium/Pro"}
      className="flex items-center justify-center font-black rounded-full flex-shrink-0 transition-transform duration-300 hover:scale-110 shadow-md"
      style={{
        width: size, height: size,
        background: isWhite
          ? "linear-gradient(135deg, #ffffff, #e2e8f0)"
          : `linear-gradient(135deg, #00d2ff, ${PURPLE}, #6a00ff)`,
        fontSize: size * 0.55, 
        color: isWhite ? "#0f172a" : "#fff",
        boxShadow: isWhite
          ? "0 0 10px rgba(255,255,255,0.8)"
          : `0 0 10px ${PURPLE_GLOW}`,
      }}
    >?</div>
  );
};

export const ActionBannerBtns = React.memo(({ T, user, tokens, onVerifyClick, onEarnClick }) => (
  <div className="flex gap-3 px-1 mb-2">
    {!user?.verified && (
      <button 
        onClick={onVerifyClick} 
        className="flex-1 py-3 rounded-2xl border-none cursor-pointer flex items-center justify-center gap-2 text-[13px] font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md"
        style={{ border: `1.5px solid ${PURPLE_BD}`, background: PURPLE_DIM, color: PURPLE }}
      >
        <ShieldCheck size={16}/> Get Verified
      </button>
    )}
    <button 
      onClick={onEarnClick} 
      className="flex-1 py-3 rounded-2xl border-none cursor-pointer flex items-center justify-center gap-2 text-[13px] font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg text-white"
      style={{ background: `linear-gradient(135deg, ${PURPLE}, #5B21B6)` }}
    >
      <Coins size={16}/> 🪙 {tokens} Tokens
    </button>
  </div>
));

// ─── 2. STORY RING & STORY BAR ───────────────────────────────────────────────
const StoryRing = React.memo(({ T, entry, seenIds, onAvatarClick, onAddClick, onViewProfile }) => {
  const hasItems = (entry.items||[]).length > 0;
  const isActive = hasItems && (entry.items||[]).some(it => !seenIds.has(it.id));
  const ringGrad = entry.isMe
    ? (hasItems ? `linear-gradient(135deg, ${PURPLE}, #00d2ff)` : T.divider)
    : (isActive ? `linear-gradient(135deg, ${PURPLE}, #00d2ff)` : T.divider);
    
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group">
      <div 
        onClick={() => { if(hasItems)onAvatarClick(); else if(entry.isMe)onAddClick(); else if(onViewProfile)onViewProfile(entry.userId); }}
        className={`relative w-[64px] h-[64px] rounded-full p-[3px] transition-transform duration-300 ${isActive ? 'animate-pulse group-hover:scale-105' : 'group-hover:scale-105'}`}
        style={{ background: ringGrad, cursor: (hasItems||entry.isMe||!entry.isMe) ? "pointer" : "default" }}
      >
        <div className="w-full h-full rounded-full p-[2px]" style={{ background: T.bg }}>
          <div className="w-full h-full rounded-full p-[2px]" style={{ background: T.bg }}>
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ background: entry.avatarUrl ? "transparent" : `linear-gradient(135deg, ${PURPLE}99, ${PURPLE})` }}>
              {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" /> : (entry.seed||entry.name||"U")[0]?.toUpperCase()}
            </div>
          </div>
        </div>
        
        {entry.trending && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-sm z-10" style={{ border: `2px solid ${T.bg}` }}>
            <Flame size={10} color="#fff" fill="#fff"/>
          </div>
        )}
        
        {entry.isMe && (
          <div 
            onClick={e=>{e.stopPropagation();onAddClick();}} 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110 z-10"
            style={{ background: PURPLE, border: `2px solid ${T.bg}` }}
          >
            <Plus size={12} color={WHITE} strokeWidth={3}/>
          </div>
        )}
      </div>
      <span className="text-[11px] max-w-[62px] overflow-hidden text-ellipsis whitespace-nowrap font-medium" style={{ color: isActive ? T.text : T.muted }}>
        {entry.isMe ? "Your Story" : entry.name}
      </span>
    </div>
  );
});

const StoryBar = React.memo(({ T, statusFeed, seenIds, onAvatarClick, onAddClick, onViewProfile }) => (
  <div className="flex gap-4 overflow-x-auto px-1 py-3 custom-scrollbar hide-scroll">
    {statusFeed.map((entry, idx) => (
      <StoryRing key={entry.userId} T={T} entry={entry} seenIds={seenIds} onAvatarClick={() => onAvatarClick(idx)} onAddClick={onAddClick} onViewProfile={onViewProfile}/>
    ))}
  </div>
));

// ─── COMMENT SECTION ─────────────────────────────────────────────────────────
const CommentSection = React.memo(({ T, post, setAllPosts, onViewProfile, onPoints }) => {
  const [commentText, setCommentText] = useState("");
  const submitComment = useCallback(() => {
    if (!commentText.trim()) return;
    const newComment = { id:uid("c"), author:"You", text:commentText.trim(), time:"Just now", authorId:"me" };
    setAllPosts(prev => prev.map(p => p.id===post.id ? {...p, comments:[...(p.comments||[]), newComment]} : p));
    if (onPoints) onPoints("COMMENT");
    setCommentText("");
  }, [commentText, onPoints, post.id, setAllPosts]);
  
  return (
    <div style={{ marginTop:14, borderTop:`1px solid ${T.divider}`, paddingTop:12 }}>
      {(post.comments||[]).length === 0 && <p style={{ margin:"0 0 12px", fontSize:12, color:T.muted, textAlign:"center" }}>No comments yet — be first!</p>}
      <div className="flex flex-col gap-2 mb-3 max-h-[180px] overflow-y-auto pr-1">
        {(post.comments||[]).map(c => (
          <div key={c.id} className="flex gap-2.5 items-start">
            <div 
              onClick={() => c.authorId && onViewProfile(c.authorId)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 cursor-pointer"
              style={{ background: PURPLE_DIM, border: `1px solid ${PURPLE_BD}`, color: PURPLE }}
            >
              {(c.author||"Y")[0].toUpperCase()}
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}` }}>
              <div className="text-[12px] font-bold" style={{ color: T.text }}>{c.author}</div>
              <div className="text-[13px] mt-0.5" style={{ color: T.text }}>{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={commentText} onChange={e=>setCommentText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submitComment()}
          placeholder="Write a comment…"
          className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
          style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }}
        />
        <button onClick={submitComment} className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border-none" style={{ background: commentText.trim()?PURPLE:T.inputBg, color: commentText.trim()?WHITE:T.muted }}>
          <Send size={14}/>
        </button>
      </div>
    </div>
  );
});

// ─── 3. POST CARD & VIDEO POST CARD ──────────────────────────────────────────
const PostCard = React.memo(({ T, post, setAllPosts, onViewProfile, onPoints, currentUser, index }) => {
  const [showComments, setShowComments] = useState(false);
  const [likeAnim,     setLikeAnim]     = useState(false);
  const [saveAnim,     setSaveAnim]     = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [likersOpen,   setLikersOpen]   = useState(false);
  const menuRef = useRef(null);

  const toggleLike = useCallback(() => {
    setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400);
    const userName = currentUser?.name || "You";
    setAllPosts(prev => prev.map(p => {
      if (p.id !== post.id) return p;
      const wasLiked = p.liked;
      const lb = p.likedBy || [];
      const newLb = wasLiked ? lb.filter(n => n!==userName) : [...lb, userName];
      return { ...p, liked:!wasLiked, likes:wasLiked?p.likes-1:p.likes+1, likedBy:newLb };
    }));
    if (!post.liked && onPoints) onPoints("LIKE_POST");
  }, [currentUser?.name, onPoints, post.id, post.liked, setAllPosts]);
  
  const toggleSave = useCallback(() => { setSaveAnim(true); setTimeout(()=>setSaveAnim(false),400); setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,saved:!p.saved,saves:p.saved?p.saves-1:p.saves+1}:p)); }, [post.id, setAllPosts]);
  const toggleRepost = useCallback(() => { setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,reposted:!p.reposted,reposts:p.reposted?p.reposts-1:p.reposts+1}:p)); if(!post.reposted&&onPoints)onPoints("REPOST"); }, [onPoints, post.id, post.reposted, setAllPosts]);
  const deletePost = useCallback(() => setAllPosts(prev => prev.filter(p => p.id !== post.id)), [post.id, setAllPosts]);

  return (
    <div 
      className="rounded-[24px] mb-5 overflow-hidden transition-all duration-300 hover:shadow-xl group relative animate-in fade-in slide-in-from-bottom-4"
      style={{ 
        background: T.cardBg || T.surface || T.bg, 
        border: `1px solid ${T.cardBorder || T.divider}`,
        boxShadow: T.cardShadow || "0 8px 30px rgba(0,0,0,0.06)",
        animationDelay: `${Math.min(index*0.05, 0.3)}s` 
      }}
    >
      <div className="p-4 pb-2">
        {post.reposted && (
          <div className="flex items-center gap-1.5 text-green-500 text-[11px] font-bold mb-3">
            <Repeat2 size={14}/> You reposted this
          </div>
        )}
        <div className="flex items-center gap-3 mb-3 relative">
          <div className="transition-transform duration-300 hover:scale-110 cursor-pointer" onClick={() => onViewProfile(post.authorId)}>
            <Avatar seed={post.seed||post.author} T={T} size={42} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[15px] cursor-pointer hover:underline" style={{ color: T.text }} onClick={() => onViewProfile(post.authorId)}>{post.author}</span>
              {post.verified && <GlimacyBadge type={post.verifiedType||"blue"} size={14}/>}
            </div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: T.mutedMid || T.muted }}>{post.time}</div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full bg-black/5" style={{ color: T.muted }}>
            <Eye size={12}/>{(post.views||0).toLocaleString()}
          </div>
          
          <div className="relative" ref={menuRef}>
            <button className="p-2 rounded-full hover:bg-black/10 transition-colors border-none bg-transparent cursor-pointer" onClick={() => setPostMenuOpen(v => !v)}>
              <MoreHorizontal size={18} color={T.muted} />
            </button>
            {postMenuOpen && (
              <div 
                className="absolute right-0 top-10 z-30 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 min-w-[160px] backdrop-blur-xl"
                style={{ background: T.isDark ? "rgba(10,0,20,0.95)" : "rgba(255,255,255,0.95)", border: `1px solid ${T.cardBorder || T.divider}` }}
              >
                {post.authorId === "me" ? (
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left" onClick={deletePost}>
                    <Trash2 size={15}/> Delete Post
                  </button>
                ) : (
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left" onClick={() => { alert("Post reported!"); setPostMenuOpen(false); }}>
                    <Flag size={15}/> Report Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-[14.5px] leading-relaxed m-0 mb-3 whitespace-pre-wrap font-medium" style={{ color: T.text }}>
          {post.content}
        </p>
      </div>

      {post.image && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl overflow-hidden shadow-sm relative transition-shadow hover:shadow-md cursor-pointer group/img">
            <img src={post.image} alt="" className="w-full max-h-[380px] object-cover block transition-transform duration-700 group-hover/img:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors duration-300" />
          </div>
        </div>
      )}

      <div className="flex justify-between px-5 pb-3 text-[12px] font-bold" style={{ color: T.mutedMid || T.muted }}>
        <span className="cursor-pointer hover:underline hover:text-pink-500 transition-colors" onClick={() => post.likes > 0 && setLikersOpen(true)}>
          {post.likes} {post.likes === 1 ? "like" : "likes"}
        </span>
        <div className="flex gap-4">
          <span>{post.reposts} reposts</span>
          <span>{(post.comments||[]).length} comments</span>
        </div>
      </div>

      <div className="h-[1px] w-full opacity-50" style={{ background: T.divider }} />

      <div className="flex px-2 py-1">
        <button onClick={toggleLike} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 cursor-pointer border-none bg-transparent ${likeAnim ? 'scale-125' : 'scale-100 active:scale-95'}`} style={{ color: post.liked ? "#ec4899" : T.muted, fontWeight: post.liked ? 800 : 600, fontSize: 13 }}>
          <Heart size={18} fill={post.liked ? "#ec4899" : "none"} /> <span className="hidden sm:inline">Like</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 active:scale-95 cursor-pointer border-none bg-transparent" style={{ color: showComments ? PURPLE : T.muted, fontWeight: showComments ? 800 : 600, fontSize: 13 }}>
          <MessageCircle size={18} fill={showComments ? PURPLE_DIM : "none"} /> <span className="hidden sm:inline">Comment</span>
        </button>
        <button onClick={toggleRepost} className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 active:scale-95 cursor-pointer border-none bg-transparent" style={{ color: post.reposted ? "#22c55e" : T.muted, fontWeight: post.reposted ? 800 : 600, fontSize: 13 }}>
          <Repeat2 size={18} /> <span className="hidden sm:inline">Repost</span>
        </button>
        <button onClick={toggleSave} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 cursor-pointer border-none bg-transparent ${saveAnim ? 'scale-125' : 'scale-100 active:scale-95'}`} style={{ color: post.saved ? PURPLE : T.muted, fontWeight: post.saved ? 800 : 600, fontSize: 13 }}>
          <Bookmark size={18} fill={post.saved ? PURPLE : "none"} /> <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      {showComments && <CommentSection T={T} post={post} setAllPosts={setAllPosts} onViewProfile={onViewProfile} onPoints={onPoints} />}
      
      {likersOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] p-5 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300" style={{ background: T.surface || T.bg, border: `1px solid ${T.cardBorder || T.divider}` }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-[18px] font-black tracking-tight" style={{ color: T.text }}>Liked by</h3>
              <button onClick={() => setLikersOpen(false)} className="p-2 rounded-full border-none bg-transparent hover:bg-black/10 cursor-pointer transition-colors" style={{ color: T.muted }}><X size={20}/></button>
            </div>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {(post.likedBy || []).map((n, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">{n[0]}</div>
                  <span className="font-bold text-[14px]" style={{ color: T.text }}>{n}</span>
                </div>
              ))}
              {(!post.likedBy || post.likedBy.length === 0) && (
                <div className="text-center py-6 text-[13px] font-medium" style={{ color: T.muted }}>No likes yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const VideoPostCard = React.memo(({ T, post, setAllPosts, onViewProfile, onPoints, currentUser, index }) => {
  const [showComments, setShowComments] = useState(false);
  const [likeAnim,     setLikeAnim]     = useState(false);
  const [saveAnim,     setSaveAnim]     = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleLike = useCallback(() => {
    setLikeAnim(true); setTimeout(()=>setLikeAnim(false),400);
    const userName = currentUser?.name || "You";
    setAllPosts(prev => prev.map(p => {
      if (p.id !== post.id) return p;
      const wasLiked = p.liked;
      const lb = p.likedBy || [];
      const newLb = wasLiked ? lb.filter(n=>n!==userName) : [...lb,userName];
      return {...p,liked:!wasLiked,likes:wasLiked?p.likes-1:p.likes+1,likedBy:newLb};
    }));
    if (!post.liked && onPoints) onPoints("LIKE_POST");
  }, [currentUser?.name, onPoints, post.id, post.liked, setAllPosts]);
  
  const toggleSave = useCallback(() => { setSaveAnim(true); setTimeout(()=>setSaveAnim(false),400); setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,saved:!p.saved,saves:p.saved?p.saves-1:p.saves+1}:p)); }, [post.id, setAllPosts]);
  const toggleRepost = useCallback(() => { 
  setAllPosts(prev => prev.map(p => p.id === post.id ? { ...p, reposted: !p.reposted, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1 } : p)); 
  if (!post.reposted && onPoints) onPoints("REPOST"); 
}, [onPoints, post.id, post.reposted, setAllPosts]);

  return (
    <div 
      className="rounded-[24px] mb-5 overflow-hidden transition-all duration-300 hover:shadow-xl group relative animate-in fade-in slide-in-from-bottom-4"
      style={{ background: T.cardBg || T.surface || T.bg, border: `1px solid ${T.cardBorder || T.divider}`, boxShadow: T.cardShadow || "0 8px 30px rgba(0,0,0,0.06)", animationDelay: `${Math.min(index*0.05, 0.3)}s` }}
    >
      <div className="relative group/vid cursor-pointer overflow-hidden">
        <img src={post.thumbnail} alt="" className="w-full h-[240px] object-cover block transition-transform duration-700 group-hover/vid:scale-[1.03]" />
        <div className="absolute inset-0 bg-black/30 group-hover/vid:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-transform duration-300 group-hover/vid:scale-110" style={{ background: `${PURPLE}cc` }}>
            <Play size={24} color={WHITE} fill={WHITE} className="ml-1" />
          </div>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] font-bold text-white border border-white/10">
          <Eye size={12}/>{post.views.toLocaleString()}
        </div>
      </div>
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-3 relative">
          <div className="transition-transform duration-300 hover:scale-110 cursor-pointer" onClick={() => onViewProfile(post.authorId)}>
            <Avatar seed={post.seed||post.author} T={T} size={42} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[15px] cursor-pointer hover:underline" style={{ color: T.text }} onClick={() => onViewProfile(post.authorId)}>{post.author}</span>
              {post.verified && <GlimacyBadge type={post.verifiedType||"blue"} size={14}/>}
            </div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: T.mutedMid || T.muted }}>{post.time}</div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button className="p-2 rounded-full hover:bg-black/10 transition-colors border-none bg-transparent cursor-pointer" onClick={() => setPostMenuOpen(v => !v)}>
              <MoreHorizontal size={18} color={T.muted} />
            </button>
            {postMenuOpen && (
              <div className="absolute right-0 top-10 z-30 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 min-w-[160px] backdrop-blur-xl" style={{ background: T.isDark ? "rgba(10,0,20,0.95)" : "rgba(255,255,255,0.95)", border: `1px solid ${T.cardBorder || T.divider}` }}>
                {post.authorId === "me" ? (
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left" onClick={deletePost}><Trash2 size={15}/> Delete</button>
                ) : (
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-none bg-transparent cursor-pointer text-left" onClick={() => { alert("Reported!"); setPostMenuOpen(false); }}><Flag size={15}/> Report</button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-[14.5px] leading-relaxed m-0 mb-3 font-medium" style={{ color: T.text }}>{post.caption}</p>
      </div>

      <div className="flex justify-between px-5 pb-3 text-[12px] font-bold" style={{ color: T.mutedMid || T.muted }}>
        <span>{post.likes} likes</span>
        <div className="flex gap-4">
          <span>{post.reposts} reposts</span>
          <span>{(post.comments||[]).length} comments</span>
        </div>
      </div>
      <div className="h-[1px] w-full opacity-50" style={{ background: T.divider }} />
      <div className="flex px-2 py-1">
        <button onClick={toggleLike} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 cursor-pointer border-none bg-transparent ${likeAnim ? 'scale-125' : 'scale-100 active:scale-95'}`} style={{ color: post.liked ? "#ec4899" : T.muted, fontWeight: post.liked ? 800 : 600, fontSize: 13 }}><Heart size={18} fill={post.liked ? "#ec4899" : "none"} /> <span className="hidden sm:inline">Like</span></button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 active:scale-95 cursor-pointer border-none bg-transparent" style={{ color: showComments ? PURPLE : T.muted, fontWeight: showComments ? 800 : 600, fontSize: 13 }}><MessageCircle size={18} fill={showComments ? PURPLE_DIM : "none"} /> <span className="hidden sm:inline">Comment</span></button>
        <button onClick={toggleRepost} className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 active:scale-95 cursor-pointer border-none bg-transparent" style={{ color: post.reposted ? "#22c55e" : T.muted, fontWeight: post.reposted ? 800 : 600, fontSize: 13 }}><Repeat2 size={18} /> <span className="hidden sm:inline">Repost</span></button>
        <button onClick={toggleSave} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl transition-all duration-300 hover:bg-black/5 cursor-pointer border-none bg-transparent ${saveAnim ? 'scale-125' : 'scale-100 active:scale-95'}`} style={{ color: post.saved ? PURPLE : T.muted, fontWeight: post.saved ? 800 : 600, fontSize: 13 }}><Bookmark size={18} fill={post.saved ? PURPLE : "none"} /> <span className="hidden sm:inline">Save</span></button>
      </div>
      {showComments && <CommentSection T={T} post={post} setAllPosts={setAllPosts} onViewProfile={onViewProfile} onPoints={onPoints} />}
    </div>
  );
});

// ─── 4. APP HEADER ───────────────────────────────────────────────────────────
const AppHeader = React.memo(({ T, user, onAvatarClick, onSearchClick, onSettingsClick, onMessagesClick, onFeedbackClick, unreadMessages, children }) => (
  <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl bg-opacity-90 shadow-sm" style={{
    background: T.isDark ? "rgba(10, 0, 18, 0.85)" : "rgba(240, 238, 255, 0.85)",
    borderBottom: `1px solid ${T.divider}`,
  }}>
    <div onClick={onAvatarClick} className="cursor-pointer flex-shrink-0 transition-transform duration-300 hover:scale-110 active:scale-95">
      {children || <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white font-black text-sm shadow-md" style={{ background: PURPLE }}>{(user?.name||"G")[0]}</div>}
    </div>
    <div className="flex-1">
      <div className="font-black text-[19px] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-cyan-400 drop-shadow-sm">Glimacy</div>
    </div>
    <div className="flex gap-2 items-center">
      <button onClick={onSearchClick} className="w-[38px] h-[38px] rounded-xl bg-transparent border-none flex items-center justify-center cursor-pointer transition-all hover:bg-black/5 hover:scale-110 active:scale-95" style={{ color: T.text }}>
        <Search size={20} strokeWidth={2.5}/>
      </button>
      <button onClick={onFeedbackClick} className="w-[38px] h-[38px] rounded-xl bg-transparent border-none flex items-center justify-center cursor-pointer transition-all hover:bg-black/5 hover:scale-110 active:scale-95" style={{ color: T.text }}>
        <MessageSquare size={20} strokeWidth={2.5}/>
      </button>
      <button onClick={onSettingsClick} className="w-[38px] h-[38px] rounded-xl bg-transparent border-none flex items-center justify-center cursor-pointer transition-all hover:bg-black/5 hover:scale-110 active:scale-95" style={{ color: T.text }}>
        <Settings size={20} strokeWidth={2.5}/>
      </button>
      <button onClick={onMessagesClick} className="relative w-[38px] h-[38px] rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-sm" style={{ background: PURPLE_DIM, border: `1px solid ${PURPLE_BD}`, color: PURPLE }}>
        <Send size={18} strokeWidth={2.5} className="-ml-0.5" />
        {unreadMessages > 0 && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse" style={{ border: `2px solid ${T.bg}` }}>
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </div>
        )}
      </button>
    </div>
  </div>
));

// ─── VERIFY MODAL ────────────────────────────────────────────────────────────
const VerifyModal = React.memo(({ T, tokens, user, onClose, onVerified, onEarnedTokens }) => {
  const [tab,          setTab]          = useState("blue");
  const [step,         setStep]         = useState("options");
  const [adCount,      setAdCount]      = useState(0);
  const [watchProgress,setWatchProgress]= useState(0);
  const timerRef = useRef(null);

  const userPostCount     = user?.posts || 0;
  const verifiedFollowers = user?.followers_count || 0; 
  const canWhite          = verifiedFollowers >= TOKEN_ECONOMY.whiteMinFollowers && userPostCount >= TOKEN_ECONOMY.whiteMinPosts;
  const canWhiteTokens    = tokens >= TOKEN_ECONOMY.whiteTokenCost && canWhite;
  const canBlueTokens     = tokens >= TOKEN_ECONOMY.tokensToVerify;

  const watchAd = () => {
    setStep("watchingAd"); setWatchProgress(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 2; setWatchProgress(p);
      if (p >= 100) {
        clearInterval(timerRef.current);
        setAdCount(c => c + 1);
        onEarnedTokens(TOKEN_ECONOMY.tokensPerAd);
        setStep("watchAd");
      }
    }, 60);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[24px] p-6 relative text-center border shadow-2xl" style={{ background: T.isDark ? "#0A0012" : "#fff", borderColor: PURPLE_BD }}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none cursor-pointer" style={{ color:T.muted }}><X size={18}/></button>
        
        {step === "options" && (
          <>
            <div className="flex gap-2 mb-4">
              {["blue","white"].map(t => (
                <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 rounded-xl border-2 font-bold text-[13px] cursor-pointer flex items-center justify-center gap-1.5" style={{ borderColor: tab===t?PURPLE:T.inputBorder, background: tab===t ? PURPLE_DIM : "transparent", color: tab===t ? WHITE : T.muted }}>
                  <GlimacyBadge type={t} size={13}/> {t === "blue" ? "Blue Badge" : "White Badge"}
                </button>
              ))}
            </div>

            {tab === "blue" && (
              <>
                <div className="text-3xl mb-2">🔵</div>
                <h3 className="m-0 text-base font-extrabold" style={{ color:PURPLE }}>Blue Verified</h3>
                <p className="mt-1 mb-4 text-[12px]" style={{ color:T.muted }}>Premium flow — use 500 tokens or pay ₦500</p>
                <div className="flex flex-col gap-2">
                  {canBlueTokens ? (
                    <button onClick={() => { onVerified("blue_tokens"); onClose(); }} className="py-3 rounded-xl border-none bg-purple-600 font-extrabold text-[13px] text-white cursor-pointer">
                      🪙 Use 500 Tokens
                    </button>
                  ) : (
                    <button onClick={() => setStep("watchAd")} className="py-3 rounded-xl border font-bold text-[13px] cursor-pointer" style={{ borderColor: PURPLE_BD, background: PURPLE_DIM, color: PURPLE }}>
                      📺 Watch Ads (need {TOKEN_ECONOMY.tokensToVerify - tokens} more)
                    </button>
                  )}
                  <button onClick={() => setStep("cardPay")} className="py-3 rounded-xl border-none bg-purple-600 font-extrabold text-[13px] text-white cursor-pointer">
                    💳 Pay ₦{TOKEN_ECONOMY.cardVerifyPrice}
                  </button>
                </div>
              </>
            )}

            {tab === "white" && (
              <>
                <div className="text-3xl mb-2">⚪</div>
                <h3 className="m-0 text-base font-extrabold text-white">White Verified</h3>
                <p className="mt-1 mb-2 text-[12px]" style={{ color:T.muted }}>Campus Elite — milestones criteria:</p>
                <div className="border rounded-xl p-3 mb-4 text-left text-[12px]" style={{ background:PURPLE_DIM, borderColor:PURPLE_BD }}>
                  {[
                    [`At least 20 verified followers (${verifiedFollowers}/20)`, verifiedFollowers >= 20],
                    [`At least 50 posts made (${userPostCount}/50)`,         userPostCount >= 50],
                    [`Cost: 10,000 tokens OR ₦2,500`,    true],
                  ].map(([label, met], i) => (
                    <div key={i} className="flex items-center gap-2 py-1 font-medium" style={{ color: met ? "#22c55e" : T.muted }}>
                      <span>{met ? "✅" : "❌"}</span> {label}
                    </div>
                  ))}
                </div>
                {!canWhite && <p className="text-[11px] text-red-500 mb-3">Milestone criteria standard metrics incomplete</p>}
                <div className="flex flex-col gap-2">
                  <button disabled={!canWhiteTokens} onClick={() => canWhiteTokens && (onVerified("white_tokens"), onClose())} className="py-3 rounded-xl border-none font-extrabold text-[13px] text-white cursor-pointer" style={{ background: canWhiteTokens ? PURPLE : T.inputBg, color: canWhiteTokens ? WHITE : T.muted }}>
                    🪙 Use 10,000 Tokens
                  </button>
                  <button disabled={!canWhite} onClick={() => canWhite && setStep("cardPayWhite")} className="py-3 rounded-xl border-none font-extrabold text-[13px] text-white cursor-pointer" style={{ background: canWhite ? PURPLE : T.inputBg, color: canWhite ? WHITE : T.muted }}>
                    💳 Pay ₦2,500
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {(step === "watchAd" || step === "watchingAd") && (
          <>
            <div className="text-4xl mb-2">📺</div>
            <h3 className="m-0 text-base font-extrabold" style={{ color:PURPLE }}>{step === "watchingAd" ? "Streaming Ad Frame…" : "Earn Verification Tokens"}</h3>
            {step === "watchingAd" ? (
              <div className="mt-4">
                <div className="h-2 rounded-full overflow-hidden w-full bg-neutral-800">
                  <div className="h-full bg-purple-600 transition-all duration-75" style={{ width: `${watchProgress}%` }} />
                </div>
                <span className="text-xs text-neutral-400 mt-1 block">{watchProgress}%</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-400 mb-4">Balance: {tokens} tokens · Earnings total package: +{TOKEN_ECONOMY.tokensPerAd}</p>
                <button onClick={watchAd} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold cursor-pointer mb-2 flex items-center justify-center gap-2"><PlayCircle size={16}/> Load Advertisement</button>
                <button onClick={() => setStep("options")} className="w-full py-2 rounded-xl bg-transparent border border-neutral-700 text-neutral-400 font-medium cursor-pointer">← Back</button>
              </>
            )}
          </>
        )}

        {(step === "cardPay" || step === "cardPayWhite") && (
          <>
            <div className="text-4xl mb-2">💳</div>
            <h3 className="m-0 text-base font-extrabold text-white">Secure Gateway Portal</h3>
            <div className="flex flex-col gap-3 my-4 text-left">
              <div>
                <label className="text-[11px] block mb-1" style={{ color:T.muted }}>Card PAN Identifier</label>
                <input placeholder="0000 0000 0000 0000" className="w-full px-3 py-2 rounded-lg border outline-none text-xs" style={{ background:T.inputBg, borderColor:PURPLE_BD, color:T.text }}/>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] block mb-1" style={{ color:T.muted }}>Validity Timeline</label>
                  <input placeholder="MM/YY" className="w-full px-3 py-2 rounded-lg border outline-none text-xs" style={{ background:T.inputBg, borderColor:PURPLE_BD, color:T.text }}/>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] block mb-1" style={{ color:T.muted }}>CVV</label>
                  <input placeholder="***" type="password" className="w-full px-3 py-2 rounded-lg border outline-none text-xs" style={{ background:T.inputBg, borderColor:PURPLE_BD, color:T.text }}/>
                </div>
              </div>
            </div>
            <button onClick={() => { onVerified(step === "cardPayWhite" ? "white_card" : "blue_card"); onClose(); }} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold cursor-pointer mb-2">Authorize Payment Package</button>
            <button onClick={() => setStep("options")} className="w-full py-2 rounded-xl bg-transparent border border-neutral-700 text-neutral-400 font-medium cursor-pointer">← Back</button>
          </>
        )}
      </div>
    </div>
  );
});

// ─── SEASON REWARDS PANEL ───────────────────────────────────────────────────
const SeasonRewards = React.memo(({ T }) => (
  <div className="p-4 rounded-2xl mb-4 border" style={{ ...glass(T), borderColor: PURPLE_BD }}>
    <div className="flex items-center gap-2 mb-3">
      <Gift size={18} color={PURPLE}/>
      <div className="font-extrabold text-[15px]" style={{ color:T.text }}>Season 1 Cash Rewards</div>
      <div className="ml-auto rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background:PURPLE_DIM, border:`1px solid ${PURPLE_BD}`, color:PURPLE }}>Coming Soon</div>
    </div>
    <p className="m-0 mb-3 text-xs" style={{ color:T.muted }}>Top ranked users inside the leaderboards division tier capture fluid monetary pay-outs.</p>
    <div className="flex flex-col gap-2">
      {[[ "🥇 1st Tier Creator Placement", "₦50,000 Fluid Cash + Custom Gold Accents" ], [ "🥈 2nd Tier Creator Placement", "₦25,000 Fluid Cash + Custom Silver Accents" ], [ "🥉 3rd Tier Creator Placement", "₦10,000 Fluid Cash + Custom Bronze Accents" ]].map(([tier, payout], i) => (
        <div key={i} className="flex items-center justify-between border rounded-xl px-3 py-2.5 bg-black/30" style={{ borderColor:PURPLE_BD }}>
          <span className="font-bold text-[13px]" style={{ color:T.text }}>{tier}</span>
          <span className="text-xs font-semibold" style={{ color:PURPLE }}>{payout}</span>
        </div>
      ))}
    </div>
  </div>
));

// ─── AD BOOST VIEW ───────────────────────────────────────────────────────────
const AdBoostView = React.memo(({ T, tokens, onSpendTokens, onEarnClick }) => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [gender, setGender] = useState("Both");
  const [payMethod, setPayMethod] = useState("card");
  const [step, setStep] = useState("build");

  const tier = AD_TIERS[selectedTier];
  const cost = tier ? tokenCost(tier.price) : 0;
  const canAfford = tokens >= cost;

  return (
    <div className="pb-24">
      <div className="p-4 border-b sticky top-0 backdrop-blur-md z-10 flex items-center gap-2" style={{ borderColor:T.divider, background: T.isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)" }}>
        <Megaphone size={19} color={PURPLE}/>
        <h2 className="m-0 text-base font-black" style={{ color:T.text }}>Campaign Dashboard</h2>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div onClick={onEarnClick} className="border rounded-2xl p-4 flex items-center gap-3 cursor-pointer" style={{ background: PURPLE_DIM, borderColor: PURPLE_BD }}>
          <div className="text-2xl">📺</div>
          <div className="flex-1">
            <h4 className="m-0 text-xs font-bold" style={{ color: PURPLE }}>Earn Complimentary Campaign Tokens</h4>
            <p className="m-0 text-[11px] mt-0.5" style={{ color: T.muted }}>Watch full streaming frames to accumulate verification bundles</p>
          </div>
          <ChevronRight size={16} color={PURPLE}/>
        </div>

        <div className="rounded-2xl p-4 border" style={glass(T)}>
          <div className="text-xs font-bold flex items-center gap-1.5 mb-3" style={{ color:T.text }}><Target size={14} color={PURPLE}/> Target Specification Demographic</div>
          <div className="flex gap-2">
            {["Male", "Female", "Both"].map(g => (
              <button key={g} onClick={() => setGender(g)} className="flex-1 py-2.5 rounded-xl font-bold border-none text-xs cursor-pointer" style={{ background: gender===g?PURPLE:T.inputBg, color: gender===g?WHITE:T.muted }}>{g}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold flex items-center gap-1.5 mb-1" style={{ color:T.text }}><TrendingUp size={14} color={PURPLE}/> Choose Scalability Tier Plan</div>
          {AD_TIERS.map((t, idx) => (
            <div key={idx} onClick={() => setSelectedTier(idx)} className="rounded-xl p-3 border cursor-pointer transition-all flex items-center justify-between" style={{ borderColor: selectedTier===idx?PURPLE:T.cardBorder, background: selectedTier===idx?PURPLE_DIM:T.cardBg }}>
              <div>
                <div className="text-[13px] font-bold" style={{ color:selectedTier===idx?PURPLE:T.text }}>{t.label} Tier Blueprint</div>
                <div className="text-[11px]" style={{ color:T.muted }}>{t.people.toLocaleString()} Estimated Targets · {t.days} Complete Days</div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-black" style={{ color:T.text }}>₦{t.price}</div>
                <div className="text-[10px]" style={{ color:T.muted }}>{tokenCost(t.price)} tokens</div>
              </div>
            </div>
          ))}
        </div>

        {selectedTier !== null && (
          <div className="rounded-2xl p-4 border flex flex-col gap-3 animate-in fade-in zoom-in-95" style={glass(T)}>
            <div className="flex gap-2">
              {["card", "tokens"].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} className="flex-1 py-2.5 rounded-xl font-bold border cursor-pointer text-xs uppercase" style={{ borderColor: payMethod===m?PURPLE:T.inputBorder, background: payMethod===m?PURPLE_DIM:"transparent", color: payMethod===m?PURPLE:T.muted }}>{m}</button>
              ))}
            </div>
            {payMethod === "tokens" && !canAfford && <p className="m-0 text-xs text-red-500 font-semibold">Insufficient token assets. Load alternative monetization structures.</p>}
            <button onClick={() => { if(payMethod==="tokens"&&!canAfford)return; setStep("success"); if(payMethod==="tokens")onSpendTokens(cost); }} className="w-full py-3.5 rounded-xl border-none font-bold text-white text-[13px] cursor-pointer" style={{ background: payMethod==="tokens"&&!canAfford?T.inputBg:PURPLE }}>Launch Selected Campaign Framework</button>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── SETTINGS PANEL ──────────────────────────────────────────────────────────
const SettingsPanel = React.memo(({ T, open, onClose, themeMode, setThemeMode, onSignOut }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-t-[24px] pb-8 max-h-[75vh] overflow-y-auto border-t" style={{ background: T.surface, borderColor: T.divider }} onClick={e=>e.stopPropagation()}>
        <div className="w-9 h-1 rounded-full mx-auto my-3 bg-neutral-700 cursor-pointer" onClick={onClose} />
        <div className="px-5 pb-3 border-b flex justify-between items-center" style={{ borderColor: T.divider }}>
          <h3 className="m-0 font-black text-sm" style={{ color: T.text }}>System Adjustments Configuration</h3>
          <X size={16} className="cursor-pointer" style={{ color:T.muted }} onClick={onClose}/>
        </div>
        <div className="flex flex-col">
          <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: T.divider }}>
            <span className="text-xs font-bold" style={{ color:T.text }}>Dark Scheme Configuration Mode</span>
            <button onClick={() => setThemeMode(themeMode==="dark"?"light":"dark")} className="px-4 py-1.5 rounded-lg border-none text-xs font-bold bg-purple-600 text-white cursor-pointer uppercase">{themeMode}</button>
          </div>
          <div onClick={onSignOut} className="px-5 py-4 flex items-center gap-2 cursor-pointer text-red-500 font-bold text-xs"><CornerUpLeft size={14}/> Terminate Current Session Authorization</div>
        </div>
      </div>
    </div>
  );
});

// ─── MAIN CONTAINER APPLICATION CELL ─────────────────────────────────────────
export default function App() {
  const [themeMode, setThemeMode] = useState("dark");
  const [user, setUser] = useState(MOCK_USER);
  const [tokens, setTokens] = useState(MOCK_USER.tokens);
  const [allPosts, setAllPosts] = useState([...INITIAL_FEED_POSTS, ...MY_VIDEO_POSTS]);
  const [activeTab, setActiveTab] = useState("home");
  const [viewingProfileId, setViewingProfileId] = useState(null);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const T = themeMode === "light" ? THEMES.light : THEMES.glimacy;
  const isOnProfile = !!viewingProfileId;
  const headerVisible = true;

  const handleEarnTokens = useCallback((amt) => setTokens(t => t + amt), []);
  const handleSpendTokens = useCallback((amt) => setTokens(t => Math.max(0, t - amt)), []);
  
  const handleVerified = useCallback((type) => {
    setUser(prev => ({ ...prev, verified: true, verifiedType: type.includes("white") ? "white" : "blue" }));
  }, []);

  const statusFeed = useMemo(() => [
    { userId: "me", name: "Your Story", isMe: true, items: [], seed: "GD" },
    { userId: "u1", name: "Chinedu Okafor", seed: "CO", trending: true, items: [{ id: "s1", type: "text", content: "Shipping clean UI builds daily 🚀", createdAt: Date.now() }] },
    { userId: "u2", name: "Amina Yusuf", seed: "AY", trending: false, items: [{ id: "s2", type: "text", content: "LLM local fine-tuning running frames complete.", createdAt: Date.now() }] }
  ], []);

  const seenIds = useMemo(() => new Set(), []);

  return (
    <div className="w-full min-h-screen flex justify-center selection:bg-purple-500/30" style={{ background: T.bg, color: T.text }}>
      
      {/* GLOBAL KEYFRAME ANIMATION CSS HOOKS */}
      <style>{`
        @keyframes storyPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.02); opacity: 0.9; } }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative shadow-2xl border-x overflow-hidden" style={{ borderColor: T.divider, background: T.bg }}>
        
        {/* APP RUNTIME CORE ROUTING RENDERS */}
        {!isOnProfile ? (
          <>
            <AppHeader 
              T={T} user={user} unreadMessages={2}
              onAvatarClick={() => setViewingProfileId("me")}
              onSearchClick={() => alert("Search Index Registry Launched")}
              onFeedbackClick={() => alert("Forward inquiries to: therealglimmar@gmail.com")}
              onSettingsClick={() => setSettingsOpen(true)}
              onMessagesClick={() => alert("Encrypted peer node array linking operational")}
            />
            
            <div className="flex-1 overflow-y-auto pb-24 hide-scroll px-3 pt-2">
              {activeTab === "home" && (
                <div className="flex flex-col gap-3">
                  <StoryBar T={T} statusFeed={statusFeed} seenIds={seenIds} onAvatarClick={(idx)=>alert(`Viewing node indices frame sequence: ${idx}`)} onAddClick={() => alert("Attachment loading platform live")} onViewProfile={(id)=>setViewingProfileId(id)}/>
                  <ActionBannerBtns T={T} user={user} tokens={tokens} onVerifyClick={() => setVerifyOpen(true)} onEarnClick={() => setVerifyOpen(true)}/>
                  
                  <div className="flex flex-col mt-2">
                    {allPosts.map((post, index) => (
                      post.type === "video" ? (
                        <VideoPostCard key={post.id} index={index} T={T} post={post} setAllPosts={setAllPosts} currentUser={user} onViewProfile={(id)=>setViewingProfileId(id)} onPoints={(act)=>alert(`Trigger protocol context updates: ${act}`)}/>
                      ) : (
                        <PostCard key={post.id} index={index} T={T} post={post} setAllPosts={setAllPosts} currentUser={user} onViewProfile={(id)=>setViewingProfileId(id)} onPoints={(act)=>alert(`Trigger protocol context updates: ${act}`)}/>
                      )
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "connect" && <ConnectHubView T={T} onViewProfile={(id) => setViewingProfileId(id)} />}
              {activeTab === "ranking" && (
                <div className="flex flex-col pt-2">
                  <SeasonRewards T={T}/>
                  <LeaderboardHeader T={T}/>
                  <Leaderboard T={T} onViewProfile={(id)=>setViewingProfileId(id)}/>
                </div>
              )}
              {activeTab === "notifs" && <NotificationsView T={T} onViewProfile={(id) => setViewingProfileId(id)} />}
              {activeTab === "ads" && <AdBoostView T={T} tokens={tokens} onSpendTokens={handleSpendTokens} onEarnClick={() => setVerifyOpen(true)}/>}
            </div>
          </>
        ) : (
          /* PROFILE DISPLAY PORTAL SUB-ROUTING HOOK */
          <div className="flex-1 flex flex-col h-full overflow-y-auto hide-scroll">
            <div className="p-3 border-b flex items-center gap-3 sticky top-0 z-50 backdrop-blur-md" style={{ borderColor:T.divider, background:T.surface }}>
              <button onClick={() => setViewingProfileId(null)} className="p-1.5 rounded-xl bg-transparent border-none cursor-pointer flex items-center justify-center hover:bg-neutral-800 transition-colors" style={{ color:T.text }}>
                <ArrowLeft size={19} strokeWidth={2.5}/>
              </button>
              <div className="font-bold text-xs uppercase tracking-wider" style={{ color:T.muted }}>Account Context Document View</div>
            </div>
            
            <div className="p-3 flex-1">
              {viewingProfileId === "me" ? (
                <ProfileView T={T} user={user} isMe={true} posts={allPosts.filter(p=>p.authorId==="me")} />
              ) : (
                (() => {
                  const targetProfile = MOCK_PROFILES.find(p => p.id === viewingProfileId) || MOCK_PROFILES[0];
                  return <ProfileView T={T} user={targetProfile} isMe={false} posts={allPosts.filter(p=>p.authorId===viewingProfileId)} />;
                })()
              )}
            </div>
          </div>
        )}

        {/* 5. POLISHED 5-TAB BOTTOM NAVIGATION DOCK COMPONENT[cite: 1] */}
        {!isOnProfile && (
          <div style={{
            position: "fixed", 
            bottom: 0, 
            left: "50%", 
            width: "100%", 
            maxWidth: 430,
            background: T.isDark ? "rgba(10, 0, 18, 0.85)" : "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)", 
            borderTop: `1px solid ${PURPLE_BD}`,
            display: "flex", 
            justifyContent: "space-around", 
            padding: "10px 0 20px", 
            zIndex: 40,
            opacity: headerVisible ? 1 : 0, 
            transform: headerVisible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(100%)",
            pointerEvents: headerVisible ? "auto" : "none", 
            transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.1)"
          }}>
            {BOTTOM_NAV.map(({ id, Icon, label }) => {
              const isActive = activeTab === id;
              return (
                <div key={id} onClick={() => { setActiveTab(id); if(id==="profile")setViewingProfileId(null); }}
                  className="flex flex-col items-center gap-1.5 flex-1 cursor-pointer transition-all duration-300"
                  style={{ 
                    color: isActive ? PURPLE : T.muted, 
                    transform: isActive ? "translateY(-4px)" : "translateY(0)" 
                  }}>
                  <div className="relative transition-transform duration-300" style={{ filter: isActive ? `drop-shadow(0 4px 10px ${PURPLE_GLOW})` : 'none', transform: isActive ? "scale(1.15)" : "scale(1)" }}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2}/>
                    {id==="ads" && <span className="absolute -top-1.5 -right-2 bg-pink-500 text-white text-[8px] font-black rounded-full px-1.5 py-0.5 leading-none shadow-sm animate-pulse">NEW</span>}
                  </div>
                  <span className="text-[10px] tracking-wide" style={{ fontWeight: isActive ? 800 : 500 }}>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL GLOBAL REGISTRY CONTROLLERS */}
        <SettingsPanel T={T} open={settingsOpen} onClose={()=>setSettingsOpen(false)} themeMode={themeMode} setThemeMode={setThemeMode} onSignOut={()=>alert("Session closed payload issued")}/>
        {verifyOpen && <VerifyModal T={T} tokens={tokens} user={user} onClose={()=>setVerifyOpen(false)} onVerified={handleVerified} onEarnedTokens={handleEarnTokens}/>}
        
      </div>
    </div>
  );
}