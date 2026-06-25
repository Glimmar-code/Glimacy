/**
 * App.jsx — Glimacy v3
 * ─────────────────────────────────────────────────────────────────────────────
 * PALETTE  : TRUE BLACK bg · DARK PURPLE verified badge · SKY BLUE secondary
 *            · WHITE text
 *
 * CHANGES FROM v2
 *  1.  Story-bar world/campus pill — smaller (height 22px, font 10)
 *  2.  Header: feedback icon → FeedbackPanel only; settings icon →
 *       SettingsPanel (theme · font size · notifications · log out)
 *  3.  Connect: shows relationship status on every card; avatar click → popup
 *       with "View Profile" + "Message" options
 *  4.  Edit-profile: changes reflect publicly; added "email" field (public)
 *  5.  Posts always public + appear on creator's profile
 *  6.  Back-navigation history stack — back arrow traces exact path you took
 *  7.  Twitter-style scroll: header + bottom nav slide off-screen on scroll-
 *       down; auto-restore after 1.2 s idle
 *  8.  Header + bottom nav completely absent in Messages & Profile views
 *  9.  WhatsApp-style horizontal tab swipe (home ↔ connect ↔ ranking ↔ notifs
 *       ↔ ads) with elastic bounce-back when swipe < threshold
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Users, Trophy, Bell, Send, Search,
  Heart, MessageCircle, Repeat2, Bookmark, Eye,
  MoreHorizontal, ArrowLeft, X, UserPlus, UserCheck,
  Camera, Share2, Copy, Video, Play, Flag, CornerUpLeft,
  ShieldCheck, Coins, Trash2, Sun, Moon, Monitor, ChevronRight,
  Plus, Flame, RefreshCw, Image as ImageIcon, Type as TypeIcon,
  Megaphone, CreditCard, PlayCircle, CheckCircle2, Zap, Target,
  TrendingUp, Radio, MessageSquare, Settings, Gift, Mail,
  BellRing, Type, LogOut, ChevronDown, ChevronUp,
} from "lucide-react";

import { Avatar }                                         from "./components/ui/Avatar";
import { ActionBtn }                                      from "./components/ui/ActionBtn";
import { VerifiedBadge, Tag, EmptyState, ActionBadgeBtn } from "./components/ui/Shared";
import Login                                              from "./components/ui/Login";
import { supabase }                                       from "./services/supabaseClient";
import EditProfileModal                                   from "./components/features/Profile/EditProfileModal";
import CreatePostModal, { CreatePostFAB }                 from "./components/ui/CreatePostModal";
import ConnectHubView                                     from "./components/features/Connect/ConnectHubView";
import NotificationsView                                  from "./components/features/Notifications/NotificationsView";
import Leaderboard                                        from "./components/features/leaderboard/Leaderboard";
import LeaderboardHeader                                  from "./components/features/leaderboard/LeaderboardHeader";
import MessagesView                                       from "./components/features/Messages/MessagesView";
import ProfileView                                        from "./components/features/Profile/Profile";

// ─── BRAND PALETTE ───────────────────────────────────────────────────────────
export const PURPLE        = "#7C3AED";          // primary
export const DARK_PURPLE   = "#5B21B6";          // verified badge bg
export const SKY_BLUE      = "#38BDF8";          // secondary accent
export const SKY_DIM       = "rgba(56,189,248,0.14)";
export const SKY_BORDER    = "rgba(56,189,248,0.32)";
export const PURPLE_DIM    = "rgba(124,58,237,0.14)";
export const PURPLE_BD     = "rgba(124,58,237,0.32)";
export const PURPLE_GLOW   = "rgba(124,58,237,0.50)";
export const BLACK         = "#000000";
export const OFF_BLACK     = "#000000";          // true black bg
export const CARD_BLACK    = "#0D0D1A";          // card surface
export const WHITE         = "#FFFFFF";

// legacy aliases so other files keep compiling
export const GOLD          = PURPLE;
export const GOLD_BRIGHT   = "#9B5BFA";
export const GOLD_DIM      = PURPLE_DIM;
export const GOLD_BORDER   = PURPLE_BD;
export const GOLD_GLOW     = PURPLE_GLOW;
export const BRAND_GRAD    = `linear-gradient(135deg,${DARK_PURPLE},#3B0090)`;

export const accent        = () => PURPLE;
export const accentDim     = () => PURPLE_DIM;
export const accentBorder  = () => PURPLE_BD;
export const accentGlow    = () => PURPLE_GLOW;

export const C = {
  gold:    PURPLE, goldBright: GOLD_BRIGHT, goldGlow: PURPLE_GLOW,
  silver:  "#C0C0C0", bronze: "#CD7F32",
  online:  "#22c55e", danger: "#ef4444", pink: "#ef4444",
  skyBlue: SKY_BLUE,
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
    bg:          BLACK,
    surface:     CARD_BLACK,
    cardBg:      "rgba(124,58,237,0.07)",
    cardBorder:  PURPLE_BD,
    cardShadow:  "0 4px 32px rgba(0,0,0,0.85),inset 0 1px 0 rgba(124,58,237,0.08)",
    text:        WHITE,
    muted:       "#7B6E99",
    mutedMid:    "#A089C8",
    inputBg:     "rgba(124,58,237,0.09)",
    inputBorder: "rgba(124,58,237,0.22)",
    pillBorder:  "rgba(124,58,237,0.14)",
    divider:     "rgba(124,58,237,0.12)",
    hoverBg:     "rgba(124,58,237,0.10)",
    sentBg:      DARK_PURPLE,
    sentText:    WHITE,
    recvBg:      "rgba(255,255,255,0.06)",
    recvText:    WHITE,
    coverGrad:   `linear-gradient(135deg,${BLACK},#1A0030,${BLACK})`,
    isDark:      true,
  },
  light: {
    id: "light", label: "Light Mode",
    bg:          "#F0EEFF",
    surface:     "#ffffff",
    cardBg:      "rgba(255,255,255,0.96)",
    cardBorder:  "rgba(91,33,182,0.14)",
    cardShadow:  "0 2px 12px rgba(91,33,182,0.10)",
    text:        "#0A0012",
    muted:       "#7B6E99",
    mutedMid:    "#8B7DAA",
    inputBg:     "rgba(91,33,182,0.06)",
    inputBorder: "rgba(91,33,182,0.20)",
    pillBorder:  "rgba(91,33,182,0.14)",
    divider:     "rgba(91,33,182,0.10)",
    hoverBg:     "rgba(91,33,182,0.06)",
    sentBg:      DARK_PURPLE,
    sentText:    WHITE,
    recvBg:      "rgba(0,0,0,0.05)",
    recvText:    "#0A0012",
    coverGrad:   "linear-gradient(135deg,#F0EEFF,#DDD4FF,#F0EEFF)",
    isDark:      false,
  },
};

export const glass = (T, extra = {}) => ({
  background:           T.cardBg,
  backdropFilter:       "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border:               `1px solid ${T.cardBorder}`,
  boxShadow:            T.cardShadow,
  ...extra,
});

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const FUTA_FACULTIES = ["SESE","SIMME","SLS","SOC","SPS","SAAT","SBMS","SLIT","SEMS","SET"];

const MOCK_USER = {
  id: "me", name: "Glimacy Dev", handle: "@glimacy.dev", verified: false,
  verifiedType: null,
  bio: "Building the future, one commit at a time 🚀",
  university: "Federal University of Technology, Akure (FUTA)",
  faculty: "SLIT", gender: "Male", tokens: 80,
  posts: 127, followers_count: 0, following_count: 0,
  worldRank: 47, campusRank: 12, score: 2100,
  isOnline: true, lastSeen: null,
  relationshipStatus: "Single",
  phone: "8012345678",
  email: "",
  website: "https://glimacy.com",
  hobby: "I love coding and building things",
  seed: "GD", avatarUrl: null, coverUrl: null,
};

const MOCK_PROFILES = [
  { id:"u1", name:"Chinedu Okafor",  handle:"@chinedu_dev",  seed:"CO",
    university:"Federal University of Technology, Akure (FUTA)", faculty:"SET",
    bio:"Full-stack dev & open source contributor 👨‍💻🚀", verified:true, verifiedType:"blue",
    followers_count:1100, following_count:312, posts:64, gender:"Male",
    relationshipStatus:"Single", hobby:"I love building open source tools",
    email:"chinedu@example.com", avatarUrl:null, coverUrl:null },
  { id:"u2", name:"Amina Yusuf",     handle:"@amina_tech",   seed:"AY",
    university:"University of Lagos, Akoka (UNILAG)", faculty:"Engineering",
    bio:"AI researcher. STEM advocate. Lagos techie 🤖✨", verified:true, verifiedType:"white",
    followers_count:3200, following_count:210, posts:89, gender:"Female",
    relationshipStatus:"Taken", hobby:"I love machine learning and art",
    email:"amina@example.com", avatarUrl:null, coverUrl:null },
];

const MY_VIDEO_POSTS = [
  { id:"vp1", authorId:"me", author:"Glimacy Dev", handle:"@glimacy.dev", time:"2h",
    type:"video", thumbnail:"https://picsum.photos/seed/vid1/400/300",
    caption:"Quick demo of the new campus feed feature 🔥 #FUTA #Tech #Dev",
    likes:142, likedBy:[], comments:[], reposts:17, saves:8, views:1240,
    saved:false, liked:false, reposted:false },
  { id:"vp2", authorId:"me", author:"Glimacy Dev", handle:"@glimacy.dev", time:"1d",
    type:"video", thumbnail:"https://picsum.photos/seed/vid2/400/300",
    caption:"Night coding session hits different ☕💻 who else? #NightOwl #SLIT",
    likes:309, likedBy:[], comments:[], reposts:44, saves:21, views:4780,
    saved:false, liked:false, reposted:false },
];

const INITIAL_FEED_POSTS = [
  { id:"fp1", authorId:"u1", author:"Chinedu Okafor", handle:"@chinedu_dev",
    seed:"CO", time:"3h", type:"text",
    content:"Building in public is the fastest way to level up. Ship early, iterate fast 🚀 #OpenSource",
    likes:319, comments:[], reposts:44, saves:12, views:2100,
    liked:false, saved:false, reposted:false },
  { id:"fp2", authorId:"u2", author:"Amina Yusuf", handle:"@amina_tech",
    seed:"AY", time:"5h", type:"text",
    content:"AI is not replacing you. A human using AI is. Stay ahead, keep learning 🤖✨ #UNILAG #Tech",
    likes:512, comments:[], reposts:88, saves:34, views:4100,
    liked:false, saved:false, reposted:false },
];

const MOCK_NOTIFICATIONS = [
  { id:"n1", type:"like",    user:{ name:"Chinedu Okafor", id:"u1", avatar:null }, timestamp:"10m ago" },
  { id:"n2", type:"comment", user:{ name:"Amina Yusuf", id:"u2", avatar:null }, previewText:"This campus feed feature is exactly what FUTA needed! 🔥", timestamp:"1h ago" },
  { id:"n3", type:"follow",  user:{ name:"New Fresher", id:"u3", avatar:null }, timestamp:"3h ago" },
];

// tabs that appear in the bottom nav
const BOTTOM_NAV = [
  { id:"home",    Icon:Home,      label:"Home"   },
  { id:"connect", Icon:Users,     label:"Connect"},
  { id:"ranking", Icon:Trophy,    label:"Ranking"},
  { id:"notifs",  Icon:Bell,      label:"Notifs" },
  { id:"ads",     Icon:Megaphone, label:"Ads"    },
];
// ordered list used for horizontal swipe
const TAB_ORDER = BOTTOM_NAV.map(t => t.id);

const AD_TIERS = [
  { people:100,   days:1,  price:499,   label:"Starter",  starterOnly:true },
  { people:250,   days:3,  price:999,   label:"Basic"    },
  { people:500,   days:5,  price:1999,  label:"Standard" },
  { people:1000,  days:7,  price:3999,  label:"Pro"      },
  { people:2500,  days:14, price:9999,  label:"Growth"   },
  { people:5000,  days:21, price:24999, label:"Premium"  },
  { people:10000, days:30, price:49999, label:"Elite"    },
];

const tokenCost = (naira) => Math.ceil(naira / 2);

const LS_KEYS = {
  myStatuses:      "glimacy_my_status_items_v3",
  seenStatusItems: "glimacy_seen_status_items_v3",
  savedArchive:    "glimacy_saved_posts_v3",
  likedIds:        "glimacy_liked_post_ids_v3",
  feedPosts:       "glimacy_feed_posts_v3",
  videoPosts:      "glimacy_video_posts_v3",
  userScore:       "glimacy_user_score_v3",
  statusLikes:     "glimacy_status_likes_v3",
  statusViews:     "glimacy_status_views_v3",
  themeMode:       "glimacy_theme_mode_v3",
  fontSize:        "glimacy_font_size_v3",
};

const POINT_ACTIONS = {
  LIKE_POST:     3,
  COMMENT:       5,
  REPOST:        4,
  POST_CREATED:  10,
  VIEW_STATUS:   1,
  FOLLOW:        2,
  LIKE_STATUS:   2,
  RECEIVED_LIKE: 2,
};

const loadLS  = (key, fallback) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } };
const saveLS  = (key, value)    => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

let _uidN = 0;
const uid = (prefix = "id") => `${prefix}_${Date.now()}_${_uidN++}`;

const STATUS_TTL_MS     = 24 * 60 * 60 * 1000;
const STATUS_BG_PRESETS = [
  `linear-gradient(135deg,${DARK_PURPLE},#3B0090)`,
  "linear-gradient(135deg,#000000,#1A0030)",
  "linear-gradient(135deg,#1A0030,#4C1D95)",
  "linear-gradient(135deg,#000000,#2D0050)",
  `linear-gradient(135deg,${DARK_PURPLE},${PURPLE})`,
  "linear-gradient(135deg,#1E0040,#6D28D9)",
];
const STATUS_SAMPLE_LINES = [
  "Campus life hits different today 🌞",
  "Grinding through assignments 📚🔥",
  "Big things coming soon... stay tuned 👀",
  "FUTA till I die 🟢⚪",
  "Coffee + Code = ❤️",
];

const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── VERIFIED BADGE  (dark-purple for blue, white circle for white) ───────────
export const GlimacyBadge = ({ type = "blue", size = 15 }) => {
  const isWhite = type === "white";
  return (
    <div
      title={isWhite ? "White Verified — Campus Elite" : "Blue Verified — Premium/Pro"}
      style={{
        width:size, height:size, borderRadius:"50%", flexShrink:0,
        background: isWhite
          ? "linear-gradient(135deg,#ffffff,#ddd)"
          : `linear-gradient(135deg,${DARK_PURPLE},#2D0060)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:size*0.55, color:isWhite?"#333":"#fff", fontWeight:900,
        boxShadow: isWhite
          ? "0 0 7px rgba(255,255,255,0.55)"
          : `0 0 8px ${DARK_PURPLE}99`,
      }}
    >✓</div>
  );
};

// ─── VERIFY MODAL ─────────────────────────────────────────────────────────────
const VerifyModal = ({ T, tokens, user, onClose, onVerified, onEarnedTokens }) => {
  const [tab,           setTab]           = useState("blue");
  const [step,          setStep]          = useState("options");
  const [adCount,       setAdCount]       = useState(0);
  const [watchProgress, setWatchProgress] = useState(0);
  const timerRef = useRef(null);

  const userPostCount     = user?.posts || 0;
  const verifiedFollowers = 0;
  const canWhite          = verifiedFollowers >= TOKEN_ECONOMY.whiteMinFollowers && userPostCount >= TOKEN_ECONOMY.whiteMinPosts;
  const canWhiteTokens    = tokens >= TOKEN_ECONOMY.whiteTokenCost && canWhite;
  const canBlueTokens     = tokens >= TOKEN_ECONOMY.tokensToVerify;

  const watchAd = () => {
    setStep("watchingAd"); setWatchProgress(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 2; setWatchProgress(p);
      if (p >= 100) { clearInterval(timerRef.current); setAdCount(c=>c+1); onEarnedTokens(TOKEN_ECONOMY.tokensPerAd); setStep("watchAd"); }
    }, 60);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",justifyContent:"center",alignItems:"center",background:"rgba(0,0,0,0.90)",backdropFilter:"blur(12px)",padding:16 }}>
      <div style={{ background:T.isDark?CARD_BLACK:"#fff",border:`1px solid ${PURPLE_BD}`,boxShadow:`0 0 60px ${PURPLE_GLOW}`,width:330,borderRadius:24,padding:28,position:"relative",textAlign:"center" }}>
        <button onClick={onClose} style={{ position:"absolute",top:14,right:14,background:"none",border:"none",color:T.muted,cursor:"pointer" }}><X size={18}/></button>

        {step==="options" && (
          <>
            <div style={{ display:"flex",gap:8,marginBottom:18 }}>
              {["blue","white"].map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:"9px 0",borderRadius:12,border:`2px solid ${tab===t?DARK_PURPLE:T.inputBorder}`,background:tab===t?PURPLE_DIM:"transparent",color:tab===t?WHITE:T.muted,fontWeight:700,fontSize:13,cursor:"pointer" }}>
                  <GlimacyBadge type={t} size={13}/>&nbsp;{t==="blue"?"Blue Verified":"White Verified"}
                </button>
              ))}
            </div>
            {tab==="blue"&&(
              <>
                <div style={{ fontSize:36,marginBottom:8 }}>🔵</div>
                <h3 style={{ margin:"0 0 4px",fontSize:17,fontWeight:800,color:DARK_PURPLE }}>Blue Verified</h3>
                <p style={{ margin:"0 0 16px",fontSize:12,color:T.muted }}>Premium / Pro — use 500 tokens or pay ₦500</p>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {canBlueTokens?(
                    <button onClick={()=>{onVerified("blue_tokens");onClose();}} style={{ padding:13,borderRadius:12,border:"none",background:DARK_PURPLE,color:WHITE,fontWeight:800,fontSize:13,cursor:"pointer" }}>🪙 Use 500 Tokens</button>
                  ):(
                    <button onClick={()=>setStep("watchAd")} style={{ padding:13,borderRadius:12,border:`1.5px solid ${PURPLE_BD}`,background:PURPLE_DIM,color:PURPLE,fontWeight:700,fontSize:13,cursor:"pointer" }}>📺 Earn Tokens (need {TOKEN_ECONOMY.tokensToVerify-tokens} more)</button>
                  )}
                  <button onClick={()=>setStep("cardPay")} style={{ padding:13,borderRadius:12,border:"none",background:DARK_PURPLE,color:WHITE,fontWeight:800,fontSize:13,cursor:"pointer" }}>💳 Pay ₦{TOKEN_ECONOMY.cardVerifyPrice.toLocaleString()}</button>
                </div>
              </>
            )}
            {tab==="white"&&(
              <>
                <div style={{ fontSize:36,marginBottom:8 }}>⚪</div>
                <h3 style={{ margin:"0 0 4px",fontSize:17,fontWeight:800,color:WHITE }}>White Verified</h3>
                <p style={{ margin:"0 0 8px",fontSize:12,color:T.muted }}>Campus Elite — requirements:</p>
                <div style={{ background:PURPLE_DIM,border:`1px solid ${PURPLE_BD}`,borderRadius:12,padding:"10px 14px",marginBottom:14,textAlign:"left" }}>
                  {[["At least 20 verified followers",verifiedFollowers>=20],["At least 50 posts made",userPostCount>=50],["Pay ₦2,500 OR 10,000 tokens",true]].map(([label,met])=>(
                    <div key={label} style={{ display:"flex",alignItems:"center",gap:8,fontSize:12,color:met?"#22c55e":T.muted,padding:"3px 0" }}><span>{met?"✅":"❌"}</span>{label}</div>
                  ))}
                </div>
                {!canWhite&&<p style={{ fontSize:11,color:"#ef4444",marginBottom:12 }}>Requirements not met yet — keep posting and building followers!</p>}
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  <button disabled={!canWhiteTokens} onClick={()=>canWhiteTokens&&(onVerified("white_tokens"),onClose())} style={{ padding:13,borderRadius:12,border:"none",background:canWhiteTokens?DARK_PURPLE:T.inputBg,color:canWhiteTokens?WHITE:T.muted,fontWeight:800,fontSize:13,cursor:canWhiteTokens?"pointer":"default" }}>🪙 Use 10,000 Tokens</button>
                  <button disabled={!canWhite} onClick={()=>canWhite&&setStep("cardPayWhite")} style={{ padding:13,borderRadius:12,border:"none",background:canWhite?DARK_PURPLE:T.inputBg,color:canWhite?WHITE:T.muted,fontWeight:800,fontSize:13,cursor:canWhite?"pointer":"default" }}>💳 Pay ₦2,500</button>
                </div>
              </>
            )}
          </>
        )}

        {(step==="watchAd"||step==="watchingAd")&&(
          <>
            <div style={{ fontSize:44,marginBottom:10 }}>📺</div>
            <h3 style={{ margin:"0 0 6px",fontSize:17,fontWeight:800,color:DARK_PURPLE }}>{step==="watchingAd"?"Ad Playing…":"Earn Tokens"}</h3>
            {step==="watchingAd"?(
              <>
                <div style={{ height:9,borderRadius:99,background:T.divider,overflow:"hidden",margin:"14px 0 10px" }}><div style={{ height:"100%",width:`${watchProgress}%`,background:DARK_PURPLE,borderRadius:99,transition:"width 0.06s linear" }}/></div>
                <p style={{ fontSize:12,color:T.muted }}>{watchProgress}%</p>
              </>
            ):(
              <>
                <p style={{ fontSize:12,color:T.muted,marginBottom:14 }}>You have <strong style={{ color:DARK_PURPLE }}>{tokens}</strong> tokens. Ads watched: {adCount}</p>
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  <button onClick={watchAd} style={{ padding:13,borderRadius:12,border:"none",background:DARK_PURPLE,color:WHITE,fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}><PlayCircle size={17}/>Watch Ad (+{TOKEN_ECONOMY.tokensPerAd} tokens)</button>
                  <button onClick={()=>setStep("options")} style={{ padding:11,borderRadius:12,border:`1px solid ${T.inputBorder}`,background:"transparent",color:T.muted,fontWeight:600,fontSize:12,cursor:"pointer" }}>← Back</button>
                </div>
              </>
            )}
          </>
        )}

        {(step==="cardPay"||step==="cardPayWhite")&&(()=>{
          const isWP   = step==="cardPayWhite";
          const price  = isWP?TOKEN_ECONOMY.whiteNairaCost:TOKEN_ECONOMY.cardVerifyPrice;
          return(
            <>
              <div style={{ fontSize:40,marginBottom:8 }}>💳</div>
              <h3 style={{ margin:"0 0 4px",fontSize:17,fontWeight:800,color:DARK_PURPLE }}>Pay ₦{price.toLocaleString()}</h3>
              <p style={{ fontSize:12,color:T.muted,marginBottom:14 }}>One-time payment for {isWP?"White":"Blue"} Verified</p>
              <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:14 }}>
                {[["Card Number","•••• •••• •••• 0000"],["Expiry","MM / YY"],["CVV","•••"]].map(([lbl,ph])=>(
                  <div key={lbl} style={{ textAlign:"left" }}>
                    <div style={{ fontSize:11,color:T.muted,marginBottom:4 }}>{lbl}</div>
                    <input placeholder={ph} style={{ width:"100%",padding:"9px 12px",borderRadius:9,background:T.inputBg,border:`1px solid ${PURPLE_BD}`,color:T.text,outline:"none",fontSize:13 }}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <button onClick={()=>{onVerified(isWP?"white_card":"blue_card");onClose();}} style={{ padding:13,borderRadius:12,border:"none",background:DARK_PURPLE,color:WHITE,fontWeight:800,fontSize:13,cursor:"pointer" }}>Pay ₦{price.toLocaleString()} Now</button>
                <button onClick={()=>setStep("options")} style={{ padding:11,borderRadius:12,border:`1px solid ${T.inputBorder}`,background:"transparent",color:T.muted,fontWeight:600,fontSize:12,cursor:"pointer" }}>← Back</button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

// ─── HOME ACTION BANNER ───────────────────────────────────────────────────────
export const ActionBannerBtns = ({ T, user, tokens, onVerifyClick, onEarnClick }) => (
  <div style={{ display:"flex",gap:8 }}>
    {!user?.verified&&(
      <button onClick={onVerifyClick} style={{ flex:1,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${DARK_PURPLE}55`,background:PURPLE_DIM,color:DARK_PURPLE,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
        <ShieldCheck size={15}/>Get Verified
      </button>
    )}
    <button onClick={onEarnClick} style={{ flex:1,padding:"10px 12px",borderRadius:12,border:"none",background:DARK_PURPLE,color:WHITE,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
      <Coins size={15}/>🪙 {tokens} Tokens
    </button>
  </div>
);

// ─── SEASON REWARDS ───────────────────────────────────────────────────────────
const SeasonRewards = ({ T }) => {
  const prizes = [
    { place:"🥇 1st Place", prize:"₦50,000 Cash + Gold Badge",   color:"#FFD700" },
    { place:"🥈 2nd Place", prize:"₦25,000 Cash + Silver Badge", color:"#C0C0C0" },
    { place:"🥉 3rd Place", prize:"₦10,000 Cash + Bronze Badge", color:"#CD7F32" },
  ];
  return(
    <div style={{ ...glass(T,{borderRadius:16}),padding:"16px",border:`1px solid ${PURPLE_BD}`,marginBottom:2 }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
        <Gift size={18} color={DARK_PURPLE}/>
        <div style={{ fontWeight:800,fontSize:15,color:T.text }}>Season 1 Rewards</div>
        <div style={{ marginLeft:"auto",background:PURPLE_DIM,border:`1px solid ${PURPLE_BD}`,borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,color:DARK_PURPLE }}>Coming Soon</div>
      </div>
      <p style={{ margin:"0 0 12px",fontSize:12,color:T.muted }}>Top ranked players at season end receive real cash prizes.</p>
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {prizes.map(p=>(
          <div key={p.place} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.3)",border:`1px solid ${PURPLE_BD}`,borderRadius:12,padding:"10px 14px" }}>
            <span style={{ fontWeight:700,fontSize:13,color:T.text }}>{p.place}</span>
            <span style={{ fontSize:12,fontWeight:600,color:p.color }}>{p.prize}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12,background:"rgba(0,0,0,0.4)",border:`1px dashed ${PURPLE_BD}`,borderRadius:10,padding:"10px 14px",textAlign:"center" }}>
        <p style={{ margin:0,fontSize:11,color:T.muted }}>🔒 Rewards unlock when Season 1 ends. Keep ranking up!</p>
      </div>
    </div>
  );
};

// ─── AD BOOST VIEW ────────────────────────────────────────────────────────────
const AdBoostView = ({ T, user, tokens, onSpendTokens, onEarnClick }) => {
  const [selectedTier,  setSelectedTier]  = useState(null);
  const [gender,        setGender]        = useState("Both");
  const [payMethod,     setPayMethod]     = useState("card");
  const [step,          setStep]          = useState("build");
  const [adWatchStep,   setAdWatchStep]   = useState(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [adsWatched,    setAdsWatched]    = useState(0);
  const timerRef = useRef(null);

  const tier           = AD_TIERS[selectedTier];
  const tCost          = tier ? tokenCost(tier.price) : 0;
  const canAffordTokens= tier && tokens >= tCost;
  const formatNaira    = (n) => `₦${n.toLocaleString()}`;

  const watchAd = () => {
    setAdWatchStep("watching"); setWatchProgress(0);
    let p = 0;
    timerRef.current = setInterval(()=>{ p+=2; setWatchProgress(p); if(p>=100){clearInterval(timerRef.current);setAdsWatched(c=>c+1);onSpendTokens(-TOKEN_ECONOMY.tokensPerAd);setAdWatchStep("watch");} }, 60);
  };
  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  if(adWatchStep==="watch"||adWatchStep==="watching"){
    return(
      <div style={{ padding:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}>
          <ArrowLeft size={20} color={T.text} style={{ cursor:"pointer" }} onClick={()=>setAdWatchStep(null)}/>
          <h2 style={{ margin:0,fontSize:17,fontWeight:700,color:T.text }}>Earn Tokens</h2>
        </div>
        <div style={{ ...glass(T,{borderRadius:18}),padding:24,textAlign:"center" }}>
          <div style={{ fontSize:44,marginBottom:10 }}>📺</div>
          <div style={{ fontSize:16,fontWeight:700,color:DARK_PURPLE,marginBottom:4 }}>{adWatchStep==="watching"?"Ad Playing…":"Watch Ads, Earn Tokens"}</div>
          {adWatchStep==="watching"?(
            <>
              <div style={{ height:9,borderRadius:99,background:T.divider,overflow:"hidden",margin:"18px 0 10px" }}><div style={{ height:"100%",width:`${watchProgress}%`,background:DARK_PURPLE,borderRadius:99,transition:"width 0.06s linear" }}/></div>
              <p style={{ fontSize:12,color:T.muted }}>{watchProgress}%</p>
            </>
          ):(
            <>
              <p style={{ fontSize:13,color:T.muted,margin:"0 0 16px" }}>🪙 <strong style={{ color:DARK_PURPLE }}>{tokens} tokens</strong> · Ads watched: {adsWatched}</p>
              <button onClick={watchAd} style={{ width:"100%",padding:14,borderRadius:13,border:"none",background:DARK_PURPLE,color:WHITE,fontWeight:800,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}><PlayCircle size={18}/>Watch Ad (+{TOKEN_ECONOMY.tokensPerAd} tokens)</button>
            </>
          )}
        </div>
      </div>
    );
  }

  if(step==="success"){
    return(
      <div style={{ padding:16,textAlign:"center" }}>
        <div style={{ ...glass(T,{borderRadius:18}),padding:36,marginTop:20 }}>
          <div style={{ fontSize:60,marginBottom:16 }}>🎉</div>
          <h2 style={{ margin:"0 0 8px",color:DARK_PURPLE,fontSize:22,fontWeight:900 }}>Boost Live!</h2>
          <p style={{ margin:"0 0 20px",fontSize:14,color:T.muted }}>Your post is now shown to <strong style={{ color:T.text }}>{tier?.people?.toLocaleString()} people</strong> for <strong style={{ color:T.text }}>{tier?.days} day{tier?.days>1?"s":""}</strong>.</p>
          <button onClick={()=>{setStep("build");setSelectedTier(null);}} style={{ padding:"12px 24px",borderRadius:13,border:"none",background:DARK_PURPLE,color:WHITE,fontWeight:700,fontSize:14,cursor:"pointer" }}>Boost Another Post</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{ padding:"0 0 80px" }}>
      <div style={{ padding:"16px 16px 14px",borderBottom:`1px solid ${T.divider}`,background:T.isDark?"rgba(0,0,0,0.96)":"rgba(255,255,255,0.96)",backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}><Megaphone size={20} color={DARK_PURPLE}/><h2 style={{ margin:0,fontSize:18,fontWeight:800,color:T.text }}>Boost Your Post</h2></div>
        <p style={{ margin:0,fontSize:12,color:T.muted }}>Reach more people — card or tokens</p>
      </div>
      <div style={{ padding:16,display:"flex",flexDirection:"column",gap:14 }}>
        <div onClick={()=>setAdWatchStep("watch")} style={{ background:PURPLE_DIM,border:`1px solid ${PURPLE_BD}`,borderRadius:14,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ fontSize:28 }}>📺</div>
          <div style={{ flex:1 }}><div style={{ fontWeight:700,fontSize:13,color:DARK_PURPLE }}>Earn Tokens by Watching Ads</div><div style={{ fontSize:11,color:T.muted }}>1 ad = {TOKEN_ECONOMY.tokensPerAd} tokens · You have 🪙{tokens}</div></div>
          <ChevronRight size={16} color={DARK_PURPLE}/>
        </div>
        <div style={{ ...glass(T,{borderRadius:14}),padding:16 }}>
          <div style={{ fontWeight:700,fontSize:13,color:T.text,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}><Target size={14} color={DARK_PURPLE}/>Target Audience</div>
          <div style={{ display:"flex",gap:8 }}>
            {["Male","Female","Both"].map(g=>(
              <button key={g} onClick={()=>setGender(g)} style={{ flex:1,padding:"9px 0",borderRadius:10,border:"none",background:gender===g?DARK_PURPLE:T.inputBg,color:gender===g?WHITE:T.muted,fontWeight:gender===g?700:500,fontSize:13,cursor:"pointer" }}>
                {g==="Male"?"👨 Male":g==="Female"?"👩 Female":"👥 Both"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontWeight:700,fontSize:13,color:T.text,marginBottom:10,display:"flex",alignItems:"center",gap:6 }}><TrendingUp size={14} color={DARK_PURPLE}/>Choose a Plan</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {AD_TIERS.map((t,i)=>{
              const sel=selectedTier===i;
              return(
                <div key={i} onClick={()=>setSelectedTier(i)} style={{ ...glass(T,{borderRadius:14}),padding:"12px 14px",cursor:"pointer",border:`1.5px solid ${sel?DARK_PURPLE:T.cardBorder}`,background:sel?PURPLE_DIM:T.cardBg }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div><span style={{ fontWeight:700,fontSize:14,color:sel?DARK_PURPLE:T.text }}>{t.label}</span>{t.starterOnly&&<span style={{ fontSize:10,color:T.muted,marginLeft:6 }}>(1-day only)</span>}</div>
                    <div style={{ textAlign:"right" }}><div style={{ fontWeight:800,fontSize:15,color:sel?DARK_PURPLE:T.text }}>{formatNaira(t.price)}</div><div style={{ fontSize:10,color:T.muted }}>{tokenCost(t.price).toLocaleString()} tokens</div></div>
                  </div>
                  <div style={{ fontSize:11,color:T.muted,marginTop:4 }}>{t.people.toLocaleString()} people · {t.days} day{t.days>1?"s":""}</div>
                </div>
              );
            })}
          </div>
        </div>
        {selectedTier!==null&&(
          <>
            <div style={{ ...glass(T,{borderRadius:14}),padding:16 }}>
              <div style={{ fontWeight:700,fontSize:13,color:T.text,marginBottom:12 }}>💳 Payment Method</div>
              <div style={{ display:"flex",gap:8 }}>
                {["card","tokens"].map(m=>(
                  <button key={m} onClick={()=>setPayMethod(m)} style={{ flex:1,padding:"10px 0",borderRadius:10,border:`1.5px solid ${payMethod===m?DARK_PURPLE:T.inputBorder}`,background:payMethod===m?PURPLE_DIM:"transparent",color:payMethod===m?DARK_PURPLE:T.muted,fontWeight:700,fontSize:13,cursor:"pointer" }}>
                    {m==="card"?"💳 Card":"🪙 Tokens"}
                  </button>
                ))}
              </div>
              {payMethod==="tokens"&&!canAffordTokens&&<p style={{ fontSize:11,color:"#ef4444",margin:"8px 0 0" }}>You need {tCost.toLocaleString()} tokens but have {tokens}. Watch ads to earn more!</p>}
            </div>
            <button disabled={payMethod==="tokens"&&!canAffordTokens} onClick={()=>{if(payMethod==="tokens"&&!canAffordTokens)return;setStep("success");if(payMethod==="tokens")onSpendTokens(tCost);}} style={{ width:"100%",padding:14,borderRadius:13,border:"none",background:(payMethod==="tokens"&&!canAffordTokens)?T.inputBg:DARK_PURPLE,color:(payMethod==="tokens"&&!canAffordTokens)?T.muted:WHITE,fontWeight:800,fontSize:15,cursor:(payMethod==="tokens"&&!canAffordTokens)?"default":"pointer" }}>
              Boost for {formatNaira(tier?.price||0)}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── STORY RING + BAR  (world/campus pill is smaller — adjustment #1) ─────────
const StoryRing = ({ T, entry, seenIds, onAvatarClick, onAddClick }) => {
  const hasItems = (entry.items||[]).length > 0;
  const isActive = hasItems && (entry.items||[]).some(it=>!seenIds.has(it.id));
  const ringGrad = entry.isMe
    ? (hasItems?DARK_PURPLE:T.divider)
    : (isActive?DARK_PURPLE:T.divider);
  return(
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5,flexShrink:0,width:64 }}>
      <div onClick={()=>{if(hasItems)onAvatarClick();else if(entry.isMe)onAddClick();}} style={{ position:"relative",width:60,height:60,borderRadius:"50%",padding:2.5,background:ringGrad,cursor:(hasItems||entry.isMe)?"pointer":"default",animation:isActive?"storyPulse 2.4s ease-in-out infinite":"none" }}>
        <div style={{ width:"100%",height:"100%",borderRadius:"50%",background:T.bg,padding:2 }}>
          <div style={{ width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",background:entry.avatarUrl?"transparent":`linear-gradient(135deg,${DARK_PURPLE}99,${DARK_PURPLE})`,display:"flex",alignItems:"center",justifyContent:"center",color:WHITE,fontWeight:700,fontSize:18 }}>
            {entry.avatarUrl?<img src={entry.avatarUrl} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:(entry.seed||entry.name||"U")[0]?.toUpperCase()}
          </div>
        </div>
        {entry.trending&&<div style={{ position:"absolute",top:-2,right:-2,width:19,height:19,borderRadius:"50%",background:"#FF6B35",display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${T.bg}` }}><Flame size={10} color="#fff" fill="#fff"/></div>}
        {entry.isMe&&<div onClick={e=>{e.stopPropagation();onAddClick();}} style={{ position:"absolute",bottom:-2,right:-2,width:20,height:20,borderRadius:"50%",background:DARK_PURPLE,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${T.bg}`,cursor:"pointer" }}><Plus size={12} color={WHITE} strokeWidth={3}/></div>}
      </div>
      {/* ADJUSTMENT #1: world/campus label pill is smaller */}
      <span style={{ fontSize:10,color:T.muted,maxWidth:62,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
        {entry.isMe?"Your Story":entry.name}
      </span>
    </div>
  );
};
const StoryBar = ({ T, statusFeed, seenIds, onAvatarClick, onAddClick }) => (
  <div style={{ display:"flex",gap:14,overflowX:"auto",padding:"2px 2px 10px" }}>
    {statusFeed.map((entry,idx)=>(
      <StoryRing key={entry.userId} T={T} entry={entry} seenIds={seenIds} onAvatarClick={()=>onAvatarClick(idx)} onAddClick={onAddClick}/>
    ))}
  </div>
);

