import { useMemo, useRef, useState } from 'react';
import { ANNIVERSARY_DATE } from '../config';

const TAPS_REQUIRED = 5;
const TAP_WINDOW_MS = 1500;

export default function DayCounter({ onSecretTap }) {
  const days = useMemo(() => {
    const now = new Date();
    const diff = now - ANNIVERSARY_DATE;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, []);

  const tapsRef = useRef([]);
  const [pulse, setPulse] = useState(false);

  function handleTap() {
    if (!onSecretTap) return;
    const now = Date.now();
    tapsRef.current = [
      ...tapsRef.current.filter((t) => now - t < TAP_WINDOW_MS),
      now,
    ];
    if (tapsRef.current.length >= TAPS_REQUIRED) {
      tapsRef.current = [];
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
      onSecretTap();
    }
  }

  return (
    <div
      className="flex items-center justify-center py-6 cursor-pointer"
      onClick={handleTap}
      role="button"
      aria-label="ספירת ימים"
    >
      <span
        className={`text-highlight select-none transition-transform ${pulse ? 'scale-110' : ''}`}
        style={{
          fontFamily: '"Courier Prime", monospace',
          fontSize: 'clamp(5rem, 20vw, 9rem)',
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          textShadow: pulse ? '0 0 30px rgba(82,183,136,0.8)' : 'none',
        }}
      >
        {days}
      </span>
    </div>
  );
}
