import { useEffect, useRef, useState } from 'react';
import Jar from './Jar';

// Bottom-anchored "drawer" version of the jar. Closed: only the brass lid
// shows at the bottom edge of the screen. Drag up or tap → slides up to
// reveal the full jar + write/pull actions.

const PEEK = 110;        // px of sheet visible when closed
const SHEET_HEIGHT = 580; // total sheet height when open
const THRESHOLD = 40;    // drag distance to commit open/close

export default function JarSheet({ unpulled, onPull, onWrite, onHistory }) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(null); // null when not dragging
  const startYRef = useRef(null);

  // Close on Esc when open
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function onPointerDown(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startYRef.current = e.clientY;
    setDragY(0);
  }
  function onPointerMove(e) {
    if (startYRef.current === null) return;
    setDragY(e.clientY - startYRef.current);
  }
  function onPointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (startYRef.current === null) return;
    const dy = (e.clientY - startYRef.current);
    startYRef.current = null;
    setDragY(null);

    if (!open && dy < -THRESHOLD) setOpen(true);
    else if (open && dy > THRESHOLD) setOpen(false);
    else if (!open && Math.abs(dy) < 6) {
      // Tap on the lid → open
      setOpen(true);
    }
  }

  // Compute translate
  const baseClosed = SHEET_HEIGHT - PEEK;
  let translate = open ? 0 : baseClosed;
  if (dragY !== null) {
    translate = Math.max(0, Math.min(baseClosed, translate + dragY));
  }

  return (
    <>
      {/* Backdrop */}
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

      {/* Sheet */}
      <section
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center select-none"
        style={{
          height: SHEET_HEIGHT,
          transform: `translateY(${translate}px)`,
          transition: dragY !== null
            ? 'none'
            : 'transform 480ms cubic-bezier(.34,1.4,.5,1)',
          willChange: 'transform',
          touchAction: 'none',
          // Wooden shelf as the sheet's background
          background:
            'linear-gradient(180deg,' +
            'rgba(13,31,22,0.0) 0%,' +
            'rgba(13,31,22,0.6) 14%,' +
            '#1a3a2a 22%,' +
            '#162e22 100%)',
          boxShadow: open ? '0 -20px 50px -10px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {/* Drag handle area + hint */}
        <div
          className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Pill */}
          <div
            className="w-12 h-1.5 rounded-full"
            style={{
              background: 'rgba(216,243,220,0.4)',
              boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
            }}
          />
          {!open && (
            <p className="text-muted text-[11px] font-body italic mt-2 tracking-wider animate-pulse">
              ↑ משוך לפתיחת הצנצנת ↑
            </p>
          )}
        </div>

        {/* Wood shelf line */}
        <div
          className="w-full h-2"
          style={{
            background: 'linear-gradient(180deg,#5a3a1a 0%,#3a2510 50%,#1f1408 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        />

        {/* Jar + actions */}
        <div className="flex-1 flex flex-col items-center justify-center pt-6 pb-8 gap-4 w-full">
          <Jar
            unpulled={unpulled}
            onPull={onPull}
            onWrite={onWrite}
            onHistory={onHistory}
          />

          {/* Add-note prompt when fully open */}
          {open && (
            <button
              onClick={onWrite}
              className="clay-primary mt-2 px-7 py-3.5 font-body font-semibold text-base animate-fadeInUp"
            >
              ✦ כתוב פתק חדש
            </button>
          )}
        </div>

        {/* Close button (only when open) */}
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="clay-soft absolute top-3 right-4 w-9 h-9 flex items-center justify-center text-muted text-sm"
            aria-label="סגור"
          >
            ✕
          </button>
        )}
      </section>
    </>
  );
}
