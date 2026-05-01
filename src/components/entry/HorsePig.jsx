import { useRef, useState } from 'react';

// Drag the picture rightward → it tumbles off the screen, revealing the
// rope that's been waiting behind it.

const COMMIT_THRESHOLD = 130;     // px of horizontal drag to commit the throw
const FRAME_W = 240;
const FRAME_H = 280;

export default function HorsePig({ onSwipe }) {
  const [dx, setDx] = useState(0);
  const [thrown, setThrown] = useState(false);
  const startXRef = useRef(null);

  function handlePointerDown(e) {
    if (thrown) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startXRef.current = e.clientX;
  }
  function handlePointerMove(e) {
    if (startXRef.current === null) return;
    const x = e.clientX - startXRef.current;
    if (x > 0) setDx(x);
  }
  function handlePointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (startXRef.current === null) return;
    const x = e.clientX - startXRef.current;
    startXRef.current = null;
    if (x >= COMMIT_THRESHOLD) {
      setThrown(true);
      // The CSS transition below carries the frame off-screen; advance the
      // stage in the parent once it's fully gone.
      setTimeout(() => onSwipe?.(), 700);
    } else {
      setDx(0);
    }
  }

  // Live tilt while dragging — proportional, capped at 35° before commit.
  const liveTilt = Math.min(dx / COMMIT_THRESHOLD, 1) * 35;
  const liveTransform = `translate(${dx}px, 0) rotate(${liveTilt}deg)`;
  // After commit: fly hard right + tumble + fall.
  const thrownTransform = `translate(${typeof window !== 'undefined' ? window.innerWidth + 200 : 1000}px, 250px) rotate(720deg)`;

  return (
    <div
      className="relative select-none"
      style={{ width: FRAME_W, height: FRAME_H + 40 }}
    >
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: '50% 50%',
          transform: thrown ? thrownTransform : liveTransform,
          transition: thrown
            ? 'transform 700ms cubic-bezier(.55,.05,.6,.95), opacity 600ms ease 200ms'
            : startXRef.current === null
              ? 'transform 350ms cubic-bezier(.34,1.56,.64,1)'
              : 'none',
          opacity: thrown ? 0 : 1,
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

      {!thrown && (
        <p
          className="absolute inset-x-0 text-center text-muted text-xs font-body italic animate-pulse"
          style={{ bottom: 0 }}
        >
          ← החלק את התמונה ימינה →
        </p>
      )}
    </div>
  );
}
