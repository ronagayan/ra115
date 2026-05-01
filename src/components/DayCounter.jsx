import { useMemo } from 'react';
import { ANNIVERSARY_DATE } from '../config';

export default function DayCounter() {
  const days = useMemo(() => {
    const now = new Date();
    const diff = now - ANNIVERSARY_DATE;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, []);

  return (
    <div className="flex items-center justify-center py-6">
      <span
        className="text-highlight select-none"
        style={{
          fontFamily: '"Courier Prime", monospace',
          fontSize: 'clamp(5rem, 20vw, 9rem)',
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {days}
      </span>
    </div>
  );
}
