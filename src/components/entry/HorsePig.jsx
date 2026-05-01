import { useEffect, useRef, useState } from 'react';

// Picture frame whose BOTTOM-RIGHT corner is its hanging point.
// At rest the frame is upright (covering the wall behind it).
// Drag right → frame rotates COUNTER-CLOCKWISE around its BR corner so the
// rest of the frame swings down-and-to-the-left. Past commit, it dangles
// at -90° with a gentle pendulum sway and BR stays at the top of the picture.

const COMMIT_DEG = -90;        // CCW so BR ends up at the top
const COMMIT_THRESHOLD = 130;  // px of horizontal drag to commit

const FRAME_W = 240;
const FRAME_H = 280;

export default function HorsePig({ onSwipe, hanging: hangingProp = false }) {
  const [rot, setRot] = useState(0);
  const [committed, setCommitted] = useState(hangingProp);
  const startXRef = useRef(null);

  useEffect(() => {
    if (hangingProp && !committed) {
      setCommitted(true);
      setRot(COMMIT_DEG);
    }
  }, [hangingProp, committed]);

  function handlePointerDown(e) {
    if (committed) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startXRef.current = e.clientX;
  }
  function handlePointerMove(e) {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    if (dx > 0) {
      const t = Math.min(dx / COMMIT_THRESHOLD, 1);
      setRot(t * COMMIT_DEG);
    } else {
      setRot(0);
    }
  }
  function handlePointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    startXRef.current = null;
    if (dx >= COMMIT_THRESHOLD) {
      setCommitted(true);
      setRot(COMMIT_DEG);
      setTimeout(() => onSwipe?.(), 600);
    } else {
      setRot(0);
    }
  }

  return (
    <div
      className="relative select-none"
      // Reserves space for both poses:
      //  - rest: frame width × height (240 × 280)
      //  - dangling (after -90° around BR): height × width (280 × 240)
      // BR is anchored at (right: 0, top: 0) so:
      //  - rest pose extends UP-LEFT from BR but with top: 0 it's clamped
      //    so the frame visually sits below the BR anchor — that's fine
      //    because we want BR at the TOP of the picture both before and
      //    after the swing.
      //  - dangling pose extends DOWN-LEFT from BR.
      // Container: width = max(W,H), height = W + H.
      style={{ width: FRAME_H, height: FRAME_W + FRAME_H }}
    >
      <div
        className="absolute cursor-grab active:cursor-grabbing"
        style={{
          right: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: '100% 100%',
          transform: committed ? '' : `rotate(${rot}deg)`,
          transition:
            startXRef.current === null
              ? committed
                ? 'transform 700ms cubic-bezier(.34,1.4,.5,1)'
                : 'transform 350ms cubic-bezier(.34,1.56,.64,1)'
              : 'none',
          animation: committed ? 'pigSway 4.5s ease-in-out infinite 0.7s' : 'none',
          touchAction: 'none',
          filter: 'drop-shadow(0 14px 18px rgba(0,0,0,0.55))',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Outer wood frame */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(92deg, #4a2a10 0px, #3a1f0a 4px, #5a3416 9px, #3a1f0a 14px, #4a2a10 18px)',
            borderRadius: 4,
            boxShadow:
              'inset 4px 4px 6px rgba(255,210,160,0.18),' +
              'inset -4px -4px 8px rgba(0,0,0,0.55),' +
              'inset 0 0 0 2px rgba(0,0,0,0.4)',
          }}
        />
        <div
          className="absolute"
          style={{
            inset: 18,
            borderRadius: 2,
            background: 'linear-gradient(135deg,#2a1608 0%,#3a1f0a 60%,#5a3416 100%)',
            boxShadow:
              'inset 3px 3px 6px rgba(0,0,0,0.6),' +
              'inset -2px -2px 4px rgba(255,210,160,0.15)',
          }}
        />
        <div
          className="absolute"
          style={{
            inset: 26,
            background: 'linear-gradient(135deg,#f4d28a 0%,#a07c4a 50%,#5a3a1a 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.4),' +
              'inset 0 -1px 0 rgba(0,0,0,0.4)',
          }}
        />
        <div
          className="absolute paper-grain"
          style={{
            inset: 30,
            background: 'linear-gradient(168deg,#fbf3da 0%,#f0e3b8 50%,#e7d8a4 100%)',
            boxShadow: 'inset 0 0 12px rgba(120,90,40,0.25)',
          }}
        >
          <div
            className="absolute flex items-center justify-center"
            style={{
              inset: 10,
              background: '#fffaf0',
              boxShadow: 'inset 0 0 18px rgba(120,90,40,0.22)',
              overflow: 'hidden',
            }}
          >
            <img
              src="/horse-pig.png?v=3"
              alt="pig"
              draggable={false}
              className="w-full h-full"
              style={{ objectFit: 'contain', filter: 'contrast(1.15) brightness(0.92)' }}
            />
          </div>
        </div>
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
      {!committed && (
        <p
          className="absolute inset-x-0 text-center text-muted text-xs font-body italic animate-pulse"
          style={{ bottom: 0 }}
        >
          ← החלק את התמונה ימינה →
        </p>
      )}

      {/* Pendulum sway. The translate keeps the pig centered visually around
          the rest pose (-90° around BR). */}
      <style>{`
        @keyframes pigSway {
          0%, 100% { transform: rotate(${COMMIT_DEG - 6}deg); }
          50%      { transform: rotate(${COMMIT_DEG + 6}deg); }
        }
      `}</style>
    </div>
  );
}
