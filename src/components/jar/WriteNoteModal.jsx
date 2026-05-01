import { useState, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

const EMOJIS = ['💚','❤️','✨','🌸','🥰','😊','🌙','⭐','🎉','🫂','💫','🌿'];

export default function WriteNoteModal({ onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = storageRef(storage, `notes/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setImageUrl(url);
    } catch {
      alert('שגיאה בהעלאת התמונה');
    }
    setUploading(false);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setSaving(true);
    await onSubmit({ text: text.trim(), emoji, imageUrl });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
         style={{ background: 'rgba(13,31,22,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md p-6 flex flex-col gap-4 clay rounded-t-[28px] sm:rounded-[28px]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-text-primary">כתוב פתק 💚</h2>
          <button onClick={onClose} className="text-muted hover:text-highlight text-xl">✕</button>
        </div>

        {/* Emoji picker */}
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(emoji === e ? '' : e)}
              className={`text-2xl p-1 rounded-lg transition-all ${
                emoji === e ? 'bg-highlight/20 scale-110' : 'hover:bg-accent/40'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Text */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="כתוב משהו מהלב..."
          rows={4}
          className="w-full rounded-xl p-3 text-text-primary font-body text-sm resize-none
                     placeholder-muted/50 focus:outline-none focus:ring-1 focus:ring-highlight"
          style={{ background: 'var(--bg)', border: '1px solid var(--accent)' }}
          dir="rtl"
        />

        {/* Image */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm text-muted hover:text-highlight transition-colors font-body flex items-center gap-1"
          >
            📷 {uploading ? 'מעלה...' : imageUrl ? 'תמונה נבחרה ✓' : 'הוסף תמונה'}
          </button>
          {imageUrl && (
            <button onClick={() => setImageUrl('')} className="text-xs text-red-400 hover:text-red-300">
              הסר
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || saving}
          className="clay-primary w-full py-3.5 font-body font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'שומר...' : 'שלח 💚'}
        </button>
      </div>
    </div>
  );
}
