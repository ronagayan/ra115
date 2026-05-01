import { useState } from 'react';

const CORRECT_CODE = '1105';

export default function SafeDial({ onSuccess }) {
  const [digits, setDigits] = useState('');
  const [status, setStatus] = useState('idle'); // idle | error | success

  function handleDigit(d) {
    if (status === 'success') return;
    const next = (digits + d).slice(-4);
    setDigits(next);
    setStatus('idle');

    if (next.length === 4) {
      if (next === CORRECT_CODE) {
        setStatus('success');
        setTimeout(onSuccess, 1200);
      } else {
        setStatus('error');
        setTimeout(() => {
          setDigits('');
          setStatus('idle');
        }, 700);
      }
    }
  }

  function handleDelete() {
    setDigits((d) => d.slice(0, -1));
    setStatus('idle');
  }

  const display = digits.padEnd(4, '·');

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      {/* Display — clay-well */}
      <div
        className={`clay-well w-full p-4 font-mono text-4xl tracking-[0.5em] text-center transition-all duration-200 ${
          status === 'error'
            ? 'animate-shake'
            : status === 'success'
            ? 'animate-pulseGreen'
            : ''
        }`}
        style={{
          fontFamily: '"Courier Prime", monospace',
          color:
            status === 'error'
              ? '#ff8a8a'
              : status === 'success'
              ? 'var(--highlight)'
              : 'var(--text)',
          textShadow:
            status === 'success'
              ? '0 0 12px rgba(82,183,136,0.6)'
              : '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        {display}
      </div>

      {status === 'success' && (
        <p className="text-highlight text-sm font-body animate-fadeInUp">
          ✓ נפתח! כניסה...
        </p>
      )}

      {/* Numpad — clay buttons */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {['1','2','3','4','5','6','7','8','9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="clay py-4 text-xl text-text-primary"
            style={{ fontFamily: '"Courier Prime", monospace' }}
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="clay py-4 text-xl text-text-primary"
          style={{ fontFamily: '"Courier Prime", monospace' }}
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="clay py-4 text-lg text-muted"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
