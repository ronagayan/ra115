import { useEffect, useRef, useState } from 'react';

// Bottom-anchored full-width jar. The JAR itself is the draggable element
// — there is no separate drawer/handle chrome.
//
// Closed: the top quarter of the screen shows the jar's TOP (lid + neck +
// upper body). Drag UP anywhere on the jar → expands to a fully-visible
// open state.
//
// LID gesture: once open, swipe horizontally on the lid to TWIST it.
// After enough rotation (≥ ¾ turn) it pops off — gravity carries it off
// the bottom of the screen. Once gone, the bouncing notes inside become
// tappable.
//
// One CTA below the jar: "להוסיף פתק".

const PEEK_VH = 25;
const FULL_HEIGHT_VH = 90;
const TWIST_THRESHOLD_DEG = 270; // ¾ of a turn to commit
const PIXELS_PER_DEG = 2;        // horizontal swipe → degrees of rotation

export default function JarSheet({ unpulled, onPull, onWrite }) {
  const [open, setOpen] = useState(false);
  const [lidGone, setLidGone] = useState(false);
  const [lid, setLid] = useState({ rot: 0, ty: 0, vy: 0 });
  const [readingNote, setReadingNote] = useState(null);

  // Sheet drag → lift jar from peek to full
  const sheetDragRef = useRef({ startY: null });
  const [sheetDragY, setSheetDragY] = useState(null);

  // Lid drag (horizontal twist)
  const lidDragRef = useRef({ active: false, startX: 0, lastDx: 0 });

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

  // Lid free-fall once committed
  useEffect(() => {
    if (!lidGone) return;
    let raf;
    function tick() {
      setLid((p) => ({
        rot: p.rot + 6,
        ty: p.ty + p.vy,
        vy: p.vy + 0.7,
      }));
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lidGone]);

  // — Sheet drag handlers —
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
    if (dy < -40 || Math.abs(dy) < 6) setOpen(true);
  }

  // — Lid twist handlers —
  function lidPointerDown(e) {
    if (!open || lidGone) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    lidDragRef.current.active = true;
    lidDragRef.current.startX = e.clientX;
    lidDragRef.current.lastDx = 0;
  }
  function lidPointerMove(e) {
    if (!lidDragRef.current.active) return;
    e.stopPropagation();
    const dx = e.clientX - lidDragRef.current.startX;
    lidDragRef.current.lastDx = dx;
    setLid((p) => ({ ...p, rot: dx / PIXELS_PER_DEG }));
  }
  function lidPointerUp(e) {
    if (!lidDragRef.current.active) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    e.stopPropagation();
    lidDragRef.current.active = false;
    const totalDeg = Math.abs(lidDragRef.current.lastDx / PIXELS_PER_DEG);
    if (totalDeg >= TWIST_THRESHOLD_DEG) {
      // Pop off: keep current rotation, give it upward then falling velocity
      setLid((p) => ({ ...p, vy: -8 }));
      setLidGone(true);
    } else {
      // Snap back
      setLid({ rot: 0, ty: 0, vy: 0 });
    }
  }

  // Sheet height
  let sheetHeight = open ? `${FULL_HEIGHT_VH}vh` : `${PEEK_VH}vh`;
  if (sheetDragY !== null && !open) {
    const peekPx = (PEEK_VH / 100) * window.innerHeight;
    const fullPx = (FULL_HEIGHT_VH / 100) * window.innerHeight;
    const liveH = Math.max(peekPx, Math.min(fullPx, peekPx - sheetDragY));
    sheetHeight = `${liveH}px`;
  }

  const notesToShow = unpulled.slice(0, 12);

  function handleReadNote(note) {
    if (!lidGone) return;
    setReadingNote(note);
  }

  async function dismissReadNote() {
    if (readingNote) await onPull(readingNote.id);
    setReadingNote(null);
  }

  // Twist progress hint
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

      {/* The jar IS the sheet — no chrome / pill / hint text */}
      <section
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center select-none overflow-visible"
        style={{
          height: sheetHeight,
          transition: sheetDragY !== null ? 'none' : 'height 480ms cubic-bezier(.34,1.4,.5,1)',
          willChange: 'height',
          touchAction: 'none',
        }}
      >
        {/* Wide-jar body — full width. Drag handlers live on the body
            so the user lifts the jar itself. */}
        <div
          className="relative w-full flex-1"
          onPointerDown={sheetPointerDown}
          onPointerMove={sheetPointerMove}
          onPointerUp={sheetPointerUp}
          onPointerCancel={sheetPointerUp}
        >
          <WideJar
            notesToShow={notesToShow}
            lidGone={lidGone}
            lid={lid}
            twistProgress={twistProgress}
            onLidPointerDown={lidPointerDown}
            onLidPointerMove={lidPointerMove}
            onLidPointerUp={lidPointerUp}
            onReadNote={handleReadNote}
            interactive={open}
          />
        </div>

        {/* CTA + close — only when fully open */}
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
              {readingNote.emoji && <div className="text-4xl text-center mb-3">{readingNote.emoji}</div>}
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
function WideJar({
  notesToShow, lidGone, lid, twistProgress,
  onLidPointerDown, onLidPointerMove, onLidPointerUp,
  onReadNote, interactive,
}) {
  return (
    <div className="relative w-full h-full">
      {/* Glass body */}
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

        {/* Bouncing notes */}
        {notesToShow.map((note, i) => {
          const seed = i;
          const left = 10 + ((seed * 23) % 75);
          const dur = 4 + (seed % 5);
          const delay = (seed * 0.7) % 5;
          const tilt = ((seed * 37) % 24) - 12;
          return (
            <button
              key={note.id || i}
              onClick={() => onReadNote(note)}
              disabled={!interactive || !lidGone}
              className="absolute pointer-events-auto"
              style={{
                left: `${left}%`,
                bottom: 8 + ((seed * 31) % 240),
                width: 60,
                height: 40,
                background: 'linear-gradient(170deg,#f5ecd0 0%,#e6d5a8 100%)',
                boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(80,55,20,0.25)',
                borderRadius: 2,
                transform: `rotate(${tilt}deg)`,
                animation: `noteFloat${seed % 4} ${dur}s ease-in-out ${delay}s infinite`,
                cursor: lidGone ? 'pointer' : 'default',
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

      {/* Lid — rotates horizontally; once committed, lid flies away */}
      {!lidGone && (
        <div
          className="absolute"
          style={{
            left: '8%',
            right: '8%',
            top: 0,
            height: 60,
            transformOrigin: '50% 50%',
            transform: `translate(0, ${lid.ty}px) rotate(${lid.rot}deg)`,
            transition: lid.rot === 0 && lid.ty === 0
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
          {/* Brass cap */}
          <div
            className="absolute"
            style={{
              left: 0, right: 0, top: 0,
              height: 50,
              borderRadius: '6px 6px 0 0',
              background:
                'linear-gradient(180deg,#f4d28a 0%,#d4a657 22%,#a87a3d 50%,#7c5526 78%,#4f3416 100%)',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.45), 0 6px 12px rgba(0,0,0,0.5)',
            }}
          >
            {/* threads + grip ridges that show the rotation */}
            <div className="absolute inset-x-0" style={{ top: 8, height: 1.5, background: 'rgba(0,0,0,0.25)' }} />
            <div className="absolute inset-x-0" style={{ top: 18, height: 1.5, background: 'rgba(0,0,0,0.20)' }} />
            <div className="absolute inset-x-0" style={{ top: 28, height: 1.5, background: 'rgba(0,0,0,0.20)' }} />
            <div className="absolute inset-x-0" style={{ top: 38, height: 1.5, background: 'rgba(0,0,0,0.25)' }} />
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
          {/* Twist progress ring around the cap */}
          {interactive && twistProgress > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: -6,
                right: -6,
                top: -6,
                height: 70,
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

      {/* Thrown lid */}
      {lidGone && (
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

      <style>{`
        @keyframes noteFloat0 { 0%, 100% { translate: 0 0; } 50% { translate: 6px -10px; } }
        @keyframes noteFloat1 { 0%, 100% { translate: 0 0; } 50% { translate: -8px -14px; } }
        @keyframes noteFloat2 { 0%, 100% { translate: 0 0; } 50% { translate: 10px 8px; } }
        @keyframes noteFloat3 { 0%, 100% { translate: 0 0; } 50% { translate: -12px 6px; } }
      `}</style>
    </div>
  );
}
