import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, UserPlus, Check, Users } from 'lucide-react';

// --- Authentic Twitter Verified Tick ---
const TwitterVerifiedIcon = ({ size = 16 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', flexShrink: 0 }}
  >
    <path
      fill="#1D9BF0"
      d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.407-.17-.867-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.28 3.422 2.28s2.825-1.015 3.422-2.28c.407.17.867.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 3.28l-3.29-3.29 1.41-1.42 1.88 1.88 5.18-5.18 1.42 1.42-6.6 6.59z"
    />
  </svg>
);

const TrophyIcon = ({ color = '#FFD700', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v1c0 2.2-1.8 4-4 4h-4a4 4 0 0 1-4-4V8a6 6 0 0 1 6-6z" />
  </svg>
);

// --- Theme-aware color helpers ---
const hexToRgb = (hex) => {
  if (!hex) return null;
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16)
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.substring(0, 2), 16),
      parseInt(clean.substring(2, 4), 16),
      parseInt(clean.substring(4, 6), 16)
    ];
  }
  return null;
};

const isLightColor = (hex) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return (r * 299 + g * 587 + b * 114) / 1000 > 125;
};

const getInitials = (name = '') =>
  name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const stripSelfTag = (name = '') => name.replace(/\s*\(You\)\s*/i, '').trim();

// Deterministic mock movement so each user has a stable rank trend across renders
const getTrend = (id) => {
  const seed = Math.abs(Math.sin(id * 12.9898)) % 1;
  if (seed < 0.42) return { dir: 'up', delta: 1 + (id % 4) };
  if (seed < 0.78) return { dir: 'down', delta: 1 + (id % 3) };
  return { dir: 'flat', delta: 0 };
};

// Lightweight count-up used for every score value on the board
function AnimatedNumber({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => frame && cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display.toLocaleString()}</span>;
}

