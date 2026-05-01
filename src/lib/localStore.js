// Tiny localStorage-backed pub/sub for offline / no-Firebase mode.
// Same API surface that useGame / useNotes need: get, set, subscribe.

const PREFIX = 'ra115:';
const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ra115') : null;

const listeners = new Map(); // key -> Set<callback>

function emit(key) {
  const cbs = listeners.get(key);
  if (cbs) for (const cb of cbs) cb(get(key));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(PREFIX)) emit(e.key.slice(PREFIX.length));
  });
  if (channel) {
    channel.addEventListener('message', (e) => {
      if (e.data?.key) emit(e.data.key);
    });
  }
}

export function get(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota or disabled
  }
  emit(key);
  if (channel) channel.postMessage({ key });
}

export function update(key, patch) {
  const cur = get(key) || {};
  set(key, { ...cur, ...patch });
}

export function push(key, item) {
  const list = get(key) || [];
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  const entry = { id, ...item };
  set(key, [entry, ...list]);
  return entry;
}

export function patchItem(key, id, patch) {
  const list = get(key) || [];
  set(
    key,
    list.map((it) => (it.id === id ? { ...it, ...patch } : it))
  );
}

export function subscribe(key, cb) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(cb);
  // Initial emit so subscribers don't have to call get() separately
  queueMicrotask(() => cb(get(key)));
  return () => {
    listeners.get(key)?.delete(cb);
  };
}
