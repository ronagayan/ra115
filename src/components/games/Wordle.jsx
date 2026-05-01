import { useState, useEffect } from 'react';
import useGame from '../../hooks/useGame';
import { getDailyWord } from '../../data/words';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

function checkGuess(guess, answer) {
  const result = Array(WORD_LENGTH).fill('absent');
  const answerArr = answer.split('');
  const guessArr = guess.split('');
  const used = Array(WORD_LENGTH).fill(false);

  // Correct positions first
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = 'correct';
      used[i] = true;
      guessArr[i] = null;
    }
  }

  // Present but wrong position
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === null) continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guessArr[i] === answerArr[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

const TILE_COLORS = {
  correct: '#52b788',
  present: '#f4a261',
  absent: '#1a3a2a',
  empty: 'transparent',
};

export default function Wordle({ user }) {
  const { state, update, reset } = useGame('wordle');
  const [input, setInput] = useState('');
  const dailyWord = getDailyWord();

  const myData = state?.[user] || { guesses: [], solved: false, done: false };
  const otherData = state?.[user === 'her' ? 'him' : 'her'] || { guesses: [], solved: false, done: false };
  const bothDone = myData.done && otherData.done;

  async function handleGuess() {
    const guess = input.trim();
    if (guess.length !== WORD_LENGTH || myData.done) return;

    const result = checkGuess(guess, dailyWord);
    const solved = result.every((r) => r === 'correct');
    const newGuesses = [...myData.guesses, { word: guess, result }];
    const done = solved || newGuesses.length >= MAX_GUESSES;

    await update({
      todayWord: dailyWord,
      [user]: { guesses: newGuesses, solved, done },
    });
    setInput('');
  }

  async function handleReset() {
    await reset({ todayWord: dailyWord, her: { guesses: [], solved: false, done: false }, him: { guesses: [], solved: false, done: false } });
  }

  const guesses = myData.guesses || [];

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-xs mx-auto">
      <h2 className="font-display text-xl text-text-primary">Wordle זוגי</h2>

      {/* Grid */}
      <div className="flex flex-col gap-1.5">
        {Array(MAX_GUESSES).fill(null).map((_, row) => {
          const guess = guesses[row];
          return (
            <div key={row} className="flex gap-1.5">
              {Array(WORD_LENGTH).fill(null).map((_, col) => {
                const letter = guess?.word[col] || (row === guesses.length && !myData.done ? input[col] : '');
                const status = guess?.result[col] || 'empty';
                return (
                  <div
                    key={col}
                    className="w-11 h-11 rounded-lg flex items-center justify-center font-mono text-lg font-bold border-2 transition-all"
                    style={{
                      background: TILE_COLORS[status],
                      borderColor: status === 'empty' ? 'var(--accent)' : TILE_COLORS[status],
                      color: 'var(--text)',
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

      {/* Status & Result */}
      {!myData.done ? (
        <>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, WORD_LENGTH))}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            placeholder={`הקלד ${WORD_LENGTH} אותיות...`}
            className="w-full rounded-xl p-3 text-center font-mono text-lg text-text-primary
                       placeholder-muted/50 focus:outline-none focus:ring-1 focus:ring-highlight"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}
            dir="rtl"
            maxLength={WORD_LENGTH}
          />
          <button
            onClick={handleGuess}
            disabled={input.trim().length !== WORD_LENGTH}
            className="clay-primary w-full py-3 font-body font-semibold disabled:opacity-50"
          >
            נחש
          </button>
        </>
      ) : (
        <div className="text-center font-body text-sm">
          {myData.solved
            ? <span className="text-highlight">✓ ניחשת ב-{myData.guesses.length} ניסיונות!</span>
            : <span className="text-muted">לא ניחשת. המילה: <strong className="text-text-primary">{dailyWord}</strong></span>
          }
          {bothDone && (
            <div className="mt-2 text-text-primary">
              <p>הצד השני: {otherData.solved ? `ניחש ב-${otherData.guesses.length} ניסיונות` : 'לא ניחש'}</p>
              {myData.solved && otherData.solved && (
                <p className="text-highlight mt-1 font-medium">
                  {myData.guesses.length < otherData.guesses.length ? '🏆 ניצחת!' :
                   myData.guesses.length > otherData.guesses.length ? 'הצד השני ניצח' : '🤝 תיקו!'}
                </p>
              )}
            </div>
          )}
          {!bothDone && <p className="text-muted mt-1">ממתין לצד השני...</p>}
          <button onClick={handleReset} className="clay-soft mt-3 px-4 py-2 text-sm text-muted">
            איפוס
          </button>
        </div>
      )}
    </div>
  );
}
