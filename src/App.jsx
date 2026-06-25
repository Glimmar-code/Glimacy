/**
 * App.jsx  — Glimacy v3 (Adjustment Pass)
 * Colors: pure BLACK background · DARK PURPLE verified badges · PINK + WHITE
 *         secondary accents · WHITE text. Primary brand action color stays
 *         the brighter DEEP PURPLE so buttons/links remain readable on black.
 * Header: Search · Feedback · Settings · Messages — the leading avatar slot
 *         morphs into a Back arrow whenever you're not at the root of a tab,
 *         see the navigation-stack section below.
 * Verified:
 *   — Blue  tick : existing token/card flow (Premium/Pro)
 *   — White tick : ₦2,500 OR 10,000 tokens  +  20 verified followers  +  50 posts
 *   — Both render in DARK PURPLE now (tier is communicated by label/ring, not hue)
 * Posts: handleCreatePost below is the SINGLE place posts get persisted —
 *        verified users upsert to Supabase + go public; unverified users are
 *        saved to IndexedDB (this device only) and reloaded on every refresh,
 *        and either way the post immediately shows in the Home feed AND on
 *        the author's own Profile (Profile.jsx reads from the same feedPosts
 *        array), which is what "make a post → it should be public + show on
 *        my profile" needed.
 * Navigation: a real back-stack (navStack) + the browser History API so the
 *        back arrow / hardware back button steps Profile → Search → Home
 *        instead of jumping straight to Home. Switching a bottom-tab resets
 *        the stack to that tab's root; drilling into a profile/search/
 *        messages pushes onto it.
 * Chrome visibility: the top header + bottom tab bar hide on Messages and on
 *        any profile (own or someone else's), and slide fully off-screen
 *        (not just fade) on scroll-down in Home, X/Twitter-style.
 * Swipe: dragging left/right on Home/Connect/Ranking/Notifs/Ads moves you
 *        through the bottom-nav order with a live rubber-band follow and a
 *        WhatsApp-style snap-back when the drag doesn't clear the threshold.
 * handleSaveProfile: full upsert to Supabase profiles table, now also
 *        uploads the avatar/cover File objects EditProfileModal hands back,
 *        and includes the new public email field.
 * Season Rewards section in Ranking (cash prizes — coming soon banner)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Home, Users, Trophy, Bell, Send, Search,
  Heart, MessageCircle, Repeat2, Bookmark, Eye,
  MoreHorizontal, ArrowLeft, X, UserPlus, UserCheck,
  Camera, Share2, Copy, Video, Play, Flag, CornerUpLeft,
  ShieldCheck, Coins, Trash2, Sun, Moon, Monitor, ChevronRight,
  Plus, Flame, RefreshCw, Image as ImageIcon, Type as TypeIcon,
  Megaphone, CreditCard, PlayCircle, CheckCircle2, Zap, Target,
  TrendingUp, UserCheck2, Radio, MessageSquare, Settings, Gift,
  ChevronLeft, LogOut, BellRing, BellOff, Mail,
} from "lucide-react";

import { Avatar }                                    from "./components/ui/Avatar";
import { ActionBtn }                                 from "./components/ui/ActionBtn";
import { VerifiedBadge, Tag, EmptyState, ActionBadgeBtn } from "./components/ui/Shared";
import Login                                         from "./components/ui/Login";
import { supabase }                                  from "./services/supabaseClient";
import EditProfileModal                              from "./components/features/Profile/EditProfileModal";
import CreatePostModal, { CreatePostFAB }            from "./components/ui/CreatePostModal";
import ConnectHubView                                from "./components/features/Connect/ConnectHubView";
import NotificationsView                             from "./components/features/Notifications/NotificationsView";
import Leaderboard                                   from "./components/features/leaderboard/Leaderboard";
import LeaderboardHeader                             from "./components/features/leaderboard/LeaderboardHeader";
import MessagesView                                  from "./components/features/Messages/MessagesView";
import ProfileView                                   from "./components/features/Profile/Profile";

// ─── BRAND: BLACK · DEEP PURPLE (primary) · DARK PURPLE (badges) · PINK (secondary) · WHITE ──
export const PURPLE       = "#7C3AED";   // deep purple — primary brand accent (buttons, active states)
export const PURPLE_DIM   = "rgba(124,58,237,0.14)";
export const PURPLE_BD    = "rgba(124,58,237,0.32)";
export const PURPLE_GLOW  = "rgba(124,58,237,0.50)";

export const DARK_PURPLE      = "#3B0764";  // verified-badge color (both Blue & White tiers render here)
export const DARK_PURPLE_DIM  = "rgba(59,7,100,0.30)";
export const DARK_PURPLE_BD   = "rgba(124,58,237,0.45)";
export const DARK_PURPLE_GLOW = "rgba(124,58,237,0.65)";

export const PINK          = "#FF4FA3";  // secondary accent — likes, highlights, status dots
export const PINK_DIM      = "rgba(255,79,163,0.14)";
export const PINK_BD       = "rgba(255,79,163,0.34)";
export const PINK_GLOW     = "rgba(255,79,163,0.55)";

export const BLACK        = "#000000";   // true black — app background, as requested
export const OFF_BLACK    = "#000000";
export const CARD_BLACK   = "#0D0710";   // barely-lifted surface so cards still read against black
export const WHITE        = "#FFFFFF";
export const OFF_WHITE    = "#FFFFFF";   // primary text is pure white now

// Kept as GOLD aliases so existing imports don't break
export const GOLD         = PURPLE;
export const GOLD_BRIGHT  = "#9B5BFA";
export const GOLD_DIM     = PURPLE_DIM;
export const GOLD_BORDER  = PURPLE_BD;
export const GOLD_GLOW    = PURPLE_GLOW;
export const BRAND_GRAD   = `linear-gradient(135deg,${PURPLE},#5B21B6)`;

export const accent       = () => PURPLE;
export const accentDim    = () => PURPLE_DIM;
export const accentBorder = () => PURPLE_BD;
export const accentGlow   = () => PURPLE_GLOW;

export const C = {
  gold: PURPLE, goldBright: GOLD_BRIGHT, goldGlow: PURPLE_GLOW,
  silver: "#C0C0C0", bronze: "#CD7F32",
  online: "#22c55e", danger: "#ef4444", pink: PINK,
  facebook: "#1877F2",
};

export const TOKEN_ECONOMY = {
  tokensPerAd:       25,
  nairaPerTenTokens: 20,
  tokensToVerify:    500,    // blue verified
  cardVerifyPrice:   500,    // ₦500 — blue
  whiteTokenCost:    10000,  // white verified: 10,000 tokens
  whiteNairaCost:    2500,   // white verified: ₦2,500
  whiteMinFollowers: 20,     // 20 verified followers needed
  whiteMinPosts:     50,     // 50 posts needed
};

// ─── THEMES  ─────────────────────────────────────────────────────────────────
const THEMES = {
  glimacy: {
    id: "glimacy", label: "Dark Mode",
    bg: BLACK, surface: CARD_BLACK,
    cardBg: "rgba(124,58,237,0.07)",
    cardBorder: PURPLE_BD,
    cardShadow: "0 4px 32px rgba(0,0,0,0.85),inset 0 1px 0 rgba(124,58,237,0.08)",
    text: WHITE, muted: "#9C8FB8", mutedMid: "#B8ACDA",
    inputBg: "rgba(124,58,237,0.09)", inputBorder: "rgba(124,58,237,0.22)",
    pillBorder: "rgba(124,58,237,0.14)", divider: "rgba(124,58,237,0.14)",
    hoverBg: "rgba(124,58,237,0.10)", sentBg: PURPLE, sentText: "#fff",
    recvBg: "rgba(255,255,255,0.06)", recvText: WHITE,
    coverGrad: `linear-gradient(135deg,${BLACK},#1A0030,${BLACK})`,
    accent: PURPLE, secondary: PINK, secondaryDim: PINK_DIM, secondaryBd: PINK_BD,
    badge: DARK_PURPLE, badgeDim: DARK_PURPLE_DIM, badgeBd: DARK_PURPLE_BD,
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
    coverGrad: "linear-gradient(135deg,#F0EEFF,#DDD4FF,#F0EEFF)",
    accent: PURPLE, secondary: PINK, secondaryDim: PINK_DIM, secondaryBd: PINK_BD,
    badge: DARK_PURPLE, badgeDim: DARK_PURPLE_DIM, badgeBd: DARK_PURPLE_BD,
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const FUTA_FACULTIES = ["SESE","SIMME","SLS","SOC","SPS","SAAT","SBMS","SLIT","SEMS","SET"];

const MOCK_USER = {
  id: "me", name: "Glimacy Dev", handle: "@glimacy.dev", verified: false,
  verifiedType: null,  // "blue" | "white" | null
  bio: "Building the future, one commit at a time 🚀",
  university: "Federal University of Technology, Akure (FUTA)",
  faculty: "SLIT", gender: "Male", tokens: 80,
  posts: 127, followers_count: 0, following_count: 0,
  worldRank: 47, campusRank: 12, score: 2100,
  isOnline: true, lastSeen: null,
  relationshipStatus: "Single",
  phone: "8012345678",
  email: "",            // shown publicly on profile when set — see Edit Profile
  emailPublic: true,
  website: "https://glimacy.com",
  hobby: "I love coding and building things",
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
    likes:319, comments:[], reposts:44, saves:12, views:2100, liked:false, saved:false, reposted:false },
  { id:"fp2", authorId:"u2", author:"Amina Yusuf", handle:"@amina_tech",
    seed:"AY", time:"5h", type:"text",
    content:"AI is not replacing you. A human using AI is. Stay ahead, keep learning 🤖✨ #UNILAG #Tech",
    likes:512, comments:[], reposts:88, saves:34, views:4100, liked:false, saved:false, reposted:false },
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

const LS_KEYS = {
  myStatuses:      "glimacy_my_status_items_v2",
  seenStatusItems: "glimacy_seen_status_items_v2",
  savedArchive:    "glimacy_saved_posts_v2",
  likedIds:        "glimacy_liked_post_ids_v2",
  feedPosts:       "glimacy_feed_posts_v2",
  videoPosts:      "glimacy_video_posts_v2",
  userScore:       "glimacy_user_score_v2",
  statusLikes:     "glimacy_status_likes_v2",
  statusViews:     "glimacy_status_views_v2",
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

const loadLS = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
};
const saveLS = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ─── IndexedDB — local-only post drafts for unverified users ────────────────
// Why: an unverified user's posts must keep showing on THIS device (Home +
// their own Profile) across refreshes, without ever reaching Supabase. A
// plain JS object in React state disappears on reload, so we mirror it here.
const IDB_NAME = "glimacy_local_drafts";
const IDB_STORE = "posts";
const openLocalDraftsDB = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === "undefined") { reject(new Error("indexedDB unavailable")); return; }
  const req = indexedDB.open(IDB_NAME, 1);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: "id" });
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror   = () => reject(req.error);
});
const idbAddLocalPost = async (post) => {
  try {
    const db = await openLocalDraftsDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(post);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch (err) { console.error("idbAddLocalPost failed:", err); }
};
const idbDeleteLocalPost = async (id) => {
  try {
    const db = await openLocalDraftsDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch (err) { console.error("idbDeleteLocalPost failed:", err); }
};
const idbGetAllLocalPosts = async () => {
  try {
    const db = await openLocalDraftsDB();
    return await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror   = () => rej(req.error);
    });
  } catch { return []; }
};

// ─── Supabase Storage — upload a File, fall back to its local blob/data URL
//     if storage isn't reachable (so the UI never breaks in dev) ────────────
const uploadToStorage = async (bucket, file, pathPrefix, fallbackUrl) => {
  if (!file) return fallbackUrl || null;
  try {
    const ext  = (file.name?.split(".").pop() || "jpg").toLowerCase();
    const path = `${pathPrefix}/${uid("f")}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || fallbackUrl || null;
  } catch (err) {
    console.error(`Storage upload to "${bucket}" failed, keeping local preview:`, err?.message || err);
    return fallbackUrl || null;
  }
};

let _uidN = 0;
const uid = (prefix = "id") => `${prefix}_${Date.now()}_${_uidN++}`;
const STATUS_TTL_MS     = 24 * 60 * 60 * 1000;
const STATUS_BG_PRESETS = [
  `linear-gradient(135deg,${PURPLE},#3B0090)`,
  "linear-gradient(135deg,#000000,#1A0030)",
  "linear-gradient(135deg,#1A0030,#4C1D95)",
  "linear-gradient(135deg,#000000,#2D0050)",
  `linear-gradient(135deg,#5B21B6,${PURPLE})`,
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

// ─── VERIFIED BADGE (Blue or White tier — both render DARK PURPLE) ───────────
export const GlimacyBadge = ({ type = "blue", size = 15 }) => {
  const isWhite = type === "white";
  return (
    <div
      title={isWhite ? "White Verified — Campus Elite" : "Blue Verified — Premium/Pro"}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg,${DARK_PURPLE},#1A0330)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.55, color: WHITE, fontWeight: 900,
        border: isWhite ? `1.4px solid ${WHITE}` : "none",
        boxShadow: isWhite
          ? `0 0 7px ${DARK_PURPLE_GLOW}, 0 0 0 1px rgba(255,255,255,0.25)`
          : `0 0 7px ${DARK_PURPLE_GLOW}`,
      }}
    >✓</div>
  );
};

// ─── VERIFY MODAL  ────────────────────────────────────────────────────────────
const VerifyModal = ({ T, tokens, user, onClose, onVerified, onEarnedTokens }) => {
  const [tab,          setTab]          = useState("blue"); // blue | white
  const [step,         setStep]         = useState("options"); // options | watchAd | watchingAd | cardPay
  const [adCount,      setAdCount]      = useState(0);
  const [watchProgress,setWatchProgress]= useState(0);
  const timerRef = useRef(null);

  const userPostCount     = user?.posts || 0;
  const verifiedFollowers = 0; // in a real app fetch from DB
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

  const baseStyle = {
    position:"fixed", inset:0, zIndex:200, display:"flex", justifyContent:"center",
    alignItems:"center", background:"rgba(0,0,0,0.88)", backdropFilter:"blur(12px)", padding:16,
  };
  const boxStyle = {
    background: T.isDark ? "#0A0012" : "#fff",
    border: `1px solid ${PURPLE_BD}`,
    boxShadow: `0 0 60px ${PURPLE_GLOW}`,
    width: 330, borderRadius: 24, padding: 28, position:"relative", textAlign:"center",
  };

  return (
    <div style={baseStyle}>
      <div style={boxStyle}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", color:T.muted, cursor:"pointer" }}><X size={18}/></button>

        {/* Tab: Blue / White */}
        {step === "options" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:18 }}>
              {["blue","white"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex:1, padding:"9px 0", borderRadius:12, border:`2px solid ${tab===t?PURPLE:T.inputBorder}`,
                  background: tab===t ? PURPLE_DIM : "transparent",
                  color: tab===t ? WHITE : T.muted, fontWeight:700, fontSize:13, cursor:"pointer",
                }}>
                  <GlimacyBadge type={t} size={13}/>&nbsp; {t === "blue" ? "Blue Verified" : "White Verified"}
                </button>
              ))}
            </div>

            {tab === "blue" && (
              <>
                <div style={{ fontSize:36, marginBottom:8 }}>🔵</div>
                <h3 style={{ margin:"0 0 4px", fontSize:17, fontWeight:800, color:PURPLE }}>Blue Verified</h3>
                <p style={{ margin:"0 0 16px", fontSize:12, color:T.muted }}>Premium / Pro — use 500 tokens or pay ₦500</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {canBlueTokens ? (
                    <button onClick={() => { onVerified("blue_tokens"); onClose(); }} style={{ padding:13, borderRadius:12, border:"none", background:PURPLE, color:WHITE, fontWeight:800, fontSize:13, cursor:"pointer" }}>
                      🪙 Use 500 Tokens
                    </button>
                  ) : (
                    <button onClick={() => setStep("watchAd")} style={{ padding:13, borderRadius:12, border:`1.5px solid ${PURPLE_BD}`, background:PURPLE_DIM, color:PURPLE, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      📺 Earn Tokens (need {TOKEN_ECONOMY.tokensToVerify - tokens} more)
                    </button>
                  )}
                  <button onClick={() => setStep("cardPay")} style={{ padding:13, borderRadius:12, border:"none", background:PURPLE, color:WHITE, fontWeight:800, fontSize:13, cursor:"pointer" }}>
                    💳 Pay ₦{TOKEN_ECONOMY.cardVerifyPrice.toLocaleString()}
                  </button>
                </div>
              </>
            )}

            {tab === "white" && (
              <>
                <div style={{ fontSize:36, marginBottom:8 }}>⚪</div>
                <h3 style={{ margin:"0 0 4px", fontSize:17, fontWeight:800, color:WHITE }}>White Verified</h3>
                <p style={{ margin:"0 0 8px", fontSize:12, color:T.muted }}>Campus Elite status — requirements:</p>
                <div style={{ background:PURPLE_DIM, border:`1px solid ${PURPLE_BD}`, borderRadius:12, padding:"10px 14px", marginBottom:14, textAlign:"left" }}>
                  {[
                    [`At least 20 verified followers`, verifiedFollowers >= 20],
                    [`At least 50 posts made`,         userPostCount >= 50],
                    [`Pay ₦2,500 OR 10,000 tokens`,    true],
                  ].map(([label, met]) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color: met ? "#22c55e" : T.muted, padding:"3px 0" }}>
                      <span>{met ? "✅" : "❌"}</span> {label}
                    </div>
                  ))}
                </div>
                {!canWhite && (
                  <p style={{ fontSize:11, color:"#ef4444", marginBottom:12 }}>
                    Requirements not met yet — keep posting and building followers!
                  </p>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button
                    disabled={!canWhiteTokens}
                    onClick={() => canWhiteTokens && (onVerified("white_tokens"), onClose())}
                    style={{ padding:13, borderRadius:12, border:"none", background:canWhiteTokens ? PURPLE : T.inputBg, color:canWhiteTokens ? WHITE : T.muted, fontWeight:800, fontSize:13, cursor:canWhiteTokens?"pointer":"default" }}
                  >
                    🪙 Use 10,000 Tokens
                  </button>
                  <button
                    disabled={!canWhite}
                    onClick={() => canWhite && setStep("cardPayWhite")}
                    style={{ padding:13, borderRadius:12, border:"none", background:canWhite ? PURPLE : T.inputBg, color:canWhite ? WHITE : T.muted, fontWeight:800, fontSize:13, cursor:canWhite?"pointer":"default" }}
                  >
                    💳 Pay ₦2,500
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* WATCH AD */}
        {(step === "watchAd" || step === "watchingAd") && (
          <>
            <div style={{ fontSize:44, marginBottom:10 }}>📺</div>
            <h3 style={{ margin:"0 0 6px", fontSize:17, fontWeight:800, color:PURPLE }}>
              {step === "watchingAd" ? "Ad Playing…" : "Earn Tokens"}
            </h3>
            {step === "watchingAd" ? (
              <>
                <div style={{ height:9, borderRadius:99, background:T.divider, overflow:"hidden", margin:"14px 0 10px" }}>
                  <div style={{ height:"100%", width:`${watchProgress}%`, background:PURPLE, borderRadius:99, transition:"width 0.06s linear" }}/>
                </div>
                <p style={{ fontSize:12, color:T.muted }}>{watchProgress}%</p>
              </>
            ) : (
              <>
                <p style={{ fontSize:12, color:T.muted, marginBottom:14 }}>You have <strong style={{ color:PURPLE }}>{tokens}</strong> tokens. Ads watched: {adCount}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button onClick={watchAd} style={{ padding:13, borderRadius:12, border:"none", background:PURPLE, color:WHITE, fontWeight:800, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <PlayCircle size={17}/> Watch Ad (+{TOKEN_ECONOMY.tokensPerAd} tokens)
                  </button>
                  <button onClick={() => setStep("options")} style={{ padding:11, borderRadius:12, border:`1px solid ${T.inputBorder}`, background:"transparent", color:T.muted, fontWeight:600, fontSize:12, cursor:"pointer" }}>
                    ← Back
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* CARD PAY (blue ₦500 or white ₦2500) */}
        {(step === "cardPay" || step === "cardPayWhite") && (() => {
          const isWhitePay = step === "cardPayWhite";
          const price = isWhitePay ? TOKEN_ECONOMY.whiteNairaCost : TOKEN_ECONOMY.cardVerifyPrice;
          return (
            <>
              <div style={{ fontSize:40, marginBottom:8 }}>💳</div>
              <h3 style={{ margin:"0 0 4px", fontSize:17, fontWeight:800, color:PURPLE }}>Pay ₦{price.toLocaleString()}</h3>
              <p style={{ fontSize:12, color:T.muted, marginBottom:14 }}>
                One-time payment for {isWhitePay ? "White" : "Blue"} Verified
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                {[["Card Number","•••• •••• •••• 0000"],["Expiry","MM / YY"],["CVV","•••"]].map(([label,ph]) => (
                  <div key={label} style={{ textAlign:"left" }}>
                    <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>{label}</div>
                    <input placeholder={ph} style={{ width:"100%", padding:"9px 12px", borderRadius:9, background:T.inputBg, border:`1px solid ${PURPLE_BD}`, color:T.text, outline:"none", fontSize:13 }}/>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <button onClick={() => { onVerified(isWhitePay ? "white_card" : "blue_card"); onClose(); }}
                  style={{ padding:13, borderRadius:12, border:"none", background:PURPLE, color:WHITE, fontWeight:800, fontSize:13, cursor:"pointer" }}>
                  Pay ₦{price.toLocaleString()} Now
                </button>
                <button onClick={() => setStep("options")} style={{ padding:11, borderRadius:12, border:`1px solid ${T.inputBorder}`, background:"transparent", color:T.muted, fontWeight:600, fontSize:12, cursor:"pointer" }}>
                  ← Back
                </button>
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
  <div style={{ display:"flex", gap:8 }}>
    {!user?.verified && (
      <button onClick={onVerifyClick} style={{
        flex:1, padding:"10px 12px", borderRadius:12, border:`1.5px solid ${PURPLE_BD}`,
        background:PURPLE_DIM, color:PURPLE, fontSize:13, fontWeight:700, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      }}>
        <ShieldCheck size={15}/> Get Verified
      </button>
    )}
    <button onClick={onEarnClick} style={{
      flex:1, padding:"10px 12px", borderRadius:12, border:"none",
      background:PURPLE, color:WHITE, fontSize:13, fontWeight:700, cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    }}>
      <Coins size={15}/> 🪙 {tokens} Tokens
    </button>
  </div>
);

// ─── SEASON REWARDS PANEL  ────────────────────────────────────────────────────
const SeasonRewards = ({ T }) => {
  const prizes = [
    { place:"🥇 1st Place", prize:"₦50,000 Cash + Gold Badge", color:"#FFD700" },
    { place:"🥈 2nd Place", prize:"₦25,000 Cash + Silver Badge", color:"#C0C0C0" },
    { place:"🥉 3rd Place", prize:"₦10,000 Cash + Bronze Badge", color:"#CD7F32" },
  ];
  return (
    <div style={{
      ...glass(T, { borderRadius:16 }), padding:"16px",
      border:`1px solid ${PURPLE_BD}`, marginBottom:2,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <Gift size={18} color={PURPLE}/>
        <div style={{ fontWeight:800, fontSize:15, color:T.text }}>Season 1 Rewards</div>
        <div style={{ marginLeft:"auto", background:PURPLE_DIM, border:`1px solid ${PURPLE_BD}`, borderRadius:8, padding:"3px 10px", fontSize:11, fontWeight:700, color:PURPLE }}>
          Coming Soon
        </div>
      </div>
      <p style={{ margin:"0 0 12px", fontSize:12, color:T.muted }}>Top ranked players at the end of Season 1 will receive real cash prizes.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {prizes.map(p => (
          <div key={p.place} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(0,0,0,0.3)", border:`1px solid ${PURPLE_BD}`, borderRadius:12, padding:"10px 14px" }}>
            <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.place}</span>
            <span style={{ fontSize:12, fontWeight:600, color:p.color }}>{p.prize}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, background:"rgba(0,0,0,0.4)", border:`1px dashed ${PURPLE_BD}`, borderRadius:10, padding:"10px 14px", textAlign:"center" }}>
        <p style={{ margin:0, fontSize:11, color:T.muted }}>🔒 Rewards unlock when Season 1 ends. Keep ranking up to compete!</p>
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

  const tier = AD_TIERS[selectedTier];
  const tCost = tier ? tokenCost(tier.price) : 0;
  const canAffordTokens = tier && tokens >= tCost;
  const formatNaira = (n) => `₦${n.toLocaleString()}`;

  const watchAd = () => {
    setAdWatchStep("watching"); setWatchProgress(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 2; setWatchProgress(p);
      if (p >= 100) { clearInterval(timerRef.current); setAdsWatched(c => c+1); onSpendTokens(-TOKEN_ECONOMY.tokensPerAd); setAdWatchStep("watch"); }
    }, 60);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  if (adWatchStep === "watch" || adWatchStep === "watching") {
    return (
      <div style={{ padding:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <ArrowLeft size={20} color={T.text} style={{ cursor:"pointer" }} onClick={() => setAdWatchStep(null)}/>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:T.text }}>Earn Tokens</h2>
        </div>
        <div style={{ ...glass(T, { borderRadius:18 }), padding:24, textAlign:"center" }}>
          <div style={{ fontSize:44, marginBottom:10 }}>📺</div>
          <div style={{ fontSize:16, fontWeight:700, color:PURPLE, marginBottom:4 }}>
            {adWatchStep==="watching" ? "Ad Playing…" : "Watch Ads, Earn Tokens"}
          </div>
          {adWatchStep==="watching" ? (
            <>
              <div style={{ height:9, borderRadius:99, background:T.divider, overflow:"hidden", margin:"18px 0 10px" }}>
                <div style={{ height:"100%", width:`${watchProgress}%`, background:PURPLE, borderRadius:99, transition:"width 0.06s linear" }}/>
              </div>
              <p style={{ fontSize:12, color:T.muted }}>{watchProgress}%</p>
            </>
          ) : (
            <>
              <p style={{ fontSize:13, color:T.muted, margin:"0 0 16px" }}>
                🪙 <strong style={{ color:PURPLE }}>{tokens} tokens</strong> · Ads watched: {adsWatched}
              </p>
              <button onClick={watchAd} style={{ width:"100%", padding:14, borderRadius:13, border:"none", background:PURPLE, color:WHITE, fontWeight:800, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <PlayCircle size={18}/> Watch Ad (+{TOKEN_ECONOMY.tokensPerAd} tokens)
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ padding:16, textAlign:"center" }}>
        <div style={{ ...glass(T, { borderRadius:18 }), padding:36, marginTop:20 }}>
          <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
          <h2 style={{ margin:"0 0 8px", color:PURPLE, fontSize:22, fontWeight:900 }}>Boost Live!</h2>
          <p style={{ margin:"0 0 20px", fontSize:14, color:T.muted }}>
            Your post is now shown to <strong style={{ color:T.text }}>{tier?.people?.toLocaleString()} people</strong> for <strong style={{ color:T.text }}>{tier?.days} day{tier?.days>1?"s":""}</strong>.
          </p>
          <button onClick={() => { setStep("build"); setSelectedTier(null); }} style={{ padding:"12px 24px", borderRadius:13, border:"none", background:PURPLE, color:WHITE, fontWeight:700, fontSize:14, cursor:"pointer" }}>
            Boost Another Post
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"0 0 80px" }}>
      <div style={{ padding:"16px 16px 14px", borderBottom:`1px solid ${T.divider}`, background:T.isDark?"rgba(0,0,0,0.96)":"rgba(255,255,255,0.96)", backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          <Megaphone size={20} color={PURPLE}/>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:T.text }}>Boost Your Post</h2>
        </div>
        <p style={{ margin:0, fontSize:12, color:T.muted }}>Reach more people — card or tokens</p>
      </div>

      <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
        <div onClick={() => setAdWatchStep("watch")} style={{ background:PURPLE_DIM, border:`1px solid ${PURPLE_BD}`, borderRadius:14, padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:28 }}>📺</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:PURPLE }}>Earn Tokens by Watching Ads</div>
            <div style={{ fontSize:11, color:T.muted }}>1 ad = {TOKEN_ECONOMY.tokensPerAd} tokens · You have 🪙{tokens}</div>
          </div>
          <ChevronRight size={16} color={PURPLE}/>
        </div>

        <div style={{ ...glass(T, { borderRadius:14 }), padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
            <Target size={14} color={PURPLE}/> Target Audience
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {["Male","Female","Both"].map(g => (
              <button key={g} onClick={() => setGender(g)} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", background:gender===g?PURPLE:T.inputBg, color:gender===g?WHITE:T.muted, fontWeight:gender===g?700:500, fontSize:13, cursor:"pointer" }}>
                {g==="Male"?"👨 Male":g==="Female"?"👩 Female":"👥 Both"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
            <TrendingUp size={14} color={PURPLE}/> Choose a Plan
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {AD_TIERS.map((t, i) => {
              const sel = selectedTier === i;
              return (
                <div key={i} onClick={() => setSelectedTier(i)} style={{ ...glass(T, { borderRadius:14 }), padding:"12px 14px", cursor:"pointer", border:`1.5px solid ${sel?PURPLE:T.cardBorder}`, background:sel?PURPLE_DIM:T.cardBg }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <span style={{ fontWeight:700, fontSize:14, color:sel?PURPLE:T.text }}>{t.label}</span>
                      {t.starterOnly && <span style={{ fontSize:10, color:T.muted, marginLeft:6 }}>(1-day only)</span>}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:800, fontSize:15, color:sel?PURPLE:T.text }}>{formatNaira(t.price)}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{tokenCost(t.price).toLocaleString()} tokens</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{t.people.toLocaleString()} people · {t.days} day{t.days>1?"s":""}</div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedTier !== null && (
          <>
            <div style={{ ...glass(T, { borderRadius:14 }), padding:16 }}>
              <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:12 }}>💳 Payment Method</div>
              <div style={{ display:"flex", gap:8 }}>
                {["card","tokens"].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{ flex:1, padding:"10px 0", borderRadius:10, border:`1.5px solid ${payMethod===m?PURPLE:T.inputBorder}`, background:payMethod===m?PURPLE_DIM:"transparent", color:payMethod===m?PURPLE:T.muted, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    {m === "card" ? "💳 Card" : "🪙 Tokens"}
                  </button>
                ))}
              </div>
              {payMethod === "tokens" && !canAffordTokens && (
                <p style={{ fontSize:11, color:"#ef4444", margin:"8px 0 0" }}>
                  You need {tCost.toLocaleString()} tokens but have {tokens}. Watch ads to earn more!
                </p>
              )}
            </div>
            <button
              disabled={payMethod==="tokens"&&!canAffordTokens}
              onClick={() => { if(payMethod==="tokens"&&!canAffordTokens)return; setStep("success"); if(payMethod==="tokens")onSpendTokens(tCost); }}
              style={{ width:"100%", padding:14, borderRadius:13, border:"none", background:(payMethod==="tokens"&&!canAffordTokens)?T.inputBg:PURPLE, color:(payMethod==="tokens"&&!canAffordTokens)?T.muted:WHITE, fontWeight:800, fontSize:15, cursor:(payMethod==="tokens"&&!canAffordTokens)?"default":"pointer" }}
            >
              Boost for {formatNaira(tier?.price||0)}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── STORY RING & BAR ─────────────────────────────────────────────────────────
const StoryRing = ({ T, entry, seenIds, onAvatarClick, onAddClick }) => {
  const hasItems = (entry.items||[]).length > 0;
  const isActive = hasItems && (entry.items||[]).some(it => !seenIds.has(it.id));
  const ringGrad = entry.isMe
    ? (hasItems ? PURPLE : T.divider)
    : (isActive ? PURPLE : T.divider);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, flexShrink:0, width:64 }}>
      <div onClick={() => { if(hasItems)onAvatarClick(); else if(entry.isMe)onAddClick(); }}
        style={{ position:"relative", width:60, height:60, borderRadius:"50%", padding:2.5, background:ringGrad, cursor:(hasItems||entry.isMe)?"pointer":"default", animation:isActive?"storyPulse 2.4s ease-in-out infinite":"none" }}>
        <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:T.bg, padding:2 }}>
          <div style={{ width:"100%", height:"100%", borderRadius:"50%", overflow:"hidden", background:entry.avatarUrl?"transparent":`linear-gradient(135deg,${PURPLE}99,${PURPLE})`, display:"flex", alignItems:"center", justifyContent:"center", color:WHITE, fontWeight:700, fontSize:18 }}>
            {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : (entry.seed||entry.name||"U")[0]?.toUpperCase()}
          </div>
        </div>
        {entry.trending && (
          <div style={{ position:"absolute", top:-2, right:-2, width:19, height:19, borderRadius:"50%", background:"#FF6B35", display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${T.bg}` }}>
            <Flame size={10} color="#fff" fill="#fff"/>
          </div>
        )}
        {entry.isMe && (
          <div onClick={e=>{e.stopPropagation();onAddClick();}} style={{ position:"absolute", bottom:-2, right:-2, width:20, height:20, borderRadius:"50%", background:PURPLE, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${T.bg}`, cursor:"pointer" }}>
            <Plus size={12} color={WHITE} strokeWidth={3}/>
          </div>
        )}
      </div>
      <span style={{ fontSize:10.5, color:T.muted, maxWidth:62, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {entry.isMe ? "Your Story" : entry.name}
      </span>
    </div>
  );
};
const StoryBar = ({ T, statusFeed, seenIds, onAvatarClick, onAddClick }) => (
  <div style={{ display:"flex", gap:14, overflowX:"auto", padding:"2px 2px 10px" }}>
    {statusFeed.map((entry, idx) => (
      <StoryRing key={entry.userId} T={T} entry={entry} seenIds={seenIds} onAvatarClick={() => onAvatarClick(idx)} onAddClick={onAddClick}/>
    ))}
  </div>
);

// ─── STORY VIEWER ────────────────────────────────────────────────────────────
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
    <div style={{position:"fixed",inset:0,zIndex:300,background:"#000",display:"flex",flexDirection:"column"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,padding:"12px 12px 8px",display:"flex",gap:4}}>
        {currentUser.items.map((_,i)=>(
          <div key={i} style={{flex:1,height:2.5,borderRadius:99,background:"rgba(255,255,255,0.3)",overflow:"hidden"}}>
            <div style={{height:"100%",background:"#fff",width:`${i<itemIdx?100:i===itemIdx?progress:0}%`,transition:"width 0.1s linear"}}/>
          </div>
        ))}
      </div>
      <div style={{position:"absolute",top:28,left:0,right:0,zIndex:10,display:"flex",alignItems:"center",padding:"0 14px",gap:10}}>
        <div style={{width:34,height:34,borderRadius:"50%",overflow:"hidden",background:`linear-gradient(135deg,${PURPLE}99,${PURPLE})`,display:"flex",alignItems:"center",justifyContent:"center",color:WHITE,fontWeight:700}}>
          {currentUser.avatarUrl?<img src={currentUser.avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(currentUser.seed||currentUser.name||"U")[0]}
        </div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{currentUser.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.7)"}}>{timeAgo(currentItem.createdAt)}</div></div>
        <X size={22} color="#fff" style={{cursor:"pointer"}} onClick={onClose}/>
        {currentUser.isMe&&<Trash2 size={18} color="rgba(255,255,255,0.7)" style={{cursor:"pointer"}} onClick={()=>{onDeleteMyItem(currentItem.id);advance();}}/>}
        <Eye size={18} color="rgba(255,255,255,0.7)" style={{cursor:"pointer"}} onClick={e=>{e.stopPropagation();setShowInteractions(v=>!v);}}/>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:bg,position:"relative"}} onPointerDown={()=>setPaused(true)} onPointerUp={()=>setPaused(false)}>
        {currentItem.type==="photo"&&currentItem.imageData&&<img src={currentItem.imageData} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>}
        {currentItem.type==="text"&&<div style={{fontSize:22,fontWeight:800,color:"#fff",textAlign:"center",padding:24,lineHeight:1.35}}>{currentItem.content}</div>}
        {currentItem.caption&&currentItem.type==="photo"&&<div style={{position:"absolute",bottom:20,left:16,right:16,background:"rgba(0,0,0,0.5)",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#fff"}}>{currentItem.caption}</div>}
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:"40%",cursor:"pointer"}} onClick={retreat}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:"40%",cursor:"pointer"}} onClick={advance}/>
        <div onClick={e=>{e.stopPropagation();toggleStoryLike();}} style={{position:"absolute",bottom:24,right:18,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",zIndex:5}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:iLikedThis?"rgba(124,58,237,0.3)":"rgba(0,0,0,0.4)",border:`2px solid ${iLikedThis?PURPLE:"rgba(255,255,255,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Heart size={20} color={iLikedThis?PURPLE:"#fff"} fill={iLikedThis?PURPLE:"none"}/>
          </div>
          <span style={{fontSize:11,color:"#fff",fontWeight:700}}>{storyLikers.length>0?storyLikers.length:""}</span>
        </div>
        {showInteractions&&(
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(10,0,18,0.92)",borderTop:`1px solid ${PURPLE_BD}`,padding:"14px 16px 24px",animation:"modalSlideUp 0.25s ease",zIndex:5,maxHeight:220,overflowY:"auto"}}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {storyViewers.length===0&&<div style={{fontSize:12,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>No views yet</div>}
              {storyViewers.map((name,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:PURPLE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>{name[0]?.toUpperCase()}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,color:"#fff",fontWeight:600}}>{name}</div>{storyLikers.includes(name)&&<div style={{fontSize:10,color:PURPLE}}>❤️ Liked this</div>}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── STATUS COMPOSER ─────────────────────────────────────────────────────────
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
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:mode==="text"?STATUS_BG_PRESETS[bgIndex]:T.isDark?"#0A0012":"#fff",borderRadius:"20px 20px 0 0",padding:18,minHeight:360,display:"flex",flexDirection:"column",animation:"modalSlideUp 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",gap:8}}>
            {[{id:"text",label:"Text",Icon:TypeIcon},{id:"photo",label:"Photo",Icon:ImageIcon}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{padding:"6px 14px",borderRadius:20,border:"none",fontSize:12.5,fontWeight:700,cursor:"pointer",background:mode===m.id?"rgba(255,255,255,0.25)":"transparent",color:mode===m.id?"#fff":T.isDark?"#fff":"#222"}}>
                <m.Icon size={13} style={{verticalAlign:"-2px",marginRight:4}}/>{m.label}
              </button>
            ))}
          </div>
          <X size={22} color={mode==="text"?"#fff":T.text} style={{cursor:"pointer"}} onClick={onClose}/>
        </div>
        {mode==="text"?(
          <>
            <textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="What's on your mind?" style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:22,fontWeight:700,textAlign:"center",resize:"none",lineHeight:1.4,padding:"30px 6px"}}/>
            <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:10}}>
              {STATUS_BG_PRESETS.map((bg,i)=>(
                <div key={i} onClick={()=>setBgIndex(i)} style={{width:28,height:28,borderRadius:"50%",background:bg,cursor:"pointer",border:bgIndex===i?"2.5px solid #fff":"2px solid rgba(255,255,255,0.4)",transform:bgIndex===i?"scale(1.1)":"scale(1)"}}/>
              ))}
            </div>
          </>
        ):(
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
            {imageData?(<div style={{position:"relative",borderRadius:14,overflow:"hidden",flex:1}}>
              <img src={imageData} alt="" style={{width:"100%",height:220,objectFit:"cover"}}/>
              <input value={text} onChange={e=>setText(e.target.value)} placeholder="Add caption..." style={{position:"absolute",bottom:10,left:10,right:10,background:"rgba(0,0,0,0.45)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",outline:"none",fontSize:13}}/>
            </div>):(
              <button onClick={()=>fileInputRef.current?.click()} style={{flex:1,border:`2px dashed ${T.inputBorder}`,borderRadius:14,background:T.inputBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:T.muted,cursor:"pointer",fontSize:13}}>
                <Camera size={28}/> Tap to upload
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
          </div>
        )}
        <button disabled={!canSubmit} onClick={submit} style={{marginTop:14,padding:13,borderRadius:12,border:"none",fontWeight:700,fontSize:14,cursor:canSubmit?"pointer":"default",background:canSubmit?PURPLE:T.divider,color:canSubmit?WHITE:T.muted,transition:"all 0.2s"}}>
          Share to Story
        </button>
      </div>
    </div>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ T, message }) => {
  if (!message) return null;
  return (
    <div style={{ position:"fixed", bottom:94, left:"50%", zIndex:400, transform:"translateX(-50%)", background:T.isDark?"rgba(0,0,12,0.96)":"rgba(10,0,20,0.92)", color:PURPLE, padding:"10px 18px", borderRadius:24, fontSize:13, fontWeight:600, boxShadow:`0 8px 24px ${PURPLE_GLOW}`, whiteSpace:"nowrap", animation:"toastPop 2.4s ease forwards" }}>
      {message}
    </div>
  );
};

// ─── COMMENT SECTION ─────────────────────────────────────────────────────────
const CommentSection = ({ T, post, allPosts, setAllPosts, onViewProfile, onPoints }) => {
  const [commentText, setCommentText] = useState("");
  const [replyTo,     setReplyTo]     = useState(null);
  const submitComment = () => {
    if (!commentText.trim()) return;
    const newComment = { id:uid("c"), author:"You", text:commentText.trim(), time:"Just now", likes:0, liked:false };
    setAllPosts(prev => prev.map(p => p.id===post.id ? {...p,comments:[...(p.comments||[]),newComment]} : p));
    if (onPoints) onPoints("COMMENT");
    setCommentText(""); setReplyTo(null);
  };
  return (
    <div className="fade-up" style={{ marginTop:10, borderTop:`1px solid ${T.divider}`, paddingTop:10 }}>
      {(post.comments||[]).length === 0 && <p style={{ margin:"0 0 10px", fontSize:12, color:T.muted, textAlign:"center" }}>No comments yet — be first!</p>}
      {(post.comments||[]).map(c => (
        <div key={c.id} style={{ display:"flex", gap:8, marginBottom:10 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:PURPLE_DIM, border:`1px solid ${PURPLE_BD}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:PURPLE, fontWeight:700, flexShrink:0 }}>
            {(c.author||"Y")[0].toUpperCase()}
          </div>
          <div style={{ flex:1, background:T.inputBg, borderRadius:12, padding:"8px 12px", border:`1px solid ${T.inputBorder}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{c.author}</div>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.4 }}>{c.text}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>{c.time}</div>
          </div>
        </div>
      ))}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input
          value={commentText} onChange={e=>setCommentText(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submitComment()}
          placeholder="Write a comment…"
          style={{ flex:1, background:T.inputBg, border:`1px solid ${T.inputBorder}`, borderRadius:12, padding:"9px 13px", color:T.text, outline:"none", fontSize:13 }}
        />
        <button onClick={submitComment} style={{ width:36, height:36, borderRadius:10, background:commentText.trim()?PURPLE:T.inputBg, color:commentText.trim()?WHITE:T.muted, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${T.inputBorder}` }}>
          <Send size={14}/>
        </button>
      </div>
    </div>
  );
};

// ─── POST CARD ────────────────────────────────────────────────────────────────
const PostCard = ({ T, post, allPosts, setAllPosts, onViewProfile, onPoints, currentUser, index }) => {
  const [showComments, setShowComments] = useState(false);
  const [likeAnim,     setLikeAnim]     = useState(false);
  const [saveAnim,     setSaveAnim]     = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [likersOpen,   setLikersOpen]   = useState(false);
  const menuRef = useRef(null);

  const toggleLike = () => {
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
  };
  const toggleSave   = () => { setSaveAnim(true); setTimeout(()=>setSaveAnim(false),400); setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,saved:!p.saved,saves:p.saved?p.saves-1:p.saves+1}:p)); };
  const toggleRepost = () => { setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,reposted:!p.reposted,reposts:p.reposted?p.reposts-1:p.reposts+1}:p)); if(!post.reposted&&onPoints)onPoints("REPOST"); };
  const deletePost   = () => setAllPosts(prev => prev.filter(p => p.id !== post.id));

  return (
    <div style={{ ...glass(T, { borderRadius:14 }), overflow:"hidden", animation:"cardIn 0.4s ease both", animationDelay:`${Math.min(index*0.05,0.3)}s` }}>
      <div style={{ padding:12 }}>
        {post.reposted && <div style={{ display:"flex", alignItems:"center", gap:6, color:"#22c55e", fontSize:11, fontWeight:600, marginBottom:8 }}><Repeat2 size={12}/> You reposted this</div>}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <Avatar seed={post.seed||post.author} T={T} size={30} onClick={() => onViewProfile(post.authorId)}/>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontWeight:600, fontSize:13, color:T.text }}>{post.author}</span>
              {post.verified && <GlimacyBadge type={post.verifiedType||"blue"} size={13}/>}
            </div>
            <div style={{ fontSize:10, color:T.muted }}>{post.time}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.muted }}>
            <Eye size={11}/>{(post.views||0).toLocaleString()}
          </div>
          <div style={{ position:"relative" }} ref={menuRef}>
            <MoreHorizontal size={15} color={T.muted} style={{ cursor:"pointer" }} onClick={() => setPostMenuOpen(v => !v)}/>
            {postMenuOpen && (
              <div style={{ position:"absolute", right:0, top:20, zIndex:30, background:T.isDark?"#0A0012":"#fff", border:`1px solid ${T.cardBorder}`, borderRadius:10, overflow:"hidden", boxShadow:"0 8px 28px rgba(0,0,0,0.55)", minWidth:168, animation:"cardIn 0.18s ease" }}>
                {post.authorId==="me" ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#ef4444" }} onClick={deletePost}><Trash2 size={14}/> Delete Post</div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#ef4444" }} onClick={() => { alert("Post reported!"); setPostMenuOpen(false); }}><Flag size={14}/> Report Post</div>
                )}
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize:13.5, lineHeight:1.6, margin:"0 0 8px", color:T.text }}>{post.content}</p>
        {(post.likedBy||[]).length > 0 && (
          <div onClick={() => setLikersOpen(v => !v)} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, cursor:"pointer" }}>
            <div style={{ display:"flex" }}>
              {(post.likedBy||[]).slice(0,3).map((n,i) => (
                <div key={i} style={{ width:18, height:18, borderRadius:"50%", background:PURPLE, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:WHITE, fontWeight:700, marginLeft:i>0?-4:0, border:`1.5px solid ${T.bg}` }}>{n[0]?.toUpperCase()}</div>
              ))}
            </div>
            <span style={{ fontSize:11, color:PURPLE, fontWeight:600 }}>
              {(post.likedBy||[]).slice(0,2).join(", ")}{(post.likedBy||[]).length>2?` +${(post.likedBy||[]).length-2} more`:""} liked this
            </span>
          </div>
        )}
        {likersOpen && (post.likedBy||[]).length > 0 && (
          <div style={{ background:T.inputBg, borderRadius:10, padding:"8px 12px", marginBottom:8 }}>
            {(post.likedBy||[]).map((n,i) => (
              <div key={i} style={{ fontSize:12, color:T.muted, padding:"2px 0", display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:16, height:16, borderRadius:"50%", background:PURPLE, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:WHITE, fontWeight:700 }}>{n[0]?.toUpperCase()}</div>
                {n}
              </div>
            ))}
          </div>
        )}
        <div style={{ height:1, background:T.divider, margin:"0 0 10px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <ActionBtn onClick={toggleLike}   Icon={Heart}          label={post.likes}              active={post.liked}    activeColor="#ef4444" fillWhenActive anim={likeAnim?"heartPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={() => setShowComments(v=>!v)} Icon={MessageCircle} label={(post.comments||[]).length} active={showComments} activeColor={PURPLE} T={T}/>
          <ActionBtn onClick={toggleRepost} Icon={Repeat2}        label={post.reposts}             active={post.reposted} activeColor="#22c55e" T={T}/>
          <ActionBtn onClick={toggleSave}   Icon={Bookmark}       label={post.saves||0}           active={post.saved}    activeColor={PURPLE} fillWhenActive anim={saveAnim?"bookmarkPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={() => {}} Icon={Share2} label="Share" T={T}/>
        </div>
        {showComments && <CommentSection T={T} post={post} allPosts={allPosts} setAllPosts={setAllPosts} onViewProfile={onViewProfile} onPoints={onPoints}/>}
      </div>
    </div>
  );
};

// ─── VIDEO POST CARD ──────────────────────────────────────────────────────────
const VideoPostCard = ({ T, post, allPosts, setAllPosts, onViewProfile, onPoints, currentUser, index }) => {
  const [showComments, setShowComments] = useState(false);
  const [likeAnim,     setLikeAnim]     = useState(false);
  const [saveAnim,     setSaveAnim]     = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleLike = () => {
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
  };
  const toggleSave   = () => { setSaveAnim(true); setTimeout(()=>setSaveAnim(false),400); setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,saved:!p.saved,saves:p.saved?p.saves-1:p.saves+1}:p)); };
  const toggleRepost = () => { setAllPosts(prev=>prev.map(p=>p.id===post.id?{...p,reposted:!p.reposted,reposts:p.reposted?p.reposts-1:p.reposts+1}:p)); if(!post.reposted&&onPoints)onPoints("REPOST"); };
  const deletePost   = () => setAllPosts(prev=>prev.filter(p=>p.id!==post.id));

  return (
    <div style={{ ...glass(T, { borderRadius:14 }), overflow:"hidden", animation:"cardIn 0.4s ease both", animationDelay:`${Math.min(index*0.05,0.3)}s` }}>
      <div style={{ position:"relative" }}>
        <img src={post.thumbnail} alt="" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:PURPLE, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Play size={18} color={WHITE} fill={WHITE}/>
          </div>
        </div>
        <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.55)", borderRadius:6, padding:"3px 7px", display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#fff" }}>
          <Eye size={10}/>{post.views.toLocaleString()}
        </div>
      </div>
      <div style={{ padding:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <Avatar seed={post.seed||post.author} T={T} size={30} onClick={() => onViewProfile(post.authorId)}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:13, color:T.text }}>{post.author}</div>
            <div style={{ fontSize:10, color:T.muted }}>{post.time}</div>
          </div>
          <div style={{ position:"relative" }} ref={menuRef}>
            <MoreHorizontal size={15} color={T.muted} style={{ cursor:"pointer" }} onClick={() => setPostMenuOpen(v => !v)}/>
            {postMenuOpen && (
              <div style={{ position:"absolute", right:0, top:20, zIndex:30, background:T.isDark?"#0A0012":"#fff", border:`1px solid ${T.cardBorder}`, borderRadius:10, overflow:"hidden", boxShadow:"0 8px 28px rgba(0,0,0,0.55)", minWidth:168, animation:"cardIn 0.18s ease" }}>
                {post.authorId==="me" ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#ef4444" }} onClick={deletePost}><Trash2 size={14}/> Delete Post</div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", fontSize:13, cursor:"pointer", color:"#ef4444" }} onClick={() => alert("Post reported!")}><Flag size={14}/> Report Post</div>
                )}
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize:12.5, lineHeight:1.5, margin:"0 0 6px", color:T.text }}>{post.caption}</p>
        <div style={{ height:1, background:T.divider, margin:"0 0 10px" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <ActionBtn onClick={toggleLike}   Icon={Heart}          label={post.likes}              active={post.liked}    activeColor="#ef4444" fillWhenActive anim={likeAnim?"heartPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={() => setShowComments(v=>!v)} Icon={MessageCircle} label={(post.comments||[]).length} active={showComments} activeColor={PURPLE} T={T}/>
          <ActionBtn onClick={toggleRepost} Icon={Repeat2}        label={post.reposts}             active={post.reposted} activeColor="#22c55e" T={T}/>
          <ActionBtn onClick={toggleSave}   Icon={Bookmark}       label={post.saves||0}           active={post.saved}    activeColor={PURPLE} fillWhenActive anim={saveAnim?"bookmarkPop 0.4s ease":"none"} T={T}/>
          <ActionBtn onClick={() => {}} Icon={Share2} label="Share" T={T}/>
        </div>
        {showComments && <CommentSection T={T} post={post} allPosts={allPosts} setAllPosts={setAllPosts} onViewProfile={onViewProfile} onPoints={onPoints}/>}
      </div>
    </div>
  );
};

// ─── SETTINGS PANEL — Theme · Notification Settings · Font Size · Log Out ───
const Switch = ({ on, onToggle, T }) => (
  <div
    onClick={onToggle}
    style={{
      width: 40, height: 24, borderRadius: 99, cursor: "pointer", flexShrink: 0,
      background: on ? PURPLE : T.inputBg, border: `1px solid ${on ? PURPLE_BD : T.inputBorder}`,
      position: "relative", transition: "background 0.2s ease, border-color 0.2s ease",
    }}
  >
    <div style={{
      position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%",
      background: WHITE, transition: "left 0.2s cubic-bezier(.34,1.56,.64,1)",
      boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
    }}/>
  </div>
);

const SettingsPanel = ({ T, open, onClose, themeMode, setThemeMode, onSignOut, notifPrefs, setNotifPrefs, fontScale, setFontScale }) => {
  const [section, setSection] = useState(null);
  useEffect(() => { if (!open) setSection(null); }, [open]);
  if (!open) return null;

  const themeOptions = [
    { id:"device", label:"Default Device Mode", icon:Monitor, desc:"Follows your system setting" },
    { id:"dark",   label:"Dark Mode",            icon:Moon,    desc:"Black & Purple — current"    },
    { id:"light",  label:"Light Mode",           icon:Sun,     desc:"Clean & bright"              },
  ];
  const notifOptions = [
    { id:"likesComments", label:"Likes & Comments",  desc:"Someone reacts to or comments on your posts" },
    { id:"newFollowers",  label:"New Followers",     desc:"Someone starts following you" },
    { id:"messages",      label:"Messages",          desc:"New direct messages" },
    { id:"mentions",      label:"Mentions & Tags",   desc:"Someone mentions you in a post or comment" },
  ];
  const fontOptions = [
    { id:"small",  label:"Small",  scale:0.92, sample:13 },
    { id:"medium", label:"Medium", scale:1,    sample:16 },
    { id:"large",  label:"Large",  scale:1.14, sample:19 },
  ];
  const rowStyle = (danger = false) => ({
    display:"flex", alignItems:"center", gap:12, padding:"14px 20px", cursor:"pointer",
    color: danger ? "#ef4444" : T.text, fontSize:14, borderBottom:`1px solid ${T.divider}`, transition:"background 0.15s",
  });

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", flexDirection:"column", justifyContent:"flex-end", animation:"overlayFadeIn 0.2s ease" }} onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:T.isDark?"#0A0012":"#fff", borderRadius:"20px 20px 0 0", paddingBottom:36, border:`1px solid ${T.divider}`, boxShadow:"0 -8px 40px rgba(0,0,0,0.5)", maxHeight:"80vh", overflowY:"auto", animation:"modalSlideUp 0.25s ease" }}>
        <div style={{ width:36, height:4, background:PURPLE_DIM, borderRadius:2, margin:"12px auto 0" }}/>
        <div style={{ display:"flex", alignItems:"center", padding:"16px 20px 8px", gap:10 }}>
          {section && <ArrowLeft size={18} color={PURPLE} style={{ cursor:"pointer" }} onClick={() => setSection(null)}/>}
          <div style={{ fontWeight:700, fontSize:17, color:T.text }}>
            {section==="theme" ? "Choose Theme" : section==="notifs" ? "Notification Settings" : section==="font" ? "Font Size" : "Settings"}
          </div>
        </div>

        {!section && (
          <>
            <div style={rowStyle()} onMouseOver={e=>e.currentTarget.style.background=T.hoverBg} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={() => setSection("theme")}>
              <div style={{ width:36, height:36, borderRadius:10, background:PURPLE_DIM, display:"flex", alignItems:"center", justifyContent:"center" }}><Moon size={17} color={PURPLE}/></div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600 }}>Theme</div><div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{themeOptions.find(t=>t.id===themeMode)?.label||"Dark Mode"}</div></div>
              <ChevronRight size={16} color={T.muted}/>
            </div>
            <div style={rowStyle()} onMouseOver={e=>e.currentTarget.style.background=T.hoverBg} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={() => setSection("notifs")}>
              <div style={{ width:36, height:36, borderRadius:10, background:PURPLE_DIM, display:"flex", alignItems:"center", justifyContent:"center" }}><BellRing size={17} color={PURPLE}/></div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600 }}>Notification Settings</div><div style={{ fontSize:11, color:T.muted, marginTop:1 }}>Choose what you get notified about</div></div>
              <ChevronRight size={16} color={T.muted}/>
            </div>
            <div style={rowStyle()} onMouseOver={e=>e.currentTarget.style.background=T.hoverBg} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={() => setSection("font")}>
              <div style={{ width:36, height:36, borderRadius:10, background:PURPLE_DIM, display:"flex", alignItems:"center", justifyContent:"center" }}><TypeIcon size={17} color={PURPLE}/></div>
              <div style={{ flex:1 }}><div style={{ fontWeight:600 }}>Font Size</div><div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{fontOptions.find(f=>f.scale===fontScale)?.label || "Medium"}</div></div>
              <ChevronRight size={16} color={T.muted}/>
            </div>
            <div style={{ height:8, background:T.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.03)", margin:"8px 0" }}/>
            <div style={rowStyle(true)} onMouseOver={e=>e.currentTarget.style.background=T.hoverBg} onMouseOut={e=>e.currentTarget.style.background="transparent"} onClick={() => { onSignOut(); onClose(); }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"rgba(239,68,68,0.10)", display:"flex", alignItems:"center", justifyContent:"center" }}><LogOut size={17} color="#ef4444"/></div>
              <div style={{ fontWeight:600 }}>Log Out</div>
            </div>
          </>
        )}

        {section==="theme" && (
          <div style={{ padding:"8px 0" }}>
            {themeOptions.map(opt => {
              const selected = themeMode === opt.id;
              return (
                <div key={opt.id} style={{ ...rowStyle(), background:selected?PURPLE_DIM:"transparent" }} onClick={() => { setThemeMode(opt.id); setSection(null); }} onMouseOver={e=>!selected&&(e.currentTarget.style.background=T.hoverBg)} onMouseOut={e=>!selected&&(e.currentTarget.style.background=selected?PURPLE_DIM:"transparent")}>
                  <div style={{ width:36, height:36, borderRadius:10, background:selected?PURPLE_DIM:T.inputBg, display:"flex", alignItems:"center", justifyContent:"center", border:selected?`1px solid ${PURPLE_BD}`:"none" }}><opt.icon size={17} color={selected?PURPLE:T.muted}/></div>
                  <div style={{ flex:1 }}><div style={{ fontWeight:selected?700:500, color:selected?PURPLE:T.text }}>{opt.label}</div><div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{opt.desc}</div></div>
                  {selected && <div style={{ width:8, height:8, borderRadius:"50%", background:PURPLE }}/>}
                </div>
              );
            })}
          </div>
        )}

        {section==="notifs" && (
          <div style={{ padding:"4px 20px 4px" }}>
            <p style={{ fontSize:12.5, color:T.muted, margin:"6px 0 14px", lineHeight:1.5 }}>Choose what Glimacy is allowed to notify you about. You can change this anytime.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {notifOptions.map(opt => (
                <div key={opt.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13.5, color:T.text }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:1 }}>{opt.desc}</div>
                  </div>
                  <Switch T={T} on={notifPrefs[opt.id] !== false} onToggle={() => setNotifPrefs(prev => ({ ...prev, [opt.id]: prev[opt.id] === false ? true : false }))}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {section==="font" && (
          <div style={{ padding:"8px 0" }}>
            {fontOptions.map(opt => {
              const selected = fontScale === opt.scale;
              return (
                <div key={opt.id} style={{ ...rowStyle(), background:selected?PURPLE_DIM:"transparent" }} onClick={() => setFontScale(opt.scale)} onMouseOver={e=>!selected&&(e.currentTarget.style.background=T.hoverBg)} onMouseOut={e=>!selected&&(e.currentTarget.style.background=selected?PURPLE_DIM:"transparent")}>
                  <div style={{ width:36, height:36, borderRadius:10, background:selected?PURPLE_DIM:T.inputBg, display:"flex", alignItems:"center", justifyContent:"center", border:selected?`1px solid ${PURPLE_BD}`:"none" }}>
                    <span style={{ fontSize:opt.sample, fontWeight:800, color:selected?PURPLE:T.muted }}>A</span>
                  </div>
                  <div style={{ flex:1 }}><div style={{ fontWeight:selected?700:500, color:selected?PURPLE:T.text }}>{opt.label}</div></div>
                  {selected && <div style={{ width:8, height:8, borderRadius:"50%", background:PURPLE }}/>}
                </div>
              );
            })}
            <p style={{ fontSize:11, color:T.muted, padding:"12px 20px 0", lineHeight:1.5 }}>Scales text and spacing across the whole app.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── FEEDBACK PANEL — separate from Settings, only feedback lives here ───────
const FeedbackPanel = ({ T, open, onClose }) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  useEffect(() => { if (!open) { setFeedbackText(""); setFeedbackSent(false); } }, [open]);
  if (!open) return null;

  const sendFeedback = () => {
    if (!feedbackText.trim()) return;
    const subject = encodeURIComponent("Glimacy App Feedback");
    const body    = encodeURIComponent(feedbackText.trim());
    window.open(`mailto:therealglimmar@gmail.com?subject=${subject}&body=${body}`, "_blank");
    setFeedbackSent(true);
    setFeedbackText("");
    setTimeout(() => { setFeedbackSent(false); onClose(); }, 1600);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", flexDirection:"column", justifyContent:"flex-end", animation:"overlayFadeIn 0.2s ease" }} onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:T.isDark?"#0A0012":"#fff", borderRadius:"20px 20px 0 0", padding:"0 0 28px", border:`1px solid ${T.divider}`, boxShadow:"0 -8px 40px rgba(0,0,0,0.5)", animation:"modalSlideUp 0.25s ease" }}>
        <div style={{ width:36, height:4, background:PURPLE_DIM, borderRadius:2, margin:"12px auto 0" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <MessageSquare size={18} color={PURPLE}/>
            <div style={{ fontWeight:700, fontSize:17, color:T.text }}>Send Feedback</div>
          </div>
          <X size={18} color={T.muted} style={{ cursor:"pointer" }} onClick={onClose}/>
        </div>
        <div style={{ padding:"4px 20px 0" }}>
          <p style={{ fontSize:13, color:T.muted, marginBottom:12 }}>Your feedback goes directly to the Glimacy admin (Glimacy).</p>
          {feedbackSent ? (
            <div style={{ background:PURPLE_DIM, border:`1px solid ${PURPLE_BD}`, borderRadius:12, padding:"16px", textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
              <div style={{ fontWeight:700, color:T.text }}>Feedback sent! Thank you.</div>
            </div>
          ) : (
            <>
              <textarea autoFocus value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Describe your feedback, bug, or feature request..." rows={4} style={{ width:"100%", background:T.inputBg, border:`1px solid ${PURPLE_BD}`, borderRadius:12, padding:"12px 14px", color:T.text, outline:"none", fontSize:13, resize:"none", fontFamily:"inherit" }}/>
              <button onClick={sendFeedback} disabled={!feedbackText.trim()} style={{ width:"100%", marginTop:10, padding:13, borderRadius:12, border:"none", background:feedbackText.trim()?PURPLE:T.inputBg, color:feedbackText.trim()?WHITE:T.muted, fontWeight:700, fontSize:14, cursor:feedbackText.trim()?"pointer":"default" }}>
                Send to Admin
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── INLINE HEADER (4 icons: Search · Feedback · Settings · Messages) ─────────
const AppHeader = ({ T, user, onAvatarClick, onSearchClick, onSettingsClick, onMessagesClick, onFeedbackClick, unreadMessages, children }) => (
  <div style={{
    position:"sticky", top:0, zIndex:50,
    display:"flex", alignItems:"center", gap:8, padding:"12px 14px 10px",
    background:T.isDark?"rgba(0,0,12,0.94)":"rgba(240,238,255,0.94)",
    backdropFilter:"blur(14px)", borderBottom:`1px solid ${T.divider}`,
  }}>
    {/* Avatar / Brand */}
    <div onClick={onAvatarClick} style={{ cursor:"pointer", flexShrink:0 }}>
      {children || <div style={{ width:32, height:32, borderRadius:"50%", background:PURPLE, display:"flex", alignItems:"center", justifyContent:"center", color:WHITE, fontWeight:800, fontSize:13 }}>{(user?.name||"G")[0]}</div>}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontWeight:800, fontSize:17, color:T.text, letterSpacing:-0.5 }}>Glimacy</div>
    </div>
    {/* Right icons */}
    <div style={{ display:"flex", gap:4, alignItems:"center" }}>
      {/* Search */}
      <button onClick={onSearchClick} style={{ width:36, height:36, borderRadius:10, background:"transparent", border:"none", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
        <Search size={19}/>
      </button>
      {/* Feedback */}
      <button onClick={onFeedbackClick} style={{ width:36, height:36, borderRadius:10, background:"transparent", border:"none", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
        <MessageSquare size={19}/>
      </button>
      {/* Settings */}
      <button onClick={onSettingsClick} style={{ width:36, height:36, borderRadius:10, background:"transparent", border:"none", color:T.muted, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
        <Settings size={19}/>
      </button>
      {/* Messages — LAST */}
      <button onClick={onMessagesClick} style={{ position:"relative", width:36, height:36, borderRadius:10, background:PURPLE_DIM, border:`1px solid ${PURPLE_BD}`, color:PURPLE, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
        <Send size={18}/>
        {unreadMessages > 0 && (
          <div style={{ position:"absolute", top:-3, right:-3, width:16, height:16, borderRadius:"50%", background:"#ef4444", color:WHITE, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${T.bg}` }}>
            {unreadMessages > 9 ? "9+" : unreadMessages}
          </div>
        )}
      </button>
    </div>
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [themeMode,  setThemeMode]  = useState("dark");
  const getDevicePrefer = () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? THEMES.glimacy : THEMES.light;
  const T = themeMode === "light" ? THEMES.light : themeMode === "device" ? getDevicePrefer() : THEMES.glimacy;

  const [activeTab,       setActiveTab]       = useState("home");
  const [homeFeedTab,     setHomeFeedTab]     = useState("friends");
  const [isLoggedIn,      setIsLoggedIn]      = useState(false);
  const [isAuthLoading,   setIsAuthLoading]   = useState(true);
  const [user,            setUser]            = useState(MOCK_USER);
  const [tokens,          setTokens]          = useState(MOCK_USER.tokens || 0);
  const [appProfiles,     setAppProfiles]     = useState([]);
  const [followingIds,    setFollowingIds]    = useState(new Set());
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const [feedPosts, setFeedPosts] = useState(() => {
    const persisted = loadLS(LS_KEYS.feedPosts, null);
    if (persisted && persisted.length > 0) return persisted;
    const likedIds = new Set(loadLS(LS_KEYS.likedIds, []));
    const savedIds = new Set(loadLS(LS_KEYS.savedArchive, []).map(p => p.id));
    return INITIAL_FEED_POSTS.map(p => ({ ...p, likedBy:p.likedBy||[], liked:likedIds.has(p.id)||p.liked, saved:savedIds.has(p.id)||p.saved }));
  });
  const [myVideoPosts, setMyVideoPosts] = useState(() => {
    const persisted = loadLS(LS_KEYS.videoPosts, null);
    if (persisted && persisted.length > 0) return persisted;
    const likedIds = new Set(loadLS(LS_KEYS.likedIds, []));
    const savedIds = new Set(loadLS(LS_KEYS.savedArchive, []).map(p => p.id));
    return MY_VIDEO_POSTS.map(p => ({ ...p, likedBy:p.likedBy||[], liked:likedIds.has(p.id)||p.liked, saved:savedIds.has(p.id)||p.saved }));
  });

  const [userScore,           setUserScore]          = useState(() => loadLS(LS_KEYS.userScore, MOCK_USER.score || 0));
  const [statusLikes,         setStatusLikes]        = useState(() => loadLS(LS_KEYS.statusLikes, {}));
  const [statusViews,         setStatusViews]        = useState(() => loadLS(LS_KEYS.statusViews, {}));
  const [notifications,       setNotifications]      = useState(MOCK_NOTIFICATIONS);
  const [viewingProfileId,    setViewingProfileId]   = useState(null);
  const [isEditModalOpen,     setIsEditModalOpen]    = useState(false);
  const [isCreateModalOpen,   setIsCreateModalOpen]  = useState(false);
  const [settingsOpen,        setSettingsOpen]       = useState(false);
  const [editName,            setEditName]           = useState("");
  const [editHandle,          setEditHandle]         = useState("");
  const [editBio,             setEditBio]            = useState("");
  const [editUni,             setEditUni]            = useState("");
  const [editFaculty,         setEditFaculty]        = useState("");
  const [editRelationship,    setEditRelationship]   = useState("Single");
  const [editGender,          setEditGender]         = useState("Male");
  const [editPhone,           setEditPhone]          = useState("");
  const [editHobby,           setEditHobby]          = useState("");
  const [searchQuery,         setSearchQuery]        = useState("");
  const [searchSubTab,        setSearchSubTab]       = useState("posts");
  const [imagePreview,        setImagePreview]       = useState(null);
  const [headerVisible,       setHeaderVisible]      = useState(true);
  const lastScrollY       = useRef(0);
  const scrollTimer       = useRef(null);
  const scrollContainerRef = useRef(null);
  const [myStatusItems,       setMyStatusItems]      = useState(() => loadLS(LS_KEYS.myStatuses, []));
  const [seenStatusItemIds,   setSeenStatusItemIds]  = useState(() => new Set(loadLS(LS_KEYS.seenStatusItems, [])));
  const [otherStatuses,       setOtherStatuses]      = useState([]);
  const [statusComposerOpen,  setStatusComposerOpen] = useState(false);
  const [storyViewerIndex,    setStoryViewerIndex]   = useState(null);
  const [savedArchive,        setSavedArchive]       = useState(() => loadLS(LS_KEYS.savedArchive, []));
  const [toast,               setToast]              = useState(null);
  const toastTimer = useRef(null);
  const showToast = (message) => { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2400); };
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing,   setRefreshing]   = useState(false);
  const pullStartY = useRef(null);

  // Scroll handler — hide header + bottom nav on scroll down
  const handleMainScroll = (e) => {
    if (activeTab !== "home") return;
    const cur  = e.currentTarget.scrollTop;
    const diff = cur - lastScrollY.current;
    if (diff > 8)  setHeaderVisible(false);
    if (diff < -8) setHeaderVisible(true);
    lastScrollY.current = cur;
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setHeaderVisible(true), 1200);
  };

  const handleUpdateAvatar = (url) => setUser(prev => ({ ...prev, avatarUrl:url }));
  const handleUpdateCover  = (url) => setUser(prev => ({ ...prev, coverUrl:url }));

  // ── Supabase: fetch user ───────────────────────────────────────────────────
  const fetchUserData = async (userId) => {
    const { data:userData } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (userData) {
      setUser(prev => ({
        ...prev, ...userData,
        name: userData.first_name ? `${userData.first_name} ${userData.last_name||""}`.trim() : (userData.name || "User"),
      }));
    }
    const { data:profilesData } = await supabase.from("profiles").select("*");
    setAppProfiles(profilesData ? profilesData.map(p => ({ ...p, name: p.first_name ? `${p.first_name} ${p.last_name||""}`.trim() : (p.name||"User") })) : MOCK_PROFILES);
    const { data:followsData } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
    if (followsData) setFollowingIds(new Set(followsData.map(f => f.following_id)));
  };

  const fetchDatabasePosts = async (currentAuthId) => {
    try {
      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending:false });
      if (error || !data) return;
      const likedIds = new Set(loadLS(LS_KEYS.likedIds, []));
      const savedIds = new Set(loadLS(LS_KEYS.savedArchive, []).map(p => p.id));
      const formatted = data.map(post => {
        const isMe = currentAuthId && post.author_id === currentAuthId;
        return { id:post.id, authorId:post.author_id, author:isMe?user.name:"Campus Member", handle:isMe?user.handle:"@campus_member", seed:isMe?(user.seed||user.name):`user_${post.id}`, time:new Date(post.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), type:"text", content:post.content, likes:0, likedBy:[], comments:[], reposts:0, saves:0, views:0, liked:likedIds.has(post.id), saved:savedIds.has(post.id), reposted:false };
      });
      setFeedPosts(formatted);
    } catch (err) { console.error("Post fetch error:", err); }
  };

  useEffect(() => {
    const initApp = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      if (session?.user) { setUser(prev => ({ ...prev, id:session.user.id })); await fetchUserData(session.user.id); fetchDatabasePosts(session.user.id); }
      else fetchDatabasePosts(null);
      setIsAuthLoading(false);
    };
    initApp();
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) { setUser(prev => ({ ...prev, id:session.user.id })); fetchUserData(session.user.id); fetchDatabasePosts(session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => { saveLS(LS_KEYS.myStatuses, myStatusItems); },         [myStatusItems]);
  useEffect(() => { saveLS(LS_KEYS.seenStatusItems, [...seenStatusItemIds]); }, [seenStatusItemIds]);
  useEffect(() => { saveLS(LS_KEYS.savedArchive, savedArchive); },        [savedArchive]);
  useEffect(() => { saveLS(LS_KEYS.likedIds, [...feedPosts,...myVideoPosts].filter(p=>p.liked).map(p=>p.id)); }, [feedPosts,myVideoPosts]);
  useEffect(() => { saveLS(LS_KEYS.feedPosts,   feedPosts); },            [feedPosts]);
  useEffect(() => { saveLS(LS_KEYS.videoPosts,  myVideoPosts); },         [myVideoPosts]);
  useEffect(() => { saveLS(LS_KEYS.userScore,   userScore); },            [userScore]);
  useEffect(() => { saveLS(LS_KEYS.statusLikes, statusLikes); },          [statusLikes]);
  useEffect(() => { saveLS(LS_KEYS.statusViews, statusViews); },          [statusViews]);

  // Auto-sync saved archive when posts change
  const isAuthorVerified = (post) => {
    if (post.authorId === user?.id || post.authorId === "me") return !!user?.verified;
    return !!appProfiles.find(p => p.id === post.authorId)?.verified;
  };
  useEffect(() => {
    const currentlySaved = [...feedPosts,...myVideoPosts].filter(p=>p.saved);
    const idsInScope = new Set([...feedPosts,...myVideoPosts].map(p=>p.id));
    setSavedArchive(prev => {
      const map = new Map(prev.map(p=>[p.id,p]));
      currentlySaved.forEach(p => { const e=map.get(p.id); map.set(p.id,{id:p.id,type:p.type,author:p.author,handle:p.handle,content:p.content,caption:p.caption,thumbnail:p.thumbnail,likes:p.likes,comments:p.comments,views:p.views,savedAt:e?.savedAt||Date.now(),authorVerifiedAtSave:e?e.authorVerifiedAtSave:isAuthorVerified(p)}); });
      const next = []; map.forEach((entry,id)=>{ const inScope=idsInScope.has(id); const stillSaved=currentlySaved.some(p=>p.id===id); if(!inScope||stillSaved)next.push(entry); });
      return next.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
    });
  }, [feedPosts,myVideoPosts]);

  useEffect(() => {
    if (otherStatuses.length > 0) return;
    const pool = appProfiles.length ? appProfiles : MOCK_PROFILES;
    if (!pool.length) return;
    const now = Date.now();
    const seeded = pool.slice(0,6).map((p,i) => ({
      userId:p.id, name:p.name, handle:p.handle, seed:p.seed||p.name, avatarUrl:p.avatarUrl||null, verified:!!p.verified,
      items: i%3===2 ? [] : [{ id:`seed_st_${p.id}`, type:"text", content:STATUS_SAMPLE_LINES[i%STATUS_SAMPLE_LINES.length], bg:STATUS_BG_PRESETS[i%STATUS_BG_PRESETS.length], createdAt:now-(i+1)*1000*60*35 }]
    }));
    setOtherStatuses(seeded);
  }, [appProfiles]);

  useEffect(() => { setHeaderVisible(true); setPullDistance(0); pullStartY.current=null; }, [activeTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleFollow = async (targetId) => {
    if (!user?.id || user.id === "me") return;
    const isFollowing = followingIds.has(targetId);
    setFollowingIds(prev => { const next=new Set(prev); isFollowing?next.delete(targetId):next.add(targetId); return next; });
    setAppProfiles(prev => prev.map(p => p.id===targetId ? {...p,followers_count:(p.followers_count||0)+(isFollowing?-1:1)} : p));
    setUser(prev => ({ ...prev, following_count:(prev.following_count||0)+(isFollowing?-1:1) }));
    if (isFollowing) await supabase.from("follows").delete().match({ follower_id:user.id, following_id:targetId });
    else              await supabase.from("follows").insert({ follower_id:user.id, following_id:targetId });
  };

  const handleOpenEditModal = () => {
    setEditName(user.name);
    setEditHandle(user.handle);
    setEditBio(user.bio);
    setEditUni(user.university);
    setEditFaculty(user.faculty || "");
    setEditRelationship(user.relationshipStatus || "Single");
    setEditGender(user.gender || "Male");
    setEditPhone(user.phone || "");
    setEditHobby(user.hobby ? user.hobby.replace(/^I love\s+/i, "") : "");
    setIsEditModalOpen(true);
  };

  // ── handleSaveProfile — full Supabase upsert ─────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    let fmtHandle = editHandle.trim();
    if (!fmtHandle.startsWith("@")) fmtHandle = "@" + fmtHandle;
    const hobbyFmt = editHobby.trim() ? `I love ${editHobby.trim()}` : "";
    const updated = {
      ...user,
      name:             editName.trim(),
      handle:           fmtHandle,
      bio:              editBio.trim(),
      university:       editUni.trim(),
      faculty:          editFaculty,
      relationshipStatus: editRelationship,
      gender:           editGender,
      phone:            editPhone.trim(),
      hobby:            hobbyFmt,
    };
    setUser(updated);
    if (user.id && user.id !== "me") {
      const [first, ...rest] = (editName.trim()).split(" ");
      const { error } = await supabase.from("profiles").upsert({
        id:                    user.id,
        first_name:            first || "",
        last_name:             rest.join(" "),
        name:                  editName.trim(),
        handle:                fmtHandle,
        bio:                   editBio.trim(),
        university:            editUni.trim(),
        faculty:               editFaculty,
        relationship_status:   editRelationship,
        gender:                editGender,
        phone:                 editPhone.trim(),
        hobby:                 hobbyFmt,
        avatar_url:            user.avatarUrl || null,
        cover_url:             user.coverUrl  || null,
        updated_at:            new Date().toISOString(),
      }, { onConflict:"id" });
      if (error) console.error("Supabase profile upsert error:", error);
    }
    setIsEditModalOpen(false);
    showToast("Profile updated ✨");
  };

  const handleViewProfile   = (profileId) => { setViewingProfileId(profileId); setActiveTab("profile"); };
  const handleExitProfile   = () => { setViewingProfileId(null); setActiveTab("home"); };
  const handleImagePreview  = ({ type, user:previewUser }) => setImagePreview({ type, user:previewUser });

  const handleVerified = (method) => {
    const isWhite = method.startsWith("white");
    if (method === "blue_tokens")  setTokens(prev => prev - TOKEN_ECONOMY.tokensToVerify);
    if (method === "white_tokens") setTokens(prev => prev - TOKEN_ECONOMY.whiteTokenCost);
    setUser(prev => ({ ...prev, verified:true, verifiedType:isWhite?"white":"blue" }));
    showToast(isWhite ? "⚪ White Verified — Campus Elite!" : "🔵 Blue Verified!");
  };

  const handleEarnedTokens = (amount) => {
    setTokens(prev => prev + amount);
    setUser(prev => ({ ...prev, tokens:(prev.tokens||0)+amount }));
    showToast(`+${amount} tokens earned 🪙`);
  };

  const addPoints = (action) => {
    const pts = POINT_ACTIONS[action] || 0;
    if (!pts) return;
    setUserScore(prev => {
      const next = prev + pts;
      if (Math.floor(prev/50) < Math.floor(next/50)) setTimeout(() => showToast(`🏆 +${pts} pts — ranking up!`), 100);
      return next;
    });
    setUser(prev => ({ ...prev, score:(prev.score||0)+pts }));
  };

  const handleSpendTokens = (amount) => {
    if (amount < 0) handleEarnedTokens(-amount);
    else { setTokens(prev => Math.max(0,prev-amount)); setUser(prev => ({ ...prev, tokens:Math.max(0,(prev.tokens||0)-amount) })); }
  };

  const handleUnsaveArchived = (postId) => {
    setSavedArchive(prev => prev.filter(p => p.id !== postId));
    setFeedPosts(prev => prev.map(p => p.id===postId?{...p,saved:false,saves:Math.max(0,(p.saves||0)-1)}:p));
    setMyVideoPosts(prev => prev.map(p => p.id===postId?{...p,saved:false,saves:Math.max(0,(p.saves||0)-1)}:p));
  };

  const handleBackupToGmail = (postsToBackup) => {
    if (!postsToBackup || postsToBackup.length === 0) { showToast("No saved posts to back up"); return; }
    const lines = postsToBackup.map((p,i) => `${i+1}. ${p.author||"Unknown"} (${p.authorVerifiedAtSave?"Verified":"Unverified"})\n${(p.content||p.caption||"").slice(0,300)}\n${(p.likes||0)} likes\n`).join("\n");
    const subject = encodeURIComponent("Glimacy — Saved Posts Backup");
    const body    = encodeURIComponent(`Saved posts:\n\n${lines}\nExported ${new Date().toLocaleString()}`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank", "noopener,noreferrer");
    showToast("Opening Gmail…");
  };

  const openStoryViewer  = (idx) => { if (idx >= 0) setStoryViewerIndex(idx); };
  const closeStoryViewer = () => setStoryViewerIndex(null);

  const handleRefreshFeed = async () => {
    try { const { data:{ session } } = await supabase.auth.getSession(); await fetchDatabasePosts(session?.user?.id||null); showToast("✨ Feed refreshed"); }
    catch { showToast("Couldn't refresh — check connection"); }
  };
  const handlePullStart = (e) => { if (activeTab!=="home"||refreshing) return; if ((scrollContainerRef.current?.scrollTop??0)>2) return; pullStartY.current=e.clientY; };
  const handlePullMove  = (e) => { if (pullStartY.current==null) return; const delta=e.clientY-pullStartY.current; if (delta<=0||(scrollContainerRef.current?.scrollTop??0)>2){setPullDistance(0);return;} setPullDistance(Math.min(delta*0.5,90)); };
  const handlePullEnd   = async () => { if (pullStartY.current==null) return; pullStartY.current=null; if(pullDistance>55&&!refreshing){setRefreshing(true);await handleRefreshFeed();setRefreshing(false);}setPullDistance(0); };

  // ── Search/filter ─────────────────────────────────────────────────────────
  const cleanQuery            = searchQuery.toLowerCase().trim();
  const aggregatedPostsList   = [...feedPosts,...myVideoPosts];
  const getScore              = (p) => (p.likes||0)*3+(p.comments?.length||0)*5+(p.reposts||0)*4+(p.views||0)*0.1;
  const parseFollowerCount    = (fStr) => { if(!fStr) return 0; if(typeof fStr==="number") return fStr; if(String(fStr).toLowerCase().endsWith("k")) return parseFloat(fStr)*1000; return parseFloat(fStr)||0; };
  const filteredPostsResults  = aggregatedPostsList.filter(p=>(p.content||p.caption||"").toLowerCase().includes(cleanQuery)).sort((a,b)=>getScore(b)-getScore(a));
  const allAvailableProfiles  = [user,...appProfiles].filter((v,i,a)=>a.findIndex(v2=>v2.id===v.id)===i);
  const filteredFriendsResults= allAvailableProfiles.filter(p=>{const n=p.name||"";const h=p.handle||"";return n.toLowerCase().includes(cleanQuery)||h.toLowerCase().includes(cleanQuery);}).sort((a,b)=>parseFollowerCount(b.followers_count??b.followers)-parseFollowerCount(a.followers_count??a.followers));
  const filteredTagsResults   = aggregatedPostsList.filter(p=>{const body=(p.content||p.caption||"").toLowerCase();const tag=cleanQuery.startsWith("#")?cleanQuery:`#${cleanQuery}`;return body.includes(cleanQuery)||body.includes(tag);}).sort((a,b)=>getScore(b)-getScore(a));

  const viewingProfile = viewingProfileId ? appProfiles.find(p => p.id===viewingProfileId)||null : null;
  const isOwnProfile   = !viewingProfileId || viewingProfileId === user?.id;
  const profileToShow  = isOwnProfile ? user : viewingProfile;

  const trendingUserIds = (() => {
    const scoreMap = {};
    aggregatedPostsList.forEach(p => { scoreMap[p.authorId] = (scoreMap[p.authorId]||0)+getScore(p); });
    return new Set(Object.entries(scoreMap).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id])=>id));
  })();

  const nowTs                  = Date.now();
  const myActiveStatusItems    = myStatusItems.filter(it => nowTs-it.createdAt < STATUS_TTL_MS);
  const otherStatusesActive    = otherStatuses.map(s=>({...s,items:s.items.filter(it=>nowTs-it.createdAt<STATUS_TTL_MS)})).filter(s=>s.items.length>0);
  const statusFeedForBar       = [
    { userId:user.id, name:"Your Story", handle:user.handle, seed:user.seed||user.name, avatarUrl:user.avatarUrl, verified:!!user.verified, isMe:true, trending:false, items:myActiveStatusItems },
    ...otherStatusesActive.map(s=>({...s,isMe:false,trending:trendingUserIds.has(s.userId)})).sort((a,b)=>(b.trending?1:0)-(a.trending?1:0)),
  ];
  const profileStatusIndex     = profileToShow ? statusFeedForBar.findIndex(s => s.userId===profileToShow.id) : -1;
  const profileHasActiveStory  = profileStatusIndex >= 0 && statusFeedForBar[profileStatusIndex].items.length > 0;
  const trendingFeedPosts      = [...feedPosts].sort((a,b) => getScore(b)-getScore(a));
  const displayedHomePosts     = homeFeedTab==="trending" ? trendingFeedPosts : feedPosts;
  const computedWorldRank      = Math.max(1, Math.floor(Math.max(0,(10000-userScore)/50)+1));
  const computedCampusRank     = Math.max(1, Math.floor(Math.max(0,(1000-userScore)/25)+1));
  const rankedUser             = { ...user, score:userScore, worldRank:computedWorldRank, campusRank:computedCampusRank };
  const unreadMsgCount         = 4; // static for now — replace with real query

  // ── Global CSS ────────────────────────────────────────────────────────────
  const globalStyles = `
    @keyframes coverShimmer{0%{background-position:0 0}100%{background-position:800px 0}}
    @keyframes heartPop{0%{transform:scale(1)}30%{transform:scale(1.5) rotate(-10deg)}60%{transform:scale(0.9) rotate(5deg)}100%{transform:scale(1)}}
    @keyframes bookmarkPop{0%{transform:scale(1)}40%{transform:scale(1.35)}70%{transform:scale(0.92)}100%{transform:scale(1)}}
    @keyframes storyPulse{0%,100%{box-shadow:0 0 0 0 ${PURPLE_GLOW};}50%{box-shadow:0 0 0 6px ${PURPLE_GLOW};}}
    @keyframes overlayFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes modalSlideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes toastPop{0%{opacity:0;transform:translate(-50%,16px) scale(0.92)}10%{opacity:1;transform:translate(-50%,0) scale(1)}88%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,12px) scale(0.95)}}
    @keyframes pullSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes cardIn{from{opacity:0;transform:translateY(14px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes tabFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes rankPop{0%{transform:scale(1)}50%{transform:scale(1.25) rotate(-3deg)}100%{transform:scale(1)}}
    @keyframes glowPulse{0%,100%{box-shadow:0 0 8px ${PURPLE_GLOW}}50%{box-shadow:0 0 20px ${PURPLE_GLOW},0 0 40px rgba(124,58,237,0.2)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    *{box-sizing:border-box;}
    html,body{max-width:430px;margin:0 auto;overscroll-behavior:none;}
    button,input,textarea{font-family:inherit;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:${PURPLE_DIM};border-radius:2px;}
  `;

  if (isAuthLoading) return (
    <div style={{ background:OFF_BLACK, height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", color:PURPLE, fontFamily:"system-ui,sans-serif" }}>
      <style>{globalStyles}</style>
      <div style={{ textAlign:"center", animation:"cardIn 0.5s ease" }}>
        <div style={{ fontSize:48, marginBottom:12, animation:"storyPulse 2s ease-in-out infinite", color:PURPLE }}>✦</div>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:1, color:PURPLE }}>Glimacy</div>
      </div>
    </div>
  );

  if (!isLoggedIn) return <Login T={T}/>;

  const isOnProfile = activeTab === "profile";

  return (
    <div style={{ backgroundColor:T.bg, color:T.text, minHeight:"100vh", maxWidth:430, margin:"0 auto", fontFamily:"system-ui,-apple-system,sans-serif", display:"flex", flexDirection:"column", position:"relative", overflowX:"hidden" }}>
      <style>{globalStyles}</style>

      {/* Global Verify Modal */}
      {verifyModalOpen && (
        <VerifyModal
          T={T} tokens={tokens} user={user}
          onClose={() => setVerifyModalOpen(false)}
          onVerified={(method) => { handleVerified(method); setVerifyModalOpen(false); }}
          onEarnedTokens={handleEarnedTokens}
        />
      )}

      {/* 4-icon App Header (hidden on profile) */}
      {!isOnProfile && (
        <div style={{ opacity:headerVisible?1:0, pointerEvents:headerVisible?"auto":"none", transition:"opacity 0.3s ease" }}>
          <AppHeader
            T={T} user={user}
            onAvatarClick={() => { setViewingProfileId(null); setActiveTab("profile"); }}
            onSearchClick={() => setActiveTab("search")}
            onFeedbackClick={() => setSettingsOpen(true)}
            onSettingsClick={() => setSettingsOpen(true)}
            onMessagesClick={() => setActiveTab("messages")}
            unreadMessages={unreadMsgCount}
          >
            {user.avatarUrl ? (
              <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", border:`2px solid ${PURPLE}` }}>
                <img src={user.avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              </div>
            ) : (
              <Avatar seed={user.name} T={T} glow/>
            )}
          </AppHeader>
        </div>
      )}

      {/* Main scroll area */}
      <div
        ref={scrollContainerRef}
        style={{ flex:1, overflowY:"auto", paddingBottom:isOnProfile?24:82 }}
        onScroll={handleMainScroll}
        onPointerDown={handlePullStart}
        onPointerMove={handlePullMove}
        onPointerUp={handlePullEnd}
        onPointerCancel={handlePullEnd}
      >
        {/* ── HOME ── */}
        {activeTab === "home" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"14px", animation:"tabFade 0.25s ease" }}>
            {(pullDistance > 0 || refreshing) && (
              <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:refreshing?40:pullDistance, transition:refreshing?"height 0.2s ease":"none" }}>
                <RefreshCw size={20} color={PURPLE} style={{ animation:refreshing?"pullSpin 0.7s linear infinite":"none", transform:refreshing?undefined:`rotate(${Math.min(pullDistance*4,280)}deg)`, opacity:Math.min((refreshing?40:pullDistance)/50,1) }}/>
              </div>
            )}
            <StoryBar T={T} statusFeed={statusFeedForBar} seenIds={seenStatusItemIds} onAvatarClick={openStoryViewer} onAddClick={() => setStatusComposerOpen(true)}/>
            <ActionBannerBtns T={T} user={user} tokens={tokens} onVerifyClick={() => setVerifyModalOpen(true)} onEarnClick={() => setVerifyModalOpen(true)}/>
            <div style={{ display:"flex", borderRadius:12, overflow:"hidden", border:`1px solid ${PURPLE_BD}`, flexShrink:0 }}>
              {[{id:"friends",label:"👥 Friends"},{id:"trending",label:"🔥 Trending"}].map(tab => (
                <button key={tab.id} onClick={() => setHomeFeedTab(tab.id)} style={{ flex:1, padding:"10px 0", border:"none", fontSize:13, fontWeight:homeFeedTab===tab.id?700:500, cursor:"pointer", transition:"all 0.2s", background:homeFeedTab===tab.id?PURPLE:"transparent", color:homeFeedTab===tab.id?WHITE:T.muted }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {displayedHomePosts.map((post,i) => (
              <PostCard key={post.id} T={T} post={post} allPosts={feedPosts} setAllPosts={setFeedPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>
            ))}
            <div style={{ opacity:headerVisible?1:0, pointerEvents:headerVisible?"auto":"none", transition:"opacity 0.3s ease" }}>
              <CreatePostFAB T={T} onClick={() => setIsCreateModalOpen(true)}/>
            </div>
            {isCreateModalOpen && (
              <CreatePostModal T={T} user={user} onClose={() => setIsCreateModalOpen(false)} onPost={(newPost) => { setFeedPosts(prev => [{...newPost,likedBy:[]}, ...prev]); if(addPoints)addPoints("POST_CREATED"); }}/>
            )}
          </div>
        )}

        {/* ── CONNECT ── */}
        {activeTab === "connect" && (
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <ConnectHubView T={T} appProfiles={appProfiles} user={user} followingIds={followingIds} handleViewProfile={handleViewProfile} handleToggleFollow={handleToggleFollow}/>
          </div>
        )}

        {/* ── RANKING ── */}
        {activeTab === "ranking" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"14px", animation:"tabFade 0.25s ease" }}>
            <LeaderboardHeader T={T}/>
            {/* Season Rewards */}
            <SeasonRewards T={T}/>
            {/* Score card */}
            <div style={{ background:PURPLE, borderRadius:16, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, boxShadow:`0 4px 24px ${PURPLE_GLOW}`, animation:"glowPulse 3s ease-in-out infinite" }}>
              <div style={{ fontSize:32 }}>🏆</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14, color:WHITE }}>Your Activity Score</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", marginTop:2 }}>
                  Like, comment & post to rank up! World #{computedWorldRank} · Campus #{computedCampusRank}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:900, fontSize:24, color:WHITE, fontVariantNumeric:"tabular-nums" }}>{userScore.toLocaleString()}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.7)", fontWeight:700, letterSpacing:"0.5px" }}>TOTAL PTS</div>
              </div>
            </div>
            {/* Points legend */}
            <div style={{ ...glass(T, { borderRadius:14 }), padding:"12px 16px" }}>
              <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:8 }}>⚡ How to Earn Points</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {Object.entries(POINT_ACTIONS).map(([k,v]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 8px", borderRadius:8, background:T.inputBg, fontSize:11 }}>
                    <span style={{ color:T.muted }}>{k.replace(/_/g," ").toLowerCase()}</span>
                    <span style={{ color:PURPLE, fontWeight:700 }}>+{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <Leaderboard T={T} selfUser={rankedUser}/>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === "notifs" && (
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <NotificationsView T={T} notifs={notifications} onProfileClick={handleViewProfile}/>
          </div>
        )}

        {/* ── MESSAGES (tab) ── */}
        {activeTab === "messages" && (
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <MessagesView T={T} user={user} onViewProfile={handleViewProfile}/>
          </div>
        )}

        {/* ── ADS ── */}
        {activeTab === "ads" && (
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <AdBoostView T={T} user={user} tokens={tokens} onSpendTokens={handleSpendTokens} onEarnClick={() => setVerifyModalOpen(true)}/>
          </div>
        )}

        {/* ── SEARCH ── */}
        {activeTab === "search" && (
          <div style={{ padding:14, display:"flex", flexDirection:"column", gap:12, animation:"tabFade 0.25s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, background:T.inputBg, border:`1px solid ${PURPLE_BD}`, borderRadius:20, padding:"8px 14px" }}>
              <Search size={16} color={T.muted}/>
              <input autoFocus value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search posts, friends, or tags..." style={{ flex:1, background:"none", border:"none", color:T.text, outline:"none", fontSize:13.5 }}/>
              {searchQuery && <X size={16} color={T.muted} style={{ cursor:"pointer" }} onClick={() => setSearchQuery("")}/>}
            </div>
            <div style={{ display:"flex", borderBottom:`1px solid ${T.divider}` }}>
              {[{id:"posts",label:"Posts"},{id:"friends",label:"Friends"},{id:"tags",label:"Tags"}].map(sub => (
                <button key={sub.id} onClick={() => setSearchSubTab(sub.id)} style={{ flex:1, padding:"11px 0", background:"none", border:"none", fontSize:13, fontWeight:searchSubTab===sub.id?700:400, color:searchSubTab===sub.id?PURPLE:T.muted, cursor:"pointer", borderBottom:searchSubTab===sub.id?`2px solid ${PURPLE}`:"2px solid transparent", transition:"all 0.15s" }}>
                  {sub.label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:4 }}>
              {searchSubTab==="posts" && (filteredPostsResults.length > 0 ? filteredPostsResults.map((post,i) => post.type==="video" ? <VideoPostCard key={post.id} T={T} post={post} allPosts={myVideoPosts} setAllPosts={setMyVideoPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/> : <PostCard key={post.id} T={T} post={post} allPosts={feedPosts} setAllPosts={setFeedPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>) : <EmptyState emoji="📝" title="No matching posts" sub="Try different terms" T={T}/>)}
              {searchSubTab==="friends" && (filteredFriendsResults.length > 0 ? filteredFriendsResults.map(p => (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 10px", borderBottom:`1px solid ${T.divider}`, cursor:"pointer", background:T.cardBg, borderRadius:10 }} onClick={() => handleViewProfile(p.id)}>
                  <Avatar seed={p.seed||p.name} T={T}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14, display:"flex", alignItems:"center", gap:5 }}>{p.name}{p.verified&&<GlimacyBadge type={p.verifiedType||"blue"} size={13}/>}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{p.handle||"No handle"}</div>
                  </div>
                  {p.id !== user?.id && (
                    <div onClick={e=>{e.stopPropagation();handleToggleFollow(p.id);}} style={{ padding:4, color:followingIds.has(p.id)?T.text:PURPLE }}>
                      {followingIds.has(p.id)?<UserCheck size={18}/>:<UserPlus size={18}/>}
                    </div>
                  )}
                </div>
              )) : <EmptyState emoji="👥" title="No friends found" sub="Check spelling or try someone else" T={T}/>)}
              {searchSubTab==="tags" && (filteredTagsResults.length > 0 ? filteredTagsResults.map((post,i) => post.type==="video" ? <VideoPostCard key={post.id} T={T} post={post} allPosts={myVideoPosts} setAllPosts={setMyVideoPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/> : <PostCard key={post.id} T={T} post={post} allPosts={feedPosts} setAllPosts={setFeedPosts} onViewProfile={handleViewProfile} onPoints={addPoints} currentUser={user} index={i}/>) : <EmptyState emoji="#️⃣" title="No matching tags" sub="Try #FUTA, #Tech, etc." T={T}/>)}
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === "profile" && profileToShow && (
          <div style={{ animation:"tabFade 0.25s ease" }}>
            <ProfileView
              T={T} profileUser={profileToShow} isOwnProfile={isOwnProfile}
              onBack={handleExitProfile} onEdit={handleOpenEditModal}
              onVerify={() => setVerifyModalOpen(true)}
              myVideoPosts={myVideoPosts} feedPosts={feedPosts}
              setFeedPosts={setFeedPosts} setMyVideoPosts={setMyVideoPosts}
              onViewProfile={handleViewProfile}
              isFollowing={followingIds.has(profileToShow.id)}
              onToggleFollow={handleToggleFollow} onImagePreview={handleImagePreview}
              onUpdateAvatar={handleUpdateAvatar} onUpdateCover={handleUpdateCover}
              savedPosts={savedArchive} onBackupToGmail={handleBackupToGmail}
              onUnsaveArchived={handleUnsaveArchived}
              hasActiveStory={profileHasActiveStory}
              onOpenStory={() => openStoryViewer(profileStatusIndex)}
              onAddStatus={() => setStatusComposerOpen(true)}
              tokens={tokens}
            />
          </div>
        )}
      </div>

      {/* ── 5-TAB BOTTOM NAV ── */}
      {!isOnProfile && (
       <div style={{
  position: "fixed", 
  bottom: 0, 
  left: "50%", 
  width: "100%", 
  maxWidth: 430,
  background: T.isDark ? "rgba(0,0,12,0.97)" : "rgba(240,238,255,0.97)",
  backdropFilter: "blur(16px)", 
  borderTop: `1px solid ${PURPLE_BD}`,
  display: "flex", 
  justifyContent: "space-around", 
  padding: "8px 0 18px", 
  zIndex: 40,
  opacity: headerVisible ? 1 : 0, 
  transform: headerVisible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(14px)",
  pointerEvents: headerVisible ? "auto" : "none", 
  transition: "opacity 0.3s ease, transform 0.3s ease",
}}>
  {BOTTOM_NAV.map(({ id, Icon, label }) => {
    const isActive = activeTab === id;
    return (
              <div key={id} onClick={() => { setActiveTab(id); if(id==="profile")setViewingProfileId(null); }}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, color:isActive?PURPLE:T.muted, cursor:"pointer", flex:1, transition:"color 0.2s,transform 0.15s", transform:isActive?"translateY(-1px)":"translateY(0)" }}>
                <div style={{ ...(isActive?{filter:`drop-shadow(0 0 6px ${PURPLE_GLOW})`}:{}), position:"relative" }}>
                  <Icon size={19} strokeWidth={isActive?2.5:2}/>
                  {id==="ads" && <span style={{ position:"absolute", top:-4, right:-6, background:PURPLE, color:WHITE, fontSize:7, fontWeight:900, borderRadius:99, padding:"1px 4px", lineHeight:1 }}>NEW</span>}
                </div>
                <span style={{ fontSize:9.5, fontWeight:isActive?700:400 }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isEditModalOpen && (
        <EditProfileModal
          T={T} user={user}
          editName={editName}         setEditName={setEditName}
          editHandle={editHandle}     setEditHandle={setEditHandle}
          editBio={editBio}           setEditBio={setEditBio}
          editUni={editUni}           setEditUni={setEditUni}
          editFaculty={editFaculty}   setEditFaculty={setEditFaculty}
          editRelationship={editRelationship} setEditRelationship={setEditRelationship}
          editGender={editGender}     setEditGender={setEditGender}
          editPhone={editPhone}       setEditPhone={setEditPhone}
          editHobby={editHobby}       setEditHobby={setEditHobby}
          onSave={handleSaveProfile}  onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {statusComposerOpen && (
        <StatusComposerModal T={T} onClose={() => setStatusComposerOpen(false)}
          onSubmit={(partial) => { setMyStatusItems(prev=>[{id:uid("st"),createdAt:Date.now(),...partial},...prev]); setStatusComposerOpen(false); showToast("Status posted to your story!"); }}
        />
      )}
      {storyViewerIndex !== null && (
        <StoryViewerModal
          T={T} statusFeed={statusFeedForBar} startIndex={storyViewerIndex}
          seenIds={seenStatusItemIds} setSeenIds={setSeenStatusItemIds}
          onDeleteMyItem={(itemId) => setMyStatusItems(prev=>prev.filter(it=>it.id!==itemId))}
          onClose={closeStoryViewer}
          statusLikes={statusLikes} setStatusLikes={setStatusLikes}
          statusViews={statusViews} setStatusViews={setStatusViews}
          currentUser={user} onPoints={addPoints}
        />
      )}

      <Toast T={T} message={toast}/>
      <SettingsPanel
        T={T} open={settingsOpen} onClose={() => setSettingsOpen(false)}
        themeMode={themeMode} setThemeMode={setThemeMode}
        onSignOut={() => supabase.auth.signOut()}
        onFeedback={() => {}}
      />
    </div>
  );
}