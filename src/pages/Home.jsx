import { useState } from 'react';
import { Link } from 'react-router-dom';
import Jar from '../components/jar/Jar';
import WriteNoteModal from '../components/jar/WriteNoteModal';
import NoteHistory from '../components/jar/NoteHistory';
import CorkBoard from '../components/gallery/CorkBoard';
import DayCounter from '../components/DayCounter';
import useNotes from '../hooks/useNotes';
import useNotifications from '../hooks/useNotifications';

export default function Home({ user }) {
  const { unpulled, history, pullRandomNote, addNote } = useNotes(user);
  const [showWrite, setShowWrite] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useNotifications(user);

  return (
    <div
      className="min-h-dvh flex flex-col relative"
      dir="rtl"
      style={{
        background:
          'radial-gradient(circle at 20% 0%, rgba(82,183,136,0.10) 0%, transparent 55%),' +
          'radial-gradient(circle at 90% 70%, rgba(45,106,79,0.18) 0%, transparent 50%),' +
          'linear-gradient(180deg, #0d1f16 0%, #1a3a2a 100%)',
      }}
    >
      {/* Subtle paper grain over the whole page */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(rgba(216,243,220,0.6) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-6 pb-2">
          <div>
            <h1 className="font-display text-2xl text-text-primary leading-none">💚</h1>
            <p className="text-muted text-[10px] font-body mt-1 tracking-[0.2em] uppercase">
              {user === 'her' ? 'amit' : 'mine'}
            </p>
          </div>
          <Link
            to={`/${user}/games`}
            className="clay-soft px-4 py-2 text-sm font-body text-text-primary"
          >
            🎮 משחקים
          </Link>
        </header>

        {/* Day counter */}
        <section className="px-5 animate-fadeInUp">
          <DayCounter />
          <p className="text-center text-muted text-[10px] tracking-[0.4em] uppercase -mt-2 font-body">
            ימים יחד
          </p>
        </section>

        {/* Cork board — photos + history of pulled notes */}
        <section
          className="mt-5 mb-2 animate-fadeInUp stagger-1 opacity-0-init"
          style={{ animationFillMode: 'forwards' }}
        >
          <h2 className="px-5 mb-2 font-display text-text-primary text-sm tracking-[0.25em] uppercase opacity-70">
            הלוח שלנו
          </h2>
          <CorkBoard history={history} />
        </section>

        {/* Jar */}
        <section
          className="flex-1 flex flex-col items-center justify-center py-10 px-5
                     animate-fadeInUp stagger-3 opacity-0-init"
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="relative w-full max-w-sm flex flex-col items-center">
            <Jar
              unpulled={unpulled}
              onPull={pullRandomNote}
              onWrite={() => setShowWrite(true)}
              onHistory={() => setShowHistory(true)}
            />
            <div
              className="mt-2 w-72 h-2 rounded-sm"
              style={{
                background: 'linear-gradient(180deg,#5a3a1a 0%,#3a2510 50%,#1f1408 100%)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.5)',
              }}
            />
            <div
              className="w-80 h-1 rounded-sm opacity-70"
              style={{ background: 'rgba(0,0,0,0.6)', filter: 'blur(2px)' }}
            />
          </div>
        </section>

        <footer className="px-5 pb-6 text-center">
          <p className="text-muted/60 text-[10px] font-body tracking-[0.3em] uppercase">
            🌿 שתי שנים יחד 🌿
          </p>
        </footer>
      </div>

      {showWrite && (
        <WriteNoteModal
          onClose={() => setShowWrite(false)}
          onSubmit={addNote}
        />
      )}
      {showHistory && (
        <NoteHistory notes={history} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
