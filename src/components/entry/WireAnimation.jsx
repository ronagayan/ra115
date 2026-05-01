import { useEffect, useRef, useState } from 'react';

// Physical hanging rope — Verlet integration with distance constraints.
// The user grabs the knob (last point) and the rope follows their finger
// like a real string under tension, complete with sag, recoil and inertia.

const W = 200;          // SVG viewBox width
const H = 320;          // SVG viewBox height
const ANCHOR = { x: W / 2, y: 4 };
const NUM_POINTS = 16;
const SEGMENT_LENGTH = 8.5;     // total natural length ≈ 128px
const GRAVITY = 0.55;
const DAMPING = 0.045;
const ITERATIONS = 8;
const PULL_TRIGGER_Y = 230;     // y-coord at which the pull "fires"

function buildPoints() {
  const pts = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const y = ANCHOR.y + i * SEGMENT_LENGTH;
    pts.push({
      x: ANCHOR.x,
      y,
      px: ANCHOR.x,
      py: y,
      fixed: i === 0,
    });
  }
  return pts;
}

export default function WireAnimation({ onPull }) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const knobRef = useRef(null);
  const knobShineRef = useRef(null);

  const pointsRef = useRef(buildPoints());
  const grabbedRef = useRef(false);
  const cursorRef = useRef({ x: ANCHOR.x, y: ANCHOR.y + (NUM_POINTS - 1) * SEGMENT_LENGTH });
  const doneRef = useRef(false);
  const pointerIdRef = useRef(null);

  const [done, setDone] = useState(false);
  const [grabbed, setGrabbed] = useState(false);

  // Convert client px → SVG coords
  function toSvg(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return { x: ANCHOR.x, y: ANCHOR.y };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  }

  // Animation loop
  useEffect(() => {
    let raf = 0;

    function step() {
      const pts = pointsRef.current;
      const lastIdx = pts.length - 1;

      // Verlet integration
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.fixed) continue;
        const vx = (p.x - p.px) * (1 - DAMPING);
        const vy = (p.y - p.py) * (1 - DAMPING);
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }

      // Constraint: anchor stays put, last point pinned to cursor while grabbed
      for (let iter = 0; iter < ITERATIONS; iter++) {
        // Re-pin grabbed endpoint each iteration
        if (grabbedRef.current && !doneRef.current) {
          pts[lastIdx].x = cursorRef.current.x;
          pts[lastIdx].y = cursorRef.current.y;
        }
        pts[0].x = ANCHOR.x;
        pts[0].y = ANCHOR.y;

        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          const diff = (dist - SEGMENT_LENGTH) / dist;
          const ox = dx * 0.5 * diff;
          const oy = dy * 0.5 * diff;

          const aMovable = !a.fixed;
          const bMovable = !(grabbedRef.current && i + 1 === lastIdx);
          if (aMovable && bMovable) {
            a.x += ox; a.y += oy;
            b.x -= ox; b.y -= oy;
          } else if (aMovable) {
            a.x += ox * 2; a.y += oy * 2;
          } else if (bMovable) {
            b.x -= ox * 2; b.y -= oy * 2;
          }
        }
      }

      // Trigger pull when the rope is yanked far enough
      const last = pts[lastIdx];
      if (!doneRef.current && last.y > PULL_TRIGGER_Y) {
        doneRef.current = true;
        setDone(true);
        grabbedRef.current = false;
        setTimeout(onPull, 500);
      }

      // Render via direct DOM mutation (no React re-render at 60fps)
      if (pathRef.current) {
        let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
        for (let i = 1; i < pts.length; i++) {
          // Smooth curve through midpoints
          const cur = pts[i];
          const prev = pts[i - 1];
          const mx = (prev.x + cur.x) / 2;
          const my = (prev.y + cur.y) / 2;
          d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
        }
        d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
        pathRef.current.setAttribute('d', d);
      }
      if (knobRef.current) {
        knobRef.current.setAttribute('transform', `translate(${last.x.toFixed(2)} ${last.y.toFixed(2)})`);
      }

      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onPull]);

  function handlePointerDown(e) {
    if (doneRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointerIdRef.current = e.pointerId;
    grabbedRef.current = true;
    setGrabbed(true);
    cursorRef.current = toSvg(e.clientX, e.clientY);
  }

  function handlePointerMove(e) {
    if (!grabbedRef.current) return;
    cursorRef.current = toSvg(e.clientX, e.clientY);
  }

  function handlePointerUp(e) {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    grabbedRef.current = false;
    setGrabbed(false);
  }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <p className="text-muted text-xs font-body">
        {done ? 'נפתח!' : grabbed ? 'משוך למטה...' : 'תפוס את הידית ומשוך'}
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="touch-none"
        style={{ overflow: 'visible', cursor: grabbed ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <linearGradient id="ropeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3a2510" />
            <stop offset="40%" stopColor="#7d5a2a" />
            <stop offset="60%" stopColor="#a07c4a" />
            <stop offset="100%" stopColor="#5a3a1a" />
          </linearGradient>
          <linearGradient id="ropeBraid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="50%" stopColor="rgba(255,220,160,0.5)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
          </linearGradient>

          <radialGradient id="knobGrad" cx="0.35" cy="0.35" r="0.7">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="20%" stopColor="#82d6a8" />
            <stop offset="65%" stopColor="#3e9a6e" />
            <stop offset="100%" stopColor="#1d4a32" />
          </radialGradient>

          <filter id="knobShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dy="3" />
            <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ceiling anchor — small brass plate at the top */}
        <g transform={`translate(${ANCHOR.x} ${ANCHOR.y})`}>
          <rect x="-14" y="-4" width="28" height="6" rx="1.5" fill="url(#ropeGrad)" />
          <rect x="-14" y="-4" width="28" height="2" fill="rgba(255,220,160,0.55)" />
          <circle cx="-9" cy="-1" r="1" fill="rgba(0,0,0,0.7)" />
          <circle cx="9" cy="-1" r="1" fill="rgba(0,0,0,0.7)" />
        </g>

        {/* Rope */}
        <path
          ref={pathRef}
          d=""
          fill="none"
          stroke="url(#ropeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Twisted braid highlight on top of the rope */}
        <path
          d=""
          fill="none"
          stroke="url(#ropeBraid)"
          strokeWidth="2.2"
          strokeDasharray="3 5"
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />

        {/* Knob — clay-styled wooden ball at the end */}
        <g ref={knobRef} filter="url(#knobShadow)">
          <circle r="14" fill="url(#knobGrad)" />
          <circle r="14" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" />
          <circle cx="-4" cy="-5" r="3.5" fill="rgba(255,255,255,0.35)" />
          <circle cx="-5.5" cy="-6.5" r="1.4" fill="rgba(255,255,255,0.7)" />
        </g>
      </svg>
    </div>
  );
}
