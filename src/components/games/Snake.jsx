import { useState, useEffect, useRef, useCallback } from 'react';
import useGame from '../../hooks/useGame';

const GRID = 20;
const CELL = 16;
const INITIAL_HER = [{ x: 5, y: 5 }];
const INITIAL_HIM = [{ x: 15, y: 15 }];
const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

function randomFood(her, him) {
  let f;
  do {
    f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while ([...her, ...him].some((p) => p.x === f.x && p.y === f.y));
  return f;
}

function moveSnake(positions, dir) {
  const head = positions[0];
  const newHead = { x: (head.x + dir.x + GRID) % GRID, y: (head.y + dir.y + GRID) % GRID };
  return [newHead, ...positions.slice(0, -1)];
}

function ate(head, food) {
  return head.x === food.x && head.y === food.y;
}

function collides(positions) {
  const head = positions[0];
  return positions.slice(1).some((p) => p.x === head.x && p.y === head.y);
}

const COLORS = { her: '#52b788', him: '#f4a261' };

export default function Snake({ user }) {
  const { state, update, reset } = useGame('snake');
  const dirRef = useRef('right');
  const intervalRef = useRef(null);
  const [running, setRunning] = useState(false);

  const her = state?.her?.positions || INITIAL_HER;
  const him = state?.him?.positions || INITIAL_HIM;
  const food = state?.food || { x: 10, y: 10 };
  const alive = state?.alive || { her: true, him: true };
  const myPositions = user === 'her' ? her : him;

  const tick = useCallback(async () => {
    if (!state) return;
    const dir = DIRS[dirRef.current] || DIRS.right;
    const newPos = moveSnake(myPositions, dir);
    const head = newPos[0];
    const otherPositions = user === 'her' ? him : her;
    const ateFood = ate(head, food);
    const hitSelf = collides(newPos);
    const hitOther = otherPositions.some((p) => p.x === head.x && p.y === head.y);
    const dead = hitSelf || hitOther;

    let newFood = food;
    let finalPos = newPos;
    if (ateFood && !dead) {
      finalPos = [...newPos, myPositions[myPositions.length - 1]];
      newFood = randomFood(user === 'her' ? finalPos : her, user === 'him' ? finalPos : him);
    }

    await update({
      [user]: { positions: finalPos, direction: dirRef.current },
      food: newFood,
      alive: { ...alive, [user]: !dead },
    });

    if (dead) {
      setRunning(false);
      clearInterval(intervalRef.current);
    }
  }, [state, user, myPositions, her, him, food, alive, update]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 150);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  useEffect(() => {
    function handleKey(e) {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                    w: 'up', s: 'down', a: 'left', d: 'right' };
      if (map[e.key]) dirRef.current = map[e.key];
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  async function handleStart() {
    const her = [...INITIAL_HER];
    const him = [...INITIAL_HIM];
    await reset({
      her: { positions: her, direction: 'right' },
      him: { positions: him, direction: 'left' },
      food: randomFood(her, him),
      alive: { her: true, him: true },
    });
    dirRef.current = user === 'her' ? 'right' : 'left';
    setRunning(true);
  }

  const gameOver = !alive.her || !alive.him;
  const loser = !alive.her ? 'עמית' : 'אתה';

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="font-display text-xl text-text-primary">Snake Wars</h2>

      {/* Board */}
      <div
        className="relative rounded-xl overflow-hidden border-2"
        style={{ width: GRID * CELL, height: GRID * CELL, background: 'var(--bg)', borderColor: 'var(--accent)' }}
      >
        {/* Food */}
        <div className="absolute w-3 h-3 rounded-full bg-red-400"
             style={{ left: food.x * CELL + CELL/2 - 6, top: food.y * CELL + CELL/2 - 6 }} />

        {/* Her snake */}
        {her.map((seg, i) => (
          <div key={`her-${i}`} className="absolute rounded-sm"
               style={{ width: CELL - 2, height: CELL - 2, left: seg.x * CELL + 1, top: seg.y * CELL + 1,
                        background: i === 0 ? COLORS.her : 'rgba(82,183,136,0.6)' }} />
        ))}

        {/* Him snake */}
        {him.map((seg, i) => (
          <div key={`him-${i}`} className="absolute rounded-sm"
               style={{ width: CELL - 2, height: CELL - 2, left: seg.x * CELL + 1, top: seg.y * CELL + 1,
                        background: i === 0 ? COLORS.him : 'rgba(244,162,97,0.6)' }} />
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 w-36">
        {[['', '↑', ''], ['←', '↓', '→']].map((row, ri) => (
          row.map((btn, ci) => btn ? (
            <button key={`${ri}-${ci}`} onPointerDown={() => {
              const dirs = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' };
              dirRef.current = dirs[btn];
            }}
            className="w-10 h-10 rounded-lg font-mono text-xl text-text-primary flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
              {btn}
            </button>
          ) : <div key={`${ri}-${ci}`} />)
        ))}
      </div>

      {gameOver && (
        <p className="text-text-primary font-body text-sm">{loser} התנגש! 🐍</p>
      )}

      <button onClick={handleStart} className="clay-primary px-6 py-3 font-body text-sm font-semibold">
        {running || gameOver ? 'משחק חדש' : 'התחל'}
      </button>
    </div>
  );
}
