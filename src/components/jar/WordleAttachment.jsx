import { useState } from 'react';

// Inline Wordle UI shown inside a note's lightbox.
// - Author sees the word + the recipient's guesses (and progress).
// - Recipient sees the empty grid and can submit guesses; each guess
//   updates note.wordle.guesses in Firestore live.
//
// Word length is determined by the author's chosen word (3-7 chars).
// Direction is auto-detected per-word (Hebrew → RTL, anything else → LTR).

const MAX_GUESSES = 6;
// If any char is in the Hebrew block (U+0590..U+05FF), treat the word as
// Hebrew → RTL. Otherwise default to LTR.
function detectDir(text) {
  if (!text) return 'ltr';
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0x0590 && code <= 0x05FF) return 'rtl';
  }
  return 'ltr';
}

const TILE_COLOR = {
  correct: '#52b788',
  present: '#f4a261',
  absent: '#1a3a2a',
  empty: 'transparent',
};

function checkGuess(guess, answer) {
  const len = answer.length;
  const result = Array(len).fill('absent');
  const ans = answer.split('');
  const gs = guess.split('');
  const used = Array(len).fill(false);
  for (let i = 0; i < len; i++) {
    if (gs[i] === ans[i]) {
      result[i] = 'correct';
      used[i] = true;
      gs[i] = null;
    }
  }
  for (let i = 0; i < len; i++) {
    if (gs[i] == null) continue;
    for (let j = 0; j < len; j++) {
      if (!used[j] && gs[i] === ans[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

export default function WordleAttachment({
  wordle,         // { word, guesses: [{word,result}], solved }
  isAuthor,       // viewer authored the note
  onUpdateGuesses,// (newGuesses, solved) => void
}) {
  const [input, setInput] = useState('');
  const word = wordle.word;
  const len = word.length;
  const guesses = wordle.guesses || [];
  const done = wordle.solved || guesses.length >= MAX_GUESSES;
  const wordDir = detectDir(word);

  async function submit() {
    if (isAuthor) return;
    const g = input.trim();
    if (g.length !== len) return;
    const result = checkGuess(g, word);
    const solved = result.every((r) => r === 'correct');
    const next = [...guesses, { word: g, result }];
    setInput('');
    await onUpdateGuesses(next, solved);
  }

  return (
    <div
      className="mt-5 p-4 rounded-xl"
      style={{
        background: 'rgba(13,31,22,0.55)',
        border: '1px solid rgba(82,183,136,0.35)',
        color: '#fffaf0',
      }}
    >
      <p className="text-center text-[10px] tracking-[0.3em] uppercase mb-2 text-muted">
        🟩 פתק wordle
      </p>

      {isAuthor ? (
        <p className="text-center text-sm font-body mb-3">
          המילה שלך: <span className="font-bold text-highlight" style={{ fontFamily: '"Courier Prime", monospace' }}>{word}</span>
        </p>
      ) : !done ? (
        <p className="text-center text-xs text-muted font-body italic mb-3">
          נסי לנחש את המילה ({len} אותיות)
        </p>
      ) : null}

      {/* Grid — direction follows the word's language */}
      <div className="flex flex-col gap-1 items-center mb-3">
        {Array.from({ length: MAX_GUESSES }).map((_, row) => {
          const guess = guesses[row];
          const isCurrent = !done && row === guesses.length;
          return (
            <div key={row} className="flex gap-1" dir={wordDir}>
              {Array.from({ length: len }).map((_, col) => {
                const status = guess?.result[col] || 'empty';
                let letter = guess?.word[col] || '';
                if (isCurrent && !isAuthor) letter = input[col] || '';
                return (
                  <div
                    key={col}
                    className="rounded font-bold flex items-center justify-center"
                    style={{
                      width: 32, height: 32,
                      fontFamily: '"Courier Prime", monospace',
                      fontSize: 16,
                      background: TILE_COLOR[status],
                      border: `2px solid ${status === 'empty' ? 'rgba(82,183,136,0.4)' : TILE_COLOR[status]}`,
                      color: '#fffaf0',
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Input — recipient only, not done */}
      {!isAuthor && !done && (
        <div className="flex gap-2 max-w-xs mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, len))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={`${len} ${wordDir === 'rtl' ? 'אותיות' : 'letters'}`}
            maxLength={len}
            dir={wordDir}
            className="flex-1 rounded-xl px-3 py-2 text-sm text-center font-mono focus:outline-none"
            style={{
              background: 'rgba(13,31,22,0.7)',
              border: '1px solid rgba(82,183,136,0.4)',
              color: '#fffaf0',
              fontFamily: '"Courier Prime", monospace',
            }}
          />
          <button
            onClick={submit}
            disabled={input.trim().length !== len}
            className="clay-primary px-3 py-2 text-xs font-semibold disabled:opacity-50"
          >
            נחש
          </button>
        </div>
      )}

      {/* Result line */}
      {done && (
        <p className="text-center text-sm font-body mt-1">
          {wordle.solved ? (
            <span className="text-highlight">✓ נוחש ב-{guesses.length} ניסיונות!</span>
          ) : (
            <span className="text-muted">המילה הייתה: <span className="text-highlight">{word}</span></span>
          )}
        </p>
      )}

      {isAuthor && !done && guesses.length > 0 && (
        <p className="text-center text-[10px] text-muted mt-1 italic">
          {guesses.length} ניסיונות עד כה
        </p>
      )}
    </div>
  );
}
