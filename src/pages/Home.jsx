import { useState } from 'react';
import { Link } from 'react-router-dom';
import JarSheet from '../components/jar/JarSheet';
import WriteNoteModal from '../components/jar/WriteNoteModal';
import NoteHistory from '../components/jar/NoteHistory';
import CorkBoard from '../components/gallery/CorkBoard';
import DayCounter from '../components/DayCounter';
import useNotes from '../hooks/useNotes';
import useNotifications from '../hooks/useNotifications';
import notifyOther from '../lib/notify';

export default function Home({ user }) {
  const {
    unpulled, history, myNotes,
    pullNote, addNote, updateNote, updateIncomingNote, deleteNote,
  } = useNotes(user);

  const [writeModal, setWriteModal] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const { permission, request: requestPushPermission } = useNotifications(user);

  function openWrite() {
    setWriteModal({ mode: 'new' });
  }
  function openEdit(note) {
    setWriteModal({ mode: 'edit', note });
  }
  function closeModal() {
    setWriteModal(null);
  }

  async function handleSubmit(payload) {
    if (writeModal?.mode === 'edit') {
      await updateNote(writeModal.note.id, payload);
    } else {
      await addNote(payload);
    }
  }

  // Wordle updates: author updates their own outgoing note, recipient
  // updates the INCOMING note (other person's outgoing → my incoming).
  async function handleUpdateWordle(note, newGuesses, solved) {
    const newWordle = { ...note.wordle, guesses: newGuesses, solved };
    if (note._mine || note.author === user) {
      await updateNote(note.id, { wordle: newWordle });
    } else {
      await updateIncomingNote(note.id, { wordle: newWordle });
      // Tell the author someone just guessed
      notifyOther(user, {
        title: '🟩 ניחוש wordle',
        body: solved ? `נוחש ב-${newGuesses.length} ניסיונות!` : `${newGuesses.length} ניסיונות עד כה`,
      });
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-x-hidden"
      dir="rtl"
      style={{
        background:
          'radial-gradient(circle at 20% 0%, rgba(82,183,136,0.10) 0%, transparent 55%),' +
          'radial-gradient(circle at 90% 70%, rgba(45,106,79,0.18) 0%, transparent 50%),' +
          'linear-gradient(180deg, #0d1f16 0%, #1a3a2a 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(rgba(216,243,220,0.6) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 pb-[26vh]">
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

        {/* Push-notifications opt-in banner */}
        {permission === 'default' && (
          <button
            onClick={requestPushPermission}
            className="mx-5 mt-2 mb-1 clay-soft px-4 py-2 text-xs font-body text-muted text-center"
          >
            🔔 הפעלי התראות כדי לדעת מתי יש פתק חדש או שתורך במשחק
          </button>
        )}

        <section className="px-5 animate-fadeInUp">
          <DayCounter />
          <p className="text-center text-muted text-[10px] tracking-[0.4em] uppercase -mt-2 font-body">
            ימים יחד
          </p>
        </section>

        <section
          className="mt-5 mb-2 animate-fadeInUp stagger-1 opacity-0-init"
          style={{ animationFillMode: 'forwards' }}
        >
          <h2 className="px-5 mb-2 font-display text-text-primary text-sm tracking-[0.25em] uppercase opacity-70">
            הלוח שלנו
          </h2>
          <CorkBoard
            history={history}
            myNotes={myNotes}
            user={user}
            onEditNote={openEdit}
            onDeleteNote={(note) => deleteNote(note.id)}
            onUpdateWordle={handleUpdateWordle}
          />
        </section>

        <div className="flex-1" />

        <footer className="px-5 pb-3 text-center">
          <p className="text-muted/60 text-[10px] font-body tracking-[0.3em] uppercase">
            🌿 שתי שנים יחד 🌿
          </p>
        </footer>
      </div>

      <JarSheet
        user={user}
        unpulled={unpulled}
        onPull={pullNote}
        onWrite={openWrite}
        onUpdateWordle={handleUpdateWordle}
      />

      {writeModal && (
        <WriteNoteModal
          onClose={closeModal}
          onSubmit={handleSubmit}
          initial={writeModal.mode === 'edit' ? writeModal.note : null}
        />
      )}
      {showHistory && (
        <NoteHistory notes={history} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
