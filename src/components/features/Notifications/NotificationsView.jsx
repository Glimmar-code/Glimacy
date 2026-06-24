import React from 'react';

// Dictionary mapping for all requested notification types
const NOTIFICATION_TYPES = {
  like: { text: 'liked your post', icon: '❤️', badgeBg: 'rgba(249, 24, 128, 0.1)', iconColor: '#f91880' },
  follow: { text: 'followed you', icon: '👤', badgeBg: 'rgba(29, 155, 240, 0.1)', iconColor: '#1da1f2' },
  share: { text: 'shared your post', icon: '🔗', badgeBg: 'rgba(0, 186, 124, 0.1)', iconColor: '#00ba7c' },
  save: { text: 'saved your post', icon: '🔖', badgeBg: 'rgba(255, 122, 0, 0.1)', iconColor: '#ff7a00' },
  repost: { text: 'reposted your post', icon: '🔁', badgeBg: 'rgba(0, 186, 124, 0.1)', iconColor: '#00ba7c' },
  comment: { text: 'commented on your post', icon: '💬', badgeBg: 'rgba(29, 155, 240, 0.1)', iconColor: '#1da1f2' },
  tag: { text: 'tagged you in a post', icon: '🏷️', badgeBg: 'rgba(121, 40, 202, 0.1)', iconColor: '#7928ca' },
  mention: { text: 'mentioned you in a post', icon: '@', badgeBg: 'rgba(255, 0, 122, 0.1)', iconColor: '#ff007a' },
};

export default function NotificationsView({ T, notifs = [], onProfileClick }) {
  // Safe theme fallbacks to prevent application crashes if 'T' is undefined
  const theme = {
    bg: T?.bg || '#0B0F12',
    text: T?.text || '#E8EDF2',
    surface: T?.surface || '#121A21'
  };

  return (
    <div style={{ backgroundColor: theme.bg, padding: '20px', overflowY: 'auto', flex: 1, minHeight: '100vh' }}>
      <h2 style={{ color: theme.text, margin: '0 0 20px 0', fontSize: '24px', fontWeight: 700 }}>
        Notifications
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifs.map((notif, idx) => {
          // Fallback configuration if type doesn't match perfectly
          const typeConfig = NOTIFICATION_TYPES[notif.type] || {
            text: 'interacted with you',
            icon: '🔔',
            badgeBg: 'rgba(128, 128, 128, 0.1)',
            iconColor: '#888'
          };

          return (
            <div
              key={notif.id || idx}
              className="premium-notification-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: theme.surface,
                borderRadius: '12px',
                borderLeft: `4px solid ${typeConfig.iconColor}`,
                cursor: 'pointer',
                // Creates a sleek staggered entrance cascade effect
                animationDelay: `${idx * 0.04}s`,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Left Side Container: Avatar & Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <img
                  src={notif.user?.avatar || 'https://via.placeholder.com/40'}
                  alt={notif.user?.name || 'User'}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents clicking the card background when clicking the avatar
                    if (onProfileClick) onProfileClick(notif.user?.id);
                  }}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ color: theme.text, fontSize: '14px', lineHeight: '1.4' }}>
                    <span style={{ fontWeight: 700 }}>{notif.user?.name || 'Someone'}</span>{' '}
                    <span style={{ color: '#aaa' }}>{typeConfig.text}</span>
                  </div>
                  
                  {/* Inline preview fallback for comments, tags, or mentions */}
                  {notif.previewText && (
                    <div style={{ color: '#777', fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}>
                      "{notif.previewText}"
                    </div>
                  )}
                  
                  <div style={{ color: '#666', fontSize: '12px' }}>{notif.timestamp || 'Just now'}</div>
                </div>
              </div>

              {/* Right Side Action Badge */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: typeConfig.badgeBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                marginLeft: '12px'
              }}>
                <span style={{ color: typeConfig.iconColor }}>{typeConfig.icon}</span>
              </div>
            </div>
          );
        })}

        {/* Empty State Notification Check */}
        {notifs.length === 0 && (
          <div style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
            No notifications yet.
          </div>
        )}
      </div>

      {/* Styled scoping blocks for ultra-premium micro-interactions */}
      <style>{`
        @keyframes dynamicFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .premium-notification-card {
          animation: dynamicFadeUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .premium-notification-card:hover {
          transform: translateY(-2px) scale(1.008);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          filter: brightness(1.06);
        }

        .premium-notification-card img:hover {
          transform: scale(1.12) rotate(3deg);
        }
      `}</style>
    </div>
  );
}