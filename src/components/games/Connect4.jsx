import { useState } from 'react';
import useGame from '../../hooks/useGame';

const ROWS = 6;
const COLS = 7;
const EMPTY = null;

function createBoard() {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
}

function checkWinner(board) {
  const check = (r, c, dr, dc, player) => {
    for (let i = 0; i < 4; i++) {
      const nr = r + i * dr, nc = c + i * dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) return false;
    }
    return true;
  };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (
        check(r, c, 0, 1, p) || check(r, c, 1, 0, p) ||
        check(r, c, 1, 1, p) || check(r, c, 1, -1, p)
      ) return p;
    }
  }
  return null;
}

function dropPiece(board, col, player) {
  const newBoard = board.map((r) => [...r]);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (newBoard[r][col] === EMPTY) {
      newBoard[r][col] = player;
      return newBoard;
    }
  }
  return null;
}

const COLORS = { her: '#52b788', him: '#f4a261' };
const LABELS = { her: 'עמית', him: 'אתה' };

export default function Connect4({ user }) {
  const { state, update, reset } = useGame('connect4');

  const board = state?.board || createBoard();
  const currentTurn = state?.currentTurn || 'her';
  const winner = state?.winner || null;

  async function handleDrop(col) {
    if (winner || currentTurn !== user) return;
    const newBoard = dropPiece(board, col, user);
    if (!newBoard) return;
    const w = checkWinner(newBoard);
    const nextTurn = user === 'her' ? 'him' : 'her';
    await update({
      board: newBoard,
      currentTurn: w ? user : nextTurn,
      winner: w || null,
    });
  }

  async function handleReset() {
    await reset({ board: createBoard(), currentTurn: 'her', winner: null });
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="font-display text-xl text-text-primary">4 בשורה</h2>

      {/* Status */}
      <div className="text-center font-body text-sm">
        {winner ? (
          <span className="text-highlight font-medium">
            {winner === user ? '🎉 ניצחת!' : `${LABELS[winner]} ניצח`}
          </span>
        ) : currentTurn === user ? (
          <span className="text-highlight">התור שלך</span>
        ) : (
          <span className="text-muted">מחכה ל{LABELS[currentTurn]}...</span>
        )}
      </div>

      {/* Board */}
      <div
        className="rounded-2xl p-3 grid gap-2"
        style={{ background: 'var(--surface)', gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {Array(COLS).fill(null).map((_, col) => (
          <div key={col} className="flex flex-col gap-2">
            {Array(ROWS).fill(null).map((_, rowIdx) => {
              const cell = board[rowIdx]?.[col];
              return (
                <button
                  key={rowIdx}
                  onClick={() => handleDrop(col)}
                  disabled={!!winner || currentTurn !== user}
                  className="w-9 h-9 rounded-full border-2 transition-all duration-150
                             hover:border-highlight disabled:cursor-default"
                  style={{
                    background: cell ? COLORS[cell] : 'var(--bg)',
                    borderColor: cell ? COLORS[cell] : 'var(--accent)',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <button
        onClick={handleReset}
        className="clay-soft px-4 py-2 font-body text-sm text-muted"
      >
        משחק חדש
      </button>
    </div>
  );
}
