import { useState } from 'react';
import { PHOTOS, decorate, HAS_REAL_PHOTOS } from '../../data/photos';

function Polaroid({ p, big, onOpen }) {
  return (
    <button
      onClick={() => p.src && onOpen(p)}
      className="relative shrink-0 active:scale-[0.97] transition-transform"
      style={{
        transform: `rotate(${p.rot}deg)`,
        width: big ? 200 : 150,
        cursor: p.src ? 'zoom-in' : 'default',
      }}
    >
      {/* Tape */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 z-10"
        style={{
          background: `${p.tape}`,
          opacity: 0.7,
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        className="bg-[#fbf3da] p-2.5 pb-8"
        style={{
          boxShadow:
            '0 18px 30px -10px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(120,90,40,0.15)',
        }}
      >
        <div
          className="w-full"
          style={{
            aspectRatio: '4 / 5',
            background: p.src
              ? `url(${p.src}) center/cover`
              : 'linear-gradient(135deg,#3a4f3e 0%,#1f2e25 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {!p.src && (
            <div className="absolute inset-0 flex items-center justify-center text-text-primary/40 text-xs font-body">
              📷
            </div>
          )}
          {/* Photo grain overlay */}
          {p.src && (
            <div
              className="absolute inset-0 mix-blend-overlay opacity-25 pointer-events-none"
              style={{
                background:
                  'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px) 0 0/3px 3px',
              }}
            />
          )}
        </div>
        {p.caption && (
          <div
            className="mt-2 text-center text-[#3a2a14]"
            style={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: 'italic',
              fontSize: big ? '0.95rem' : '0.78rem',
            }}
          >
            {p.caption}
          </div>
        )}
      </div>
    </button>
  );
}

export default function PhotoWall() {
  const [open, setOpen] = useState(null);
  const decorated = PHOTOS.map(decorate);

  // Featured: top 5 spread across the wall in a layered cluster.
  const cluster = decorated.slice(0, 5);
  const rest = decorated.slice(5);

  return (
    <div className="relative">
      {/* Cluster */}
      <div className="relative h-[280px] mx-auto max-w-md flex items-center justify-center">
        {cluster.map((p, i) => {
          const positions = [
            { left: '4%', top: '14%', z: 1, big: false },
            { left: '20%', top: '40%', z: 3, big: true },
            { left: '46%', top: '8%', z: 2, big: false },
            { left: '62%', top: '38%', z: 4, big: true },
            { left: '78%', top: '4%', z: 1, big: false },
          ];
          const pos = positions[i] || positions[0];
          return (
            <div
              key={p.id}
              className="absolute animate-fadeInUp"
              style={{
                left: pos.left,
                top: pos.top,
                zIndex: pos.z,
                animationDelay: `${i * 0.1}s`,
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              <Polaroid p={p} big={pos.big} onOpen={setOpen} />
            </div>
          );
        })}
      </div>

      {/* Sub-strip of remaining */}
      {rest.length > 0 && (
        <div className="mt-2 overflow-x-auto px-6 pb-3 -mx-6 no-scrollbar">
          <div className="flex gap-4 w-max">
            {rest.map((p, i) => (
              <div
                key={p.id}
                className="animate-fadeInUp"
                style={{
                  animationDelay: `${0.5 + i * 0.05}s`,
                  opacity: 0,
                  animationFillMode: 'forwards',
                }}
              >
                <Polaroid p={p} big={false} onOpen={setOpen} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!HAS_REAL_PHOTOS && (
        <p className="text-center text-muted text-[11px] font-body italic mt-3 px-6">
          ↳ הוסף תמונות אל <span className="font-mono text-text-primary">src/assets/photos/</span>
        </p>
      )}

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          style={{ background: 'rgba(13,31,22,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => setOpen(null)}
        >
          <div
            className="max-w-md w-full animate-fadeInUp"
            style={{ transform: 'rotate(-1deg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-[#fbf3da] p-3 pb-10"
              style={{
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.45)',
              }}
            >
              <img src={open.src} alt={open.caption} className="w-full" />
              {open.caption && (
                <div
                  className="mt-3 text-center text-[#3a2a14]"
                  style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}
                >
                  {open.caption}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
