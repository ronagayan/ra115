import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, query,
  orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db, isLocal } from '../firebase';
import * as local from '../lib/localStore';

export default function useNotes(user) {
  // her sees her_notes (written by him), him sees him_notes (written by her)
  const collectionName = user === 'her' ? 'her_notes' : 'him_notes';
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (isLocal) {
      const unsub = local.subscribe(`notes:${collectionName}`, (val) => {
        setNotes(val || []);
        setLoading(false);
      });
      return unsub;
    }

    const q = query(
      collection(db, 'notes', collectionName, 'items'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user, collectionName]);

  const unpulled = notes.filter((n) => !n.pulled);
  const history = notes
    .filter((n) => n.pulled)
    .sort((a, b) => (b.createdAt?.seconds || b.createdAt || 0) - (a.createdAt?.seconds || a.createdAt || 0));

  async function pullRandomNote() {
    if (unpulled.length === 0) return null;
    const idx = Math.floor(Math.random() * unpulled.length);
    const note = unpulled[idx];

    if (isLocal) {
      local.patchItem(`notes:${collectionName}`, note.id, { pulled: true });
      return note;
    }

    await updateDoc(
      doc(db, 'notes', collectionName, 'items', note.id),
      { pulled: true }
    );
    return note;
  }

  async function addNote({ text, emoji, imageUrl }) {
    // writer is the opposite user — note lands in the other's pile
    const targetCollection = user === 'her' ? 'him_notes' : 'her_notes';

    if (isLocal) {
      local.push(`notes:${targetCollection}`, {
        text,
        emoji: emoji || null,
        imageUrl: imageUrl || null,
        createdAt: Date.now() / 1000,
        pulled: false,
      });
      return;
    }

    await addDoc(collection(db, 'notes', targetCollection, 'items'), {
      text,
      emoji: emoji || null,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp(),
      pulled: false,
    });
  }

  return { notes, unpulled, history, loading, pullRandomNote, addNote };
}
