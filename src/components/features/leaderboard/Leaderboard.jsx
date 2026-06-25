import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, UserPlus, Check, Users } from 'lucide-react';

// --- Authentic Twitter Verified Tick ---
const TwitterVerifiedIcon = ({ size = 13 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '3px', flexShrink: 0 }}
  >
    <path
      fill="#1D9BF0"
      d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.407-.17-.867-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.28 3.422 2.28s2.825-1.015 3.422-2.28c.407.17.867.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.72 3.28l-3.29-3.29 1.41-1.42 1.88 1.88 5.18-5.18 1.42 1.42-6.6 6.59z"
    />
  </svg>
);

const TrophyIcon = ({ color = '#FFD700', size = 20 }) => (
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
    return [parseInt(clean[0]+clean[0],16), parseInt(clean[1]+clean[1],16), parseInt(clean[2]+clean[2],16)];
  }
  if (clean.length === 6) {
    return [parseInt(clean.substring(0,2),16), parseInt(clean.substring(2,4),16), parseInt(clean.substring(4,6),16)];
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
  name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const stripSelfTag = (name = '') => name.replace(/\s*\(You\)\s*/i, '').trim();

const getTrend = (id) => {
  const seed = Math.abs(Math.sin(id * 12.9898)) % 1;
  if (seed < 0.42) return { dir: 'up', delta: 1 + (id % 4) };
  if (seed < 0.78) return { dir: 'down', delta: 1 + (id % 3) };
  return { dir: 'flat', delta: 0 };
};

function AnimatedNumber({ value, duration = 800 }) {
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
  const [localTab, setLocalTab] = useState('world');
  const activeTab = lbTab || localTab;
  const [visibleRows, setVisibleRows] = useState(new Set());
  const rowRefs = useRef({});

  const handleTabChange = (targetTab) => {
    if (setLbTab) setLbTab(targetTab);
    setLocalTab(targetTab);
    setVisibleRows(new Set());
  };

  const [followedUsers, setFollowedUsers] = useState([2, 5, 9]);
  const touchStartX = useRef(0);

  const adaptiveMuted = isLightColor(T.bg) ? '#475569' : '#94A3B8';
  const activeTabTextColor = isLightColor(T.accent) ? '#0F172A' : '#FFFFFF';
  const neutralBadgeBg = isLightColor(T.bg) ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 60 && activeTab === 'world') handleTabChange('campus');
    else if (diffX < -60 && activeTab === 'campus') handleTabChange('world');
  };

  const toggleFollow = (id, e) => {
    e.stopPropagation();
    setFollowedUsers((prev) => prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]);
  };

  // Intersection observer for row reveal
  useEffect(() => {
    const observers = [];
    Object.entries(rowRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setVisibleRows((prev) => new Set([...prev, Number(id)])); },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [activeTab]);

  // --- Mock data ---
  const worldUsers = [
    { id: 1,  name: 'Sarah Jenkins',       points: 4950, verified: true,  university: 'MIT',                       avatarBg: '#FFD700' },
    { id: 2,  name: 'Liam Chen',           points: 4820, verified: true,  university: 'Stanford University',       avatarBg: '#C0C0C0' },
    { id: 3,  name: 'Sofia Rodriguez',     points: 4710, verified: false, university: 'Oxford University',         avatarBg: '#CD7F32' },
    { id: 4,  name: 'Amara Okafor',        points: 4500, verified: true,  university: 'Harvard University',        avatarBg: '#3B82F6' },
    { id: 5,  name: 'Yuki Tanaka',         points: 4390, verified: false, university: 'University of Tokyo',       avatarBg: '#EC4899' },
    { id: 6,  name: 'Ethan Hunt',          points: 4210, verified: true,  university: 'Stanford University',       avatarBg: '#10B981' },
    { id: 7,  name: 'Elena Rostova',       points: 4150, verified: false, university: 'Sorbonne University',       avatarBg: '#8B5CF6' },
    { id: 8,  name: 'Marcus Vance',        points: 3990, verified: true,  university: 'UC Berkeley',               avatarBg: '#F59E0B' },
    { id: 9,  name: 'Chloe Baker',         points: 3870, verified: false, university: 'Stanford University',       avatarBg: '#EF4444' },
    { id: 10, name: 'Lucas Meyer',         points: 3740, verified: true,  university: 'ETH Zurich',                avatarBg: '#6366F1' },
    { id: 11, name: 'Aisha Yusuf',         points: 3610, verified: false, university: 'University of Cape Town',   avatarBg: '#14B8A6' },
    { id: 12, name: 'Mateo Silva',         points: 3500, verified: false, university: 'University of São Paulo',   avatarBg: '#F97316' },
    { id: 13, name: 'Emma Watson',         points: 3420, verified: true,  university: 'Cambridge University',      avatarBg: '#A855F7' },
    { id: 14, name: 'Alex Rivera (You)',   points: 3380, verified: true,  university: 'Stanford University',       avatarBg: '#06B6D4' },
    { id: 15, name: 'Devon Lane',          points: 3210, verified: false, university: 'Yale University',           avatarBg: '#64748B' },
    { id: 16, name: 'Jane Cooper',         points: 3150, verified: false, university: 'Columbia University',       avatarBg: '#475569' },
    { id: 17, name: 'Cody Fisher',         points: 2990, verified: true,  university: 'Princeton University',      avatarBg: '#334155' },
    { id: 18, name: 'Theresa Webb',        points: 2840, verified: false, university: 'Cornell University',        avatarBg: '#1E293B' },
    { id: 19, name: 'Savannah Nguyen',     points: 2710, verified: true,  university: 'Caltech',                   avatarBg: '#0F172A' },
    { id: 20, name: 'Eleanor Pena',        points: 2600, verified: false, university: 'Duke University',           avatarBg: '#334155' }
  ];

  const campusUsers = [
    { id: 2,  name: 'Liam Chen',           points: 4820, verified: true,  university: 'Main Campus',      avatarBg: '#C0C0C0' },
    { id: 6,  name: 'Ethan Hunt',          points: 4210, verified: true,  university: 'Science Annex',    avatarBg: '#10B981' },
    { id: 14, name: 'Alex Rivera (You)',   points: 3380, verified: true,  university: 'Engineering Block', avatarBg: '#06B6D4' },
    { id: 9,  name: 'Chloe Baker',         points: 3120, verified: false, university: 'Medical Quad',     avatarBg: '#EF4444' },
    { id: 21, name: 'Bradley Wilson',      points: 2540, verified: false, university: 'Main Campus',      avatarBg: '#F43F5E' },
    { id: 22, name: 'Kristin Watson',      points: 2490, verified: true,  university: 'Main Campus',      avatarBg: '#84CC16' },
    { id: 23, name: 'Danny DeVito',        points: 2410, verified: false, university: 'Arts Theater',     avatarBg: '#10B981' },
    { id: 24, name: 'Guy Hawkins',         points: 2350, verified: false, university: 'Main Campus',      avatarBg: '#E2E8F0' },
    { id: 25, name: 'Dianne Russell',      points: 2290, verified: true,  university: 'West Wing',        avatarBg: '#A855F7' },
    { id: 26, name: 'Albert Flores',       points: 2210, verified: false, university: 'Main Campus',      avatarBg: '#F97316' },
    { id: 27, name: 'Floyd Miles',         points: 2150, verified: false, university: 'Science Annex',    avatarBg: '#06B6D4' },
    { id: 28, name: 'Marvin McKinney',     points: 2090, verified: true,  university: 'Main Campus',      avatarBg: '#6366F1' },
    { id: 29, name: 'Jerome Bell',         points: 1980, verified: false, university: 'Engineering Block', avatarBg: '#EC4899' },
    { id: 30, name: 'Courtney Henry',      points: 1850, verified: false, university: 'Main Campus',      avatarBg: '#475569' },
    { id: 31, name: 'Arlene McCoy',        points: 1740, verified: true,  university: 'West Wing',        avatarBg: '#14B8A6' },
    { id: 32, name: 'Kathryn Murphy',      points: 1690, verified: false, university: 'Main Campus',      avatarBg: '#F59E0B' },
    { id: 33, name: 'Darrell Steward',     points: 1550, verified: false, university: 'Medical Quad',     avatarBg: '#64748B' },
    { id: 34, name: 'Esther Howard',       points: 1420, verified: true,  university: 'Main Campus',      avatarBg: '#3B82F6' },
    { id: 35, name: 'Leslie Alexander',    points: 1310, verified: false, university: 'Arts Theater',     avatarBg: '#CD7F32' },
    { id: 36, name: 'Ronald Richards',     points: 1200, verified: false, university: 'Main Campus',      avatarBg: '#FFD700' }
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
      case 1: return { borderColor: '#FFD700', shadow: '0 0 18px rgba(255,215,0,0.22)', badgeBg: 'linear-gradient(135deg,#FFE066 0%,#F59E0B 100%)', textCol: '#F59E0B' };
      case 2: return { borderColor: '#E2E8F0', shadow: '0 0 14px rgba(226,232,240,0.12)', badgeBg: 'linear-gradient(135deg,#FFFFFF 0%,#94A3B8 100%)', textCol: '#94A3B8' };
      case 3: return { borderColor: '#B45309', shadow: '0 0 14px rgba(180,83,9,0.12)', badgeBg: 'linear-gradient(135deg,#F59E0B 0%,#B45309 100%)', textCol: '#B45309' };
      default: return null;
    }
  };

  const animationStyles = `
    @keyframes rowSlideIn {
      from { opacity: 0; transform: translateX(-12px) scale(0.98); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes shimmerSweep {
      0%   { background-position: -300% center; }
      100% { background-position: 300% center; }
    }
    @keyframes trophyFloat {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-3px) rotate(-4deg); }
    }
    @keyframes livePulse {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
      70%  { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    @keyframes goldRing {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.5); }
      50%      { box-shadow: 0 0 0 4px rgba(255,215,0,0); }
    }
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes popIn {
      0%   { transform: scale(0.5); opacity: 0; }
      65%  { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); }
    }
    @keyframes followPop {
      0%   { transform: scale(1); }
      40%  { transform: scale(0.88); }
      70%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    @keyframes scoreGlow {
      0%,100% { text-shadow: none; }
      50%      { text-shadow: 0 0 8px currentColor; }
    }

    .lb-row-visible {
      animation: rowSlideIn 0.38s cubic-bezier(0.16,1,0.3,1) both;
    }
    .lb-row-hidden {
      opacity: 0;
    }
    .gold-shimmer {
      background: linear-gradient(90deg,
        rgba(30,41,59,0.6) 0%,
        rgba(255,215,0,0.1) 40%,
        rgba(255,215,0,0.18) 50%,
        rgba(255,215,0,0.1) 60%,
        rgba(30,41,59,0.6) 100%
      );
      background-size: 300% auto;
      animation: shimmerSweep 3.5s linear infinite;
    }
    .trophy-float { animation: trophyFloat 3s ease-in-out infinite; }
    .live-dot { animation: livePulse 2s ease-out infinite; }
    .rank1-ring { animation: goldRing 2.2s ease-in-out infinite; }
    .bottom-bar-enter { animation: slideUpFade 0.45s cubic-bezier(0.16,1,0.3,1) both; }
    .rank-pop { animation: popIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }

    .lb-row-hover {
      transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
      will-change: transform;
    }
    .lb-row-hover:hover {
      transform: translateY(-1px) scale(1.005);
      filter: brightness(1.07);
    }
    .lb-row-hover:active {
      transform: scale(0.995);
      filter: brightness(0.97);
    }

    .lb-follow-btn {
      transition: transform 0.15s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
      will-change: transform;
    }
    .lb-follow-btn:active { animation: followPop 0.3s ease both; }
    .lb-follow-btn:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

    .lb-avatar {
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .lb-row-hover:hover .lb-avatar { transform: scale(1.08); }

    .score-val { animation: scoreGlow 3s ease-in-out infinite; }

    .lb-scroll::-webkit-scrollbar { width: 4px; }
    .lb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
    .lb-scroll { scrollbar-width: thin; }

    @media (prefers-reduced-motion: reduce) {
      .lb-row-visible, .gold-shimmer, .trophy-float, .live-dot,
      .rank1-ring, .bottom-bar-enter, .rank-pop, .score-val {
        animation: none !important;
      }
      .lb-row-hidden { opacity: 1; }
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

      {/* ── Header ── */}
      <div style={{ padding: '14px 16px 10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="trophy-float" style={{ display: 'inline-flex', transformOrigin: 'center bottom' }}>
            <TrophyIcon color={T.accent} size={20} />
          </span>
          <h2 style={{ color: T.text, fontSize: '17px', fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
            Arena Standings
          </h2>
        </div>

        {/* Sliding tab switcher */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            position: 'relative',
            backgroundColor: 'rgba(0,0,0,0.18)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 3, bottom: 3, left: 3,
              width: 'calc(50% - 3px)',
              borderRadius: '7px',
              background: T.accent,
              boxShadow: '0 3px 10px rgba(0,0,0,0.22)',
              transform: activeTab === 'campus' ? 'translateX(100%)' : 'translateX(0)',
              transition: 'transform 0.32s cubic-bezier(0.65,0,0.35,1)'
            }}
          />
          {['world','campus'].map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => handleTabChange(tab)}
              style={{
                position: 'relative', zIndex: 1, flex: 1,
                padding: '7px 0',
                fontSize: '12px', fontWeight: 700,
                color: activeTab === tab ? activeTabTextColor : adaptiveMuted,
                background: 'transparent', border: 'none',
                borderRadius: '7px', cursor: 'pointer',
                transition: 'color 0.22s ease'
              }}
            >
              {tab === 'world' ? 'World Rank' : 'Campus Rank'}
            </button>
          ))}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', fontSize: '10px', color: adaptiveMuted, fontWeight: 600 }}>
          <Users size={10} />
          <span>{currentList.length} competitors</span>
          <span style={{ width: 2, height: 2, borderRadius: '50%', backgroundColor: adaptiveMuted, opacity: 0.5 }} />
          <span
            className="live-dot"
            style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: '#10B981',
              animationPlayState: isScrolling ? 'paused' : 'running'
            }}
          />
          <span>Live</span>
        </div>
      </div>

      {/* ── List ── */}
      <div
        ref={lbRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="lb-scroll"
        style={{ padding: '10px 12px 100px 12px', overflowY: 'auto', flex: 1, scrollBehavior: 'smooth' }}
      >
        {currentList.map((user, idx) => {
          const rank = idx + 1;
          const premiumStyle = getPremiumPodiumStyles(rank);
          const isFollowing = followedUsers.includes(user.id);
          const isSelf = user.id === selfId;
          const displayName = stripSelfTag(user.name);
          const trend = getTrend(user.id);
          const rowKey = `${activeTab}-${user.id}`;
          const isVisible = visibleRows.has(user.id);

          return (
            <div
              key={rowKey}
              ref={(el) => { rowRefs.current[user.id] = el; }}
              onClick={() => onAvatarClick?.(user)}
              className={`lb-row-hover ${rank === 1 ? 'gold-shimmer' : ''} ${isVisible ? 'lb-row-visible' : 'lb-row-hidden'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 11px',
                backgroundColor: premiumStyle ? undefined : isSelf ? `${T.accent}14` : T.surface,
                borderRadius: '11px',
                marginBottom: '7px',
                cursor: 'pointer',
                border: premiumStyle
                  ? `1px solid ${premiumStyle.borderColor}`
                  : isSelf
                  ? `1px solid ${T.accent}55`
                  : '1px solid rgba(255,255,255,0.03)',
                boxShadow: premiumStyle?.shadow,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animationDelay: isVisible ? `${idx * 0.025}s` : '0s'
              }}
            >
              {/* Rank badge + trend */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: '24px', height: '24px',
                    borderRadius: '50%',
                    background: premiumStyle ? premiumStyle.badgeBg : neutralBadgeBg,
                    border: premiumStyle ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: premiumStyle ? '#0F172A' : adaptiveMuted
                  }}
                >
                  {rank}
                </div>
                {trend.dir !== 'flat' && (
                  <div
                    style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: '11px', height: '11px',
                      borderRadius: '50%',
                      backgroundColor: trend.dir === 'up' ? '#10B981' : '#EF4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1.5px solid ${T.bg}`
                    }}
                  >
                    {trend.dir === 'up'
                      ? <TrendingUp size={6} color="#fff" strokeWidth={3} />
                      : <TrendingDown size={6} color="#fff" strokeWidth={3} />
                    }
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div
                className={`lb-avatar ${rank === 1 ? 'rank1-ring' : ''}`}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  backgroundColor: user.avatarBg || T.accent,
                  border: premiumStyle ? `1.5px solid ${premiumStyle.borderColor}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                  color: isLightColor(user.avatarBg || T.accent) ? '#0F172A' : '#FFFFFF',
                  fontSize: '11px',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
              >
                {getInitials(user.name)}
              </div>

              {/* Identity */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      color: T.text,
                      fontWeight: rank <= 3 ? 700 : 600,
                      fontSize: '12px',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '120px'
                    }}
                    title={displayName}
                  >
                    {displayName}
                  </span>
                  {user.verified && <TwitterVerifiedIcon size={12} />}
                  {isSelf && (
                    <span
                      style={{
                        fontSize: '8px', fontWeight: 800,
                        padding: '1px 5px', borderRadius: '999px',
                        backgroundColor: T.accent, color: activeTabTextColor,
                        marginLeft: '3px', letterSpacing: '0.3px', flexShrink: 0
                      }}
                    >
                      YOU
                    </span>
                  )}
                </div>
                <div
                  style={{
                    color: adaptiveMuted, fontSize: '10px', marginTop: '1px',
                    fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}
                >
                  {user.university}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {!isSelf && (
                  <button
                    onClick={(e) => toggleFollow(user.id, e)}
                    className="lb-follow-btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '3px',
                      padding: '4px 8px', borderRadius: '6px',
                      fontSize: '10px', fontWeight: 700,
                      cursor: 'pointer',
                      border: isFollowing ? '1px solid rgba(255,255,255,0.12)' : 'none',
                      backgroundColor: isFollowing ? 'rgba(255,255,255,0.07)' : T.text,
                      color: isFollowing ? adaptiveMuted : T.bg,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isFollowing ? <Check size={9} /> : <UserPlus size={9} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}

                <div style={{ textAlign: 'right', minWidth: '40px' }}>
                  <div
                    className="score-val"
                    style={{
                      color: premiumStyle ? premiumStyle.textCol : T.accent,
                      fontWeight: 700, fontSize: '12px',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    <AnimatedNumber value={user.points} />
                  </div>
                  <span style={{ display: 'block', fontSize: '8px', color: adaptiveMuted, fontWeight: 600, letterSpacing: '0.3px' }}>
                    PTS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Self status bar ── */}
      <div
        className="bottom-bar-enter"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: isLightColor(T.bg) ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.88)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '11px 16px 18px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.28)', zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <span style={{ display: 'block', fontSize: '8px', color: adaptiveMuted, fontWeight: 700, letterSpacing: '0.5px' }}>
              {activeTab === 'world' ? 'WORLD' : 'CAMPUS'}
            </span>
            <span
              key={activeTab}
              className="rank-pop"
              style={{ display: 'block', fontSize: '16px', fontWeight: 800, color: T.accent, fontVariantNumeric: 'tabular-nums' }}
            >
              #{activeTab === 'world' ? resolvedSelfUser.worldRank : resolvedSelfUser.campusRank}
            </span>
          </div>

          <div
            className="lb-avatar"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '11px', color: '#FFF',
              border: `1.5px solid ${T.accent}55`, flexShrink: 0
            }}
          >
            {getInitials(resolvedSelfUser.name)}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
              <h4 style={{ color: T.text, margin: 0, fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                {stripSelfTag(resolvedSelfUser.name)}
              </h4>
              {resolvedSelfUser.verified && <TwitterVerifiedIcon size={12} />}
            </div>
            <p style={{ color: adaptiveMuted, margin: '1px 0 0 0', fontSize: '10px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resolvedSelfUser.university} · <span style={{ color: T.accent, fontWeight: 600 }}>{resolvedSelfUser.campus}</span>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: T.text, fontSize: '15px', fontWeight: 800 }}>
            <AnimatedNumber value={resolvedSelfUser.points} />
          </div>
          <div style={{ color: T.accent, fontSize: '8px', fontWeight: 700, letterSpacing: '0.5px' }}>
            TOTAL SCORE
          </div>
        </div>
      </div>
    </div>
  );
}