import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown, UserPlus, UserCheck,
  MessageSquare, Shuffle, RefreshCw
} from "lucide-react";

// ── FIXED IMPORTS (Changed from ../../ui/ to ./) ──
// ── UPDATED IMPORTS ──
import { Avatar } from "../../ui/Avatar";
import { VerifiedBadge } from "../../ui/Shared";
// Remove the old import pointing to EditProfileModal.jsx
// Add this new import:
import { NIGERIAN_UNIVERSITIES } from "../../../constants";

// ─────────────────────────────────────────────────────────────────
// HELPERS & DATA
// ─────────────────────────────────────────────────────────────────
const accent    = T => T.isDark ? "#00D2C4" : "#0F766E";
const accentDim = T => T.isDark ? "rgba(0,210,196,0.10)" : "rgba(15,118,110,0.09)";

// FUTA Specific Faculties
const FUTA_FACULTIES = [
  "SAAT", "SBMS", "SEET", "SET", "SIMME", "SMAT", "SOC", "SOS", "SPES"
];

function getCommonThings(userA, userB) {
  const commons = [];
  if (userA.university && userB.university && userA.university === userB.university) commons.push("Same university 🏫");
  if (userA.faculty && userB.faculty && userA.faculty === userB.faculty) commons.push("Same faculty 📚");
  if (userA.gender && userB.gender && userA.gender === userB.gender) commons.push(`Fellow ${userA.gender} 👥`);
  if (userA.relationshipStatus && userB.relationshipStatus && userA.relationshipStatus === userB.relationshipStatus) commons.push(`Both ${userA.relationshipStatus} 💘`);
  const aHobby = (userA.hobby || "").toLowerCase();
  const bHobby = (userB.hobby || "").toLowerCase();
  const aWords = aHobby.split(/\s+/).filter(w => w.length > 4);
  const bWords = bHobby.split(/\s+/).filter(w => w.length > 4);
  if (aWords.some(w => bWords.includes(w))) commons.push("Similar hobbies 🎨");
  return commons;
}

