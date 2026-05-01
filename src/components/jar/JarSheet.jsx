import { useEffect, useRef, useState } from 'react';

// A full-screen-width jar with two-stage interaction:
//   peek  → bottom 25vh shows the jar's top (lid + neck)
//   full  → jar fully visible on screen
//
// In the full state, the LID itself is draggable. Drag it up far enough or
// throw it with enough velocity → physics takes over: gravity + initial
// velocity carry it off the screen. Once gone, the notes inside (which have
// been bouncing the whole time) become tappable, and tapping reads a note.
//
// One button below the jar: "להוסיף פתק".

const PEEK_VH = 25;
const FULL_HEIGHT_VH = 88;
const LID_LIFT_TO_THROW = 100;       // px of upward drag to commit the throw
const LID_VELOCITY_TO_THROW = 6;     // px/frame at release to commit the throw

export default function JarSheet({
  unpulled,
  onPull,
  onWrite,
}) {
  // Sheet stages
  const [open, setOpen] = useState(false);          // peek ↔ full
  const [lidThrown, setLidThrown] = useState(false); // lid has popped off

  // Lid drag/physics state
  const [lid, setLid] = useState({ y: 0, x: 0, rot: 0, vx: 0, vy: 0 });
  const lidDragRef = useRef({
    active: false,
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    lastT: 0,
    vx: 0, vy: 0,
  });

  // Sheet drag (peek → full)
  const sheetDragRef = useRef({ startY: null });
  const [sheetDragY, setSheetDragY] = useState(null);

  // Note tap → read
  const [readingNote, setReadingNote] = useState(null);

  // Esc closes everything
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

  // ── Lid physics: free-fall after thrown ──
  useEffect(() => {
    if (!lidThrown) return;
    let raf;
    function tick() {
      setLid((p) => {
        const nx = p.x + p.vx;
        const ny = p.y + p.vy;
        const nvy = p.vy + 0.7; // gravity
        const nvx = p.vx * 0.995;
        const nrot = p.rot + p.vx * 0.4;
        return { x: nx, y: ny, vx: nvx, vy: nvy, rot: nrot };
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lidThrown]);

  // ── Sheet drag (lift jar from peek) ──
  function sheetPointerDown(e) {
    if (open) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    sheetDragRef.current.startY = e.clientY;
    setSheetDragY(0);
  }
  function sheetPointerMove(e) {
    if (sheetDragRef.current.startY === null) return;
    setSheetDragY(e.clientY - sheetDragRef.current.startY);
  }
  function sheetPointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (sheetDragRef.current.startY === null) return;
    const dy = e.clientY - sheetDragRef.current.startY;
    sheetDragRef.current.startY = null;
    setSheetDragY(null);
    if (dy < -40 || Math.abs(dy) < 6) {
      setOpen(true);
    }
  }

  // ── Lid drag ──
  function lidPointerDown(e) {
    if (!open || lidThrown) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const now = performance.now();
    lidDragRef.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      lastX: e.clientX, lastY: e.clientY,
      lastT: now,
      vx: 0, vy: 0,
    };
  }
  function lidPointerMove(e) {
    if (!lidDragRef.current.active) return;
    const now = performance.now();
    const dt = Math.max(1, now - lidDragRef.current.lastT);
    const fdx = e.clientX - lidDragRef.current.lastX;
    const fdy = e.clientY - lidDragRef.current.lastY;
    // Velocity in px/frame (~16.67ms)
    lidDragRef.current.vx = (fdx / dt) * 16;
    lidDragRef.current.vy = (fdy / dt) * 16;
    lidDragRef.current.lastX = e.clientX;
    lidDragRef.current.lastY = e.clientY;
    lidDragRef.current.lastT = now;

    const dx = e.clientX - lidDragRef.current.startX;
    const dy = e.clientY - lidDragRef.current.startY;
    setLid({ x: dx, y: dy, rot: dx * 0.2, vx: 0, vy: 0 });
  }
  function lidPointerUp(e) {
    if (!lidDragRef.current.active) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    lidDragRef.current.active = false;

    const dy = e.clientY - lidDragRef.current.startY;
    const speed = Math.hypot(lidDragRef.current.vx, lidDragRef.current.vy);
    const liftedEnough = dy < -LID_LIFT_TO_THROW;
    const thrown = liftedEnough || speed > LID_VELOCITY_TO_THROW;

    if (thrown) {
      // Commit physics: keep current position, give it the release velocity,
      // and ensure some upward kick so it actually flies up before falling.
      setLid((p) => ({
        ...p,
        vx: lidDragRef.current.vx || 0,
        vy: Math.min(lidDragRef.current.vy, -8), // always going up at release
      }));
      setLidThrown(true);
    } else {
      // Snap back
      setLid({ x: 0, y: 0, rot: 0, vx: 0, vy: 0 });
    }
  }

  // Dynamic sheet height
  let sheetHeight = open ? `${FULL_HEIGHT_VH}vh` : `${PEEK_VH}vh`;
  if (sheetDragY !== null && !open) {
    const peekPx = (PEEK_VH / 100) * window.innerHeight;
    const fullPx = (FULL_HEIGHT_VH / 100) * window.innerHeight;
    const liveH = Math.max(peekPx, Math.min(fullPx, peekPx - sheetDragY));
    sheetHeight = `${liveH}px`;
  }

  // Notes are positioned inside the jar interior. We compute slots once and
  // animate via CSS keyframes (cheap, no per-frame React updates). Each note
  // gets a deterministic seed.
  const notesToShow = unpulled.slice(0, 12);

  function handleReadNote(note) {
    if (!lidThrown) return;
    setReadingNote(note);
  }

  async function dismissReadNote() {
    if (readingNote) {
      // Mark it pulled — moves to the cork board.
      await onPull(readingNote.id);
    }
    setReadingNote(null);
  }

  return (
    <>
      {/* Backdrop dim when fully open */}
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

      {/* The sheet */}
      <section
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center select-none overflow-hidden"
        style={{
          height: sheetHeight,
          transition: sheetDragY !== null
            ? 'none'
            : 'height 480ms cubic-bezier(.34,1.4,.5,1)',
          willChange: 'height',
          touchAction: 'none',
          background:
            'linear-gradient(180deg,' +
            'rgba(13,31,22,0) 0%,' +
            'rgba(13,31,22,0.5) 6%,' +
            '#1a3a2a 14%,' +
            '#0f2418 100%)',
          boxShadow: open ? '0 -25px 60px -10px rgba(0,0,0,0.7)' : '0 -10px 24px -8px rgba(0,0,0,0.5)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        onPointerDown={sheetPointerDown}
        onPointerMove={sheetPointerMove}
        onPointerUp={sheetPointerUp}
        onPointerCancel={sheetPointerUp}
      >
        {/* Drag handle */}
        <div className="w-full flex flex-col items-center pt-3 pb-2 flex-shrink-0">
          <div
            className="w-12 h-1.5 rounded-full"
            style={{
              background: 'rgba(216,243,220,0.45)',
              boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
            }}
          />
          {!open && (
            <p className="text-muted text-[11px] font-body italic mt-1.5 tracking-wider animate-pulse">
              ↑ הרם את הצנצנת ↑
            </p>
          )}
        </div>

        {/* Wood shelf */}
        <div
          className="w-full h-2 flex-shrink-0"
          style={{
            background: 'linear-gradient(180deg,#5a3a1a 0%,#3a2510 50%,#1f1408 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        />

        {/* Wide jar, takes full sheet width */}
        <div className="w-full flex-1 flex flex-col items-center justify-start pt-2 relative">
          <WideJar
            notesToShow={notesToShow}
            lidThrown={lidThrown}
            lid={lid}
            onLidPointerDown={lidPointerDown}
            onLidPointerMove={lidPointerMove}
            onLidPointerUp={lidPointerUp}
            onReadNote={handleReadNote}
            interactive={open}
          />

          {/* Single CTA — only when open */}
          {open && (
            <button
              onClick={onWrite}
              className="clay-primary mt-4 px-7 py-3.5 font-body font-semibold text-base"
            >
              ✦ להוסיף פתק
            </button>
          )}

          {/* Close button when open */}
          {open && (
            <button
              onClick={() => setOpen(false)}
              className="clay-soft absolute top-1 right-4 w-9 h-9 flex items-center justify-center text-muted text-sm"
              aria-label="סגור"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* Read-note lightbox */}
      {readingNote && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          style={{ background: 'rgba(13,31,22,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={dismissReadNote}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => { e.stopPropagation(); dismissReadNote(); }}
            className="clay-soft absolute top-6 right-6 w-11 h-11 flex items-center justify-center text-text-primary text-lg z-10"
            aria-label="סגור"
          >
            ✕
          </button>
          <div
            className="max-w-md w-full animate-fadeInUp"
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
              {readingNote.emoji && (
                <div className="text-4xl text-center mb-3">{readingNote.emoji}</div>
              )}
              {readingNote.imageUrl && (
                <img
                  src={readingNote.imageUrl}
                  alt=""
                  loading="eager"
                  className="w-full rounded-sm mb-4 max-h-72 object-cover"
                />
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
                {readingNote.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// The jar itself: wide as the sheet, with lid + glass body + bouncing notes.
// ────────────────────────────────────────────────────────────────────────────
function WideJar({
  notesToShow, lidThrown, lid,
  onLidPointerDown, onLidPointerMove, onLidPointerUp,
  onReadNote, interactive,
}) {
  return (
    <div
      className="relative w-full"
      style={{ height: '100%', maxHeight: 540, minHeight: 360 }}
    >
      {/* Glass body — full width minus a margin, ~75% height */}
      <div
        className="absolute"
        style={{
          left: '5%',
          right: '5%',
          top: 60,
          bottom: 0,
          borderRadius: '18px 18px 28px 28px',
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
            'inset 0 -20px 40px rgba(0,0,0,0.45)',
          border: '1.5px solid rgba(13,31,22,0.55)',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute"
          style={{
            left: '8%',
            top: '5%',
            bottom: '15%',
            width: 14,
            background: 'linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
            filter: 'blur(2px)',
            borderRadius: 8,
          }}
        />

        {/* Bouncing notes — purely CSS animations, deterministic per index */}
        {notesToShow.map((note, i) => {
          const seed = i;
          const left = 12 + ((seed * 23) % 70);
          const dur = 4 + (seed % 5);
          const delay = (seed * 0.7) % 5;
          const tilt = ((seed * 37) % 24) - 12;
          return (
            <button
              key={note.id || i}
              onClick={() => onReadNote(note)}
              disabled={!interactive || !lidThrown}
              className="absolute pointer-events-auto"
              style={{
                left: `${left}%`,
                bottom: 8 + ((seed * 31) % 200),
                width: 56,
                height: 38,
                background: 'linear-gradient(170deg,#f5ecd0 0%,#e6d5a8 100%)',
                boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(80,55,20,0.25)',
                borderRadius: 2,
                transform: `rotate(${tilt}deg)`,
                animation: `noteFloat${seed % 4} ${dur}s ease-in-out ${delay}s infinite`,
                cursor: lidThrown ? 'pointer' : 'default',
                opacity: 0.95,
              }}
            >
              <div className="mt-1.5 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.55)', width: '70%' }} />
              <div className="mt-1 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.45)', width: '85%' }} />
              <div className="mt-1 mx-1.5 h-px" style={{ background: 'rgba(80,55,20,0.40)', width: '55%' }} />
            </button>
          );
        })}

        {notesToShow.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted/70 text-xs italic font-body">הצנצנת ריקה</p>
          </div>
        )}
      </div>

      {/* Lid + neck — draggable */}
      {!lidThrown && (
        <div
          className="absolute"
          style={{
            left: '8%',
            right: '8%',
            top: 0,
            height: 70,
            transform: `translate(${lid.x}px, ${lid.y}px) rotate(${lid.rot}deg)`,
            transition: lid.vx === 0 && lid.vy === 0 && lid.x === 0 && lid.y === 0
              ? 'transform 220ms cubic-bezier(.34,1.56,.64,1)'
              : 'none',
            cursor: interactive ? 'grab' : 'default',
            touchAction: 'none',
          }}
          onPointerDown={onLidPointerDown}
          onPointerMove={onLidPointerMove}
          onPointerUp={onLidPointerUp}
          onPointerCancel={onLidPointerUp}
        >
          {/* Brass lid */}
          <div
            className="absolute"
            style={{
              left: 0, right: 0, top: 0,
              height: 50,
              borderRadius: '6px 6px 0 0',
              background:
                'linear-gradient(180deg,' +
                '#f4d28a 0%,' +
                '#d4a657 22%,' +
                '#a87a3d 50%,' +
                '#7c5526 78%,' +
                '#4f3416 100%)',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.45), 0 6px 12px rgba(0,0,0,0.5)',
            }}
          >
            {/* threads */}
            <div className="absolute inset-x-0" style={{ top: 8, height: 1.5, background: 'rgba(0,0,0,0.25)' }} />
            <div className="absolute inset-x-0" style={{ top: 18, height: 1.5, background: 'rgba(0,0,0,0.20)' }} />
            <div className="absolute inset-x-0" style={{ top: 28, height: 1.5, background: 'rgba(0,0,0,0.20)' }} />
            <div className="absolute inset-x-0" style={{ top: 38, height: 1.5, background: 'rgba(0,0,0,0.25)' }} />
          </div>
          {/* lid rim under */}
          <div
            className="absolute"
            style={{
              left: -4, right: -4, top: 50,
              height: 8,
              borderRadius: 2,
              background: 'linear-gradient(180deg,#7c5526 0%,#d4a657 50%,#7c5526 100%)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.35)',
            }}
          />
          {/* hint when open and lid is fresh */}
          {interactive && lid.x === 0 && lid.y === 0 && (
            <div className="absolute -top-6 inset-x-0 text-center text-muted text-[10px] font-body italic animate-pulse">
              ↑ הרם / זרוק ↑
            </div>
          )}
        </div>
      )}

      {/* Thrown lid still rendered but flying around */}
      {lidThrown && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '8%',
            right: '8%',
            top: 0,
            height: 70,
            transform: `translate(${lid.x}px, ${lid.y}px) rotate(${lid.rot}deg)`,
            zIndex: 60,
          }}
        >
          <div
            className="absolute"
            style={{
              left: 0, right: 0, top: 0,
              height: 50,
              borderRadius: '6px 6px 0 0',
              background:
                'linear-gradient(180deg,#f4d28a 0%,#d4a657 22%,#a87a3d 50%,#7c5526 78%,#4f3416 100%)',
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

      {/* Floating note keyframes */}
      <style>{`
        @keyframes noteFloat0 { 0%, 100% { translate: 0 0; } 50% { translate: 6px -10px; } }
        @keyframes noteFloat1 { 0%, 100% { translate: 0 0; } 50% { translate: -8px -14px; } }
        @keyframes noteFloat2 { 0%, 100% { translate: 0 0; } 50% { translate: 10px 8px; } }
        @keyframes noteFloat3 { 0%, 100% { translate: 0 0; } 50% { translate: -12px 6px; } }
      `}</style>
    </div>
  );
}
