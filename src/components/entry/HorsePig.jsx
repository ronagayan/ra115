import { useEffect, useRef, useState } from 'react';

// Pig in a wood-framed picture. Drag right → frame rotates around its
// BOTTOM-RIGHT corner (so it swings down-and-right like a painting that
// just got knocked off its hook). Past threshold → it commits and stays
// dangling at ~95° with a gentle pendulum sway.
//
// Props:
//   onSwipe   — called once when the rotation commits (parent reveals rope)
//   hanging   — when true, drag is disabled and the pig stays in its
//               final swung-out resting state (still sways)

const COMMIT_DEG = 90;
const COMMIT_THRESHOLD_PX = 130;

export default function HorsePig({ onSwipe, hanging: hangingProp = false }) {
  const [rot, setRot] = useState(0);
  const [committed, setCommitted] = useState(hangingProp);
  const startXRef = useRef(null);

  // Sync external hanging prop in case the parent forces the resting state.
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
      const t = Math.min(dx / COMMIT_THRESHOLD_PX, 1);
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

    if (dx >= COMMIT_THRESHOLD_PX) {
      setCommitted(true);
      setRot(COMMIT_DEG);
      // Let the swing settle visually, then let parent advance.
      setTimeout(() => onSwipe?.(), 700);
    } else {
      setRot(0); // snap back
    }
  }

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{
        // The container is wider so the rotated frame doesn't get clipped
        // and we leave room for the swing arc (frame swings to the right).
        width: 360,
        height: 340,
      }}
    >
      {/* Hanging hardware — small brass nail at top */}
      <div className="relative" style={{ height: 28, width: 220 }}>
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
        <svg width="220" height="28" viewBox="0 0 220 28" className="absolute inset-0 pointer-events-none">
          <defs>
            <linearGradient id="twine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a07c4a" />
              <stop offset="100%" stopColor="#5a3a1a" />
            </linearGradient>
          </defs>
          <path d="M 110 6 Q 60 18 30 26" fill="none" stroke="url(#twine)" strokeWidth="2" strokeLinecap="round" />
          <path d="M 110 6 Q 160 18 190 26" fill="none" stroke="url(#twine)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wrapper that scopes the swing transform to the bottom-right corner */}
      <div
        className="relative"
        style={{
          width: 240,
          height: 280,
          // Position the wrapper so its bottom-right corner is the pivot.
          // We anchor visually a bit left of center so the frame's start
          // position looks centered relative to the page.
          marginRight: 0,
        }}
      >
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{
            transformOrigin: '100% 100%', // bottom-right corner = pivot
            transform: `rotate(${rot}deg)`,
            transition:
              startXRef.current === null
                ? committed
                  ? 'transform 700ms cubic-bezier(.34,1.4,.5,1)'
                  : 'transform 350ms cubic-bezier(.34,1.56,.64,1)'
                : 'none',
            // Once committed, the pig sways gently around its rest pose.
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
                src="/horse-pig.png?v=2"
                alt="pig"
                draggable={false}
                className="w-full h-full"
                style={{
                  objectFit: 'contain',
                  filter: 'contrast(1.15) brightness(0.92)',
                }}
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
      </div>

      {!committed && (
        <p className="text-muted text-xs font-body italic animate-pulse mt-2">
          ← החלק את התמונה ימינה →
        </p>
      )}

      {/* Sway keyframes — small pendulum swing around the rest pose */}
      <style>{`
        @keyframes pigSway {
          0%, 100% { transform: rotate(${COMMIT_DEG - 6}deg); }
          50%      { transform: rotate(${COMMIT_DEG + 6}deg); }
        }
      `}</style>
    </div>
  );
}
