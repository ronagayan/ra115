import { useEffect } from 'react';

export default function NoteCard({ note, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fadeInUp"
      style={{
        background: 'rgba(13,31,22,0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Hint */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-muted/70 text-[11px] font-body tracking-[0.3em] uppercase pointer-events-none">
        הקש מחוץ לפתק לסגירה
      </div>
      <div
        className="relative max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: 'rotate(-1.6deg)',
        }}
      >
        {/* Paper */}
        <div
          className="relative px-7 py-8 rounded-[3px]"
          style={{
            background:
              'linear-gradient(168deg,#fbf3da 0%,#f0e3b8 50%,#e7d8a4 100%)',
            color: '#3a2a14',
            boxShadow:
              '0 30px 50px -12px rgba(0,0,0,0.55), 0 8px 14px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(120,90,40,0.2)',
            backgroundImage:
              'radial-gradient(rgba(120,90,40,0.05) 1px, transparent 1px), linear-gradient(168deg,#fbf3da 0%,#f0e3b8 50%,#e7d8a4 100%)',
            backgroundSize: '4px 4px, 100% 100%',
          }}
        >
          {/* Tape strips */}
          <div
            className="absolute -top-3 left-6 w-16 h-5 rotate-[-6deg] pointer-events-none"
            style={{
              background: 'rgba(216,243,220,0.35)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            className="absolute -top-3 right-6 w-16 h-5 rotate-[5deg] pointer-events-none"
            style={{
              background: 'rgba(216,243,220,0.35)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {note.emoji && (
            <div className="text-4xl text-center mb-3" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
              {note.emoji}
            </div>
          )}
          {note.imageUrl && (
            <img
              src={note.imageUrl}
              alt=""
              className="w-full rounded-sm mb-4 object-cover max-h-56"
              style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.35)' }}
            />
          )}
          <p
            className="text-center whitespace-pre-wrap leading-relaxed"
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.15rem',
              fontStyle: 'italic',
              color: '#3a2a14',
            }}
            dir="rtl"
          >
            {note.text}
          </p>

          <div className="mt-5 text-center">
            <span
              className="inline-block w-10 h-px"
              style={{ background: 'rgba(58,42,20,0.4)' }}
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute -top-3 -left-3 w-9 h-9 rounded-full flex items-center justify-center text-bg text-sm shadow-lg transition-transform hover:scale-110"
          style={{ background: 'var(--highlight)' }}
          aria-label="סגור"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
