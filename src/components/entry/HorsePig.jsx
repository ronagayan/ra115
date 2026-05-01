import { useRef, useState } from 'react';

// Picture-frame component shown FIRST in the entry flow.
// User drags rightward on the framed picture — it rotates clockwise tracking
// the drag. Past threshold, it completes a full spin, fades out, and triggers
// onSwipe so the rope-pull step takes over.

const PULL_THRESHOLD = 120; // px of horizontal drag to commit
const FULL_SPIN = 360;      // rotation at threshold

export default function HorsePig({ onSwipe }) {
  const [rot, setRot] = useState(0);
  const [opened, setOpened] = useState(false);
  const startXRef = useRef(null);
  const lastXRef = useRef(0);

  function handlePointerDown(e) {
    if (opened) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
  }

  function handlePointerMove(e) {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    lastXRef.current = e.clientX;
    if (dx > 0) {
      const t = Math.min(dx / PULL_THRESHOLD, 1);
      setRot(t * FULL_SPIN);
    } else {
      setRot(0);
    }
  }

  function handlePointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (startXRef.current === null) return;
    const dx = lastXRef.current - startXRef.current;
    startXRef.current = null;

    if (dx >= PULL_THRESHOLD) {
      // Commit: complete the spin and fly off
      setOpened(true);
      setRot(720);
      setTimeout(onSwipe, 800);
    } else {
      // Snap back
      setRot(0);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Hanging wire — twine going up to a nail */}
      <div className="relative" style={{ height: 56, width: 220 }}>
        {/* Nail */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 0,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #f0d28a, #a07c4a 65%, #5a3a1a 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
        {/* Twine — V-shape from nail to frame corners */}
        <svg
          width="220"
          height="56"
          viewBox="0 0 220 56"
          className="absolute inset-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="twine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a07c4a" />
              <stop offset="100%" stopColor="#5a3a1a" />
            </linearGradient>
          </defs>
          <path
            d="M 110 6 Q 60 30 30 52"
            fill="none"
            stroke="url(#twine)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 110 6 Q 160 30 190 52"
            fill="none"
            stroke="url(#twine)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Wood-framed picture — the part that rotates */}
      <div
        className="relative cursor-grab active:cursor-grabbing"
        style={{
          width: 240,
          height: 280,
          touchAction: 'none',
          transform: `rotate(${rot}deg) ${opened ? 'translate(180px, 80px) scale(0.6)' : ''}`,
          transition: opened
            ? 'transform 800ms cubic-bezier(.55,.05,.6,.95), opacity 700ms ease 200ms'
            : startXRef.current === null
            ? 'transform 350ms cubic-bezier(.34,1.56,.64,1)'
            : 'none',
          opacity: opened ? 0 : 1,
          transformOrigin: 'center',
          filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.55))',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Outer dark wood frame — thick, with grain */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(92deg, #4a2a10 0px, #3a1f0a 4px, #5a3416 9px, #3a1f0a 14px, #4a2a10 18px)',
            borderRadius: '4px',
            boxShadow:
              'inset 4px 4px 6px rgba(255,210,160,0.18),' +
              'inset -4px -4px 8px rgba(0,0,0,0.55),' +
              'inset 0 0 0 2px rgba(0,0,0,0.4)',
          }}
        />
        {/* Bevel — inner darker ring */}
        <div
          className="absolute"
          style={{
            inset: 18,
            borderRadius: '2px',
            background: 'linear-gradient(135deg,#2a1608 0%,#3a1f0a 60%,#5a3416 100%)',
            boxShadow:
              'inset 3px 3px 6px rgba(0,0,0,0.6),' +
              'inset -2px -2px 4px rgba(255,210,160,0.15)',
          }}
        />
        {/* Thin gold accent line */}
        <div
          className="absolute"
          style={{
            inset: 26,
            background:
              'linear-gradient(135deg,#f4d28a 0%,#a07c4a 50%,#5a3a1a 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.4),' +
              'inset 0 -1px 0 rgba(0,0,0,0.4)',
          }}
        />
        {/* Cream mat / paper border */}
        <div
          className="absolute paper-grain"
          style={{
            inset: 30,
            background:
              'linear-gradient(168deg,#fbf3da 0%,#f0e3b8 50%,#e7d8a4 100%)',
            boxShadow: 'inset 0 0 12px rgba(120,90,40,0.25)',
          }}
        >
          {/* The drawing */}
          <div
            className="absolute"
            style={{
              inset: 14,
              background: '#fff',
              backgroundImage: 'url(/horse-pig.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              boxShadow: 'inset 0 0 18px rgba(120,90,40,0.18)',
            }}
          />
        </div>
        {/* Mitered-corner highlights on the wood frame */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background:
              'linear-gradient(135deg,rgba(255,210,160,0.18) 0%,transparent 6%, transparent 94%, rgba(0,0,0,0.45) 100%)',
            borderRadius: 4,
          }}
        />
      </div>

      {/* Hint */}
      {!opened && (
        <p className="text-muted text-xs font-body italic animate-pulse">
          ← החלק את התמונה ימינה →
        </p>
      )}
    </div>
  );
}
