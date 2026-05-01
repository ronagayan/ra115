import { useMemo, useState } from 'react';
import NoteCard from './NoteCard';

// Tilt + offset are deterministic per index so notes don't re-shuffle on render.
function noteLayout(i, total) {
  const tilts = [-9, 6, -3, 11, -7, 4, -12, 8, 2, -5];
  const xs = [10, 35, 60, 22, 48, 70, 15, 55, 30, 65];
  const ys = [62, 50, 70, 38, 58, 30, 75, 22, 45, 65];
  const t = tilts[i % tilts.length];
  return {
    rot: t,
    left: `${xs[i % xs.length]}%`,
    bottom: `${ys[i % ys.length]}%`,
    delay: (i * 0.7) % 4,
  };
}

export default function Jar({ unpulled, onPull, onWrite, onHistory }) {
  const [pulledNote, setPulledNote] = useState(null);
  const [pulling, setPulling] = useState(false);

  const visibleNotes = useMemo(() => unpulled.slice(0, 12), [unpulled]);

  async function handlePull() {
    if (unpulled.length === 0 || pulling) return;
    setPulling(true);
    const note = await onPull();
    setPulledNote(note);
    setPulling(false);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Jar */}
      <div
        className="relative cursor-pointer active:scale-[0.98] transition-transform"
        style={{ width: 240, height: 320 }}
        onClick={handlePull}
        role="button"
        aria-label="שלוף פתק"
      >
        <svg
          viewBox="0 0 240 320"
          width="240"
          height="320"
          className="absolute inset-0 drop-shadow-[0_25px_30px_rgba(0,0,0,0.45)]"
        >
          <defs>
            {/* Glass body — vertical highlight + tinted depth */}
            <linearGradient id="glassBody" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(216,243,220,0.05)" />
              <stop offset="18%" stopColor="rgba(216,243,220,0.32)" />
              <stop offset="40%" stopColor="rgba(82,183,136,0.10)" />
              <stop offset="62%" stopColor="rgba(45,106,79,0.18)" />
              <stop offset="100%" stopColor="rgba(13,31,22,0.45)" />
            </linearGradient>
            <linearGradient id="glassBodyTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(216,243,220,0.16)" />
              <stop offset="55%" stopColor="rgba(82,183,136,0.05)" />
              <stop offset="100%" stopColor="rgba(13,31,22,0.20)" />
            </linearGradient>

            {/* Specular highlight on the jar curve */}
            <linearGradient id="specular" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Brass lid */}
            <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4d28a" />
              <stop offset="22%" stopColor="#d4a657" />
              <stop offset="50%" stopColor="#a87a3d" />
              <stop offset="78%" stopColor="#7c5526" />
              <stop offset="100%" stopColor="#4f3416" />
            </linearGradient>
            <linearGradient id="brassRim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5526" />
              <stop offset="50%" stopColor="#d4a657" />
              <stop offset="100%" stopColor="#7c5526" />
            </linearGradient>

            {/* Bottom shadow inside jar */}
            <radialGradient id="bottomShadow" cx="0.5" cy="0.95" r="0.55">
              <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            {/* Jar silhouette (body + neck) for clipping notes */}
            <clipPath id="jarInside">
              <path d="
                M 50 96
                L 50 280
                Q 50 304 76 304
                L 164 304
                Q 190 304 190 280
                L 190 96
                Z" />
            </clipPath>
          </defs>

          {/* Jar shadow on table */}
          <ellipse cx="120" cy="312" rx="84" ry="6" fill="rgba(0,0,0,0.45)" />

          {/* Jar body */}
          <path
            d="
              M 44 92
              Q 44 80 56 80
              L 184 80
              Q 196 80 196 92
              L 196 100
              L 192 100
              L 192 286
              Q 192 308 168 308
              L 72 308
              Q 48 308 48 286
              L 48 100
              L 44 100
              Z"
            fill="url(#glassBody)"
            stroke="rgba(216,243,220,0.18)"
            strokeWidth="1"
          />
          {/* Top fade overlay for depth */}
          <path
            d="
              M 48 100
              L 192 100
              L 192 200
              L 48 200 Z"
            fill="url(#glassBodyTop)"
          />
          {/* Bottom interior shadow */}
          <rect x="48" y="220" width="144" height="88" fill="url(#bottomShadow)" clipPath="url(#jarInside)" />

          {/* Specular highlight (thin curve) */}
          <path
            d="
              M 60 110
              Q 56 200 62 290
              L 70 290
              Q 64 200 68 112 Z"
            fill="url(#specular)"
            opacity="0.7"
          />
          {/* Subtle right-side reflection */}
          <path
            d="M 178 130 Q 184 200 178 270 L 182 270 Q 188 200 182 130 Z"
            fill="rgba(216,243,220,0.18)"
          />

          {/* Outer glass edge */}
          <path
            d="
              M 44 92
              Q 44 80 56 80
              L 184 80
              Q 196 80 196 92
              L 196 100
              L 192 100
              L 192 286
              Q 192 308 168 308
              L 72 308
              Q 48 308 48 286
              L 48 100
              L 44 100 Z"
            fill="none"
            stroke="rgba(13,31,22,0.55)"
            strokeWidth="1.2"
          />

          {/* Brass screw lid */}
          <rect x="40" y="44" width="160" height="42" rx="4" fill="url(#brass)" />
          {/* Lid threads */}
          <rect x="40" y="50" width="160" height="1.5" fill="rgba(0,0,0,0.25)" />
          <rect x="40" y="60" width="160" height="1.5" fill="rgba(0,0,0,0.20)" />
          <rect x="40" y="70" width="160" height="1.5" fill="rgba(0,0,0,0.20)" />
          <rect x="40" y="80" width="160" height="1.5" fill="rgba(0,0,0,0.25)" />
          {/* Lid top edge highlight */}
          <rect x="40" y="44" width="160" height="3" fill="rgba(255,255,255,0.35)" />
          {/* Lid rim under */}
          <rect x="38" y="84" width="164" height="6" rx="2" fill="url(#brassRim)" />
        </svg>

        {/* Twine + linen tag */}
        <div
          className="absolute pointer-events-none"
          style={{ left: '50%', top: 92, transform: 'translateX(-50%) rotate(-6deg)' }}
        >
          <div
            className="w-0.5 h-5 mx-auto"
            style={{ background: 'repeating-linear-gradient(0deg,#a07c4a 0 2px,#7d5a2a 2px 4px)' }}
          />
          <div
            className="px-2 py-1 font-display text-[10px] tracking-wide"
            style={{
              background: 'linear-gradient(180deg,#e9dcc1 0%,#cfbe98 100%)',
              color: '#5a3a1a',
              borderRadius: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(90,58,26,0.25)',
              fontFamily: '"Playfair Display", serif',
            }}
          >
            פתקים
          </div>
        </div>

        {/* Floating paper notes inside the jar */}
        <div className="absolute inset-0" style={{ clipPath: 'inset(96px 24px 16px 24px round 0 0 22px 22px)' }}>
          {visibleNotes.map((n, i) => {
            const layout = noteLayout(i, visibleNotes.length);
            return (
              <div
                key={n.id || i}
                className="absolute animate-float"
                style={{
                  left: layout.left,
                  bottom: layout.bottom,
                  transform: `rotate(${layout.rot}deg)`,
                  animationDelay: `${layout.delay}s`,
                  animationDuration: `${5 + (i % 4)}s`,
                  width: 38,
                  height: 26,
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(170deg,#f5ecd0 0%,#e6d5a8 100%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(80,55,20,0.2)',
                    borderRadius: 1,
                  }}
                >
                  {/* Three handwriting strokes for paper feel */}
                  <div className="mt-1.5 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.55)', width: '70%' }} />
                  <div className="mt-1 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.45)', width: '85%' }} />
                  <div className="mt-1 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.40)', width: '55%' }} />
                </div>
              </div>
            );
          })}

          {visibleNotes.length === 0 && (
            <div className="absolute inset-0 flex items-end justify-center pb-12">
              <span className="text-muted text-xs font-body italic">הצנצנת ריקה</span>
            </div>
          )}
        </div>

        {/* Count badge — wax-seal style */}
        {unpulled.length > 0 && (
          <div
            className="absolute -top-2 -right-1 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #c9462b, #7a1f15)',
              color: '#ffe9d6',
              fontFamily: '"Playfair Display", serif',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              transform: 'rotate(-8deg)',
            }}
          >
            {unpulled.length}
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-muted text-xs font-body italic">
        {unpulled.length > 0
          ? pulling ? 'שולפת...' : 'הקש על הצנצנת לשליפה'
          : 'אין פתקים חדשים'}
      </p>

      {/* Buttons — claymorphism */}
      <div className="flex gap-3">
        <button
          onClick={onWrite}
          className="clay-primary px-6 py-3 font-body text-sm font-semibold"
        >
          ✦ כתבי פתק
        </button>
        <button
          onClick={onHistory}
          className="clay-soft px-6 py-3 font-body text-sm text-muted"
        >
          היסטוריה
        </button>
      </div>

      {pulledNote && (
        <NoteCard note={pulledNote} onClose={() => setPulledNote(null)} />
      )}
    </div>
  );
}
