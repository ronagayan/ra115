import { useState } from 'react';
import { Link } from 'react-router-dom';
import Connect4 from '../components/games/Connect4';
import Drawing from '../components/games/Drawing';
import Memory from '../components/games/Memory';
import Scoreboard from '../components/Scoreboard';

const GAME_LIST = [
  { id: 'connect4', label: '4 בשורה',  icon: '🔵' },
  { id: 'drawing',  label: 'ציור מהיר', icon: '🎨' },
  { id: 'memory',   label: 'זיכרון',    icon: '🧠' },
];

const GAME_COMPONENTS = {
  connect4: Connect4,
  drawing: Drawing,
  memory: Memory,
};

export default function Games({ user }) {
  const [active, setActive] = useState(null);
  const [showScores, setShowScores] = useState(false);

  const GameComponent = active ? GAME_COMPONENTS[active] : null;

  return (
    <div
      className="min-h-dvh flex flex-col"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #0d1f16 0%, #1a3a2a 100%)' }}
    >
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <Link to={`/${user}`} className="clay-soft px-4 py-2 font-body text-sm text-muted">
          ← חזרה
        </Link>
        <h1 className="font-display text-xl text-text-primary">🎮 משחקים</h1>
        <button
          onClick={() => setShowScores(true)}
          className="clay-gold px-4 py-2 font-body text-sm font-semibold"
        >
          🏆 ניקוד
        </button>
      </header>

      {!active ? (
        <div className="flex-1 p-5">
          <div className="grid grid-cols-3 gap-3">
            {GAME_LIST.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActive(g.id)}
                className="clay flex flex-col items-center gap-2 p-4 animate-fadeInUp"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                  animationFillMode: 'forwards',
                }}
              >
                <span className="text-3xl">{g.icon}</span>
                <span className="text-text-primary font-body text-xs text-center">{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="px-5 py-2">
            <button
              onClick={() => setActive(null)}
              className="clay-soft px-4 py-2 font-body text-sm text-muted"
            >
              ← כל המשחקים
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <GameComponent user={user} />
          </div>
        </div>
      )}

      {showScores && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'linear-gradient(180deg,#0d1f16 0%,#1a3a2a 100%)' }}
        >
          <div className="flex items-center justify-between p-4">
            <h2 className="font-display text-xl text-text-primary">🏆 דירוג</h2>
            <button
              onClick={() => setShowScores(false)}
              className="clay-soft w-9 h-9 flex items-center justify-center text-muted text-lg"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Scoreboard />
          </div>
        </div>
      )}
    </div>
  );
}
