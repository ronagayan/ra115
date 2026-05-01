import { useEffect, useRef, useState } from 'react';
import imageToBase64 from '../../lib/imageToBase64';

const EMOJIS = ['💚','❤️','✨','🌸','🥰','😊','🌙','⭐','🎉','🫂','💫','🌿'];

export default function WriteNoteModal({ onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await imageToBase64(file);
      setImageUrl(dataUrl);
    } catch (err) {
      console.error('image processing failed', err);
      alert('שגיאה בעיבוד התמונה');
    }
    setUploading(false);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ text: text.trim(), emoji, imageUrl });
      onClose();
    } catch (err) {
      console.error('save failed', err);
      alert('שגיאה בשליחת הפתק. נסי שוב.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      style={{ background: 'rgba(13,31,22,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md p-6 flex flex-col gap-4 clay rounded-t-[28px] sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Image preview */}
        {imageUrl && (
          <div className="relative">
            <img
              src={imageUrl}
              alt=""
              className="w-full max-h-48 object-cover rounded-xl"
              style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.35)' }}
            />
            <button
              onClick={() => setImageUrl('')}
              className="absolute top-2 left-2 w-8 h-8 rounded-full bg-bg/80 text-text-primary text-sm flex items-center justify-center"
              aria-label="הסר תמונה"
            >
              ✕
            </button>
          </div>
        )}

        {/* Image picker */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="clay-soft px-3 py-2 text-sm text-muted font-body flex items-center gap-1 disabled:opacity-50"
          >
            📷 {uploading ? 'מעבד...' : imageUrl ? 'החלף תמונה' : 'הוסף תמונה'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImage}
          />
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
