import { useState, useRef, useEffect } from 'react';
import useGame from '../../hooks/useGame';
import notifyOther from '../../lib/notify';

const WORDS_LIST = ['חתול', 'כלב', 'בית', 'עץ', 'שמש', 'ים', 'הר', 'ציפור', 'דג', 'פרח'];

function randomWord() {
  return WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
}

export default function Drawing({ user }) {
  const { state, update, reset } = useGame('drawing');
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [guess, setGuess] = useState('');

  const isDrawer = state?.drawer === user;
  const isGuesser = state?.guesser === user;
  const canvas64 = state?.canvas || null;

  // Draw canvas image if guesser
  useEffect(() => {
    if (!canvasRef.current || isDrawer || !canvas64) return;
    const img = new Image();
    img.onload = () => {
      canvasRef.current.getContext('2d').drawImage(img, 0, 0, 300, 300);
    };
    img.src = canvas64;
  }, [canvas64, isDrawer]);

  function startDraw(e) {
    if (!isDrawer) return;
    setDrawing(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!drawing || !isDrawer) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#52b788';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches?.[0] || e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  async function saveCanvas() {
    const data = canvasRef.current.toDataURL('image/webp', 0.5);
    await update({ canvas: data });
  }

  async function handleGuess() {
    if (!guess.trim()) return;
    const correct = guess.trim() === state?.word;
    await update({ guess: guess.trim(), guessCorrect: correct });
    setGuess('');
    notifyOther(user, {
      title: '🎨 ציור מהיר',
      body: correct ? `ניחש נכון: ${state?.word}` : `ניחוש: ${guess.trim()}`,
      url: `/${user === 'her' ? 'him' : 'her'}/games`,
    });
  }

  async function handleStart() {
    const word = randomWord();
    await reset({
      word,
      canvas: null,
      drawer: user,
      guesser: user === 'her' ? 'him' : 'her',
      guess: null,
      guessCorrect: false,
    });
    notifyOther(user, {
      title: '🎨 ציור מהיר',
      body: 'יש לך משחק לנחש!',
      url: `/${user === 'her' ? 'him' : 'her'}/games`,
    });
  }

  function clearCanvas() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 300, 300);
  }

  if (!state?.drawer) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <h2 className="font-display text-xl text-text-primary">ציור מהיר</h2>
        <button onClick={handleStart} className="clay-primary px-6 py-3 font-body font-semibold">
          התחל משחק
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="font-display text-xl text-text-primary">ציור מהיר</h2>

      {isDrawer && (
        <div className="px-4 py-2 rounded-xl font-body text-text-primary font-medium"
             style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
          צייר: <strong className="text-highlight">{state.word}</strong>
        </div>
      )}

      {isGuesser && <p className="text-muted font-body text-sm">נחש מה מצוייר:</p>}

      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-2xl touch-none"
        style={{ background: 'var(--surface)', border: '2px solid var(--accent)', cursor: isDrawer ? 'crosshair' : 'default' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={() => { setDrawing(false); if (isDrawer) saveCanvas(); }}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={() => { setDrawing(false); if (isDrawer) saveCanvas(); }}
      />

      {isDrawer && (
        <div className="flex gap-3">
          <button onClick={clearCanvas} className="clay-soft px-4 py-2 font-body text-sm text-muted">
            מחק
          </button>
          <button onClick={handleStart} className="clay-soft px-4 py-2 font-body text-sm text-muted">
            מילה חדשה
          </button>
        </div>
      )}

      {isGuesser && !state.guessCorrect && (
        <div className="flex gap-2 w-full max-w-xs">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            placeholder="הניחוש שלך..."
            className="flex-1 rounded-xl p-2 text-text-primary font-body text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}
            dir="rtl"
          />
          <button onClick={handleGuess} className="clay-primary px-4 py-2 font-body text-sm font-semibold">
            נחש
          </button>
        </div>
      )}

      {state.guess && (
        <div className={`font-body text-sm ${state.guessCorrect ? 'text-highlight' : 'text-red-400'}`}>
          {state.guessCorrect ? `✓ נכון! "${state.word}"` : `ניחשת: "${state.guess}" — לא נכון`}
        </div>
      )}
    </div>
  );
}
