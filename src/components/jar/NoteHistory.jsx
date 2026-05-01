export default function NoteHistory({ notes, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col"
         style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between p-4 border-b"
           style={{ borderColor: 'var(--accent)' }}>
        <h2 className="font-display text-xl text-text-primary">היסטוריית פתקים</h2>
        <button onClick={onClose} className="text-muted hover:text-highlight text-xl transition-colors">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {notes.length === 0 ? (
          <p className="text-muted text-center font-body mt-10">אין פתקים עדיין</p>
        ) : (
          notes.map((note, i) => (
            <div
              key={note.id}
              className="rounded-2xl p-4 animate-fadeInUp"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--accent)',
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              {note.emoji && <span className="text-xl mr-2">{note.emoji}</span>}
              {note.imageUrl && (
                <img src={note.imageUrl} alt="" className="w-full rounded-xl mb-2 object-cover max-h-32" />
              )}
              <p className="text-text-primary font-body text-sm leading-relaxed whitespace-pre-wrap">
                {note.text}
              </p>
              {note.createdAt && (
                <p className="text-muted text-xs mt-2 font-body">
                  {new Date(note.createdAt.seconds * 1000).toLocaleDateString('he-IL')}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
