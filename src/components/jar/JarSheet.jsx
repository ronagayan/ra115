import { useEffect, useMemo, useRef, useState } from 'react';
import WordleAttachment from './WordleAttachment';

// Bottom-anchored full-width jar.
//
// Closed (peek): bottom 25vh of viewport. Touch ANYWHERE on the jar and
// drag up to open. The lid is purely cosmetic in this state — drag
// handlers belong to the entire jar surface.
//
// Open (full): jar fully visible. Now the lid is interactive: swipe it
// horizontally to twist (3D rotation around the vertical axis through the
// cap, using CSS rotateX-via-perspective so it looks like an actual screw
// motion). Past 270° of accumulated twist, the lid pops off and falls.
//
// Once the lid is gone, the bouncing notes inside (DVD-screensaver style
// — bounce off all four walls, no React re-renders, pure DOM mutation in
// a rAF loop) become tappable. Tapping a note opens it for reading.

const PEEK_VH = 25;
const FULL_HEIGHT_VH = 90;
// 180° (half turn) at 1px/deg = 180 px of swipe to commit. A typical phone
// finger swing is ~250-300 px, so a single motion is enough. The
// accumulated-absolute tracking lets back-and-forth wiggles count too.
const TWIST_THRESHOLD_DEG = 180;
const PIXELS_PER_DEG = 1;