export default function Leaderboard({
  T = { bg: '#0F172A', surface: '#1E293B', accent: '#F59E0B', text: '#F8FAFC' },
  lbRef,
  isScrolling,
  onAvatarClick,
  lbTab,
  setLbTab,
  selfUser
}) {
  // Dual-state hook supports both standalone use and parent-controlled navigation
  const [localTab, setLocalTab] = useState('world');
  const activeTab = lbTab || localTab;

  const handleTabChange = (targetTab) => {
    if (setLbTab) setLbTab(targetTab);
    setLocalTab(targetTab);
  };

  const [followedUsers, setFollowedUsers] = useState([2, 5, 9]);
  const touchStartX = useRef(0);

  const adaptiveMuted = isLightColor(T.bg) ? '#475569' : '#94A3B8';
  const activeTabTextColor = isLightColor(T.accent) ? '#0F172A' : '#FFFFFF';
  const neutralBadgeBg = isLightColor(T.bg) ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';

  // Swipe gesture handlers
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 60 && activeTab === 'world') handleTabChange('campus');
    else if (diffX < -60 && activeTab === 'campus') handleTabChange('world');
  };

  const toggleFollow = (id, e) => {
    e.stopPropagation();
    setFollowedUsers((prev) => (prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]));
  };

  // --- Mock data ---
  const worldUsers = [
    { id: 1, name: 'Sarah Jenkins', points: 4950, verified: true, university: 'MIT', avatarBg: '#FFD700' },
    { id: 2, name: 'Liam Chen', points: 4820, verified: true, university: 'Stanford University', avatarBg: '#C0C0C0' },
    { id: 3, name: 'Sofia Rodriguez', points: 4710, verified: false, university: 'Oxford University', avatarBg: '#CD7F32' },
    { id: 4, name: 'Amara Okafor', points: 4500, verified: true, university: 'Harvard University', avatarBg: '#3B82F6' },
    { id: 5, name: 'Yuki Tanaka', points: 4390, verified: false, university: 'University of Tokyo', avatarBg: '#EC4899' },
    { id: 6, name: 'Ethan Hunt', points: 4210, verified: true, university: 'Stanford University', avatarBg: '#10B981' },
    { id: 7, name: 'Elena Rostova', points: 4150, verified: false, university: 'Sorbonne University', avatarBg: '#8B5CF6' },
    { id: 8, name: 'Marcus Vance', points: 3990, verified: true, university: 'UC Berkeley', avatarBg: '#F59E0B' },
    { id: 9, name: 'Chloe Baker', points: 3870, verified: false, university: 'Stanford University', avatarBg: '#EF4444' },
    { id: 10, name: 'Lucas Meyer', points: 3740, verified: true, university: 'ETH Zurich', avatarBg: '#6366F1' },
    { id: 11, name: 'Aisha Yusuf', points: 3610, verified: false, university: 'University of Cape Town', avatarBg: '#14B8A6' },
    { id: 12, name: 'Mateo Silva', points: 3500, verified: false, university: 'University of São Paulo', avatarBg: '#F97316' },
    { id: 13, name: 'Emma Watson', points: 3420, verified: true, university: 'Cambridge University', avatarBg: '#A855F7' },
    { id: 14, name: 'Alex Rivera (You)', points: 3380, verified: true, university: 'Stanford University', avatarBg: '#06B6D4' },
    { id: 15, name: 'Devon Lane', points: 3210, verified: false, university: 'Yale University', avatarBg: '#64748B' },
    { id: 16, name: 'Jane Cooper', points: 3150, verified: false, university: 'Columbia University', avatarBg: '#475569' },
    { id: 17, name: 'Cody Fisher', points: 2990, verified: true, university: 'Princeton University', avatarBg: '#334155' },
    { id: 18, name: 'Theresa Webb', points: 2840, verified: false, university: 'Cornell University', avatarBg: '#1E293B' },
    { id: 19, name: 'Savannah Nguyen', points: 2710, verified: true, university: 'Caltech', avatarBg: '#0F172A' },
    { id: 20, name: 'Eleanor Pena', points: 2600, verified: false, university: 'Duke University', avatarBg: '#334155' }
  ];

  const campusUsers = [
    { id: 2, name: 'Liam Chen', points: 4820, verified: true, university: 'Main Campus', avatarBg: '#C0C0C0' },
    { id: 6, name: 'Ethan Hunt', points: 4210, verified: true, university: 'Science Annex', avatarBg: '#10B981' },
    { id: 14, name: 'Alex Rivera (You)', points: 3380, verified: true, university: 'Engineering Block', avatarBg: '#06B6D4' },
    { id: 9, name: 'Chloe Baker', points: 3120, verified: false, university: 'Medical Quad', avatarBg: '#EF4444' },
    { id: 21, name: 'Bradley Wilson', points: 2540, verified: false, university: 'Main Campus', avatarBg: '#F43F5E' },
    { id: 22, name: 'Kristin Watson', points: 2490, verified: true, university: 'Main Campus', avatarBg: '#84CC16' },
    { id: 23, name: 'Danny DeVito', points: 2410, verified: false, university: 'Arts Theater', avatarBg: '#10B981' },
    { id: 24, name: 'Guy Hawkins', points: 2350, verified: false, university: 'Main Campus', avatarBg: '#E2E8F0' },
    { id: 25, name: 'Dianne Russell', points: 2290, verified: true, university: 'West Wing', avatarBg: '#A855F7' },
    { id: 26, name: 'Albert Flores', points: 2210, verified: false, university: 'Main Campus', avatarBg: '#F97316' },
    { id: 27, name: 'Floyd Miles', points: 2150, verified: false, university: 'Science Annex', avatarBg: '#06B6D4' },
    { id: 28, name: 'Marvin McKinney', points: 2090, verified: true, university: 'Main Campus', avatarBg: '#6366F1' },
    { id: 29, name: 'Jerome Bell', points: 1980, verified: false, university: 'Engineering Block', avatarBg: '#EC4899' },
    { id: 30, name: 'Courtney Henry', points: 1850, verified: false, university: 'Main Campus', avatarBg: '#475569' },
    { id: 31, name: 'Arlene McCoy', points: 1740, verified: true, university: 'West Wing', avatarBg: '#14B8A6' },
    { id: 32, name: 'Kathryn Murphy', points: 1690, verified: false, university: 'Main Campus', avatarBg: '#F59E0B' },
    { id: 33, name: 'Darrell Steward', points: 1550, verified: false, university: 'Medical Quad', avatarBg: '#64748B' },
    { id: 34, name: 'Esther Howard', points: 1420, verified: true, university: 'Main Campus', avatarBg: '#3B82F6' },
    { id: 35, name: 'Leslie Alexander', points: 1310, verified: false, university: 'Arts Theater', avatarBg: '#CD7F32' },
    { id: 36, name: 'Ronald Richards', points: 1200, verified: false, university: 'Main Campus', avatarBg: '#FFD700' }
  ].sort((a, b) => b.points - a.points);

  const currentList = activeTab === 'world' ? worldUsers : campusUsers;

  const resolvedSelfUser = selfUser || {
    id: 14,
    name: 'Alex Rivera',
    verified: true,
    university: 'Stanford University',
    campus: 'Main Campus',
    worldRank: 14,
    campusRank: 3,
    points: 3380
  };
  const selfId = resolvedSelfUser.id ?? 14;

  const getPremiumPodiumStyles = (rank) => {
    switch (rank) {
      case 1:
        return {
          borderColor: '#FFD700',
          shadow: '0 0 20px rgba(255, 215, 0, 0.25)',
          badgeBg: 'linear-gradient(135deg, #FFE066 0%, #F59E0B 100%)',
          textCol: '#F59E0B'
        };
      case 2:
        return {
          borderColor: '#E2E8F0',
          shadow: '0 0 20px rgba(226, 232, 240, 0.15)',
          badgeBg: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
          textCol: '#94A3B8'
        };
      case 3:
        return {
          borderColor: '#B45309',
          shadow: '0 0 20px rgba(180, 83, 9, 0.15)',
          badgeBg: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
          textCol: '#B45309'
        };
      default:
        return null;
    }
  };

  // Embedded stylesheet driving every motion cue used below
  const animationStyles = `
    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes eliteShine {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes trophyFloat {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-2px) rotate(-3deg); }
    }
    @keyframes livePulse {
      0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); }
      70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    @keyframes ringPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.45); }
      50% { box-shadow: 0 0 0 5px rgba(255,215,0,0); }
    }
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes popIn {
      0% { transform: scale(0.6); opacity: 0; }
      60% { transform: scale(1.08); opacity: 1; }
      100% { transform: scale(1); }
    }
    .leaderboard-row-animate {
      animation: cardFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .premium-gold-glow {
      background: linear-gradient(90deg, rgba(30,41,59,0.7) 0%, rgba(245,158,11,0.08) 50%, rgba(30,41,59,0.7) 100%);
      background-size: 200% auto;
      animation: eliteShine 4s linear infinite, cardFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .trophy-float { animation: trophyFloat 3.2s ease-in-out infinite; }
    .live-dot { animation: livePulse 2s ease-out infinite; }
    .rank1-ring { animation: ringPulse 2.4s ease-in-out infinite; }
    .bottom-bar-enter { animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .rank-pop { animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .lb-row-hover { transition: transform 0.2s ease, filter 0.2s ease; }
    .lb-row-hover:hover { transform: translateY(-2px); filter: brightness(1.06); }
    .lb-row-hover:active { transform: translateY(0) scale(0.995); }
    .lb-follow-btn { transition: transform 0.15s ease, background-color 0.2s ease, color 0.2s ease; }
    .lb-follow-btn:active { transform: scale(0.92); }
    .lb-scroll::-webkit-scrollbar { width: 6px; }
    .lb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
    .lb-scroll { scrollbar-width: thin; }
    @media (prefers-reduced-motion: reduce) {
      .leaderboard-row-animate, .premium-gold-glow, .trophy-float, .live-dot,
      .rank1-ring, .bottom-bar-enter, .rank-pop {
        animation: none !important;
      }
    }
  `;

  return (
    <div
      style={{
        backgroundColor: T.bg,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {/* Header */}
      <div style={{ padding: '20px 20px 14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span className="trophy-float" style={{ display: 'inline-flex', transformOrigin: 'center bottom' }}>
            <TrophyIcon color={T.accent} size={26} />
          </span>
          <h2 style={{ color: T.text, fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            Arena Standings
          </h2>
        </div>

        {/* Tabs with animated sliding indicator */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            position: 'relative',
            backgroundColor: 'rgba(0,0,0,0.15)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: 'calc(50% - 4px)',
              borderRadius: '8px',
              background: T.accent,
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              transform: activeTab === 'campus' ? 'translateX(100%)' : 'translateX(0)',
              transition: 'transform 0.35s cubic-bezier(0.65, 0, 0.35, 1)'
            }}
          />
          <button
            role="tab"
            aria-selected={activeTab === 'world'}
            onClick={() => handleTabChange('world')}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              padding: '10px 0',
              fontSize: '14px',
              fontWeight: 700,
              color: activeTab === 'world' ? activeTabTextColor : adaptiveMuted,
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'color 0.25s ease'
            }}
          >
            World Rank
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'campus'}
            onClick={() => handleTabChange('campus')}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              padding: '10px 0',
              fontSize: '14px',
              fontWeight: 700,
              color: activeTab === 'campus' ? activeTabTextColor : adaptiveMuted,
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'color 0.25s ease'
            }}
          >
            Campus Rank
          </button>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: adaptiveMuted, fontWeight: 600 }}>
          <Users size={12} />
          <span>{currentList.length} competitors</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: adaptiveMuted, opacity: 0.5 }} />
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', animationPlayState: isScrolling ? 'paused' : 'running' }} />
          <span>Live rankings</span>
        </div>
      </div>

      {/* List */}
      <div
        ref={lbRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="lb-scroll"
        style={{
          padding: '16px 16px 115px 16px',
          overflowY: 'auto',
          flex: 1,
          scrollBehavior: 'smooth'
        }}
      >
        {currentList.map((user, idx) => {
          const rank = idx + 1;
          const premiumStyle = getPremiumPodiumStyles(rank);
          const isFollowing = followedUsers.includes(user.id);
          const isSelf = user.id === selfId;
          const displayName = stripSelfTag(user.name);
          const trend = getTrend(user.id);

          return (
            <div
              key={`${activeTab}-${user.id}`}
              onClick={() => onAvatarClick?.(user)}
              className={`leaderboard-row-animate lb-row-hover ${rank === 1 ? 'premium-gold-glow' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                backgroundColor: premiumStyle ? undefined : isSelf ? `${T.accent}14` : T.surface,
                borderRadius: '14px',
                marginBottom: '10px',
                cursor: 'pointer',
                border: premiumStyle
                  ? `1px solid ${premiumStyle.borderColor}`
                  : isSelf
                  ? `1px solid ${T.accent}55`
                  : '1px solid rgba(255,255,255,0.03)',
                boxShadow: premiumStyle?.shadow,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animationDelay: `${idx * 0.03}s`
              }}
            >
              {/* Rank badge + trend indicator */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: premiumStyle ? premiumStyle.badgeBg : neutralBadgeBg,
                    border: premiumStyle ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: premiumStyle ? '#0F172A' : adaptiveMuted
                  }}
                >
                  {rank}
                </div>
                {trend.dir !== 'flat' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -3,
                      right: -3,
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: trend.dir === 'up' ? '#10B981' : '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${T.bg}`
                    }}
                  >
                    {trend.dir === 'up' ? (
                      <TrendingUp size={8} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <TrendingDown size={8} color="#FFFFFF" strokeWidth={3} />
                    )}
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div
                className={rank === 1 ? 'rank1-ring' : ''}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: user.avatarBg || T.accent,
                  border: premiumStyle ? `2px solid ${premiumStyle.borderColor}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#000',
                  fontSize: '15px',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                {getInitials(user.name)}
              </div>

              {/* Identity */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      color: T.text,
                      fontWeight: rank <= 3 ? 700 : 600,
                      fontSize: '15px',
                      wordBreak: 'break-word'
                    }}
                  >
                    {displayName}
                  </span>
                  {user.verified && <TwitterVerifiedIcon />}
                  {isSelf && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        backgroundColor: T.accent,
                        color: activeTabTextColor,
                        marginLeft: '6px',
                        letterSpacing: '0.3px',
                        flexShrink: 0
                      }}
                    >
                      YOU
                    </span>
                  )}
                </div>

                <div
                  style={{
                    color: adaptiveMuted,
                    fontSize: '12px',
                    marginTop: '2px',
                    wordBreak: 'break-word',
                    fontWeight: 500
                  }}
                >
                  {user.university}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {!isSelf && (
                  <button
                    onClick={(e) => toggleFollow(user.id, e)}
                    className="lb-follow-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isFollowing ? '1px solid rgba(255,255,255,0.15)' : 'none',
                      backgroundColor: isFollowing ? 'rgba(255,255,255,0.08)' : T.text,
                      color: isFollowing ? adaptiveMuted : T.bg
                    }}
                  >
                    {isFollowing ? <Check size={11} /> : <UserPlus size={11} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}

                <div
                  style={{
                    textAlign: 'right',
                    minWidth: '48px',
                    color: premiumStyle ? premiumStyle.textCol : T.accent,
                    fontWeight: 700,
                    fontSize: '14px'
                  }}
                >
                  <AnimatedNumber value={user.points} />
                  <span style={{ display: 'block', fontSize: '9px', color: adaptiveMuted, fontWeight: 600 }}>PTS</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Self status bar */}
      <div
        className="bottom-bar-enter"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isLightColor(T.bg) ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 20px 24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.3)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <span style={{ display: 'block', fontSize: '9px', color: adaptiveMuted, fontWeight: 700, letterSpacing: '0.5px' }}>
              {activeTab === 'world' ? 'WORLD' : 'CAMPUS'}
            </span>
            <span
              key={activeTab}
              className="rank-pop"
              style={{ display: 'block', fontSize: '20px', fontWeight: 800, color: T.accent, fontVariantNumeric: 'tabular-nums' }}
            >
              #{activeTab === 'world' ? resolvedSelfUser.worldRank : resolvedSelfUser.campusRank}
            </span>
          </div>

          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#FFF',
              border: `2px solid ${T.accent}55`,
              flexShrink: 0
            }}
          >
            {getInitials(resolvedSelfUser.name)}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <h4 style={{ color: T.text, margin: 0, fontSize: '15px', fontWeight: 700, wordBreak: 'break-word' }}>
                {stripSelfTag(resolvedSelfUser.name)}
              </h4>
              {resolvedSelfUser.verified && <TwitterVerifiedIcon />}
            </div>
            <p style={{ color: adaptiveMuted, margin: '2px 0 0 0', fontSize: '12px', wordBreak: 'break-word', fontWeight: 500 }}>
              {resolvedSelfUser.university} • <span style={{ color: T.accent, fontWeight: 600 }}>{resolvedSelfUser.campus}</span>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: T.text, fontSize: '18px', fontWeight: 800 }}>
            <AnimatedNumber value={resolvedSelfUser.points} />
          </div>
          <div style={{ color: T.accent, fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>
            TOTAL SCORE
          </div>
        </div>
      </div>
    </div>
  );
}