// ─── STORY VIEWER ─────────────────────────────────────────────────────────────
const STORY_ITEM_MS = 5000;
const StoryViewerModal = ({ T, statusFeed, startIndex, seenIds, setSeenIds, onDeleteMyItem, onClose, statusLikes, setStatusLikes, statusViews, setStatusViews, currentUser:viewer, onPoints }) => {
  const [userIdx,setUserIdx]=useState(startIndex);
  const [itemIdx,setItemIdx]=useState(0);
  const [paused,setPaused]=useState(false);
  const [progress,setProgress]=useState(0);
  const [showInteractions,setShowInteractions]=useState(false);
  const startRef=useRef(null);
  const currentUser=statusFeed[userIdx];
  const currentItem=currentUser?.items?.[itemIdx];
  const viewerName=viewer?.name||"You";
  const storyLikers=(statusLikes&&currentItem)?statusLikes[currentItem.id]||[]:[];
  const storyViewers=(statusViews&&currentItem)?statusViews[currentItem.id]||[]:[];
  const iLikedThis=storyLikers.includes(viewerName);
  const toggleStoryLike=()=>{
    if(!currentItem||!setStatusLikes)return;
    setStatusLikes(prev=>{const cur=prev[currentItem.id]||[];const next=cur.includes(viewerName)?cur.filter(n=>n!==viewerName):[...cur,viewerName];return{...prev,[currentItem.id]:next};});
    if(!iLikedThis&&onPoints)onPoints("LIKE_STATUS");
  };
  useEffect(()=>{
    setProgress(0);startRef.current=null;if(!currentItem)return;
    setSeenIds(p=>new Set([...p,currentItem.id]));
    if(setStatusViews&&viewerName){setStatusViews(prev=>{const cur=prev[currentItem.id]||[];if(cur.includes(viewerName))return prev;if(onPoints)onPoints("VIEW_STATUS");return{...prev,[currentItem.id]:[...cur,viewerName]};});}
  },[userIdx,itemIdx]);
  useEffect(()=>{
    if(!currentItem||paused)return;
    let handle;
    const raf=()=>{const now=Date.now();if(!startRef.current)startRef.current=now;const elapsed=now-startRef.current;const pct=Math.min(100,(elapsed/STORY_ITEM_MS)*100);setProgress(pct);if(pct<100)handle=requestAnimationFrame(raf);else advance();};
    handle=requestAnimationFrame(raf);return()=>cancelAnimationFrame(handle);
  },[currentItem,paused,userIdx,itemIdx]);
  const advance=()=>{if(itemIdx<(currentUser?.items?.length||0)-1){setItemIdx(i=>i+1);}else if(userIdx<statusFeed.length-1){setUserIdx(i=>i+1);setItemIdx(0);}else onClose();};
  const retreat=()=>{if(itemIdx>0)setItemIdx(i=>i-1);else if(userIdx>0){setUserIdx(i=>i-1);setItemIdx(0);}};
  if(!currentUser||!currentItem)return null;
  const bg=currentItem.type==="photo"?"#000":currentItem.bg||STATUS_BG_PRESETS[0];
  return(
    <div style={{ position:"fixed",inset:0,zIndex:300,background:"#000",display:"flex",flexDirection:"column" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"12px 12px 8px",display:"flex",gap:4 }}>
        {currentUser.items.map((_,i)=>(
          <div key={i} style={{ flex:1,height:2.5,borderRadius:99,background:"rgba(255,255,255,0.3)",overflow:"hidden" }}>
            <div style={{ height:"100%",background:"#fff",width:`${i<itemIdx?100:i===itemIdx?progress:0}%`,transition:"width 0.1s linear" }}/>
          </div>
        ))}
      </div>
      <div style={{ position:"absolute",top:28,left:0,right:0,zIndex:10,display:"flex",alignItems:"center",padding:"0 14px",gap:10 }}>
        <div style={{ width:34,height:34,borderRadius:"50%",overflow:"hidden",background:`linear-gradient(135deg,${DARK_PURPLE}99,${DARK_PURPLE})`,display:"flex",alignItems:"center",justifyContent:"center",color:WHITE,fontWeight:700 }}>
          {currentUser.avatarUrl?<img src={currentUser.avatarUrl} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:(currentUser.seed||currentUser.name||"U")[0]}
        </div>
        <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>{currentUser.name}</div><div style={{ fontSize:10,color:"rgba(255,255,255,0.7)" }}>{timeAgo(currentItem.createdAt)}</div></div>
        <X size={22} color="#fff" style={{ cursor:"pointer" }} onClick={onClose}/>
        {currentUser.isMe&&<Trash2 size={18} color="rgba(255,255,255,0.7)" style={{ cursor:"pointer" }} onClick={()=>{onDeleteMyItem(currentItem.id);advance();}}/>}
        <Eye size={18} color="rgba(255,255,255,0.7)" style={{ cursor:"pointer" }} onClick={e=>{e.stopPropagation();setShowInteractions(v=>!v);}}/>
      </div>
      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:bg,position:"relative" }} onPointerDown={()=>setPaused(true)} onPointerUp={()=>setPaused(false)}>
        {currentItem.type==="photo"&&currentItem.imageData&&<img src={currentItem.imageData} alt="" style={{ maxWidth:"100%",maxHeight:"100%",objectFit:"contain" }}/>}
        {currentItem.type==="text"&&<div style={{ fontSize:22,fontWeight:800,color:"#fff",textAlign:"center",padding:24,lineHeight:1.35 }}>{currentItem.content}</div>}
        {currentItem.caption&&currentItem.type==="photo"&&<div style={{ position:"absolute",bottom:20,left:16,right:16,background:"rgba(0,0,0,0.5)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#fff" }}>{currentItem.caption}</div>}
        <div style={{ position:"absolute",left:0,top:0,bottom:0,width:"40%",cursor:"pointer" }} onClick={retreat}/>
        <div style={{ position:"absolute",right:0,top:0,bottom:0,width:"40%",cursor:"pointer" }} onClick={advance}/>
        <div onClick={e=>{e.stopPropagation();toggleStoryLike();}} style={{ position:"absolute",bottom:24,right:18,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",zIndex:5 }}>
          <div style={{ width:44,height:44,borderRadius:"50%",background:iLikedThis?`${DARK_PURPLE}44`:"rgba(0,0,0,0.4)",border:`2px solid ${iLikedThis?DARK_PURPLE:"rgba(255,255,255,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Heart size={20} color={iLikedThis?DARK_PURPLE:"#fff"} fill={iLikedThis?DARK_PURPLE:"none"}/>
          </div>
          <span style={{ fontSize:11,color:"#fff",fontWeight:700 }}>{storyLikers.length>0?storyLikers.length:""}</span>
        </div>
        {showInteractions&&(
          <div onClick={e=>e.stopPropagation()} style={{ position:"absolute",bottom:0,left:0,right:0,background:"rgba(10,0,18,0.92)",borderTop:`1px solid ${PURPLE_BD}`,padding:"14px 16px 24px",animation:"modalSlideUp 0.25s ease",zIndex:5,maxHeight:220,overflowY:"auto" }}>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {storyViewers.length===0&&<div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",textAlign:"center" }}>No views yet</div>}
              {storyViewers.map((name,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:DARK_PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700 }}>{name[0]?.toUpperCase()}</div>
                  <div style={{ flex:1 }}><div style={{ fontSize:13,color:"#fff",fontWeight:600 }}>{name}</div>{storyLikers.includes(name)&&<div style={{ fontSize:10,color:DARK_PURPLE }}>❤️ Liked this</div>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── STATUS COMPOSER ──────────────────────────────────────────────────────────
const StatusComposerModal = ({ T, onClose, onSubmit }) => {
  const [mode,setMode]=useState("text");
  const [text,setText]=useState("");
  const [bgIndex,setBgIndex]=useState(0);
  const [imageData,setImageData]=useState(null);
  const fileInputRef=useRef(null);
  const handleFile=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setImageData(ev.target?.result||null);r.readAsDataURL(f);};
  const canSubmit=mode==="text"?text.trim().length>0:!!imageData;
  const submit=()=>{if(!canSubmit)return;onSubmit(mode==="text"?{type:"text",content:text,bg:STATUS_BG_PRESETS[bgIndex]}:{type:"photo",imageData,caption:text});};
  return(
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",display:"flex",flexDirection:"column",justifyContent:"flex-end" }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:mode==="text"?STATUS_BG_PRESETS[bgIndex]:T.isDark?CARD_BLACK:"#fff",borderRadius:"20px 20px 0 0",padding:18,minHeight:360,display:"flex",flexDirection:"column",animation:"modalSlideUp 0.3s ease" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <div style={{ display:"flex",gap:8 }}>
            {[{id:"text",label:"Text",Icon:TypeIcon},{id:"photo",label:"Photo",Icon:ImageIcon}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{ padding:"6px 14px",borderRadius:20,border:"none",fontSize:12.5,fontWeight:700,cursor:"pointer",background:mode===m.id?"rgba(255,255,255,0.25)":"transparent",color:mode===m.id?"#fff":T.isDark?"#fff":"#222" }}>
                <m.Icon size={13} style={{ verticalAlign:"-2px",marginRight:4 }}/>{m.label}
              </button>
            ))}
          </div>
          <X size={22} color={mode==="text"?"#fff":T.text} style={{ cursor:"pointer" }} onClick={onClose}/>
        </div>
        {mode==="text"?(
          <>
            <textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="What's on your mind?" style={{ flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:22,fontWeight:700,textAlign:"center",resize:"none",lineHeight:1.4,padding:"30px 6px" }}/>
            <div style={{ display:"flex",gap:8,justifyContent:"center",marginTop:10 }}>
              {STATUS_BG_PRESETS.map((bg,i)=>(
                <div key={i} onClick={()=>setBgIndex(i)} style={{ width:28,height:28,borderRadius:"50%",background:bg,cursor:"pointer",border:bgIndex===i?"2.5px solid #fff":"2px solid rgba(255,255,255,0.4)",transform:bgIndex===i?"scale(1.1)":"scale(1)" }}/>
              ))}
            </div>
          </>
        ):(
          <div style={{ flex:1,display:"flex",flexDirection:"column",gap:12 }}>
            {imageData?(<div style={{ position:"relative",borderRadius:14,overflow:"hidden",flex:1 }}>
              <img src={imageData} alt="" style={{ width:"100%",height:220,objectFit:"cover" }}/>
              <input value={text} onChange={e=>setText(e.target.value)} placeholder="Add caption..." style={{ position:"absolute",bottom:10,left:10,right:10,background:"rgba(0,0,0,0.45)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",outline:"none",fontSize:13 }}/>
            </div>):(
              <button onClick={()=>fileInputRef.current?.click()} style={{ flex:1,border:`2px dashed ${T.inputBorder}`,borderRadius:14,background:T.inputBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:T.muted,cursor:"pointer",fontSize:13 }}>
                <Camera size={28}/>Tap to upload
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }}/>
          </div>
        )}
        <button disabled={!canSubmit} onClick={submit} style={{ marginTop:14,padding:13,borderRadius:12,border:"none",fontWeight:700,fontSize:14,cursor:canSubmit?"pointer":"default",background:canSubmit?DARK_PURPLE:T.divider,color:canSubmit?WHITE:T.muted,transition:"all 0.2s" }}>Share to Story</button>
      </div>
    </div>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ T, message }) => {
  if(!message)return null;
  return(
    <div style={{ position:"fixed",bottom:94,left:"50%",zIndex:400,transform:"translateX(-50%)",background:T.isDark?"rgba(0,0,12,0.96)":"rgba(10,0,20,0.92)",color:SKY_BLUE,padding:"10px 18px",borderRadius:24,fontSize:13,fontWeight:600,boxShadow:`0 8px 24px ${SKY_BLUE}55`,whiteSpace:"nowrap",animation:"toastPop 2.4s ease forwards" }}>
      {message}
    </div>
  );
};

// ─── COMMENT SECTION ──────────────────────────────────────────────────────────
const CommentSection = ({ T, post, allPosts, setAllPosts, onViewProfile, onPoints }) => {
  const [commentText,setCommentText]=useState("");
  const submitComment=()=>{
    if(!commentText.trim())return;
    const nc={id:uid("c"),author:"You",text:commentText.trim(),time:"Just now",likes:0,liked:false};
    setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,comments:[...(p.comments||[]),nc]}:p));
    if(onPoints)onPoints("COMMENT");
    setCommentText("");
  };
  return(
    <div style={{ marginTop:10,borderTop:`1px solid ${T.divider}`,paddingTop:10 }}>
      {(post.comments||[]).length===0&&<p style={{ margin:"0 0 10px",fontSize:12,color:T.muted,textAlign:"center" }}>No comments yet — be first!</p>}
      {(post.comments||[]).map(c=>(
        <div key={c.id} style={{ display:"flex",gap:8,marginBottom:10 }}>
          <div style={{ width:28,height:28,borderRadius:"50%",background:PURPLE_DIM,border:`1px solid ${PURPLE_BD}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:SKY_BLUE,fontWeight:700,flexShrink:0 }}>{(c.author||"Y")[0].toUpperCase()}</div>
          <div style={{ flex:1,background:T.inputBg,borderRadius:12,padding:"8px 12px",border:`1px solid ${T.inputBorder}` }}>
            <div style={{ fontSize:12,fontWeight:700,color:T.text }}>{c.author}</div>
            <div style={{ fontSize:13,color:T.text,lineHeight:1.4 }}>{c.text}</div>
            <div style={{ fontSize:10,color:T.muted,marginTop:4 }}>{c.time}</div>
          </div>
        </div>
      ))}
      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
        <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitComment()} placeholder="Write a comment…" style={{ flex:1,background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:12,padding:"9px 13px",color:T.text,outline:"none",fontSize:13 }}/>
        <button onClick={submitComment} style={{ width:36,height:36,borderRadius:10,background:commentText.trim()?DARK_PURPLE:T.inputBg,color:commentText.trim()?WHITE:T.muted,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.inputBorder}` }}><Send size={14}/></button>
      </div>
    </div>
  );
};

// ─── POST CARD ────────────────────────────────────────────────────────────────
const PostCard = ({ T, post, allPosts, setAllPosts, onViewProfile, onPoints, currentUser, index }) => {
  const [showComments,setShowComments]=useState(false);
  const [likeAnim,setLikeAnim]=useState(false);
  const [saveAnim,setSaveAnim]=useState(false);
  const [postMenuOpen,setPostMenuOpen]=useState(false);
  const [likersOpen,setLikersOpen]=useState(false);
  const menuRef=useRef(null);

  const toggleLike=()=>{
    setLikeAnim(true);setTimeout(()=>setLikeAnim(false),400);
    const userName=currentUser?.name||"You";
    setAllPosts(prev=>prev.map(p=>{
      if(p.id!==post.id)return p;
      const wasLiked=p.liked;
      const lb=p.likedBy||[];
      const newLb=wasLiked?lb.filter(n=>n!==userName):[...lb,userName];
      return{...p,liked:!wasLiked,likes:wasLiked?p.likes-1:p.likes+1,likedBy:newLb};
    }));
    if(!post.liked&&onPoints)onPoints("LIKE_POST");
  };
  const toggleSave   =()=>{setSaveAnim(true);setTimeout(()=>setSaveAnim(false),400);setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,saved:!p.saved,saves:p.saved?p.saves-1:p.saves+1}:p));};
  const toggleRepost =()=>{setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,reposted:!p.reposted,reposts:p.reposted?p.reposts-1:p.reposts+1}:p));if(!post.reposted&&onPoints)onPoints("REPOST");};
  const deletePost   =()=>setAllPosts(prev=>prev.filter(p=>p.id!==post.id));

  return(
    <div style={{ ...glass(T,{borderRadius:14}),overflow:"hidden",animation:"cardIn 0.4s ease both",animationDelay:`${Math.min(index*0.05,0.3)}s` }}>
      <div style={{ padding:12 }}>
        {post.reposted&&<div style={{ display:"flex",alignItems:"center",gap:6,color:"#22c55e",fontSize:11,fontWeight:600,marginBottom:8 }}><Repeat2 size={12}/>You reposted this</div>}
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
          <Avatar seed={post.seed||post.author} T={T} size={30} onClick={()=>onViewProfile(post.authorId)}/>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <span style={{ fontWeight:600,fontSize:13,color:T.text }}>{post.author}</span>
              {post.verified&&<GlimacyBadge type={post.verifiedType||"blue"} size={13}/>}
            </div>
            <div style={{ fontSize:10,color:T.muted }}>{post.time}</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.muted }}><Eye size={11}/>{(post.views||0).toLocaleString()}</div>
          <div style={{ position:"relative" }} ref={menuRef}>
            <MoreHorizontal size={15} color={T.muted} style={{ cursor:"pointer" }} onClick={()=>setPostMenuOpen(v=>!v)}/>
            {postMenuOpen&&(
              <div style={{ position:"absolute",right:0,top:20,zIndex:30,background:T.isDark?CARD_BLACK:"#fff",border:`1px solid ${T.cardBorder}`,borderRadius:10,overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.55)",minWidth:168,animation:"cardIn 0.18s ease" }}>
                {post.authorId==="me"?(
                  <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",fontSize:13,cursor:"pointer",color:"#ef4444" }} onClick={deletePost}><Trash2 size={14}/>Delete Post</div>
                ):(
                  <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",fontSize:13,cursor:"pointer",color:"#ef4444" }} onClick={()=>{alert("Post reported!");setPostMenuOpen(false);}}><Flag size={14}/>Report Post</div>
                )}
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize:13.5,lineHeight:1.6,margin:"0 0 8px",color:T.text }}>{post.content}</p>
        {post.imageUrl&&<img src={post.imageUrl} alt="" style={{ width:"100%",borderRadius:10,marginBottom:8,objectFit:"cover",maxHeight:320 }}/>}
        {(post.likedBy||[]).length>0&&(
          <div onClick={()=>setLikersOpen(v=>!v)} style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8,cursor:"pointer" }}>
            <div style={{ display:"flex" }}>
              {(post.likedBy||[]).slice(0,3).map((n,i)=>(
                <div key={i} style={{ width:18,height:18,borderRadius:"50%",background:DARK_PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:WHITE,fontWeight:700,marginLeft:i>0?-4:0,border:`1.5px solid ${T.bg}` }}>{n[0]?.toUpperCase()}</div>
              ))}
            </div>
            <span style={{ fontSize:11,color:SKY_BLUE,fontWeight:600 }}>
              {(post.likedBy||[]).slice(0,2).join(", ")}{(post.likedBy||[]).length>2?` +${(post.likedBy||[]).length-2} more`:""} liked this
            </span>
          </div>
        )}
        {likersOpen&&(post.likedBy||[]).length>0&&(
          <div style={{ background:T.inputBg,borderRadius:10,padding:"8px 12px",marginBottom:8 }}>
            {(post.likedBy||[]).map((n,i)=>(
              <div key={i} style={{ fontSize:12,color:T.muted,padding:"2px 0",display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:16,height:16,borderRadius:"50%",background:DARK_PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:WHITE,fontWeight:700 }}>{n[0]?.toUpperCase()}</div>{n}
              </div>
            ))}
          </div>
        )}
        <div style={{ height:1,background:T.divider,margin:"0 0 10px" }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <ActionBtn onClick={toggleLike}   Icon={Heart}         label={post.likes}             active={post.liked}    activeColor="#ef4444" fillWhenActive anim={likeAnim?"heartPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={()=>setShowComments(v=>!v)} Icon={MessageCircle} label={(post.comments||[]).length} active={showComments} activeColor={SKY_BLUE} T={T}/>
          <ActionBtn onClick={toggleRepost} Icon={Repeat2}       label={post.reposts}            active={post.reposted} activeColor="#22c55e" T={T}/>
          <ActionBtn onClick={toggleSave}   Icon={Bookmark}      label={post.saves||0}          active={post.saved}    activeColor={SKY_BLUE} fillWhenActive anim={saveAnim?"bookmarkPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={()=>{}}       Icon={Share2}        label="Share"                  T={T}/>
        </div>
        {showComments&&<CommentSection T={T} post={post} allPosts={allPosts} setAllPosts={setAllPosts} onViewProfile={onViewProfile} onPoints={onPoints}/>}
      </div>
    </div>
  );
};

// ─── VIDEO POST CARD ──────────────────────────────────────────────────────────
const VideoPostCard = ({ T, post, allPosts, setAllPosts, onViewProfile, onPoints, currentUser, index }) => {
  const [showComments,setShowComments]=useState(false);
  const [likeAnim,setLikeAnim]=useState(false);
  const [saveAnim,setSaveAnim]=useState(false);
  const [postMenuOpen,setPostMenuOpen]=useState(false);
  const menuRef=useRef(null);
  const toggleLike=()=>{setLikeAnim(true);setTimeout(()=>setLikeAnim(false),400);const userName=currentUser?.name||"You";setAllPosts(prev=>prev.map(p=>{if(p.id!==post.id)return p;const wasLiked=p.liked;const lb=p.likedBy||[];const newLb=wasLiked?lb.filter(n=>n!==userName):[...lb,userName];return{...p,liked:!wasLiked,likes:wasLiked?p.likes-1:p.likes+1,likedBy:newLb};}));if(!post.liked&&onPoints)onPoints("LIKE_POST");};
  const toggleSave   =()=>{setSaveAnim(true);setTimeout(()=>setSaveAnim(false),400);setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,saved:!p.saved,saves:p.saved?p.saves-1:p.saves+1}:p));};
  const toggleRepost =()=>{setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,reposted:!p.reposted,reposts:p.reposted?p.reposts-1:p.reposts+1}:p));if(!post.reposted&&onPoints)onPoints("REPOST");};
  const deletePost   =()=>setAllPosts(prev=>prev.filter(p=>p.id!==post.id));
  return(
    <div style={{ ...glass(T,{borderRadius:14}),overflow:"hidden",animation:"cardIn 0.4s ease both",animationDelay:`${Math.min(index*0.05,0.3)}s` }}>
      <div style={{ position:"relative" }}>
        <img src={post.thumbnail} alt="" style={{ width:"100%",height:200,objectFit:"cover",display:"block" }}/>
        <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ width:44,height:44,borderRadius:"50%",background:DARK_PURPLE,display:"flex",alignItems:"center",justifyContent:"center" }}><Play size={18} color={WHITE} fill={WHITE}/></div>
        </div>
        <div style={{ position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.55)",borderRadius:6,padding:"3px 7px",display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#fff" }}><Eye size={10}/>{post.views.toLocaleString()}</div>
      </div>
      <div style={{ padding:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
          <Avatar seed={post.seed||post.author} T={T} size={30} onClick={()=>onViewProfile(post.authorId)}/>
          <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:13,color:T.text }}>{post.author}</div><div style={{ fontSize:10,color:T.muted }}>{post.time}</div></div>
          <div style={{ position:"relative" }} ref={menuRef}>
            <MoreHorizontal size={15} color={T.muted} style={{ cursor:"pointer" }} onClick={()=>setPostMenuOpen(v=>!v)}/>
            {postMenuOpen&&(
              <div style={{ position:"absolute",right:0,top:20,zIndex:30,background:T.isDark?CARD_BLACK:"#fff",border:`1px solid ${T.cardBorder}`,borderRadius:10,overflow:"hidden",boxShadow:"0 8px 28px rgba(0,0,0,0.55)",minWidth:168,animation:"cardIn 0.18s ease" }}>
                {post.authorId==="me"?(<div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",fontSize:13,cursor:"pointer",color:"#ef4444" }} onClick={deletePost}><Trash2 size={14}/>Delete Post</div>):(<div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",fontSize:13,cursor:"pointer",color:"#ef4444" }} onClick={()=>alert("Post reported!")}><Flag size={14}/>Report Post</div>)}
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize:12.5,lineHeight:1.5,margin:"0 0 6px",color:T.text }}>{post.caption}</p>
        <div style={{ height:1,background:T.divider,margin:"0 0 10px" }}/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <ActionBtn onClick={toggleLike}   Icon={Heart}        label={post.likes}   active={post.liked}    activeColor="#ef4444" fillWhenActive anim={likeAnim?"heartPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={()=>setShowComments(v=>!v)} Icon={MessageCircle} label={(post.comments||[]).length} active={showComments} activeColor={SKY_BLUE} T={T}/>
          <ActionBtn onClick={toggleRepost} Icon={Repeat2}      label={post.reposts} active={post.reposted} activeColor="#22c55e" T={T}/>
          <ActionBtn onClick={toggleSave}   Icon={Bookmark}     label={post.saves||0} active={post.saved}  activeColor={SKY_BLUE} fillWhenActive anim={saveAnim?"bookmarkPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={()=>{}}       Icon={Share2}       label="Share"        T={T}/>
        </div>
        {showComments&&<CommentSection T={T} post={post} allPosts={allPosts} setAllPosts={setAllPosts} onViewProfile={onViewProfile} onPoints={onPoints}/>}
      </div>
    </div>
  );
};

// ─── FEEDBACK PANEL  (adjustment #2: feedback icon opens THIS only) ───────────
const FeedbackPanel = ({ T, open, onClose }) => {
  const [text,    setText]    = useState("");
  const [sent,    setSent]    = useState(false);
  const [section, setSection] = useState(null);
  useEffect(()=>{if(!open){setText("");setSent(false);setSection(null);}}, [open]);
  if(!open)return null;

  const sendFeedback = () => {
    if(!text.trim())return;
    const sub  = encodeURIComponent("Glimacy App Feedback");
    const body = encodeURIComponent(text.trim());
    window.open(`mailto:therealglimmar@gmail.com?subject=${sub}&body=${body}`,"_blank");
    setSent(true); setText("");
    setTimeout(()=>setSent(false),3000);
  };

  return(
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"overlayFadeIn 0.2s ease" }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:T.isDark?CARD_BLACK:"#fff",borderRadius:"20px 20px 0 0",paddingBottom:36,border:`1px solid ${T.divider}`,boxShadow:"0 -8px 40px rgba(0,0,0,0.5)",maxHeight:"75vh",overflowY:"auto",animation:"modalSlideUp 0.25s ease" }}>
        <div style={{ width:36,height:4,background:PURPLE_DIM,borderRadius:2,margin:"12px auto 0" }}/>
        <div style={{ display:"flex",alignItems:"center",padding:"16px 20px 8px",gap:10 }}>
          <div style={{ fontWeight:700,fontSize:17,color:T.text }}>Send Feedback</div>
          <X size={18} color={T.muted} style={{ marginLeft:"auto",cursor:"pointer" }} onClick={onClose}/>
        </div>
        <div style={{ padding:"8px 20px 0" }}>
          {sent?(
            <div style={{ textAlign:"center",padding:"24px 0" }}>
              <div style={{ fontSize:40 }}>✅</div>
              <div style={{ fontWeight:700,fontSize:15,color:SKY_BLUE,marginTop:10 }}>Feedback sent!</div>
              <div style={{ fontSize:12,color:T.muted,marginTop:6 }}>Thank you for helping us improve Glimacy.</div>
            </div>
          ):(
            <>
              <p style={{ fontSize:13,color:T.muted,margin:"0 0 14px" }}>Spotted a bug? Have a feature idea? Let us know.</p>
              <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Describe your feedback, bug, or feature request..." rows={5} style={{ width:"100%",background:T.inputBg,border:`1px solid ${PURPLE_BD}`,borderRadius:12,padding:"12px 14px",color:T.text,outline:"none",fontSize:13,resize:"none",fontFamily:"inherit" }}/>
              <button onClick={sendFeedback} disabled={!text.trim()} style={{ width:"100%",marginTop:12,padding:13,borderRadius:12,border:"none",background:text.trim()?DARK_PURPLE:T.inputBg,color:text.trim()?WHITE:T.muted,fontWeight:700,fontSize:14,cursor:text.trim()?"pointer":"default" }}>
                Send to Admin
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS PANEL  (adjustment #2: theme · font size · notifications · logout)
const SettingsPanel = ({ T, open, onClose, themeMode, setThemeMode, fontSize, setFontSize, onSignOut }) => {
  const [section, setSection] = useState(null);
  const [notifPosts,    setNotifPosts]    = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifFollows,  setNotifFollows]  = useState(true);
  useEffect(()=>{if(!open)setSection(null);},[open]);
  if(!open)return null;

  const themeOptions = [
    { id:"device", label:"Follow Device",  Icon:Monitor, desc:"Matches your system setting" },
    { id:"dark",   label:"Dark Mode",      Icon:Moon,    desc:"Black & Purple"               },
    { id:"light",  label:"Light Mode",     Icon:Sun,     desc:"Clean & bright"               },
  ];
  const rowStyle = (danger=false) => ({
    display:"flex",alignItems:"center",gap:12,padding:"14px 20px",cursor:"pointer",
    color:danger?"#ef4444":T.text,fontSize:14,borderBottom:`1px solid ${T.divider}`,
    transition:"background 0.15s",
  });
  const toggle = (val,setter) => <div onClick={()=>setter(v=>!v)} style={{ width:40,height:22,borderRadius:11,background:val?DARK_PURPLE:T.inputBg,position:"relative",cursor:"pointer",transition:"background 0.2s",border:`1px solid ${val?DARK_PURPLE:T.inputBorder}` }}><div style={{ position:"absolute",top:2,left:val?18:2,width:18,height:18,borderRadius:"50%",background:val?WHITE:T.muted,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/></div>;

  return(
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"overlayFadeIn 0.2s ease" }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:T.isDark?CARD_BLACK:"#fff",borderRadius:"20px 20px 0 0",paddingBottom:36,border:`1px solid ${T.divider}`,boxShadow:"0 -8px 40px rgba(0,0,0,0.5)",maxHeight:"85vh",overflowY:"auto",animation:"modalSlideUp 0.25s ease" }}>
        <div style={{ width:36,height:4,background:PURPLE_DIM,borderRadius:2,margin:"12px auto 0" }}/>
        <div style={{ display:"flex",alignItems:"center",padding:"16px 20px 8px",gap:10 }}>
          {section&&<ArrowLeft size={18} color={DARK_PURPLE} style={{ cursor:"pointer" }} onClick={()=>setSection(null)}/>}
          <div style={{ fontWeight:700,fontSize:17,color:T.text }}>
            {section==="theme"?"Choose Theme":section==="font"?"Font Size":section==="notifs"?"Notifications":"Settings"}
          </div>
          <X size={18} color={T.muted} style={{ marginLeft:"auto",cursor:"pointer" }} onClick={onClose}/>
        </div>

        {!section&&(
          <>
            {/* Theme row */}
            <div style={rowStyle()} onMouseOver={e=>e.currentTarget.style.background=T.hoverBg} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={()=>setSection("theme")}>
              <div style={{ width:36,height:36,borderRadius:10,background:PURPLE_DIM,display:"flex",alignItems:"center",justifyContent:"center" }}><Moon size={17} color={DARK_PURPLE}/></div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:14,color:T.text }}>Theme</div><div style={{ fontSize:11,color:T.muted }}>{themeMode==="dark"?"Dark Mode":themeMode==="light"?"Light Mode":"Device Default"}</div></div>
              <ChevronRight size={16} color={T.muted}/>
            </div>
            {/* Font size row */}
            <div style={rowStyle()} onMouseOver={e=>e.currentTarget.style.background=T.hoverBg} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={()=>setSection("font")}>
              <div style={{ width:36,height:36,borderRadius:10,background:PURPLE_DIM,display:"flex",alignItems:"center",justifyContent:"center" }}><Type size={17} color={DARK_PURPLE}/></div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:14,color:T.text }}>Font Size</div><div style={{ fontSize:11,color:T.muted }}>{fontSize}px</div></div>
              <ChevronRight size={16} color={T.muted}/>
            </div>
            {/* Notifications row */}
            <div style={rowStyle()} onMouseOver={e=>e.currentTarget.style.background=T.hoverBg} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={()=>setSection("notifs")}>
              <div style={{ width:36,height:36,borderRadius:10,background:PURPLE_DIM,display:"flex",alignItems:"center",justifyContent:"center" }}><BellRing size={17} color={DARK_PURPLE}/></div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:14,color:T.text }}>Notifications</div><div style={{ fontSize:11,color:T.muted }}>Posts, messages, follows</div></div>
              <ChevronRight size={16} color={T.muted}/>
            </div>
            {/* Log out */}
            <div style={rowStyle(true)} onMouseOver={e=>e.currentTarget.style.background="rgba(239,68,68,0.07)"} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={()=>{onSignOut();onClose();}}>
              <div style={{ width:36,height:36,borderRadius:10,background:"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}><LogOut size={17} color="#ef4444"/></div>
              <div style={{ fontWeight:600,fontSize:14 }}>Log Out</div>
            </div>
          </>
        )}

        {section==="theme"&&(
          <div style={{ padding:"8px 16px" }}>
            {themeOptions.map(opt=>(
              <div key={opt.id} onClick={()=>setThemeMode(opt.id)} style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 10px",cursor:"pointer",borderRadius:12,border:`1.5px solid ${themeMode===opt.id?DARK_PURPLE:T.inputBorder}`,background:themeMode===opt.id?PURPLE_DIM:"transparent",marginBottom:10 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:themeMode===opt.id?PURPLE_DIM:T.inputBg,display:"flex",alignItems:"center",justifyContent:"center" }}><opt.Icon size={18} color={themeMode===opt.id?DARK_PURPLE:T.muted}/></div>
                <div><div style={{ fontWeight:700,fontSize:14,color:themeMode===opt.id?DARK_PURPLE:T.text }}>{opt.label}</div><div style={{ fontSize:11,color:T.muted }}>{opt.desc}</div></div>
                {themeMode===opt.id&&<div style={{ marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:DARK_PURPLE,display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ color:WHITE,fontSize:12,fontWeight:900 }}>✓</span></div>}
              </div>
            ))}
          </div>
        )}

        {section==="font"&&(
          <div style={{ padding:"16px 20px" }}>
            <p style={{ fontSize:12,color:T.muted,margin:"0 0 16px" }}>Choose your preferred reading size.</p>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
              {[12,14,16,18,20,22].map(sz=>(
                <button key={sz} onClick={()=>setFontSize(sz)} style={{ padding:"12px 0",borderRadius:12,border:`1.5px solid ${fontSize===sz?DARK_PURPLE:T.inputBorder}`,background:fontSize===sz?PURPLE_DIM:"transparent",color:fontSize===sz?DARK_PURPLE:T.muted,fontWeight:fontSize===sz?800:500,fontSize:sz,cursor:"pointer" }}>Aa</button>
              ))}
            </div>
            <p style={{ fontSize:fontSize,color:T.text,margin:"16px 0 0",lineHeight:1.5,textAlign:"center" }}>Preview text at {fontSize}px — Campus life hits different 🚀</p>
          </div>
        )}

        {section==="notifs"&&(
          <div style={{ padding:"8px 20px" }}>
            {[
              ["New post interactions",notifPosts,   setNotifPosts],
              ["New messages",         notifMessages,setNotifMessages],
              ["New followers",        notifFollows, setNotifFollows],
            ].map(([label,val,setter])=>(
              <div key={label} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:`1px solid ${T.divider}` }}>
                <span style={{ fontSize:14,color:T.text }}>{label}</span>
                {toggle(val,setter)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── APP HEADER  (adjustment #2: feedback → FeedbackPanel; settings → SettingsPanel)
// adjustment #8: not rendered on Profile or Messages tabs
const AppHeader = ({ T, user, onAvatarClick, onSearchClick, onFeedbackClick, onSettingsClick, onMessagesClick, unreadMessages, children }) => (
  <div style={{
    position:"sticky",top:0,zIndex:50,
    display:"flex",alignItems:"center",gap:8,padding:"12px 14px 10px",
    background:T.isDark?"rgba(0,0,0,0.94)":"rgba(240,238,255,0.94)",
    backdropFilter:"blur(14px)",borderBottom:`1px solid ${T.divider}`,
  }}>
    <div onClick={onAvatarClick} style={{ cursor:"pointer",flexShrink:0 }}>
      {children||<div style={{ width:32,height:32,borderRadius:"50%",background:DARK_PURPLE,display:"flex",alignItems:"center",justifyContent:"center",color:WHITE,fontWeight:800,fontSize:13 }}>{(user?.name||"G")[0]}</div>}
    </div>
    <div style={{ flex:1 }}><div style={{ fontWeight:800,fontSize:17,color:T.text,letterSpacing:-0.5 }}>Glimacy</div></div>
    <div style={{ display:"flex",gap:4,alignItems:"center" }}>
      {/* Search */}
      <button onClick={onSearchClick} style={{ width:36,height:36,borderRadius:10,background:"transparent",border:"none",color:T.muted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Search size={19}/></button>
      {/* Feedback only */}
      <button onClick={onFeedbackClick} style={{ width:36,height:36,borderRadius:10,background:"transparent",border:"none",color:T.muted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><MessageSquare size={19}/></button>
      {/* Settings only */}
      <button onClick={onSettingsClick} style={{ width:36,height:36,borderRadius:10,background:"transparent",border:"none",color:T.muted,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><Settings size={19}/></button>
      {/* Messages */}
      <button onClick={onMessagesClick} style={{ position:"relative",width:36,height:36,borderRadius:10,background:PURPLE_DIM,border:`1px solid ${PURPLE_BD}`,color:SKY_BLUE,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
        <Send size={18}/>
        {unreadMessages>0&&<div style={{ position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:"50%",background:"#ef4444",color:WHITE,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${T.bg}` }}>{unreadMessages>9?"9+":unreadMessages}</div>}
      </button>
    </div>
  </div>
);

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const globalStyles = `
  @keyframes tabFade      { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
  /* ── Classic page-turn: content curls in from the left like turning a book page ── */
  @keyframes pageTurn     {
    0%   { opacity:0; transform:perspective(900px) rotateY(-18deg) translateX(-28px); }
    60%  { opacity:1; transform:perspective(900px) rotateY(2deg)   translateX(2px);   }
    100% { opacity:1; transform:perspective(900px) rotateY(0deg)   translateX(0);     }
  }
  @keyframes cardIn       { from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes heartPop     { 0%{transform:scale(1)}40%{transform:scale(1.45)}70%{transform:scale(0.9)}100%{transform:scale(1)} }
  @keyframes bookmarkPop  { 0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)} }
  @keyframes toastPop     { 0%{opacity:0;transform:translateX(-50%) translateY(10px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0} }
  @keyframes modalSlideUp { from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1} }
  @keyframes overlayFadeIn{ from{opacity:0}to{opacity:1} }
  @keyframes storyPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(91,33,182,0.5)}50%{box-shadow:0 0 0 5px rgba(91,33,182,0)} }
  @keyframes glowPulse    { 0%,100%{box-shadow:0 4px 24px ${PURPLE_GLOW}}50%{box-shadow:0 8px 40px ${PURPLE_GLOW},0 0 0 8px ${PURPLE_DIM}} }
  @keyframes pullSpin     { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
  @keyframes navSlideIn   { from{transform:translateX(-50%) translateY(14px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1} }
  * { -webkit-tap-highlight-color:transparent; }
  .hide-scrollbar::-webkit-scrollbar{display:none}
  .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
  /* Performance: promote animated layers to their own compositor layers */
  .tab-content { will-change: transform, opacity; transform-origin: left center; contain: layout style; }
  .post-card   { contain: layout style; will-change: auto; }
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState(() => loadLS(LS_KEYS.themeMode,"dark"));
  const [fontSize,  setFontSize]  = useState(() => loadLS(LS_KEYS.fontSize, 14));
  const getDevicePref = () => typeof window!=="undefined"&&window.matchMedia("(prefers-color-scheme:dark)").matches?THEMES.glimacy:THEMES.light;
  const T = themeMode==="light"?THEMES.light:themeMode==="device"?getDevicePref():THEMES.glimacy;
  useEffect(()=>saveLS(LS_KEYS.themeMode,themeMode),[themeMode]);
  useEffect(()=>saveLS(LS_KEYS.fontSize,fontSize), [fontSize]);

  // ── Navigation history stack (adjustment #6) ───────────────────────────────
  const [navHistory,       setNavHistory]       = useState(["home"]);
  const [activeTab,        setActiveTab]        = useState("home");
  const [viewingProfileId, setViewingProfileId] = useState(null);

  const navigateTo = useCallback((tab, profileId=null) => {
    setNavHistory(prev => [...prev, tab]);
    setActiveTab(tab);
    if(profileId!==null) setViewingProfileId(profileId);
  }, []);

  const goBack = useCallback(() => {
    setNavHistory(prev => {
      if(prev.length<=1){ setActiveTab("home"); return ["home"]; }
      const newHist = prev.slice(0,-1);
      const prevTab = newHist[newHist.length-1];
      setActiveTab(prevTab);
      if(prevTab!=="profile") setViewingProfileId(null);
      return newHist;
    });
  }, []);

  // ── App state ──────────────────────────────────────────────────────────────
  const [homeFeedTab,     setHomeFeedTab]     = useState("friends");
  const [isLoggedIn,      setIsLoggedIn]      = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);
  const [user,            setUser]            = useState(MOCK_USER);
  const [tokens,          setTokens]          = useState(MOCK_USER.tokens||0);
  const [appProfiles,     setAppProfiles]     = useState([]);
  const [followingIds,    setFollowingIds]    = useState(new Set());
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const [feedPosts, setFeedPosts] = useState(()=>{
    const p=loadLS(LS_KEYS.feedPosts,null);
    if(p&&p.length>0)return p;
    const likedIds=new Set(loadLS(LS_KEYS.likedIds,[]));
    const savedIds=new Set(loadLS(LS_KEYS.savedArchive,[]).map(p=>p.id));
    return INITIAL_FEED_POSTS.map(p=>({...p,likedBy:p.likedBy||[],liked:likedIds.has(p.id)||p.liked,saved:savedIds.has(p.id)||p.saved}));
  });
  const [myVideoPosts, setMyVideoPosts] = useState(()=>{
    const p=loadLS(LS_KEYS.videoPosts,null);
    if(p&&p.length>0)return p;
    const likedIds=new Set(loadLS(LS_KEYS.likedIds,[]));
    const savedIds=new Set(loadLS(LS_KEYS.savedArchive,[]).map(p=>p.id));
    return MY_VIDEO_POSTS.map(p=>({...p,likedBy:p.likedBy||[],liked:likedIds.has(p.id)||p.liked,saved:savedIds.has(p.id)||p.saved}));
  });

  const [userScore,           setUserScore]          = useState(()=>loadLS(LS_KEYS.userScore,MOCK_USER.score||0));
  const [statusLikes,         setStatusLikes]        = useState(()=>loadLS(LS_KEYS.statusLikes,{}));
  const [statusViews,         setStatusViews]        = useState(()=>loadLS(LS_KEYS.statusViews,{}));
  const [notifications,       setNotifications]      = useState(MOCK_NOTIFICATIONS);
  const [isEditModalOpen,     setIsEditModalOpen]    = useState(false);
  const [isCreateModalOpen,   setIsCreateModalOpen]  = useState(false);
  const [settingsOpen,        setSettingsOpen]       = useState(false);
  const [feedbackOpen,        setFeedbackOpen]       = useState(false);
  const [editName,            setEditName]           = useState("");
  const [editHandle,          setEditHandle]         = useState("");
  const [editBio,             setEditBio]            = useState("");
  const [editUni,             setEditUni]            = useState("");
  const [editFaculty,         setEditFaculty]        = useState("");
  const [editRelationship,    setEditRelationship]   = useState("Single");
  const [editGender,          setEditGender]         = useState("Male");
  const [editPhone,           setEditPhone]          = useState("");
  const [editHobby,           setEditHobby]          = useState("");
  const [editEmail,           setEditEmail]          = useState("");   // adjustment #4
  const [searchQuery,         setSearchQuery]        = useState("");
  const [searchSubTab,        setSearchSubTab]       = useState("posts");
  const [imagePreview,        setImagePreview]       = useState(null);

  // ── Scroll-hide header/nav (adjustment #7) ─────────────────────────────────
  const [headerVisible,    setHeaderVisible]    = useState(true);
  const lastScrollY     = useRef(0);
  const scrollTimer     = useRef(null);
  const scrollRafId     = useRef(null);
  const scrollContainerRef = useRef(null);

  const handleMainScroll = useCallback((e) => {
    const HIDE_TABS = ["profile","messages"];
    if(HIDE_TABS.includes(activeTab)) return;
    // Capture the value synchronously before the rAF fires
    const cur = e.currentTarget.scrollTop;
    if(scrollRafId.current) cancelAnimationFrame(scrollRafId.current);
    scrollRafId.current = requestAnimationFrame(() => {
      const diff = cur - lastScrollY.current;
      if(diff > 8)  setHeaderVisible(false);
      if(diff < -8) setHeaderVisible(true);
      lastScrollY.current = cur;
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(()=>setHeaderVisible(true), 1200);
    });
  }, [activeTab]);

  // ── Horizontal swipe between tabs (adjustment #9) ──────────────────────────
  const swipeStartX    = useRef(null);
  const swipeStartY    = useRef(null);
  const [swipeOffset,  setSwipeOffset]  = useState(0);
  const [isSwipingH,   setIsSwipingH]   = useState(false);
  const SWIPE_THRESHOLD = 55;

  const onTouchStart = (e) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    setIsSwipingH(false);
    setSwipeOffset(0);
  };
  const onTouchMove = (e) => {
    if(swipeStartX.current===null)return;
    const dx = e.touches[0].clientX - swipeStartX.current;
    const dy = e.touches[0].clientY - swipeStartY.current;
    if(!isSwipingH){
      if(Math.abs(dy)>Math.abs(dx)+5)return; // vertical dominant → don't intercept
      if(Math.abs(dx)>10)setIsSwipingH(true);
    }
    if(isSwipingH){
      // elastic resistance when at first/last tab
      const curIdx  = TAB_ORDER.indexOf(activeTab);
      const atStart = curIdx===0   && dx>0;
      const atEnd   = curIdx===TAB_ORDER.length-1 && dx<0;
      const damped  = (atStart||atEnd) ? dx*0.25 : dx;
      setSwipeOffset(damped);
    }
  };
  const onTouchEnd = () => {
    if(!isSwipingH){ swipeStartX.current=null; return; }
    const curIdx = TAB_ORDER.indexOf(activeTab);
    if(swipeOffset < -SWIPE_THRESHOLD && curIdx < TAB_ORDER.length-1){
      navigateTo(TAB_ORDER[curIdx+1]);
    } else if(swipeOffset > SWIPE_THRESHOLD && curIdx > 0){
      navigateTo(TAB_ORDER[curIdx-1]);
    }
    setSwipeOffset(0);
    setIsSwipingH(false);
    swipeStartX.current=null;
  };

  // ── Stories ────────────────────────────────────────────────────────────────
  const [myStatusItems,       setMyStatusItems]      = useState(()=>loadLS(LS_KEYS.myStatuses,[]));
  const [seenStatusItemIds,   setSeenStatusItemIds]  = useState(()=>new Set(loadLS(LS_KEYS.seenStatusItems,[])));
  const [otherStatuses,       setOtherStatuses]      = useState([]);
  const [statusComposerOpen,  setStatusComposerOpen] = useState(false);
  const [storyViewerIndex,    setStoryViewerIndex]   = useState(null);

  const [savedArchive,     setSavedArchive]     = useState(()=>loadLS(LS_KEYS.savedArchive,[]));
  const [toast,            setToast]            = useState(null);
  const toastTimer = useRef(null);
  const showToast = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(null),2400); };

  const [pullDistance,  setPullDistance]  = useState(0);
  const [refreshing,    setRefreshing]    = useState(false);
  const pullStartY = useRef(null);

  // ── Supabase ───────────────────────────────────────────────────────────────
  const fetchUserData = async (userId) => {
    const { data:ud } = await supabase.from("profiles").select("*").eq("id",userId).single();
    if(ud){ setUser(prev=>({...prev,...ud,name:ud.first_name?`${ud.first_name} ${ud.last_name||""}`.trim():(ud.name||"User")})); }
    const { data:pd } = await supabase.from("profiles").select("*");
    setAppProfiles(pd?pd.map(p=>({...p,name:p.first_name?`${p.first_name} ${p.last_name||""}`.trim():(p.name||"User")})):MOCK_PROFILES);
    const { data:fd } = await supabase.from("follows").select("following_id").eq("follower_id",userId);
    if(fd)setFollowingIds(new Set(fd.map(f=>f.following_id)));
  };

  const fetchDatabasePosts = async (authId) => {
    try{
      const { data,error } = await supabase.from("posts").select("*").order("created_at",{ascending:false});
      if(error||!data)return;
      const likedIds=new Set(loadLS(LS_KEYS.likedIds,[]));
      const savedIds=new Set(loadLS(LS_KEYS.savedArchive,[]).map(p=>p.id));
      const formatted=data.map(post=>{
        const isMe=authId&&post.author_id===authId;
        return{ id:post.id,authorId:post.author_id,author:isMe?user.name:"Campus Member",handle:isMe?user.handle:"@campus_member",seed:isMe?(user.seed||user.name):`user_${post.id}`,time:new Date(post.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),type:"text",content:post.content,imageUrl:post.image_url||null,likes:0,likedBy:[],comments:[],reposts:0,saves:0,views:0,liked:likedIds.has(post.id),saved:savedIds.has(post.id),reposted:false };
      });
      setFeedPosts(formatted);
    }catch(err){console.error("Post fetch error:",err);}
  };

  useEffect(()=>{
    const init=async()=>{
      const { data:{ session } }=await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      if(session?.user){setUser(prev=>({...prev,id:session.user.id}));await fetchUserData(session.user.id);fetchDatabasePosts(session.user.id);}
      else fetchDatabasePosts(null);
      setIsAuthLoading(false);
    };
    init();
    const { data:{ subscription } }=supabase.auth.onAuthStateChange((_e,session)=>{
      setIsLoggedIn(!!session);
      if(session?.user){setUser(prev=>({...prev,id:session.user.id}));fetchUserData(session.user.id);fetchDatabasePosts(session.user.id);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  // ── Persist (debounced to avoid localStorage thrashing on rapid state changes) ─
  const lsTimer = useRef(null);
  const debouncedSave = useCallback((key, value) => {
    clearTimeout(lsTimer.current);
    lsTimer.current = setTimeout(() => saveLS(key, value), 600);
  }, []);
  useEffect(()=>saveLS(LS_KEYS.myStatuses,myStatusItems),[myStatusItems]);
  useEffect(()=>saveLS(LS_KEYS.seenStatusItems,[...seenStatusItemIds]),[seenStatusItemIds]);
  useEffect(()=>saveLS(LS_KEYS.savedArchive,savedArchive),[savedArchive]);
  useEffect(()=>debouncedSave(LS_KEYS.likedIds,[...feedPosts,...myVideoPosts].filter(p=>p.liked).map(p=>p.id)),[feedPosts,myVideoPosts]);
  useEffect(()=>debouncedSave(LS_KEYS.feedPosts,feedPosts),[feedPosts]);
  useEffect(()=>debouncedSave(LS_KEYS.videoPosts,myVideoPosts),[myVideoPosts]);
  useEffect(()=>saveLS(LS_KEYS.userScore,userScore),[userScore]);
  useEffect(()=>saveLS(LS_KEYS.statusLikes,statusLikes),[statusLikes]);
  useEffect(()=>saveLS(LS_KEYS.statusViews,statusViews),[statusViews]);

  const isAuthorVerified=(post)=>{
    if(post.authorId===user?.id||post.authorId==="me")return !!user?.verified;
    return !!appProfiles.find(p=>p.id===post.authorId)?.verified;
  };
  useEffect(()=>{
    const cur=[...feedPosts,...myVideoPosts].filter(p=>p.saved);
    const ids=new Set([...feedPosts,...myVideoPosts].map(p=>p.id));
    setSavedArchive(prev=>{
      const map=new Map(prev.map(p=>[p.id,p]));
      cur.forEach(p=>{const e=map.get(p.id);map.set(p.id,{id:p.id,type:p.type,author:p.author,handle:p.handle,content:p.content,caption:p.caption,thumbnail:p.thumbnail,likes:p.likes,comments:p.comments,views:p.views,savedAt:e?.savedAt||Date.now(),authorVerifiedAtSave:e?e.authorVerifiedAtSave:isAuthorVerified(p)});});
      const next=[];map.forEach((entry,id)=>{const inScope=ids.has(id);const still=cur.some(p=>p.id===id);if(!inScope||still)next.push(entry);});
      return next.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
    });
  },[feedPosts,myVideoPosts]);

  useEffect(()=>{
    if(otherStatuses.length>0)return;
    const pool=appProfiles.length?appProfiles:MOCK_PROFILES;
    if(!pool.length)return;
    const now=Date.now();
    const seeded=pool.slice(0,6).map((p,i)=>({
      userId:p.id,name:p.name,handle:p.handle,seed:p.seed||p.name,avatarUrl:p.avatarUrl||null,verified:!!p.verified,
      items:i%3===2?[]:[ {id:`seed_st_${p.id}`,type:"text",content:STATUS_SAMPLE_LINES[i%STATUS_SAMPLE_LINES.length],bg:STATUS_BG_PRESETS[i%STATUS_BG_PRESETS.length],createdAt:now-(i+1)*1000*60*35} ]
    }));
    setOtherStatuses(seeded);
  },[appProfiles]);

  useEffect(()=>{ setHeaderVisible(true); setPullDistance(0); pullStartY.current=null; },[activeTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleFollow=async(targetId)=>{
    if(!user?.id||user.id==="me")return;
    const isF=followingIds.has(targetId);
    setFollowingIds(prev=>{const n=new Set(prev);isF?n.delete(targetId):n.add(targetId);return n;});
    setAppProfiles(prev=>prev.map(p=>p.id===targetId?{...p,followers_count:(p.followers_count||0)+(isF?-1:1)}:p));
    setUser(prev=>({...prev,following_count:(prev.following_count||0)+(isF?-1:1)}));
    if(isF)await supabase.from("follows").delete().match({follower_id:user.id,following_id:targetId});
    else   await supabase.from("follows").insert({follower_id:user.id,following_id:targetId});
  };

  const handleOpenEditModal=()=>{
    setEditName(user.name);
    setEditHandle(user.handle);
    setEditBio(user.bio);
    setEditUni(user.university);
    setEditFaculty(user.faculty||"");
    setEditRelationship(user.relationshipStatus||"Single");
    setEditGender(user.gender||"Male");
    setEditPhone(user.phone||"");
    setEditHobby(user.hobby?user.hobby.replace(/^I love\s+/i,""):"");
    setEditEmail(user.email||"");
    setIsEditModalOpen(true);
  };

  // adjustment #4: save email publicly
  const handleSaveProfile=async(e)=>{
    e.preventDefault();
    let fmtHandle=editHandle.trim();
    if(!fmtHandle.startsWith("@"))fmtHandle="@"+fmtHandle;
    const hobbyFmt=editHobby.trim()?`I love ${editHobby.trim()}`:"";
    const updated={...user,name:editName.trim(),handle:fmtHandle,bio:editBio.trim(),university:editUni.trim(),faculty:editFaculty,relationshipStatus:editRelationship,gender:editGender,phone:editPhone.trim(),hobby:hobbyFmt,email:editEmail.trim()};
    setUser(updated);
    // Reflect on appProfiles so other users see it (adjustment #4)
    setAppProfiles(prev=>prev.map(p=>p.id===user.id?{...p,...updated}:p));
    if(user.id&&user.id!=="me"){
      const [first,...rest]=(editName.trim()).split(" ");
      const { error }=await supabase.from("profiles").upsert({
        id:user.id,first_name:first||"",last_name:rest.join(" "),name:editName.trim(),handle:fmtHandle,bio:editBio.trim(),university:editUni.trim(),faculty:editFaculty,relationship_status:editRelationship,gender:editGender,phone:editPhone.trim(),hobby:hobbyFmt,email:editEmail.trim(),avatar_url:user.avatarUrl||null,cover_url:user.coverUrl||null,updated_at:new Date().toISOString(),
      },{onConflict:"id"});
      if(error)console.error("Supabase profile upsert error:",error);
    }
    setIsEditModalOpen(false);
    showToast("Profile updated ✨");
  };

  // adjustment #6: use navigateTo so back traces the path
  const handleViewProfile  = (profileId) => navigateTo("profile", profileId);
  const handleExitProfile  = ()           => goBack();
  const handleImagePreview = ({type,user:pu}) => setImagePreview({type,user:pu});

  const handleVerified=(method)=>{
    const isWhite=method.startsWith("white");
    if(method==="blue_tokens")  setTokens(prev=>prev-TOKEN_ECONOMY.tokensToVerify);
    if(method==="white_tokens") setTokens(prev=>prev-TOKEN_ECONOMY.whiteTokenCost);
    setUser(prev=>({...prev,verified:true,verifiedType:isWhite?"white":"blue"}));
    showToast(isWhite?"⚪ White Verified — Campus Elite!":"🔵 Blue Verified!");
  };
  const handleEarnedTokens=(amount)=>{ setTokens(prev=>prev+amount); setUser(prev=>({...prev,tokens:(prev.tokens||0)+amount})); showToast(`+${amount} tokens earned 🪙`); };

  const addPoints=(action)=>{
    const pts=POINT_ACTIONS[action]||0;
    if(!pts)return;
    setUserScore(prev=>{
      const next=prev+pts;
      if(Math.floor(prev/50)<Math.floor(next/50))setTimeout(()=>showToast(`🏆 +${pts} pts — ranking up!`),100);
      return next;
    });
    setUser(prev=>({...prev,score:(prev.score||0)+pts}));
  };

  const handleSpendTokens=(amount)=>{
    if(amount<0)handleEarnedTokens(-amount);
    else{ setTokens(prev=>Math.max(0,prev-amount)); setUser(prev=>({...prev,tokens:Math.max(0,(prev.tokens||0)-amount)})); }
  };
  const handleUnsaveArchived=(postId)=>{
    setSavedArchive(prev=>prev.filter(p=>p.id!==postId));
    setFeedPosts(prev=>prev.map(p=>p.id===postId?{...p,saved:false,saves:Math.max(0,(p.saves||0)-1)}:p));
    setMyVideoPosts(prev=>prev.map(p=>p.id===postId?{...p,saved:false,saves:Math.max(0,(p.saves||0)-1)}:p));
  };
  const handleBackupToGmail=(postsToBackup)=>{
    if(!postsToBackup||postsToBackup.length===0){showToast("No saved posts to back up");return;}
    const lines=postsToBackup.map((p,i)=>`${i+1}. ${p.author||"Unknown"} (${p.authorVerifiedAtSave?"Verified":"Unverified"})\n${(p.content||p.caption||"").slice(0,300)}\n${(p.likes||0)} likes\n`).join("\n");
    const sub=encodeURIComponent("Glimacy — Saved Posts Backup");
    const body=encodeURIComponent(`Saved posts:\n\n${lines}\nExported ${new Date().toLocaleString()}`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${sub}&body=${body}`,"_blank","noopener,noreferrer");
    showToast("Opening Gmail…");
  };

  const openStoryViewer  = (idx) => { if(idx>=0)setStoryViewerIndex(idx); };
  const closeStoryViewer = ()    => setStoryViewerIndex(null);

  const handleRefreshFeed=async()=>{
    try{ const{ data:{ session } }=await supabase.auth.getSession(); await fetchDatabasePosts(session?.user?.id||null); showToast("✨ Feed refreshed"); }
    catch{ showToast("Couldn't refresh — check connection"); }
  };
  const handlePullStart=(e)=>{ if(activeTab!=="home"||refreshing)return; if((scrollContainerRef.current?.scrollTop??0)>2)return; pullStartY.current=e.clientY; };
  const handlePullMove =(e)=>{ if(pullStartY.current==null)return; const delta=e.clientY-pullStartY.current; if(delta<=0||(scrollContainerRef.current?.scrollTop??0)>2){setPullDistance(0);return;} setPullDistance(Math.min(delta*0.5,90)); };
  const handlePullEnd  =async()=>{ if(pullStartY.current==null)return; pullStartY.current=null; if(pullDistance>55&&!refreshing){setRefreshing(true);await handleRefreshFeed();setRefreshing(false);}setPullDistance(0); };
  const handleUpdateAvatar=(url)=>setUser(prev=>({...prev,avatarUrl:url}));
  const handleUpdateCover =(url)=>setUser(prev=>({...prev,coverUrl:url}));

  // ── Derived ────────────────────────────────────────────────────────────────
  const cleanQuery           = searchQuery.toLowerCase().trim();
  const aggregatedPosts      = [...feedPosts,...myVideoPosts];
  const getScore             = (p)=>(p.likes||0)*3+(p.comments?.length||0)*5+(p.reposts||0)*4+(p.views||0)*0.1;
  const parseFC              = (v)=>{ if(!v)return 0; if(typeof v==="number")return v; if(String(v).toLowerCase().endsWith("k"))return parseFloat(v)*1000; return parseFloat(v)||0; };
  const filteredPostsResults = aggregatedPosts.filter(p=>(p.content||p.caption||"").toLowerCase().includes(cleanQuery)).sort((a,b)=>getScore(b)-getScore(a));
  const allProfiles          = [user,...appProfiles].filter((v,i,a)=>a.findIndex(v2=>v2.id===v.id)===i);
  const filteredFriendsResults=allProfiles.filter(p=>(p.name||"").toLowerCase().includes(cleanQuery)||(p.handle||"").toLowerCase().includes(cleanQuery)).sort((a,b)=>parseFC(b.followers_count)-parseFC(a.followers_count));
  const filteredTagsResults  = aggregatedPosts.filter(p=>{ const body=(p.content||p.caption||"").toLowerCase(); const tag=cleanQuery.startsWith("#")?cleanQuery:`#${cleanQuery}`; return body.includes(cleanQuery)||body.includes(tag); }).sort((a,b)=>getScore(b)-getScore(a));
  const viewingProfile       = viewingProfileId?appProfiles.find(p=>p.id===viewingProfileId)||null:null;
  const profileToShow        = viewingProfileId?(viewingProfileId==="me"?user:viewingProfile):user;
  const isOwnProfile         = !viewingProfileId||viewingProfileId==="me"||viewingProfileId===user?.id;

  // adjustment #8: no header/bottom-nav in Profile or Messages
  const isOnProfile          = activeTab==="profile";
  const isOnMessages         = activeTab==="messages";
  const hideChrome           = isOnProfile||isOnMessages;

  const liveStatuses         = myStatusItems.filter(it=>Date.now()-it.createdAt<STATUS_TTL_MS);
  const profileHasActiveStory= liveStatuses.length>0;
  const profileStatusIndex   = 0;
  const statusFeedForBar     = [
    { userId:user.id||"me",name:user.name,handle:user.handle,seed:user.seed||user.name,avatarUrl:user.avatarUrl||null,verified:!!user.verified,isMe:true,items:liveStatuses },
    ...otherStatuses.filter(s=>s.userId!==user.id&&s.items.length>0),
  ];

  const computedWorldRank  = Math.max(1,userScore>0?Math.max(1,1000-Math.floor(userScore/5)):user.worldRank||47);
  const computedCampusRank = Math.max(1,userScore>0?Math.max(1,100-Math.floor(userScore/15)):user.campusRank||12);
  const rankedUser         = { ...user,worldRank:computedWorldRank,campusRank:computedCampusRank,score:userScore };
  const unreadMsgCount     = 0;
  const displayedHomePosts = homeFeedTab==="trending"?[...feedPosts].sort((a,b)=>getScore(b)-getScore(a)):feedPosts;

  // ── Loading / Auth ─────────────────────────────────────────────────────────
  if(isAuthLoading){
    return(
      <div style={{ width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BLACK }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:52,marginBottom:14,animation:"pulse 1.5s ease-in-out infinite" }}>✦</div>
          <div style={{ fontWeight:800,fontSize:22,color:WHITE,letterSpacing:-1 }}>Glimacy</div>
          <div style={{ fontSize:12,color:SKY_BLUE,marginTop:6 }}>Loading…</div>
        </div>
      </div>
    );
  }
  if(!isLoggedIn){
    return(
      <div style={{ width:"100%",minHeight:"100vh",background:BLACK }}>
        <style>{globalStyles}</style>
        <Login onLogin={()=>setIsLoggedIn(true)}/>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return(
    <div style={{ width:"100%",maxWidth:430,margin:"0 auto",minHeight:"100vh",height:"100vh",display:"flex",flexDirection:"column",background:T.bg,position:"relative",overflow:"hidden",fontSize:fontSize }}>
      <style>{globalStyles}</style>
      <style>{`@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>

      {/* Verify modal */}
      {verifyModalOpen&&(
        <VerifyModal T={T} tokens={tokens} user={user} onClose={()=>setVerifyModalOpen(false)} onVerified={(m)=>{handleVerified(m);setVerifyModalOpen(false);}} onEarnedTokens={handleEarnedTokens}/>
      )}

      {/* App header — hidden on Profile + Messages (adjustment #8) */}
      {!hideChrome&&(
        <div style={{
          overflow:"hidden",
          /* Collapse height to 0 when hidden so flex:1 scroll area expands to fill it */
          maxHeight: headerVisible ? 80 : 0,
          transition: "max-height 0.3s cubic-bezier(.4,0,.2,1)",
          willChange: "max-height",
        }}>
          <AppHeader
            T={T} user={user}
            onAvatarClick={()=>navigateTo("profile")}
            onSearchClick={()=>navigateTo("search")}
            onFeedbackClick={()=>setFeedbackOpen(true)}
            onSettingsClick={()=>setSettingsOpen(true)}
            onMessagesClick={()=>navigateTo("messages")}
            unreadMessages={unreadMsgCount}
          >
            {user.avatarUrl?(
              <div style={{ width:32,height:32,borderRadius:"50%",overflow:"hidden",border:`2px solid ${DARK_PURPLE}` }}>
                <img src={user.avatarUrl} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
              </div>
            ):(
              <Avatar seed={user.name} T={T} glow/>
            )}
          </AppHeader>
        </div>
      )}

      {/* Main scrollable content with horizontal swipe (adjustment #9) */}
      <div
        ref={scrollContainerRef}
        style={{
          flex:1,overflowY:"auto",
          /* When bars are hidden, shrink padding so content truly fills the screen */
          paddingBottom: hideChrome ? 24 : headerVisible ? 82 : 24,
          transform:`translateX(${swipeOffset}px)`,
          transition: isSwipingH
            ? "none"
            : "transform 0.35s cubic-bezier(.25,.46,.45,.94), padding-bottom 0.3s ease",
          willChange: "transform",
        }}
        onScroll={handleMainScroll}
        onPointerDown={handlePullStart}
        onPointerMove={handlePullMove}
        onPointerUp={handlePullEnd}
        onPointerCancel={handlePullEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >

        {/* ── HOME ── */}
        {activeTab==="home"&&(
          <div className="tab-content" style={{ display:"flex",flexDirection:"column",gap:12,padding:"14px",animation:"pageTurn 0.35s cubic-bezier(.25,.46,.45,.94)" }}>
            {(pullDistance>0||refreshing)&&(
              <div style={{ display:"flex",justifyContent:"center",alignItems:"center",height:refreshing?40:pullDistance,transition:refreshing?"height 0.2s ease":"none" }}>
                <RefreshCw size={20} color={SKY_BLUE} style={{ animation:refreshing?"pullSpin 0.7s linear infinite":"none",transform:refreshing?undefined:`rotate(${Math.min(pullDistance*4,280)}deg)`,opacity:Math.min((refreshing?40:pullDistance)/50,1) }}/>
              </div>
            )}
            <StoryBar T={T} statusFeed={statusFeedForBar} seenIds={seenStatusItemIds} onAvatarClick={openStoryViewer} onAddClick={()=>setStatusComposerOpen(true)}/>
            <ActionBannerBtns T={T} user={user} tokens={tokens} onVerifyClick={()=>setVerifyModalOpen(true)} onEarnClick={()=>setVerifyModalOpen(true)}/>
            <div style={{ display:"flex",borderRadius:12,overflow:"hidden",border:`1px solid ${PURPLE_BD}`,flexShrink:0 }}>
              {[{id:"friends",label:"👥 Friends"},{id:"trending",label:"🔥 Trending"}].map(tab=>(
                <button key={tab.id} onClick={()=>setHomeFeedTab(tab.id)} style={{ flex:1,padding:"10px 0",border:"none",fontSize:13,fontWeight:homeFeedTab===tab.id?700:500,cursor:"pointer",transition:"all 0.2s",background:homeFeedTab===tab.id?DARK_PURPLE:"transparent",color:homeFeedTab===tab.id?WHITE:T.muted }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {displayedHomePosts.map((post,i)=>(
              post.type==="video"
                ?<VideoPostCard key={post.id} T={T} post={post} allPosts={myVideoPosts} setAllPosts={setMyVideoPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>
                :<PostCard      key={post.id} T={T} post={post} allPosts={feedPosts}    setAllPosts={setFeedPosts}    onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>
            ))}
            {/* FAB also hides on scroll (adjustment #7) */}
            <div style={{ opacity:headerVisible?1:0,pointerEvents:headerVisible?"auto":"none",transition:"opacity 0.3s ease" }}>
              <CreatePostFAB T={T} onClick={()=>setIsCreateModalOpen(true)}/>
            </div>
            {isCreateModalOpen&&(
              <CreatePostModal
                T={T} user={user}
                onClose={()=>setIsCreateModalOpen(false)}
                onPost={async(draft)=>{
                  let imageUrl=null;
                  // Upload image if present and user is verified
                  if(draft.imageFile&&user?.isVerified){
                    try{
                      const ext=draft.imageFile.name.split(".").pop();
                      const path=`posts/${user.id||"me"}/${uid("img")}.${ext}`;
                      const { data:upData }=await supabase.storage.from("post-images").upload(path,draft.imageFile,{contentType:draft.imageFile.type});
                      if(upData){ const { data:urlData }=supabase.storage.from("post-images").getPublicUrl(path); imageUrl=urlData?.publicUrl||null; }
                    }catch(e){ console.error("Image upload error:",e); }
                  }
                  const newPost={
                    id:uid("post"),authorId:user.id||"me",author:user.name,handle:user.handle,
                    seed:user.seed||user.name,time:"Just now",type:draft.type,
                    content:draft.content,imageUrl,
                    likes:0,likedBy:[],comments:[],reposts:0,saves:0,views:0,
                    liked:false,saved:false,reposted:false,
                    verified:user.verified,verifiedType:user.verifiedType,
                  };
                  // adjustment #5: always public → push to feedPosts
                  setFeedPosts(prev=>[newPost,...prev]);
                  if(user.id&&user.id!=="me"){
                    await supabase.from("posts").insert({author_id:user.id,content:draft.content,image_url:imageUrl,type:draft.type,created_at:new Date().toISOString()}).then(({error})=>{ if(error)console.error("Post insert error:",error); });
                  }
                  addPoints("POST_CREATED");
                  showToast("Post shared! 🚀");
                }}
              />
            )}
          </div>
        )}

        {/* ── CONNECT (adjustment #3: relationship status + avatar popup) ── */}
        {activeTab==="connect"&&(
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <ConnectHubView
              T={T}
              appProfiles={appProfiles}
              user={user}
              followingIds={followingIds}
              handleViewProfile={handleViewProfile}
              handleToggleFollow={handleToggleFollow}
              onMessageUser={(profileId)=>navigateTo("messages",profileId)}
            />
          </div>
        )}

        {/* ── RANKING ── */}
        {activeTab==="ranking"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:12,padding:"14px",animation:"tabFade 0.25s ease" }}>
            <LeaderboardHeader T={T}/>
            <SeasonRewards T={T}/>
            <div style={{ background:DARK_PURPLE,borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:`0 4px 24px ${PURPLE_GLOW}`,animation:"glowPulse 3s ease-in-out infinite" }}>
              <div style={{ fontSize:32 }}>🏆</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800,fontSize:14,color:WHITE }}>Your Activity Score</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:2 }}>World #{computedWorldRank} · Campus #{computedCampusRank}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:900,fontSize:24,color:WHITE,fontVariantNumeric:"tabular-nums" }}>{userScore.toLocaleString()}</div>
                <div style={{ fontSize:9,color:"rgba(255,255,255,0.7)",fontWeight:700,letterSpacing:"0.5px" }}>TOTAL PTS</div>
              </div>
            </div>
            <div style={{ ...glass(T,{borderRadius:14}),padding:"12px 16px" }}>
              <div style={{ fontWeight:700,fontSize:13,color:T.text,marginBottom:8 }}>⚡ How to Earn Points</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                {Object.entries(POINT_ACTIONS).map(([k,v])=>(
                  <div key={k} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 8px",borderRadius:8,background:T.inputBg,fontSize:11 }}>
                    <span style={{ color:T.muted }}>{k.replace(/_/g," ").toLowerCase()}</span>
                    <span style={{ color:SKY_BLUE,fontWeight:700 }}>+{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <Leaderboard T={T} selfUser={rankedUser}/>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab==="notifs"&&(
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <NotificationsView T={T} notifs={notifications} onProfileClick={handleViewProfile}/>
          </div>
        )}

        {/* ── MESSAGES  (adjustment #8: no header/bottom nav here) ── */}
        {activeTab==="messages"&&(
          <div style={{ animation:"tabFade 0.25s ease" }}>
            {/* Back button since header is hidden */}
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"14px 14px 8px",borderBottom:`1px solid ${T.divider}`,background:T.isDark?"rgba(0,0,0,0.94)":"rgba(240,238,255,0.94)",backdropFilter:"blur(14px)",position:"sticky",top:0,zIndex:50 }}>
              <button onClick={goBack} style={{ width:36,height:36,borderRadius:10,background:PURPLE_DIM,border:`1px solid ${PURPLE_BD}`,color:SKY_BLUE,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                <ArrowLeft size={18}/>
              </button>
              <div style={{ fontWeight:700,fontSize:17,color:T.text }}>Messages</div>
            </div>
            <MessagesView T={T} user={user} onViewProfile={handleViewProfile}/>
          </div>
        )}

        {/* ── ADS ── */}
        {activeTab==="ads"&&(
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <AdBoostView T={T} user={user} tokens={tokens} onSpendTokens={handleSpendTokens} onEarnClick={()=>setVerifyModalOpen(true)}/>
          </div>
        )}

        {/* ── SEARCH ── */}
        {activeTab==="search"&&(
          <div style={{ padding:14,display:"flex",flexDirection:"column",gap:12,animation:"tabFade 0.25s ease" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <button onClick={goBack} style={{ width:34,height:34,borderRadius:10,background:PURPLE_DIM,border:`1px solid ${PURPLE_BD}`,color:SKY_BLUE,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
                <ArrowLeft size={16}/>
              </button>
              <div style={{ flex:1,display:"flex",alignItems:"center",gap:10,background:T.inputBg,border:`1px solid ${PURPLE_BD}`,borderRadius:20,padding:"8px 14px" }}>
                <Search size={16} color={T.muted}/>
                <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search posts, friends, or tags..." style={{ flex:1,background:"none",border:"none",color:T.text,outline:"none",fontSize:13.5 }}/>
                {searchQuery&&<X size={16} color={T.muted} style={{ cursor:"pointer" }} onClick={()=>setSearchQuery("")}/>}
              </div>
            </div>
            <div style={{ display:"flex",borderBottom:`1px solid ${T.divider}` }}>
              {[{id:"posts",label:"Posts"},{id:"friends",label:"Friends"},{id:"tags",label:"Tags"}].map(sub=>(
                <button key={sub.id} onClick={()=>setSearchSubTab(sub.id)} style={{ flex:1,padding:"11px 0",background:"none",border:"none",fontSize:13,fontWeight:searchSubTab===sub.id?700:400,color:searchSubTab===sub.id?SKY_BLUE:T.muted,cursor:"pointer",borderBottom:searchSubTab===sub.id?`2px solid ${SKY_BLUE}`:"2px solid transparent",transition:"all 0.15s" }}>
                  {sub.label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12,marginTop:4 }}>
              {searchSubTab==="posts"&&(filteredPostsResults.length>0?filteredPostsResults.map((post,i)=>post.type==="video"?<VideoPostCard key={post.id} T={T} post={post} allPosts={myVideoPosts} setAllPosts={setMyVideoPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>:<PostCard key={post.id} T={T} post={post} allPosts={feedPosts} setAllPosts={setFeedPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>):<EmptyState emoji="📝" title="No matching posts" sub="Try different terms" T={T}/>)}
              {searchSubTab==="friends"&&(filteredFriendsResults.length>0?filteredFriendsResults.map(p=>(
                <div key={p.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 10px",borderBottom:`1px solid ${T.divider}`,cursor:"pointer",background:T.cardBg,borderRadius:10 }} onClick={()=>handleViewProfile(p.id)}>
                  <Avatar seed={p.seed||p.name} T={T}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:5 }}>{p.name}{p.verified&&<GlimacyBadge type={p.verifiedType||"blue"} size={13}/>}</div>
                    <div style={{ fontSize:12,color:T.muted }}>{p.handle||"No handle"}</div>
                    {p.relationshipStatus&&<div style={{ fontSize:11,color:SKY_BLUE,marginTop:2 }}>💙 {p.relationshipStatus}</div>}
                  </div>
                  {p.id!==user?.id&&(
                    <div onClick={e=>{e.stopPropagation();handleToggleFollow(p.id);}} style={{ padding:4,color:followingIds.has(p.id)?T.text:DARK_PURPLE }}>
                      {followingIds.has(p.id)?<UserCheck size={18}/>:<UserPlus size={18}/>}
                    </div>
                  )}
                </div>
              )):<EmptyState emoji="👥" title="No friends found" sub="Check spelling or try someone else" T={T}/>)}
              {searchSubTab==="tags"&&(filteredTagsResults.length>0?filteredTagsResults.map((post,i)=>post.type==="video"?<VideoPostCard key={post.id} T={T} post={post} allPosts={myVideoPosts} setAllPosts={setMyVideoPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>:<PostCard key={post.id} T={T} post={post} allPosts={feedPosts} setAllPosts={setFeedPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>):<EmptyState emoji="#️⃣" title="No matching tags" sub="Try #FUTA, #Tech, etc." T={T}/>)}
            </div>
          </div>
        )}

        {/* ── PROFILE (adjustment #8: no header/bottom nav) ── */}
        {activeTab==="profile"&&profileToShow&&(
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <ProfileView
              T={T} profileUser={profileToShow} isOwnProfile={isOwnProfile}
              onBack={handleExitProfile} onEdit={handleOpenEditModal}
              onVerify={()=>setVerifyModalOpen(true)}
              myVideoPosts={myVideoPosts} feedPosts={feedPosts}
              setFeedPosts={setFeedPosts} setMyVideoPosts={setMyVideoPosts}
              onViewProfile={handleViewProfile}
              isFollowing={followingIds.has(profileToShow.id)}
              onToggleFollow={handleToggleFollow} onImagePreview={handleImagePreview}
              onUpdateAvatar={handleUpdateAvatar} onUpdateCover={handleUpdateCover}
              savedPosts={savedArchive} onBackupToGmail={handleBackupToGmail}
              onUnsaveArchived={handleUnsaveArchived}
              hasActiveStory={profileHasActiveStory}
              onOpenStory={()=>openStoryViewer(profileStatusIndex)}
              onAddStatus={()=>setStatusComposerOpen(true)}
              tokens={tokens}
            />
          </div>
        )}
      </div>

      {/* ── BOTTOM NAV — hidden on Profile + Messages (adjustment #8) ── */}
      {!hideChrome&&(
        <div style={{
          position:"fixed",bottom:0,left:"50%",width:"100%",maxWidth:430,
          background:T.isDark?"rgba(0,0,0,0.97)":"rgba(240,238,255,0.97)",
          backdropFilter:"blur(16px)",borderTop:`1px solid ${PURPLE_BD}`,
          display:"flex",justifyContent:"space-around",padding:"8px 0 18px",zIndex:40,
          opacity:headerVisible?1:0,
          transform:headerVisible?"translateX(-50%) translateY(0)":"translateX(-50%) translateY(14px)",
          pointerEvents:headerVisible?"auto":"none",
          transition:"opacity 0.3s ease, transform 0.3s ease",
        }}>
          {BOTTOM_NAV.map(({ id,Icon,label })=>{
            const isActive=activeTab===id;
            return(
              <div key={id}
                onClick={()=>{ setNavHistory([id]); setActiveTab(id); if(id!=="profile")setViewingProfileId(null); }}
                style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,color:isActive?SKY_BLUE:T.muted,cursor:"pointer",flex:1,transition:"color 0.2s,transform 0.15s",transform:isActive?"translateY(-1px)":"translateY(0)" }}
              >
                <div style={{ ...(isActive?{filter:`drop-shadow(0 0 6px ${SKY_BLUE}88)`}:{}),position:"relative" }}>
                  <Icon size={19} strokeWidth={isActive?2.5:2}/>
                  {id==="ads"&&<span style={{ position:"absolute",top:-4,right:-6,background:DARK_PURPLE,color:WHITE,fontSize:7,fontWeight:900,borderRadius:99,padding:"1px 4px",lineHeight:1 }}>NEW</span>}
                </div>
                <span style={{ fontSize:9.5,fontWeight:isActive?700:400 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {isEditModalOpen&&(
        <EditProfileModal
          T={T} user={user}
          editName={editName}               setEditName={setEditName}
          editHandle={editHandle}           setEditHandle={setEditHandle}
          editBio={editBio}                 setEditBio={setEditBio}
          editUni={editUni}                 setEditUni={setEditUni}
          editFaculty={editFaculty}         setEditFaculty={setEditFaculty}
          editRelationship={editRelationship} setEditRelationship={setEditRelationship}
          editGender={editGender}           setEditGender={setEditGender}
          editPhone={editPhone}             setEditPhone={setEditPhone}
          editHobby={editHobby}             setEditHobby={setEditHobby}
          editEmail={editEmail}             setEditEmail={setEditEmail}
          onSave={handleSaveProfile}
          onClose={()=>setIsEditModalOpen(false)}
        />
      )}
      {statusComposerOpen&&(
        <StatusComposerModal T={T} onClose={()=>setStatusComposerOpen(false)}
          onSubmit={(partial)=>{ setMyStatusItems(prev=>[{id:uid("st"),createdAt:Date.now(),...partial},...prev]); setStatusComposerOpen(false); showToast("Status posted to your story!"); }}
        />
      )}
      {storyViewerIndex!==null&&(
        <StoryViewerModal
          T={T} statusFeed={statusFeedForBar} startIndex={storyViewerIndex}
          seenIds={seenStatusItemIds} setSeenIds={setSeenStatusItemIds}
          onDeleteMyItem={(itemId)=>setMyStatusItems(prev=>prev.filter(it=>it.id!==itemId))}
          onClose={closeStoryViewer}
          statusLikes={statusLikes} setStatusLikes={setStatusLikes}
          statusViews={statusViews} setStatusViews={setStatusViews}
          currentUser={user} onPoints={addPoints}
        />
      )}

      <Toast T={T} message={toast}/>

      {/* Feedback panel (adjustment #2) */}
      <FeedbackPanel T={T} open={feedbackOpen} onClose={()=>setFeedbackOpen(false)}/>

      {/* Settings panel (adjustment #2) */}
      <SettingsPanel
        T={T} open={settingsOpen} onClose={()=>setSettingsOpen(false)}
        themeMode={themeMode} setThemeMode={setThemeMode}
        fontSize={fontSize}   setFontSize={setFontSize}
        onSignOut={()=>supabase.auth.signOut()}
      />
    </div>
  );
}