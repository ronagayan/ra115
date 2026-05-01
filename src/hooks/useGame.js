import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, isLocal } from '../firebase';
import * as local from '../lib/localStore';

export default function useGame(gameId) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocal) {
      const key = `game:${gameId}`;
      const unsub = local.subscribe(key, (val) => {
        setState(val);
        setLoading(false);
      });
      return unsub;
    }
    const unsub = onSnapshot(doc(db, 'games', gameId), (snap) => {
      setState(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [gameId]);

  async function update(data) {
    if (isLocal) {
      local.update(`game:${gameId}`, data);
      return;
    }
    await updateDoc(doc(db, 'games', gameId), data);
  }

  async function reset(initialState) {
    if (isLocal) {
      local.set(`game:${gameId}`, initialState);
      return;
    }
    await setDoc(doc(db, 'games', gameId), initialState);
  }

  return { state, loading, update, reset };
}
