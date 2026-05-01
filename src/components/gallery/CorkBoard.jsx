import { useEffect, useRef, useState } from 'react';
import { PHOTOS, HAS_REAL_PHOTOS } from '../../data/photos';

// Pseudo-random but deterministic per-index variation.
function jitter(seed, lo, hi) {
  const x = Math.sin(seed * 999.13 + 17) * 10000;
  const f = x - Math.floor(x);
  return lo + f * (hi - lo);
}

const PIN_COLORS = ['', 'pushpin-blue', 'pushpin-yellow', 'pushpin-green'];
const TAPE_COLORS = ['rgba(216,243,220,0.55)', 'rgba(244,210,138,0.55)', 'rgba(230,213,168,0.55)', 'rgba(163,217,177,0.55)'];

function PolaroidItem({ item, idx, onOpen }) {
  const tape = TAPE_COLORS[idx % TAPE_COLORS.length];
  const rot = jitter(idx, -10, 10);
  return (
    <button
      onClick={() => item.src && onOpen(item)}
      className="relative active:scale-[0.97] transition-transform"
      style={{
        transform: `rotate(${rot.toFixed(2)}deg)`,
        cursor: item.src ? 'zoom-in' : 'default',
      }}
    >
      {/* Tape across top */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 z-10 pointer-events-none"
        style={{
          background: tape,
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        className="bg-[#fbf3da] p-2 pb-6"
        style={{
          width: 132,
          boxShadow:
            '0 14px 22px -8px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(120,90,40,0.15)',
        }}
      >
        <div
          className="w-full"
          style={{
            aspectRatio: '4 / 5',
            background: item.src
              ? `url(${item.src}) center/cover`
              : 'linear-gradient(135deg,#3a4f3e 0%,#1f2e25 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {!item.src && (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xl">📷</div>
          )}
          {item.src && (
            <div
              className="absolute inset-0 mix-blend-overlay opacity-25 pointer-events-none"
              style={{ background: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px) 0 0/3px 3px' }}
            />
          )}
        </div>
        {item.caption && (
          <div
            className="mt-1.5 text-center text-[#3a2a14] text-[11px]"
            style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}
          >
            {item.caption}
          </div>
        )}
      </div>
    </button>
  );
}

function NoteItem({ item, idx, onOpen }) {
  const pin = PIN_COLORS[idx % PIN_COLORS.length];
  const rot = jitter(idx + 0.5, -8, 8);
  // Alternate paper hues so adjacent notes don't blend
  const hues = [
    'linear-gradient(168deg,#fbf3da 0%,#f0e3b8 100%)',
    'linear-gradient(168deg,#dee9d2 0%,#bbd0a4 100%)',
    'linear-gradient(168deg,#f4d8b3 0%,#dab38a 100%)',
    'linear-gradient(168deg,#f7eed1 0%,#e6cc93 100%)',
  ];
  const bg = hues[idx % hues.length];
  return (
    <button
      onClick={() => onOpen(item)}
      className="relative active:scale-[0.97] transition-transform"
      style={{ transform: `rotate(${rot.toFixed(2)}deg)`, cursor: 'zoom-in' }}
    >
      {/* Pushpin */}
      <div
        className={`pushpin ${pin} absolute left-1/2 -translate-x-1/2 z-20`}
        style={{ top: -6 }}
      />
      <div
        className="px-3 py-3 paper-grain"
        style={{
          width: 124,
          minHeight: 90,
          background: bg,
          color: '#3a2a14',
          boxShadow:
            '0 14px 22px -8px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(120,90,40,0.18)',
          borderRadius: 2,
        }}
      >
        {item.emoji && (
          <div className="text-center text-base mb-0.5" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}>
            {item.emoji}
          </div>
        )}
        {item.imageUrl && (
          <img src={item.imageUrl} alt="" className="w-full mb-1 max-h-20 object-cover rounded-sm" />
        )}
        <p
          className="text-[11px] leading-snug text-right line-clamp-3"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.text}
        </p>
      </div>
    </button>
  );
}

export default function CorkBoard({ history = [] }) {
  const [open, setOpen] = useState(null);
  const scrollRef = useRef(null);

  // Close lightbox on Esc
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Combine — newest items go to the right.
  // Photos first (the immutable backdrop of memories), then history notes.
  const items = [
    ...PHOTOS.map((p) => ({ kind: 'photo', ...p })),
    ...history.map((n) => ({ kind: 'note', ...n, id: n.id || n.text?.slice(0, 8) })),
  ];

  // Two-row staggered layout. Each item gets a column slot.
  const COL_WIDTH = 110;
  const ROW_HEIGHT = 170;
  const PAD_LEFT = 28;
  const PAD_TOP = 28;

  const decorated = items.map((item, i) => {
    const col = i;
    const row = i % 2; // alternate top/bottom row
    const xJitter = jitter(i, -14, 14);
    const yJitter = jitter(i + 0.7, -22, 22);
    return {
      ...item,
      _x: PAD_LEFT + col * COL_WIDTH + xJitter,
      _y: PAD_TOP + row * ROW_HEIGHT + yJitter,
      _idx: i,
    };
  });

  const totalWidth = Math.max(decorated.length, 4) * COL_WIDTH + PAD_LEFT * 2 + 60;
  const boardHeight = ROW_HEIGHT * 2 + PAD_TOP * 2;

  // Auto-scroll to the right when new items are added.
  const lastCount = useRef(items.length);
  useEffect(() => {
    if (items.length > lastCount.current && scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }
    lastCount.current = items.length;
  }, [items.length]);

  return (
    <div className="px-3">
      {/* Wood-framed cork board */}
      <div className="wood-frame rounded-[14px] p-3" style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden no-scrollbar cork-surface rounded-[8px]"
          style={{ height: boardHeight }}
        >
          <div className="relative" style={{ width: totalWidth, height: boardHeight }}>
            {decorated.map((item) =>
              item.kind === 'photo' ? (
                <div
                  key={`photo-${item.id}-${item._idx}`}
                  className="absolute"
                  style={{ left: item._x, top: item._y, transformOrigin: 'center' }}
                >
                  <PolaroidItem item={item} idx={item._idx} onOpen={setOpen} />
                </div>
              ) : (
                <div
                  key={`note-${item.id}-${item._idx}`}
                  className="absolute"
                  style={{ left: item._x, top: item._y, transformOrigin: 'center' }}
                >
                  <NoteItem item={item} idx={item._idx} onOpen={setOpen} />
                </div>
              )
            )}

            {decorated.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[#3a2a14]/60 italic font-body text-sm">הלוח עוד ריק</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!HAS_REAL_PHOTOS && (
        <p className="text-center text-muted text-[11px] font-body italic mt-2 px-6">
          ↳ הוסף תמונות אל <span className="font-mono text-text-primary">src/assets/photos/</span>
        </p>
      )}

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          style={{ background: 'rgba(13,31,22,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* Hint above */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-muted/70 text-[11px] font-body tracking-[0.3em] uppercase pointer-events-none">
            הקש מחוץ לתמונה לסגירה
          </div>

          {/* Close button — visible & always reachable */}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(null); }}
            className="clay-soft absolute top-6 right-6 w-11 h-11 flex items-center justify-center text-text-primary text-lg z-10"
            aria-label="סגור"
          >
            ✕
          </button>

          <div
            className="max-w-md w-full animate-fadeInUp"
            style={{ transform: 'rotate(-1deg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {open.kind === 'photo' ? (
              <div
                className="bg-[#fbf3da] p-3 pb-10"
                style={{ boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.45)' }}
              >
                {open.src && <img src={open.src} alt={open.caption} className="w-full" />}
                {!open.src && (
                  <div className="w-full aspectRatio-[4/5] flex items-center justify-center text-white/30" style={{ aspectRatio: '4/5', background: 'linear-gradient(135deg,#3a4f3e,#1f2e25)' }}>📷</div>
                )}
                {open.caption && (
                  <div className="mt-3 text-center text-[#3a2a14]" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
                    {open.caption}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="px-7 py-8 paper-grain"
                style={{
                  background: 'linear-gradient(168deg,#fbf3da 0%,#f0e3b8 50%,#e7d8a4 100%)',
                  color: '#3a2a14',
                  boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.45)',
                }}
              >
                {open.emoji && <div className="text-4xl text-center mb-3">{open.emoji}</div>}
                {open.imageUrl && <img src={open.imageUrl} alt="" className="w-full rounded-sm mb-4 max-h-56 object-cover" />}
                <p
                  className="text-center whitespace-pre-wrap leading-relaxed"
                  style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.15rem' }}
                  dir="rtl"
                >
                  {open.text}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
