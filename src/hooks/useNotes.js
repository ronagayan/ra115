import { useState, useEffect } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, query,
  orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db, isLocal } from '../firebase';
import * as local from '../lib/localStore';

// her_notes = notes written BY him (read by her)
// him_notes = notes written BY her (read by him)
const incomingFor = (user) => (user === 'her' ? 'her_notes' : 'him_notes');
const outgoingFor = (user) => (user === 'her' ? 'him_notes' : 'her_notes');

export default function useNotes(user) {
  const incomingColl = incomingFor(user);
  const outgoingColl = outgoingFor(user);

  // Notes I've received (from the other side)
  const [incoming, setIncoming] = useState([]);
  // Notes I've sent (to the other side) — I can edit/delete these
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (isLocal) {
      const u1 = local.subscribe(`notes:${incomingColl}`, (v) => {
        setIncoming(v || []);
        setLoading(false);
      });
      const u2 = local.subscribe(`notes:${outgoingColl}`, (v) => setOutgoing(v || []));
      return () => { u1(); u2(); };
    }

    const qIn = query(
      collection(db, 'notes', incomingColl, 'items'),
      orderBy('createdAt', 'desc')
    );
    const qOut = query(
      collection(db, 'notes', outgoingColl, 'items'),
      orderBy('createdAt', 'desc')
    );
    const u1 = onSnapshot(qIn, (snap) => {
      setIncoming(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const u2 = onSnapshot(qOut, (snap) => {
      setOutgoing(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { u1(); u2(); };
  }, [user, incomingColl, outgoingColl]);

  // Backwards-compatible helpers
  const unpulled = incoming.filter((n) => !n.pulled);
  const history = incoming
    .filter((n) => n.pulled)
    .sort((a, b) =>
      (b.createdAt?.seconds || b.createdAt || 0) -
      (a.createdAt?.seconds || a.createdAt || 0)
    );
  const myNotes = outgoing
    .slice()
    .sort((a, b) =>
      (b.createdAt?.seconds || b.createdAt || 0) -
      (a.createdAt?.seconds || a.createdAt || 0)
    );

  // Pull a specific note (by id) — marks it as `pulled: true` so it
  // graduates from the jar to the cork board.
  async function pullNote(noteId) {
    if (!noteId) return null;
    if (isLocal) {
      local.patchItem(`notes:${incomingColl}`, noteId, { pulled: true });
      return null;
    }
    await updateDoc(doc(db, 'notes', incomingColl, 'items', noteId), { pulled: true });
    return null;
  }

  async function pullRandomNote() {
    if (unpulled.length === 0) return null;
    const idx = Math.floor(Math.random() * unpulled.length);
    const note = unpulled[idx];
    await pullNote(note.id);
    return note;
  }

  async function addNote({ text, emoji, imageUrl }) {
    if (isLocal) {
      local.push(`notes:${outgoingColl}`, {
        text,
        emoji: emoji || null,
        imageUrl: imageUrl || null,
        author: user,
        createdAt: Date.now() / 1000,
        pulled: false,
      });
      return;
    }
    await addDoc(collection(db, 'notes', outgoingColl, 'items'), {
      text,
      emoji: emoji || null,
      imageUrl: imageUrl || null,
      author: user,
      createdAt: serverTimestamp(),
      pulled: false,
    });
  }

  // Edit/delete on outgoing notes (the ones I authored).
  async function updateNote(noteId, patch) {
    if (isLocal) {
      local.patchItem(`notes:${outgoingColl}`, noteId, patch);
      return;
    }
    await updateDoc(doc(db, 'notes', outgoingColl, 'items', noteId), patch);
  }

  // Update an INCOMING note (one the other authored — used for live wordle
  // guesses where the recipient is mutating fields on the author's note).
  async function updateIncomingNote(noteId, patch) {
    if (isLocal) {
      local.patchItem(`notes:${incomingColl}`, noteId, patch);
      return;
    }
    await updateDoc(doc(db, 'notes', incomingColl, 'items', noteId), patch);
  }

  async function deleteNote(noteId) {
    if (isLocal) {
      const list = local.get(`notes:${outgoingColl}`) || [];
      local.set(`notes:${outgoingColl}`, list.filter((n) => n.id !== noteId));
      return;
    }
    await deleteDoc(doc(db, 'notes', outgoingColl, 'items', noteId));
  }

  return {
    notes: incoming, // backwards-compat
    unpulled,
    history,
    myNotes,
    loading,
    pullNote,
    pullRandomNote,
    addNote,
    updateNote,
    updateIncomingNote,
    deleteNote,
  };
}
