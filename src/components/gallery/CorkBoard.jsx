import { useEffect, useRef, useState } from 'react';
import { PHOTOS, HAS_REAL_PHOTOS } from '../../data/photos';
import WordleAttachment from '../jar/WordleAttachment';

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
          className="w-full relative overflow-hidden"
          style={{
            aspectRatio: '4 / 5',
            background: 'linear-gradient(135deg,#3a4f3e 0%,#1f2e25 100%)',
          }}
        >
          {item.src ? (
            <img
              src={item.src}
              alt={item.caption || ''}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
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

function NoteItem({ item, idx, onOpen, mine }) {
  const pin = PIN_COLORS[idx % PIN_COLORS.length];
  const rot = jitter(idx + 0.5, -8, 8);
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
      <div
        className={`pushpin ${pin} absolute left-1/2 -translate-x-1/2 z-20`}
        style={{ top: -6 }}
      />
      <div
        className="px-3 py-3 paper-grain relative"
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
        {mine && (
          <div
            className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded text-[8px] tracking-[0.2em] uppercase font-semibold"
            style={{ background: '#52b788', color: '#0d1f16' }}
          >
            שלי
          </div>
        )}
        {item.wordle && (
          <div
            className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[8px] tracking-[0.2em] uppercase font-semibold"
            style={{ background: '#f4a261', color: '#3a1f08' }}
          >
            🟩
          </div>
        )}
        {item.emoji && (
          <div className="text-center text-base mb-0.5" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}>
            {item.emoji}
          </div>
        )}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full mb-1 max-h-20 object-cover rounded-sm"
          />
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

export default function CorkBoard({
  history = [],
  myNotes = [],
  user,
  onEditNote,
  onDeleteNote,
  onUpdateWordle, // (note, newGuesses, solved) => Promise — recipient guess
}) {
  const [open, setOpen] = useState(null);
  const scrollRef = useRef(null);

  // Keep `open` in sync with the latest note data (so wordle guesses
  // refresh live while the lightbox is open).
  const allLiveNotes = [...(history || []), ...(myNotes || [])];
  const liveOpen = open?.id
    ? { ...open, ...(allLiveNotes.find((n) => n.id === open.id) || {}) }
    : open;

  // Close lightbox on Esc
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Mark which items are notes I authored.
  // Use a Set of ids so dedup is cheap.
  const myIds = new Set(myNotes.map((n) => n.id));

  // Combine into a single timeline.
  // Photos first (the immutable backdrop), then notes (history + myNotes
  // merged). myNotes ALWAYS appear regardless of pulled-state.
  const allNotes = [
    ...history.map((n) => ({ ...n, _mine: myIds.has(n.id) || n.author === user })),
    ...myNotes
      .filter((n) => !myIds.has(n.id) || true) // keep all, will dedup below
      .map((n) => ({ ...n, _mine: true })),
  ];

  // Dedup by id (a note could in theory be in both lists)
  const seen = new Set();
  const uniqNotes = allNotes.filter((n) => {
    if (!n.id) return true;
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  // Sort notes by createdAt desc (newest at right end)
  uniqNotes.sort((a, b) => {
    const ta = a.createdAt?.seconds ?? a.createdAt ?? 0;
    const tb = b.createdAt?.seconds ?? b.createdAt ?? 0;
    return ta - tb;
  });

  const items = [
    ...PHOTOS.map((p) => ({ kind: 'photo', ...p })),
    ...uniqNotes.map((n) => ({ kind: 'note', ...n })),
  ];

  // Two-row staggered layout.
  const COL_WIDTH = 110;
  const ROW_HEIGHT = 170;
  const PAD_LEFT = 28;
  const PAD_TOP = 28;

  const decorated = items.map((item, i) => {
    const col = i;
    const row = i % 2;
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

  // Auto-scroll right on new items.
  const lastCount = useRef(items.length);
  useEffect(() => {
    if (items.length > lastCount.current && scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }
    lastCount.current = items.length;
  }, [items.length]);

  function handleEdit(note) {
    setOpen(null);
    onEditNote?.(note);
  }
  async function handleDelete(note) {
    if (!confirm('למחוק את הפתק?')) return;
    setOpen(null);
    await onDeleteNote?.(note);
  }

  return (
    <div className="px-3">
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
                  <NoteItem item={item} idx={item._idx} onOpen={setOpen} mine={!!item._mine} />
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
      {liveOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 overflow-y-auto"
          style={{ background: 'rgba(13,31,22,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-muted/70 text-[11px] font-body tracking-[0.3em] uppercase pointer-events-none">
            הקש מחוץ לסגירה
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(null); }}
            className="clay-soft fixed top-6 right-6 w-11 h-11 flex items-center justify-center text-text-primary text-lg z-[70]"
            aria-label="סגור"
          >
            ✕
          </button>

          <div
            className="max-w-md w-full animate-fadeInUp my-12"
            style={{ transform: 'rotate(-1deg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {liveOpen.kind === 'photo' ? (
              <div
                className="bg-[#fbf3da] p-3 pb-10"
                style={{ boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.45)' }}
              >
                {liveOpen.src ? (
                  <img src={liveOpen.src} alt={liveOpen.caption} loading="eager" className="w-full" />
                ) : (
                  <div className="w-full flex items-center justify-center text-white/30" style={{ aspectRatio: '4/5', background: 'linear-gradient(135deg,#3a4f3e,#1f2e25)' }}>📷</div>
                )}
                {liveOpen.caption && (
                  <div className="mt-3 text-center text-[#3a2a14]" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}>
                    {liveOpen.caption}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="px-7 py-8 paper-grain relative"
                style={{
                  background: 'linear-gradient(168deg,#fbf3da 0%,#f0e3b8 50%,#e7d8a4 100%)',
                  color: '#3a2a14',
                  boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.45)',
                }}
              >
                {liveOpen.emoji && <div className="text-4xl text-center mb-3">{liveOpen.emoji}</div>}
                {liveOpen.imageUrl && <img src={liveOpen.imageUrl} alt="" loading="eager" className="w-full rounded-sm mb-4 max-h-72 object-cover" />}
                <p
                  className="text-center whitespace-pre-wrap leading-relaxed"
                  style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '1.15rem' }}
                  dir="rtl"
                >
                  {liveOpen.text}
                </p>

                {liveOpen.wordle && (
                  <WordleAttachment
                    wordle={liveOpen.wordle}
                    isAuthor={liveOpen._mine}
                    onUpdateGuesses={async (newGuesses, solved) => {
                      if (onUpdateWordle) {
                        await onUpdateWordle(liveOpen, newGuesses, solved);
                      }
                    }}
                  />
                )}

                {liveOpen._mine && (onEditNote || onDeleteNote) && (
                  <div className="mt-6 flex gap-3 justify-center">
                    {onEditNote && (
                      <button
                        onClick={() => handleEdit(liveOpen)}
                        className="clay-soft px-4 py-2 text-sm font-body text-text-primary"
                      >
                        ✎ ערוך
                      </button>
                    )}
                    {onDeleteNote && (
                      <button
                        onClick={() => handleDelete(liveOpen)}
                        className="clay-gold px-4 py-2 text-sm font-body font-semibold"
                      >
                        🗑 מחק
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