export default function JarSheet({ unpulled, onPull, onWrite, onUpdateWordle, user }) {
  const [open, setOpen] = useState(false);
  const [lidGone, setLidGone] = useState(false);
  const [lidOffscreen, setLidOffscreen] = useState(false);
  const [lid, setLid] = useState({ rot: 0, ty: 0, vy: 0 });
  const [readingNote, setReadingNote] = useState(null);

  // Live preview of sheet height while dragging up
  const [sheetDragY, setSheetDragY] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (readingNote) setReadingNote(null);
        else if (open) setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, readingNote]);

  // Free-fall once committed. We let the lid fall well past the viewport
  // (window.innerHeight + 400) before stopping AND unmounting it, so it
  // truly disappears off the bottom of the screen instead of stopping at
  // the edge of the jar.
  useEffect(() => {
    if (!lidGone || lidOffscreen) return;
    let raf;
    let alive = true;
    function tick() {
      if (!alive) return;
      setLid((p) => {
        const ny = p.ty + p.vy;
        const limit = (typeof window !== 'undefined' ? window.innerHeight : 1000) + 400;
        if (ny > limit) {
          alive = false;
          // Schedule unmount after this frame so React doesn't re-render
          // synchronously inside the updater.
          queueMicrotask(() => setLidOffscreen(true));
          return p;
        }
        return {
          rot: p.rot + 6,
          ty: ny,
          vy: p.vy + 0.7,
        };
      });
      if (alive) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [lidGone, lidOffscreen]);

  // ONE unified pointer handler at the section level — fixes mobile because
  // setPointerCapture fires once on the section (the captured element won't
  // change) and 3D rotateY on the lid no longer affects hit testing.
  //
  // gesture mode is decided at pointerdown:
  //   - !open                   → "lift" (drag up to open the jar)
  //   - open && started on lid  → "twist" (horizontal swipe rotates lid)
  //   - open && elsewhere       → "close" (drag down or tap to close)
  const gestureRef = useRef({
    mode: null, // 'lift' | 'twist' | 'close'
    startX: 0,
    startY: 0,
    lastDx: 0,
    accDeg: 0,
  });

  function startedOnLid(e) {
    // The lid is the top ~70px of the jar (within the sheet section).
    // We use bounding box of the section so the math is correct regardless
    // of where the user touches.
    const rect = e.currentTarget.getBoundingClientRect();
    const yWithin = e.clientY - rect.top;
    return yWithin < 80;
  }

  function sectionPointerDown(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);

    if (!open) {
      gestureRef.current = {
        mode: 'lift',
        startX: e.clientX, startY: e.clientY,
        lastDx: 0, accDeg: 0,
      };
      setSheetDragY(0);
    } else if (startedOnLid(e) && !lidGone) {
      // Twist gesture only works while the lid is still on
      gestureRef.current = {
        mode: 'twist',
        startX: e.clientX, startY: e.clientY,
        lastDx: 0, accDeg: 0,
      };
    } else {
      // Open + non-lid (or open + lid-already-gone) → drag down to close
      gestureRef.current = {
        mode: 'close',
        startX: e.clientX, startY: e.clientY,
        lastDx: 0, accDeg: 0,
      };
    }
  }

  function sectionPointerMove(e) {
    const g = gestureRef.current;
    if (!g.mode) return;
    if (g.mode === 'lift') {
      setSheetDragY(e.clientY - g.startY);
    } else if (g.mode === 'twist') {
      const dx = e.clientX - g.startX;
      g.lastDx = dx;
      const newRot = dx / PIXELS_PER_DEG;
      g.accDeg = Math.max(g.accDeg, Math.abs(newRot));
      setLid((p) => ({ ...p, rot: newRot }));
    }
    // close gesture has no live preview — just commits on release
  }

  function sectionPointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const g = gestureRef.current;

    if (g.mode === 'lift') {
      const dy = e.clientY - g.startY;
      setSheetDragY(null);
      // Drag up enough OR tap → open
      if (dy < -40 || Math.abs(dy) < 6) setOpen(true);
    } else if (g.mode === 'twist') {
      const totalDeg = Math.max(g.accDeg, Math.abs(g.lastDx / PIXELS_PER_DEG));
      if (totalDeg >= TWIST_THRESHOLD_DEG) {
        setLid((p) => ({ ...p, vy: -8 }));
        setLidGone(true);
      } else {
        setLid({ rot: 0, ty: 0, vy: 0 });
      }
    } else if (g.mode === 'close') {
      const dy = e.clientY - g.startY;
      // Drag down enough → close
      if (dy > 60) setOpen(false);
    }
    gestureRef.current.mode = null;
  }

  // Sheet height
  let sheetHeight = open ? `${FULL_HEIGHT_VH}vh` : `${PEEK_VH}vh`;
  if (sheetDragY !== null && !open) {
    const peekPx = (PEEK_VH / 100) * window.innerHeight;
    const fullPx = (FULL_HEIGHT_VH / 100) * window.innerHeight;
    const liveH = Math.max(peekPx, Math.min(fullPx, peekPx - sheetDragY));
    sheetHeight = `${liveH}px`;
  }

  // Memoize so the reference is stable across re-renders (otherwise
  // FloatingNotes' state-init useEffect retriggers and snaps the notes
  // back to their starting positions every frame).
  const notesToShow = useMemo(() => unpulled.slice(0, 12), [
    // Recompute only when the actual set of unpulled note ids changes,
    // not on every parent render.
    unpulled.map((n) => n.id).join('|'),
    unpulled.length,
  ]);

  function handleReadNote(note) {
    if (!lidGone) return;
    setReadingNote(note);
  }

  async function dismissReadNote() {
    if (readingNote) await onPull(readingNote.id);
    setReadingNote(null);
  }

  const liveReading = readingNote
    ? unpulled.find((n) => n.id === readingNote.id) || readingNote
    : null;

  const twistProgress = Math.min(Math.abs(lid.rot) / TWIST_THRESHOLD_DEG, 1);

  return (
    <>
      {/* Backdrop dim */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className="fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: 'rgba(13,31,22,0.78)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* The jar IS the sheet — ALL pointer handlers are on the section
          itself, so dragging up works from anywhere on the visible jar. */}
      <section
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center select-none overflow-visible"
        style={{
          height: sheetHeight,
          transition: sheetDragY !== null ? 'none' : 'height 480ms cubic-bezier(.34,1.4,.5,1)',
          willChange: 'height',
          touchAction: 'none',
          // Perspective so 3D rotations on the lid look like actual depth
          perspective: '900px',
        }}
        onPointerDown={sectionPointerDown}
        onPointerMove={sectionPointerMove}
        onPointerUp={sectionPointerUp}
        onPointerCancel={sectionPointerUp}
      >
        <div className="relative w-full flex-1">
          <WideJar
            notesToShow={notesToShow}
            lidGone={lidGone}
            lidOffscreen={lidOffscreen}
            lid={lid}
            twistProgress={twistProgress}
            onReadNote={handleReadNote}
            interactive={open}
          />
        </div>

        {open && (
          <div className="w-full px-6 pb-5 flex flex-col items-center gap-3">
            <button
              onClick={onWrite}
              className="clay-primary px-7 py-3.5 font-body font-semibold text-base"
            >
              ✦ להוסיף פתק
            </button>
            <button
              onClick={() => setOpen(false)}
              className="clay-soft absolute top-2 right-4 w-9 h-9 flex items-center justify-center text-muted text-sm"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>
        )}
      </section>

      {/* Read-note lightbox */}
      {liveReading && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 overflow-y-auto"
          style={{ background: 'rgba(13,31,22,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={dismissReadNote}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => { e.stopPropagation(); dismissReadNote(); }}
            className="clay-soft fixed top-6 right-6 w-11 h-11 flex items-center justify-center text-text-primary text-lg z-[70]"
            aria-label="סגור"
          >
            ✕
          </button>
          <div
            className="max-w-md w-full animate-fadeInUp my-12"
            style={{ transform: 'rotate(-1.6deg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-7 py-8 paper-grain relative"
              style={{
                background: 'linear-gradient(168deg,#fbf3da 0%,#f0e3b8 50%,#e7d8a4 100%)',
                color: '#3a2a14',
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.45)',
              }}
            >
              {liveReading.emoji && <div className="text-4xl text-center mb-3">{liveReading.emoji}</div>}
              {liveReading.imageUrl && (
                <img src={liveReading.imageUrl} alt="" loading="eager" className="w-full rounded-sm mb-4 max-h-72 object-cover" />
              )}
              <p
                className="text-center whitespace-pre-wrap leading-relaxed"
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontStyle: 'italic',
                  fontSize: '1.15rem',
                }}
                dir="rtl"
              >
                {liveReading.text}
              </p>

              {liveReading.wordle && (
                <WordleAttachment
                  wordle={liveReading.wordle}
                  isAuthor={liveReading.author === user}
                  onUpdateGuesses={async (newGuesses, solved) => {
                    if (onUpdateWordle) {
                      await onUpdateWordle(liveReading, newGuesses, solved);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function WideJar({
  notesToShow, lidGone, lidOffscreen, lid, twistProgress,
  onReadNote, interactive,
}) {
  return (
    <div className="relative w-full h-full">
      {/* Glass body — pointerEvents: none so drag-to-open events bubble */}
      <div
        className="absolute"
        style={{
          left: '4%',
          right: '4%',
          top: 50,
          bottom: 0,
          borderRadius: '14px 14px 26px 26px',
          background:
            'linear-gradient(135deg,' +
            'rgba(216,243,220,0.06) 0%,' +
            'rgba(216,243,220,0.18) 18%,' +
            'rgba(82,183,136,0.10) 45%,' +
            'rgba(45,106,79,0.20) 72%,' +
            'rgba(13,31,22,0.55) 100%)',
          boxShadow:
            'inset 8px 0 20px rgba(216,243,220,0.10),' +
            'inset -8px 0 30px rgba(0,0,0,0.4),' +
            'inset 0 -20px 40px rgba(0,0,0,0.45),' +
            '0 -10px 30px rgba(0,0,0,0.4)',
          border: '1.5px solid rgba(13,31,22,0.55)',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute"
          style={{
            left: '7%',
            top: '5%',
            bottom: '15%',
            width: 14,
            background: 'linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
            filter: 'blur(2px)',
            borderRadius: 8,
          }}
        />

        {/* DVD-style bouncing notes */}
        <FloatingNotes
          notes={notesToShow}
          interactive={interactive && lidGone}
          onTap={onReadNote}
        />

        {notesToShow.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted/70 text-xs italic font-body">הצנצנת ריקה</p>
          </div>
        )}
      </div>

      {/* Lid — purely visual. ALL pointer handling lives on the parent
          section. The cap container stays a FIXED rectangle (no 3D
          rotation that would shrink its width). Rotation is conveyed by
          scrolling internal grip ridges + a sweeping highlight, so the
          cap visually maintains its size at all times. */}
      {!lidGone && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '8%',
            right: '8%',
            top: 0,
            height: 60,
            // Only vertical translation here — no rotation on the wrapper,
            // so the bounding box never shrinks.
            transform: `translate(0, ${lid.ty}px)`,
            transition:
              lid.rot === 0 && lid.ty === 0
                ? 'transform 220ms cubic-bezier(.34,1.56,.64,1)'
                : 'none',
            cursor: interactive ? 'grab' : 'default',
          }}
        >
          {/* Brass cap — fixed rectangle */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: 0, right: 0, top: 0,
              height: 50,
              borderRadius: '6px 6px 0 0',
              background:
                'linear-gradient(180deg,#f4d28a 0%,#d4a657 22%,#a87a3d 50%,#7c5526 78%,#4f3416 100%)',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.45), 0 6px 12px rgba(0,0,0,0.5)',
            }}
          >
            {/* Static horizontal thread lines */}
            <div className="absolute inset-x-0" style={{ top: 8, height: 1.5, background: 'rgba(0,0,0,0.25)' }} />
            <div className="absolute inset-x-0" style={{ top: 18, height: 1.5, background: 'rgba(0,0,0,0.20)' }} />
            <div className="absolute inset-x-0" style={{ top: 28, height: 1.5, background: 'rgba(0,0,0,0.20)' }} />
            <div className="absolute inset-x-0" style={{ top: 38, height: 1.5, background: 'rgba(0,0,0,0.25)' }} />

            {/* Grip notches that SCROLL horizontally with rotation —
                this is the visual cue that the cap is being twisted. */}
            <div
              className="absolute"
              style={{
                left: -200,
                right: -200,
                top: 0, bottom: 0,
                background:
                  'repeating-linear-gradient(90deg,' +
                  'rgba(0,0,0,0.0) 0 5px,' +
                  'rgba(0,0,0,0.30) 5px 6px,' +
                  'rgba(255,235,180,0.18) 6px 7px,' +
                  'rgba(0,0,0,0.0) 7px 12px)',
                transform: `translateX(${lid.rot * 0.6}px)`,
              }}
            />
            {/* Sweeping shine that follows the rotation */}
            <div
              className="absolute"
              style={{
                top: 0, bottom: 0,
                width: 28,
                left: `calc(50% + ${Math.sin((lid.rot * Math.PI) / 180) * 50}% - 14px)`,
                background:
                  'linear-gradient(90deg,' +
                  'rgba(255,255,255,0) 0%,' +
                  'rgba(255,255,255,0.35) 50%,' +
                  'rgba(255,255,255,0) 100%)',
                filter: 'blur(2px)',
                pointerEvents: 'none',
              }}
            />
          </div>

          <div
            className="absolute"
            style={{
              left: -4, right: -4, top: 50, height: 8,
              borderRadius: 2,
              background: 'linear-gradient(180deg,#7c5526 0%,#d4a657 50%,#7c5526 100%)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.35)',
            }}
          />

          {interactive && twistProgress > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: -6, right: -6, top: -6, height: 70,
                borderRadius: '12px 12px 0 0',
                border: '2px dashed rgba(82,183,136,0.7)',
                opacity: twistProgress,
              }}
            />
          )}
          {interactive && lid.rot === 0 && (
            <div className="absolute -top-6 inset-x-0 text-center text-muted text-[10px] font-body italic animate-pulse">
              ↶ סובב את המכסה ↷
            </div>
          )}
        </div>
      )}

      {lidGone && !lidOffscreen && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '8%',
            right: '8%',
            top: 0,
            height: 60,
            transform: `translate(0, ${lid.ty}px) rotate(${lid.rot}deg)`,
            zIndex: 60,
          }}
        >
          <div
            className="absolute"
            style={{
              left: 0, right: 0, top: 0,
              height: 50,
              borderRadius: '6px 6px 0 0',
              background: 'linear-gradient(180deg,#f4d28a 0%,#d4a657 22%,#a87a3d 50%,#7c5526 78%,#4f3416 100%)',
              boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
            }}
          />
          <div
            className="absolute"
            style={{
              left: -4, right: -4, top: 50, height: 8, borderRadius: 2,
              background: 'linear-gradient(180deg,#7c5526 0%,#d4a657 50%,#7c5526 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DVD-screensaver bouncing notes. Each note has position + velocity;
// each frame it advances and reflects off the four interior walls.
// We do all updates via refs + direct DOM mutation so we don't trigger
// React reconciliation 60×/sec.
function FloatingNotes({ notes, interactive, onTap }) {
  const containerRef = useRef(null);
  const noteRefs = useRef([]);
  const states = useRef([]);

  // Initialize/refresh physics state ONLY when the note ids actually
  // change. (notes is a fresh array reference on every parent render so
  // depending on `notes` directly resets positions every frame.)
  const idsKey = notes.map((n) => n.id || '').join('|');
  useEffect(() => {
    states.current = notes.map((_, i) => {
      const seed = i + 1;
      const angle = (seed * 137) % 360 * (Math.PI / 180);
      const speed = 0.6 + ((seed * 7) % 10) * 0.08;
      return {
        x: 20 + ((seed * 53) % 200),
        y: 20 + ((seed * 71) % 260),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: ((seed * 37) % 24) - 12,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    let raf;
    function tick() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0) {
        const noteW = 60;
        const noteH = 40;
        const W = rect.width;
        const H = rect.height;

        for (let i = 0; i < states.current.length; i++) {
          const s = states.current[i];
          if (!s) continue;
          s.x += s.vx;
          s.y += s.vy;

          // Bounce off walls — DVD logo style
          if (s.x <= 0)         { s.x = 0;         s.vx = Math.abs(s.vx); }
          if (s.x >= W - noteW) { s.x = W - noteW; s.vx = -Math.abs(s.vx); }
          if (s.y <= 0)         { s.y = 0;         s.vy = Math.abs(s.vy); }
          if (s.y >= H - noteH) { s.y = H - noteH; s.vy = -Math.abs(s.vy); }

          const el = noteRefs.current[i];
          if (el) {
            el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${s.rot}deg)`;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {notes.map((note, i) => (
        <button
          key={note.id || i}
          ref={(el) => (noteRefs.current[i] = el)}
          onClick={() => onTap(note)}
          disabled={!interactive}
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: 60,
            height: 40,
            background: 'linear-gradient(170deg,#f5ecd0 0%,#e6d5a8 100%)',
            boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(80,55,20,0.25)',
            borderRadius: 2,
            transform: 'translate(0, 0)',
            willChange: 'transform',
            cursor: interactive ? 'pointer' : 'default',
            opacity: 0.95,
            pointerEvents: interactive ? 'auto' : 'none',
          }}
        >
          <div className="mt-1.5 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.55)', width: '70%' }} />
          <div className="mt-1 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.45)', width: '85%' }} />
          <div className="mt-1 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.40)', width: '55%' }} />
          {note.wordle && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[8px] rounded-full"
              style={{ background: '#f4a261', color: '#3a1f08' }}
            >
              🟩
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
