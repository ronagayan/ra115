import { useEffect, useRef, useState } from 'react';
import Jar from './Jar';

// Bottom-anchored jar. Closed: bottom 25vh of the viewport shows the
// TOP of the jar (lid + neck + upper body) rising out of the bottom of the
// screen. Drag up or tap → expands to a fully-visible open state with the
// full jar + a "write note" CTA.

const PEEK_VH = 25;            // % of viewport height when closed
const OPEN_HEIGHT_PX = 560;    // px when fully open (jar + CTA + padding)
const THRESHOLD = 40;          // drag distance to commit open/close

export default function JarSheet({ unpulled, onPull, onWrite, onHistory }) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(null);
  const startYRef = useRef(null);

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
    const dy = e.clientY - startYRef.current;
    startYRef.current = null;
    setDragY(null);

    if (!open && dy < -THRESHOLD) setOpen(true);
    else if (open && dy > THRESHOLD) setOpen(false);
    else if (!open && Math.abs(dy) < 6) setOpen(true); // tap to open
  }

  // Effective height. While dragging, smoothly interpolate.
  let style;
  if (open) {
    style = { height: `${OPEN_HEIGHT_PX}px` };
  } else {
    style = { height: `${PEEK_VH}vh` };
  }
  // While actively dragging, override with a live preview height
  if (dragY !== null) {
    const baseH = open ? OPEN_HEIGHT_PX : window.innerHeight * (PEEK_VH / 100);
    const liveH = Math.max(window.innerHeight * (PEEK_VH / 100),
                           Math.min(OPEN_HEIGHT_PX, baseH - dragY));
    style = { height: `${liveH}px` };
  }

  return (
    <>
      {/* Backdrop dim — only when fully open */}
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
          ...style,
          transition: dragY !== null
            ? 'none'
            : 'height 480ms cubic-bezier(.34,1.4,.5,1)',
          willChange: 'height',
          touchAction: 'none',
          background:
            'linear-gradient(180deg,' +
            'rgba(13,31,22,0) 0%,' +
            'rgba(13,31,22,0.55) 8%,' +
            '#1a3a2a 18%,' +
            '#0f2418 100%)',
          boxShadow: open ? '0 -25px 60px -10px rgba(0,0,0,0.7)' : '0 -10px 24px -8px rgba(0,0,0,0.5)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
      >
        {/* Drag handle row — fixed at top of sheet */}
        <div
          className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="w-12 h-1.5 rounded-full"
            style={{
              background: 'rgba(216,243,220,0.45)',
              boxShadow: '0 1px 0 rgba(0,0,0,0.4)',
            }}
          />
          {!open && (
            <p className="text-muted text-[11px] font-body italic mt-1.5 tracking-wider animate-pulse">
              ↑ משוך לפתיחה ↑
            </p>
          )}
        </div>

        {/* Wood shelf — visible at the top edge */}
        <div
          className="w-full h-2 flex-shrink-0"
          style={{
            background: 'linear-gradient(180deg,#5a3a1a 0%,#3a2510 50%,#1f1408 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        />

        {/* Jar — anchored to the top of the sheet so the LID is what shows
            during peek, and the body grows into view as the sheet opens. */}
        <div className="w-full flex flex-col items-center pt-4 flex-shrink-0">
          <Jar
            unpulled={unpulled}
            onPull={onPull}
            onWrite={onWrite}
            onHistory={onHistory}
          />
        </div>

        {/* CTA — only visible when fully open (it lives in the lower portion
            of the sheet that's hidden during peek). */}
        <div className="flex flex-col items-center gap-3 pt-4 pb-6 flex-shrink-0">
          <button
            onClick={onWrite}
            className="clay-primary px-7 py-3.5 font-body font-semibold text-base"
          >
            ✦ כתוב פתק חדש
          </button>
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