// ─────────────────────────────────────────────────────────────────
// ACTIVE STATUS BADGE
// ─────────────────────────────────────────────────────────────────
export function ActiveStatusBadge({ isOnline, lastSeen, T, size = "sm" }) {
  const dotSize = size === "sm" ? 8 : 10;
  const fontSize = size === "sm" ? 10 : 11;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <div style={{
        width:dotSize, height:dotSize, borderRadius:"50%",
        background: isOnline ? "#22c55e" : T.muted,
        boxShadow: isOnline ? "0 0 0 2px rgba(34,197,94,0.3)" : "none",
        flexShrink:0,
        animation: isOnline ? "onlinePulse 2.5s ease-in-out infinite" : "none",
      }} />
      <span style={{ fontSize, color: isOnline ? "#22c55e" : T.muted, fontWeight:500 }}>
        {isOnline ? "Online" : lastSeen ? `Seen ${lastSeen}` : "Offline"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROFILE CONNECT CARD
// ─────────────────────────────────────────────────────────────────
function ConnectCard({ T, profile, isFollowing, onToggleFollow, onViewProfile, onMessage, commons = [] }) {
  const C_accent = accent(T);
  const displayName = profile.name || `${profile.first_name||""} ${profile.last_name||""}`.trim() || "User";

  return (
    <div style={{
      background: T.cardBg, backdropFilter:"blur(18px)",
      border:`1px solid ${T.cardBorder}`,
      boxShadow: T.cardShadow,
      borderRadius:16, padding:16, overflow:"hidden",
      transition:"transform 0.2s, box-shadow 0.2s",
      marginBottom: 12
    }}
    >
      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
        <div style={{ position:"relative", flexShrink:0, cursor:"pointer" }} onClick={() => onViewProfile(profile.id)} >
          <Avatar seed={profile.seed || displayName} size={50} T={T} />
          <div style={{
            position:"absolute", bottom:1, right:1,
            width:13, height:13, borderRadius:"50%",
            background: profile.isOnline ? "#22c55e" : T.muted,
            border:`2px solid ${T.isDark?"#0F1419":"#fff"}`,
            boxShadow: profile.isOnline ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
          }} />
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:14, color:T.text, cursor:"pointer" }}
              onClick={() => onViewProfile(profile.id)}>{displayName}</span>
            {profile.verified && <VerifiedBadge />}
          </div>
          <div style={{ fontSize:11.5, color:T.muted, marginBottom:4 }}>
            {profile.handle}
          </div>

          <ActiveStatusBadge isOnline={profile.isOnline} lastSeen={profile.lastSeen} T={T} />

          {profile.university && (
            <div style={{ fontSize:11, color:T.mutedMid, marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
              🏫 {profile.university.split(" (")[0]}
            </div>
          )}
          {profile.faculty && (
            <div style={{ fontSize:11, color:T.mutedMid, display:"flex", alignItems:"center", gap:4 }}>
              📚 {profile.faculty}
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
          <button onClick={() => onToggleFollow(profile.id)} style={{
            display:"flex", alignItems:"center", gap:5, padding:"6px 14px",
            borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer",
            background: isFollowing ? "rgba(255,255,255,0.08)" : C_accent,
            color: isFollowing ? T.text : "#0B0F12",
            border: isFollowing ? `1px solid ${T.divider}` : "none",
            transition:"all 0.2s",
          }}>
            {isFollowing ? <UserCheck size={13}/> : <UserPlus size={13}/>}
            {isFollowing ? "Following" : "Add"}
          </button>
          <button onClick={() => onMessage(profile.id)} style={{
            display:"flex", alignItems:"center", gap:5, padding:"6px 14px",
            borderRadius:20, border:`1px solid ${T.divider}`, fontSize:12, fontWeight:600,
            cursor:"pointer", background:"none", color:C_accent, transition:"all 0.2s",
          }}>
            <MessageSquare size={13}/> Message
          </button>
        </div>
      </div>

      {commons.length > 0 && (
        <div style={{
          marginTop:12, paddingTop:10, borderTop:`1px solid ${T.divider}`,
          display:"flex", flexWrap:"wrap", gap:6,
        }}>
          {commons.map((c,i) => (
            <div key={i} style={{
              background:`${C_accent}15`, border:`1px solid ${C_accent}30`,
              borderRadius:20, padding:"3px 10px",
              fontSize:11, color:C_accent, fontWeight:600,
            }}>{c}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CUSTOM SELECT DROPDOWNS
// ─────────────────────────────────────────────────────────────────
function CustomSelect({ T, value, onChange, options, placeholder, icon }) {
  const [open, setOpen] = useState(false);
  const C_accent = accent(T);

  return (
    <div style={{ position:"relative", flex:1 }}>
      <div onClick={() => setOpen(v=>!v)} style={{
        display:"flex", alignItems:"center", gap:8, cursor:"pointer",
        background:T.inputBg, border:`1px solid ${open ? C_accent : T.inputBorder}`,
        borderRadius:16, padding:"12px 14px", fontSize:13, color:T.text,
        transition:"border-color 0.2s",
      }}>
        {icon}
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {value || placeholder}
        </span>
        <ChevronDown size={15} color={T.muted} style={{ transform:open?"rotate(180deg)":"none", transition:"0.2s" }} />
      </div>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:200,
          background:T.isDark?"#12181E":"#fff",
          border:`1px solid ${T.cardBorder}`,
          borderRadius:14, boxShadow:"0 12px 40px rgba(0,0,0,0.5)",
          maxHeight:200, overflowY:"auto",
        }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                padding:"10px 14px", fontSize:13, color:value===opt?C_accent:T.text,
                cursor:"pointer", fontWeight:value===opt?700:400, transition:"background 0.15s",
              }}
              onMouseOver={e=>e.currentTarget.style.background=T.hoverBg}
              onMouseOut={e=>e.currentTarget.style.background="none"}
            >{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SPIN MATCH COMPONENT
// ─────────────────────────────────────────────────────────────────
function SpinMatch({ T, user, profiles, followingIds, onToggleFollow, onViewProfile, onMessage }) {
  const [spinning, setSpinning] = useState(false);
  const [match, setMatch] = useState(null);
  const [displaySeed, setDisplaySeed] = useState("??");
  const [commons, setCommons] = useState([]);
  
  // Partner Preferences State
  const [targetUni, setTargetUni] = useState("");
  const [targetFaculty, setTargetFaculty] = useState("");
  const [targetGender, setTargetGender] = useState("");

  const intervalRef = useRef(null);
  const C_accent = accent(T);

  const isFutaSelected = targetUni.includes("Federal University of Technology, Akure") || targetUni.includes("FUTA");

  // Determine eligible pool based on selections
  const eligiblePool = profiles.filter(p => {
    if (targetUni && targetUni !== "Any University" && p.university !== targetUni) return false;
    if (isFutaSelected && targetFaculty && targetFaculty !== "Any Faculty" && p.faculty !== targetFaculty) return false;
    if (targetGender && targetGender !== "Any Gender" && p.gender !== targetGender) return false;
    return true;
  });

  const spin = () => {
    if (spinning || eligiblePool.length === 0) return;
    setSpinning(true);
    setMatch(null);

    let ticks = 0;
    const total = 18 + Math.floor(Math.random() * 10); 
    intervalRef.current = setInterval(() => {
      const rnd = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
      setDisplaySeed(rnd.seed || rnd.name || "?");
      ticks++;
      
      if (ticks >= total) {
        clearInterval(intervalRef.current);
        // Find best match in the eligible pool based on common interests
        const scored = eligiblePool.map(p => ({ p, score: getCommonThings(user, p).length + Math.random() * 0.5 }));
        scored.sort((a, b) => b.score - a.score);
        const winner = scored[0].p;
        const winCommons = getCommonThings(user, winner);
        
        setMatch(winner);
        setCommons(winCommons);
        setDisplaySeed(winner.seed || winner.name);
        setSpinning(false);
      }
    }, spinning ? 60 : 80);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div style={{
      background: T.cardBg, backdropFilter:"blur(18px)",
      border:`1px solid ${T.cardBorder}`, borderRadius:20,
      padding:20, textAlign:"center",
    }}>
      <div style={{ fontSize:13, fontWeight:700, color:C_accent, marginBottom:16, letterSpacing:"0.08em" }}>
        🎯 FIND A PARTNER
      </div>

      {/* Target Criteria Selection */}
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24, textAlign:"left" }}>
        <CustomSelect 
          T={T} value={targetUni} onChange={setTargetUni}
          options={["Any University", ...NIGERIAN_UNIVERSITIES]}
          placeholder="Select University" icon="🏫" 
        />
        
        {isFutaSelected && (
           <CustomSelect 
             T={T} value={targetFaculty} onChange={setTargetFaculty}
             options={["Any Faculty", ...FUTA_FACULTIES]}
             placeholder="Select FUTA Faculty" icon="📚" 
           />
        )}

        <CustomSelect 
          T={T} value={targetGender} onChange={setTargetGender}
          options={["Any Gender", "Male", "Female"]}
          placeholder="Select Gender" icon="👥" 
        />
      </div>

      <div style={{ fontSize:12, color:T.muted, marginBottom:18 }}>
        {eligiblePool.length} {eligiblePool.length === 1 ? "person matches" : "people match"} your criteria
      </div>

      {/* Slot display */}
      <div style={{
        width:90, height:90, borderRadius:"50%", margin:"0 auto 20px",
        background:`linear-gradient(135deg,${accentDim(T)},${T.cardBg})`,
        border:`2.5px solid ${spinning ? C_accent : T.cardBorder}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: spinning ? `0 0 32px ${C_accent}44` : "none",
        transition:"border-color 0.2s, box-shadow 0.2s",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ animation: spinning ? "spinAvatar 0.12s linear infinite" : (match ? "avatarReveal 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : "none") }}>
          {(spinning || match) ? ( <Avatar seed={displaySeed} size={70} T={T} /> ) : ( <Shuffle size={32} color={T.muted} /> )}
        </div>
      </div>

      <style>{`
        @keyframes spinAvatar { 0%,100%{opacity:0.6;transform:scale(0.95);} 50%{opacity:1;transform:scale(1.05);} }
        @keyframes avatarReveal { from{transform:scale(0.3) rotate(-20deg);opacity:0;} to{transform:scale(1) rotate(0);opacity:1;} }
        @keyframes onlinePulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4);} 50%{box-shadow:0 0 0 4px rgba(34,197,94,0);} }
      `}</style>

      {/* Spin button */}
      <button onClick={spin} disabled={spinning || eligiblePool.length === 0} style={{
        display:"inline-flex", alignItems:"center", gap:8,
        padding:"12px 36px", borderRadius:24, border:"none",
        background: spinning || eligiblePool.length === 0 ? T.divider : `linear-gradient(135deg,${C_accent},${T.isDark?"#0077b6":"#0ea5e9"})`,
        color: spinning || eligiblePool.length === 0 ? T.muted : "#0B0F12",
        fontWeight:800, fontSize:15, cursor: (spinning || eligiblePool.length === 0) ? "not-allowed" : "pointer",
        boxShadow: spinning || eligiblePool.length === 0 ? "none" : `0 6px 24px ${C_accent}44`,
        transition:"all 0.25s", marginBottom:16, width:"100%", justifyContent:"center"
      }}>
        <RefreshCw size={18} style={{ animation: spinning ? "spinIcon 0.7s linear infinite" : "none" }} />
        {spinning ? "Finding Partner…" : match ? "Spin Again" : "Start Search"}
      </button>

      {/* Match result */}
      {match && !spinning && (
        <div style={{ animation:"fadeMatchIn 0.4s ease both", textAlign:"left", marginTop:16 }}>
          <style>{`@keyframes fadeMatchIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:none;} }`}</style>
          <div style={{ fontSize:13, color:T.muted, marginBottom:10, textAlign:"center" }}>
            ✨ Found a connection with <strong style={{ color:T.text }}>{match.name || match.first_name}</strong>!
          </div>
          <ConnectCard
            T={T} profile={match} commons={commons}
            isFollowing={followingIds.has(match.id)}
            onToggleFollow={onToggleFollow}
            onViewProfile={onViewProfile}
            onMessage={onMessage}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN CONNECT HUB VIEW
// ─────────────────────────────────────────────────────────────────
export default function ConnectHubView({ T, user, appProfiles, followingIds, onToggleFollow, onViewProfile }) {
  const [tab, setTab] = useState("spin"); // Defaulting to spin tab for partner search
  const C_accent = accent(T);

  const onMessage = (profileId) => {
    alert(`Opening DM with user ${profileId} (connect to your messages tab)`);
  };

  const candidateProfiles = appProfiles.filter(p => p.id !== user?.id);

  return (
    <div>
      {/* Header */}
      <div style={{ padding:"16px 16px 0" }}>
        <h2 style={{ fontSize:20, fontWeight:800, margin:"0 0 2px", color:T.text }}>Connect Hub</h2>
        <p style={{ fontSize:12.5, color:T.muted, margin:"0 0 14px" }}>
          Find your campus tribe 🎓
        </p>

        {/* Sub tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:14 }}>
          <button onClick={() => setTab("spin")} style={{
            flex:1, padding:"10px 0", borderRadius:12, border:"none",
            background: tab==="spin" ? C_accent : T.inputBg,
            color: tab==="spin" ? "#0B0F12" : T.muted,
            fontWeight: tab==="spin" ? 800 : 500,
            fontSize:13, cursor:"pointer", transition:"all 0.2s",
          }}>
            ⚡ Find Partner
          </button>
          <button onClick={() => setTab("browse")} style={{
            flex:1, padding:"10px 0", borderRadius:12, border:"none",
            background: tab==="browse" ? C_accent : T.inputBg,
            color: tab==="browse" ? "#0B0F12" : T.muted,
            fontWeight: tab==="browse" ? 800 : 500,
            fontSize:13, cursor:"pointer", transition:"all 0.2s",
          }}>
            👥 Browse All
          </button>
        </div>
      </div>

      {tab === "spin" && (
        <div style={{ padding:"0 14px 14px" }}>
          <SpinMatch
            T={T} user={user} profiles={candidateProfiles}
            followingIds={followingIds} onToggleFollow={onToggleFollow}
            onViewProfile={onViewProfile} onMessage={onMessage}
          />
        </div>
      )}

      {tab === "browse" && (
        <div style={{ padding:"0 14px 14px" }}>
          {candidateProfiles.map(p => (
            <ConnectCard
              key={p.id} T={T} profile={p} commons={getCommonThings(user, p)}
              isFollowing={followingIds.has(p.id)} onToggleFollow={onToggleFollow}
              onViewProfile={onViewProfile} onMessage={onMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
}