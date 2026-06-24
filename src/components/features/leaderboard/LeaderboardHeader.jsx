import React from 'react';
import { Crown, Timer, Sparkles, ChevronRight } from 'lucide-react';

export default function LeaderboardHeader({ 
  T = { bg: '#0F172A', cardBg: 'rgba(255,255,255,0.04)', cardBorder: 'rgba(255,255,255,0.1)', accent: '#00D2C4', text: '#E8EDF2', muted: '#8B95A1', isDark: true } 
}) {
  // Determine if we need to adjust text colors based on the theme
  const isLightColor = (hex) => {
    if (!hex) return false;
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 125;
  };

  const accentIsLight = isLightColor(T.accent);
  const badgeTextColor = accentIsLight ? '#0B0F12' : '#FFFFFF';

  const animationStyles = `
    @keyframes shimmerWave {
      0% { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @keyframes floatPulse {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
      50% { transform: translateY(-2px) scale(1.05); opacity: 1; }
    }
    .header-banner-animate {
      animation: shimmerWave 6s linear infinite;
      background-size: 200% auto;
    }
    .icon-pulse {
      animation: floatPulse 3s ease-in-out infinite;
    }
  `;

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '4px' }}>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* Premium Glassmorphism Card */}
      <div 
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          background: T.isDark ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `1px solid ${T.cardBorder}`,
          boxShadow: T.isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
          padding: '16px 20px',
        }}
      >
        {/* Animated Accent Glow Background */}
        <div 
          className="header-banner-animate"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, ${T.accent}15 50%, transparent 100%)`,
            opacity: 0.6,
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Left Side: Title & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="icon-pulse" style={{ color: '#FFD700', display: 'flex' }}>
                <Crown size={20} />
              </div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 800, 
                color: T.text,
                letterSpacing: '-0.3px' 
              }}>
                Season 1 <span style={{ color: T.accent }}>Live</span>
              </h1>
            </div>
            
            <p style={{ margin: 0, fontSize: '12px', color: T.muted, fontWeight: 500 }}>
              Compete globally or dominate your campus.
            </p>
          </div>

          {/* Right Side: Countdown / Meta Tag */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              backgroundColor: `${T.accent}20`, 
              padding: '4px 8px', 
              borderRadius: '8px',
              border: `1px solid ${T.accent}40`
            }}>
              <Timer size={12} color={T.accent} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.accent }}>
                14d 08h
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Call-to-Action Bar */}
        <div style={{ 
          marginTop: '16px', 
          paddingTop: '12px', 
          borderTop: `1px solid ${T.cardBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#F59E0B" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: T.text }}>
              View Season Rewards
            </span>
          </div>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            backgroundColor: T.cardBg, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <ChevronRight size={14} color={T.muted} />
          </div>
        </div>

      </div>
    </div>
  );
}