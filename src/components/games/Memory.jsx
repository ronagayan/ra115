import useGame from '../../hooks/useGame';

const EMOJIS = ['🐱', '🐶', '🐸', '🦊', '🐺', '🦁', '🐯', '🐻'];

function createCards() {
  const pairs = [...EMOJIS, ...EMOJIS];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, id) => ({ id, emoji }));
}

const LABELS = { her: 'עמית', him: 'אתה' };

export default function Memory({ user }) {
  const { state, update, reset } = useGame('memory');

  const cards = state?.cards || [];
  const flipped = state?.flipped || [];
  const matched = state?.matched || [];
  const currentTurn = state?.currentTurn || 'her';
  const scores = state?.scores || { her: 0, him: 0 };
  const gameOver = matched.length === cards.length && cards.length > 0;

  async function handleFlip(id) {
    if (currentTurn !== user || flipped.length >= 2 || matched.includes(id) || flipped.includes(id)) return;

    const newFlipped = [...flipped, id];

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      const cardA = cards[a];
      const cardB = cards[b];

      if (cardA.emoji === cardB.emoji) {
        const newMatched = [...matched, a, b];
        const newScores = { ...scores, [user]: scores[user] + 1 };
        await update({ flipped: [], matched: newMatched, scores: newScores });
      } else {
        await update({ flipped: newFlipped });
        setTimeout(async () => {
          await update({ flipped: [], currentTurn: user === 'her' ? 'him' : 'her' });
        }, 1000);
      }
    } else {
      await update({ flipped: newFlipped });
    }
  }

  async function handleStart() {
    await reset({
      cards: createCards(),
      flipped: [],
      matched: [],
      currentTurn: 'her',
      scores: { her: 0, him: 0 },
    });
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <h2 className="font-display text-xl text-text-primary">זיכרון מהיר</h2>
        <button onClick={handleStart} className="clay-primary px-6 py-3 font-body font-semibold">
          התחל משחק
        </button>
      </div>
    );
  }

  const winner = gameOver
    ? (scores.her > scores.him ? 'עמית' : scores.him > scores.her ? 'אתה' : 'תיקו')
    : null;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="font-display text-xl text-text-primary">זיכרון מהיר</h2>

      {/* Scores & Turn */}
      <div className="flex gap-6 font-body text-sm items-center">
        <span className={`${currentTurn === 'her' ? 'text-highlight font-medium' : 'text-muted'}`}>
          {scores.her} עמית {currentTurn === 'her' && '←'}
        </span>
        <span className={`${currentTurn === 'him' ? 'text-gold font-medium' : 'text-muted'}`}>
          {currentTurn === 'him' && '→'} אתה {scores.him}
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              disabled={currentTurn !== user || isFlipped}
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-300
                         disabled:cursor-default"
              style={{
                background: isFlipped ? 'var(--accent)' : 'var(--surface)',
                border: `2px solid ${matched.includes(card.id) ? 'var(--highlight)' : 'var(--accent)'}`,
                transform: isFlipped ? 'rotateY(180deg)' : 'none',
              }}
            >
              {isFlipped ? card.emoji : '❓'}
            </button>
          );
        })}
      </div>

      {gameOver && (
        <div className="text-center font-body">
          <p className="text-highlight font-medium text-lg">
            {winner === 'תיקו' ? '🤝 תיקו!' : `🏆 ${winner} ניצח!`}
          </p>
          <button onClick={handleStart} className="clay-soft mt-2 px-4 py-2 text-sm text-muted">
            שחק שוב
          </button>
        </div>
      )}
    </div>
  );
}
