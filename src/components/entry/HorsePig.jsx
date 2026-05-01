import { useState, useRef } from 'react';

export default function HorsePig({ onSwipe }) {
  const [offsetX, setOffsetX] = useState(0);
  const [opened, setOpened] = useState(false);
  const [lid, setLid] = useState(false);
  const startXRef = useRef(null);
  const offsetRef = useRef(0);
  const pointerIdRef = useRef(null);

  function finalize() {
    if (offsetRef.current > 60) {
      setOpened(true);
      setLid(true);
      setTimeout(onSwipe, 700);
    } else {
      setOffsetX(0);
      offsetRef.current = 0;
    }
    startXRef.current = null;
    pointerIdRef.current = null;
  }

  function handlePointerDown(e) {
    if (opened) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
  }

  function handlePointerMove(e) {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    const clamped = Math.max(0, Math.min(dx, 120));
    offsetRef.current = clamped;
    setOffsetX(clamped);
  }

  function handlePointerUp(e) {
    if (startXRef.current === null) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    finalize();
  }

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Box — drag handlers on the entire visible area */}
      <div
        className="relative w-64 h-64 cursor-grab active:cursor-grabbing"
        style={{ perspective: '800px', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Lid */}
        <div
          className="absolute inset-x-0 top-0 h-32 rounded-t-2xl z-20 transition-all duration-700 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--accent) 100%)',
            border: '2px solid var(--highlight)',
            transformOrigin: 'top center',
            transform: lid ? 'rotateX(-120deg)' : 'rotateX(0deg)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="flex items-center justify-center h-full text-muted text-sm font-body">
            החלק ימינה לפתוח 👉
          </div>
        </div>

        {/* Box body */}
        <div
          className="absolute inset-x-0 bottom-0 top-28 rounded-b-2xl z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, var(--accent) 0%, var(--surface) 100%)',
            border: '2px solid var(--highlight)',
            borderTop: 'none',
          }}
        >
          {/* Horse-Pig image inside box (decorative, no longer captures events) */}
          <div className="flex items-center justify-center h-full p-4">
            <img
              src="/horse-pig.png"
              alt="horse-pig"
              className="max-h-28 max-w-full object-contain rounded-xl transition-transform duration-150"
              style={{
                transform: `translateX(${offsetX}px)`,
                opacity: opened ? 0 : 1,
                minWidth: '4rem',
                minHeight: '4rem',
                background: 'rgba(82,183,136,0.15)',
              }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {!opened && (
        <p className="text-muted text-sm font-body animate-pulse">← החלק ימינה →</p>
      )}
    </div>
  );
}
