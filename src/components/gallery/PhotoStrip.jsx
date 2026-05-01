import { useState } from 'react';
import { PHOTOS } from '../../data/photos';

// Slim auto-scrolling band — secondary to PhotoWall.
// Uses CSS animation; pause on hover/touch.
export default function PhotoStrip() {
  const [paused, setPaused] = useState(false);
  const doubled = [...PHOTOS, ...PHOTOS];

  return (
    <div className="relative w-full overflow-hidden py-2">
      {/* Edge fades */}
      <div
        className="absolute inset-y-0 right-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }}
      />
      <div
        className="absolute inset-y-0 left-0 w-12 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }}
      />

      <div
        className="flex gap-3 w-max"
        style={{
          animation: paused ? 'none' : 'scrollX 50s linear infinite',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 1500)}
      >
        {doubled.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="shrink-0 rounded-md overflow-hidden"
            style={{
              width: 96,
              height: 120,
              background: p.src
                ? `url(${p.src}) center/cover`
                : 'linear-gradient(135deg,#2d6a4f,#1a3a2a)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(216,243,220,0.08)',
            }}
          >
            {!p.src && (
              <div className="w-full h-full flex items-center justify-center text-text-primary/30">
                📷
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
