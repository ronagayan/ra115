import { useState, useEffect } from 'react';
import useGame from '../../hooks/useGame';
import { TRIVIA_QUESTIONS } from '../../data/trivia';

export default function Trivia({ user }) {
  const { state, update, reset } = useGame('trivia');
  const [answered, setAnswered] = useState(false);

  const questions = TRIVIA_QUESTIONS;
  const qIdx = state?.currentQ ?? 0;
  const scores = state?.scores || { her: 0, him: 0 };
  const question = questions[qIdx % questions.length];
  const firstClick = state?.firstClick;
  const sessionDone = qIdx >= 10;

  useEffect(() => {
    setAnswered(false);
  }, [qIdx]);

  async function handleAnswer(option) {
    if (firstClick || answered) return;
    setAnswered(true);
    const correct = option === question.a;
    const newScores = { ...scores };
    if (correct) newScores[user] = (newScores[user] || 0) + 1;

    await update({
      firstClick: user,
      [`lastAnswer_${user}`]: option,
      scores: newScores,
    });

    // Advance after 1.5s
    setTimeout(async () => {
      await update({ currentQ: qIdx + 1, firstClick: null });
    }, 1500);
  }

  async function handleReset() {
    await reset({ currentQ: 0, firstClick: null, scores: { her: 0, him: 0 } });
  }

  if (sessionDone) {
    const winner = scores.her > scores.him ? 'עמית' : scores.him > scores.her ? 'אתה' : 'תיקו';
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <h2 className="font-display text-xl text-text-primary">טריוויה — תוצאות</h2>
        <div className="flex gap-6 font-body text-lg">
          <span className="text-highlight">עמית: {scores.her}</span>
          <span className="text-gold">אתה: {scores.him}</span>
        </div>
        <p className="font-display text-xl text-text-primary">{winner === 'תיקו' ? '🤝 תיקו!' : `🏆 ${winner} ניצח!`}</p>
        <button onClick={handleReset} className="clay-primary px-6 py-3 font-body text-sm font-semibold">
          משחק חדש
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-sm w-full mx-auto">
      <h2 className="font-display text-xl text-text-primary">טריוויה מהירה</h2>

      {/* Scores */}
      <div className="flex gap-6 font-body text-sm">
        <span className="text-highlight">עמית: {scores.her}</span>
        <span className="text-muted">שאלה {qIdx + 1}/10</span>
        <span className="text-gold">אתה: {scores.him}</span>
      </div>

      {/* Question */}
      <div className="w-full rounded-2xl p-4 text-center"
           style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
        <p className="font-body text-text-primary text-base">{question.q}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {question.options.map((opt) => {
          const isCorrect = opt === question.a;
          const myAnswer = state?.[`lastAnswer_${user}`];
          let bg = 'var(--surface)';
          if (firstClick && isCorrect) bg = 'rgba(82,183,136,0.3)';
          if (firstClick && myAnswer === opt && !isCorrect) bg = 'rgba(220,38,38,0.3)';

          return (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={!!firstClick}
              className="py-3 px-3 rounded-xl font-body text-sm text-text-primary transition-all
                         active:scale-95 disabled:cursor-default"
              style={{
                background: bg,
                border: `1px solid ${firstClick && isCorrect ? 'var(--highlight)' : 'var(--accent)'}`,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {firstClick && (
        <p className="text-muted text-sm font-body animate-fadeInUp">
          {firstClick === user ? 'ענית ראשון!' : 'הצד השני ענה ראשון'} — הבא...
        </p>
      )}
    </div>
  );
}
