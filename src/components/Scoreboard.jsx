import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, isLocal } from '../firebase';
import * as local from '../lib/localStore';

export default function Scoreboard() {
  const [allTime, setAllTime] = useState({ her: 0, him: 0 });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (isLocal) {
      const unsubA = local.subscribe('scores:allTime', (v) => setAllTime(v || { her: 0, him: 0 }));
      const unsubS = local.subscribe('scores:sessions', (v) => setSessions(v || []));
      return () => { unsubA(); unsubS(); };
    }
    const unsubAll = onSnapshot(doc(db, 'scores', 'allTime'), (snap) => {
      if (snap.exists()) setAllTime(snap.data());
    });

    const q = query(collection(db, 'scores', 'sessions', 'list'), orderBy('date', 'desc'));
    const unsubSessions = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAll(); unsubSessions(); };
  }, []);

  const herLeads = allTime.her > allTime.him;
  const himLeads = allTime.him > allTime.her;

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="font-display text-xl text-text-primary text-center">🏆 לוח דירוג</h2>

      {/* All-time totals */}
      <div className="flex gap-4 justify-center">
        <div className={`flex-1 rounded-2xl p-4 text-center transition-all`}
             style={{ background: 'var(--surface)', border: `2px solid ${herLeads ? 'var(--highlight)' : 'var(--accent)'}` }}>
          {herLeads && <div className="text-gold text-lg mb-1">👑</div>}
          <p className="text-muted font-body text-xs mb-1">עמית</p>
          <p className={`font-mono text-3xl font-bold ${herLeads ? 'text-highlight' : 'text-text-primary'}`}>
            {allTime.her}
          </p>
        </div>
        <div className="flex items-center text-muted font-body text-lg">VS</div>
        <div className={`flex-1 rounded-2xl p-4 text-center transition-all`}
             style={{ background: 'var(--surface)', border: `2px solid ${himLeads ? 'var(--gold)' : 'var(--accent)'}` }}>
          {himLeads && <div className="text-gold text-lg mb-1">👑</div>}
          <p className="text-muted font-body text-xs mb-1">אתה</p>
          <p className={`font-mono text-3xl font-bold ${himLeads ? 'text-gold' : 'text-text-primary'}`}>
            {allTime.him}
          </p>
        </div>
      </div>

      {/* Sessions history */}
      {sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-muted font-body text-sm text-center">היסטוריית סשנים</p>
          {sessions.slice(0, 10).map((session) => {
            const date = session.date?.toDate?.() || new Date();
            const herWins = session.totals?.her > session.totals?.him;
            const himWins = session.totals?.him > session.totals?.her;
            return (
              <div key={session.id} className="flex items-center justify-between rounded-xl px-4 py-2"
                   style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
                <span className="text-muted font-body text-xs">
                  {date.toLocaleDateString('he-IL')}
                </span>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className={herWins ? 'text-highlight font-bold' : 'text-muted'}>
                    {herWins && '👑'} {session.totals?.her || 0}
                  </span>
                  <span className="text-muted">–</span>
                  <span className={himWins ? 'text-gold font-bold' : 'text-muted'}>
                    {session.totals?.him || 0} {himWins && '👑'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
