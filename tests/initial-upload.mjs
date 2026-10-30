// Regression tests run the real sync IIFE with a simulated Supabase and localStorage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const original = readFileSync(new URL('../js/sync.js', import.meta.url), 'utf8');
const marker = '  sb.auth\n    .getSession()';
assert.ok(original.includes(marker));
// Expose the private pull and user only in this test's in-memory copy.
const source = original.replace(marker, '  window.testPull = pull; window.testSetUser = function (user) { curUser = user; }; window.testDirty = function () { return JSON.stringify(dirtyIds); }; window.testPush = function () { return pushKey(KEY, localStorage.getItem(KEY)); };\n' + marker);
const game = { id: 'game-1', winner: 'Ali', player1: 'Ali', player2: 'Reza' };
const key = 'backgammon_main_games';
const dirtyKey = 'backgammon_dirty';
const localNewKey = 'backgammon_local_new';
const never = () => new Promise(() => {});

function harness({ storage, upload, remoteGames = [], timer = () => 0, cancelTimer = () => {} } = {}) {
  const values = storage || new Map([[key, JSON.stringify([game])], [localNewKey, JSON.stringify([game.id])]]);
  const localStorage = {
    getItem: k => values.has(k) ? values.get(k) : null,
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: k => values.delete(k),
  };
  const calls = [];
  const sb = {
    auth: { getSession: never },
    from(table) {
      return {
        select() {
          return {
            eq() {
              if (table === 'players') return Promise.resolve({ data: [], error: null });
              if (table === 'games') return Promise.resolve({ data: remoteGames, error: null });
              return { maybeSingle: async () => ({ data: null, error: null }) };
            },
          };
        },
        upsert(rows) {
          calls.push({ table, rows: JSON.parse(JSON.stringify(rows)) });
          if (table === 'games') return upload(rows, calls.length);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { style: {}, addEventListener() {} });
      return elements.get(id);
    },
    addEventListener() {},
  };
  const window = { supabase: { createClient: () => sb }, addEventListener() {} };
  runInNewContext(source, {
    window, document, localStorage, isBlocked: () => false,
    navigator: { onLine: true }, console: { error() {}, warn() {}, log() {} },
    setTimeout: timer, clearTimeout: cancelTimer, setInterval, clearInterval, Promise, AbortController,
  });
  window.testSetUser({ id: 'user-1' });
  return { values, localStorage, calls, pull: window.testPull, setUser: window.testSetUser, getDirty: window.testDirty, push: window.testPush, markDirty: window.__sbMarkDirty };
}
const dirty = h => JSON.parse(h.values.get(dirtyKey) || '{}');

test('successful initial upload clears persisted dirty state only after confirmation', async () => {
  const h = harness({ upload: async () => ({ error: null }) });
  await h.pull();
  assert.deepEqual(h.calls[0].rows, [{ id: game.id, data: game, user_id: 'user-1', league: 'main' }]);
  assert.deepEqual(dirty(h), {});
  assert.equal(h.values.has(localNewKey), false);
  assert.deepEqual(JSON.parse(h.values.get(key)), [game]);
});

test('Supabase error preserves local games, dirty queue and offline marker, then next pull retries', async () => {
  let count = 0;
  const h = harness({ upload: async () => ++count === 1 ? { error: { message: 'server error' } } : { error: null } });
  await h.pull();
  assert.equal(count, 1, 'failed upload must not be immediately retried by the generic push');
  assert.deepEqual(dirty(h), { [game.id]: 'add' });
  assert.deepEqual(JSON.parse(h.values.get(key)), [game]);
  assert.equal(h.values.has(localNewKey), true);
  await h.pull();
  assert.equal(count, 2);
  assert.deepEqual(dirty(h), {});
  assert.equal(h.values.has(localNewKey), false);
});

test('network rejection preserves a persisted retry queue across reload', async () => {
  const h = harness({ upload: async () => { throw new Error('offline'); } });
  await h.pull();
  assert.deepEqual(dirty(h), { [game.id]: 'add' });
  assert.equal(h.values.has(localNewKey), true);
  const reloaded = harness({ storage: h.values, upload: async () => ({ error: null }) });
  await reloaded.pull();
  assert.equal(reloaded.calls.length, 1);
  assert.deepEqual(dirty(reloaded), {});
});

test('an edit made while the initial upload is in flight remains queued', async () => {
  let resolveUpload;
  let started;
  const uploadStarted = new Promise(resolve => { started = resolve; });
  const h = harness({ upload: (_rows, count) => {
    if (count > 1) return never();
    started();
    return new Promise(resolve => { resolveUpload = resolve; });
  } });
  const pulling = h.pull();
  await uploadStarted;
  const updated = { ...game, winner: 'Reza' };
  h.localStorage.setItem(key, JSON.stringify([updated]));
  resolveUpload({ error: null });
  await pulling;
  assert.deepEqual(dirty(h), { [game.id]: 'add' });
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[1].rows[0].data, updated);
});

test('nonempty server uses merge instead of initial upload', async () => {
  const h = harness({
    storage: new Map([[key, JSON.stringify([game])]]),
    remoteGames: [{ id: game.id, data: game }],
    upload: async () => { throw new Error('unexpected upload'); },
  });
  await h.pull();
  assert.equal(h.calls.length, 0);
  assert.deepEqual(JSON.parse(h.values.get(key)), [game]);
});

test('server error does not discard pre-existing pending actions', async () => {
  const values = new Map([
    [key, JSON.stringify([game])],
    [dirtyKey, JSON.stringify({ [game.id]: 'edit', 'other-id': 'add' })],
    [localNewKey, JSON.stringify([game.id])],
  ]);
  const h = harness({ storage: values, upload: async () => ({ error: { code: '42501', message: 'denied' } }) });
  await h.pull();
  assert.deepEqual(dirty(h), { [game.id]: 'edit', 'other-id': 'add' });
  assert.equal(h.calls.length, 1);
});

test('guest pull does not upload local games', async () => {
  const h = harness({ upload: async () => { throw new Error('unexpected upload'); } });
  h.setUser(null);
  await h.pull();
  assert.equal(h.calls.length, 0);
  assert.deepEqual(JSON.parse(h.values.get(key)), [game]);
});

test('a lost response can be recovered when the game is already on the server', async () => {
  const first = harness({ upload: async () => { throw new Error('connection lost after server commit'); } });
  await first.pull();
  const retry = harness({
    storage: first.values,
    remoteGames: [{ id: game.id, data: game }],
    upload: async () => ({ error: null }),
  });
  await retry.pull();
  // pushKey is asynchronous; allow its successful response to settle.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(retry.calls.length, 1);
  assert.deepEqual(retry.calls[0].rows[0].data, game);
  assert.deepEqual(JSON.parse(retry.getDirty()), {});
  assert.deepEqual(dirty(retry), {});
});

test('ordinary push persists success and reload does not resend', async () => {
  const values = new Map([[key, JSON.stringify([game])], [dirtyKey, JSON.stringify({ [game.id]: 'edit' })]]);
  const h = harness({ storage: values, upload: async () => ({ error: null }) });
  await h.push();
  assert.deepEqual(dirty(h), {});
  const reloaded = harness({ storage: values, remoteGames: [{ id: game.id, data: game }], upload: async () => ({ error: null }) });
  await reloaded.pull();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reloaded.calls.length, 0);
});

test('overlapping edits are serialized and only the last confirmed version is cleared', async () => {
  const values = new Map([[key, JSON.stringify([game])], [dirtyKey, JSON.stringify({ [game.id]: 'edit' })]]);
  const resolvers = [];
  const h = harness({ storage: values, upload: () => new Promise(resolve => resolvers.push(resolve)) });
  const first = h.push();
  assert.equal(h.calls.length, 1);
  const updated = { ...game, winner: 'Reza' };
  h.markDirty(game.id, 'edit');
  h.localStorage.setItem(key, JSON.stringify([updated]));
  await h.push();
  assert.equal(h.calls.length, 1, 'second write must wait for first');
  resolvers[0]({ error: null });
  await first;
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[1].rows[0].data, updated);
  assert.deepEqual(dirty(h), { [game.id]: 'edit' });
  resolvers[1]({ error: null });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(dirty(h), {});
});

test('a newer edit stays queued even if no second push has started yet', async () => {
  const values = new Map([[key, JSON.stringify([game])], [dirtyKey, JSON.stringify({ [game.id]: 'edit' })]]);
  const resolvers = [];
  const h = harness({ storage: values, upload: () => new Promise(resolve => resolvers.push(resolve)) });
  const first = h.push();
  const updated = { ...game, winner: 'Reza' };
  h.markDirty(game.id, 'edit');
  h.localStorage.setItem(key, JSON.stringify([updated]));
  resolvers[0]({ error: null });
  await first;
  assert.equal(h.calls.length, 2);
  assert.deepEqual(dirty(h), { [game.id]: 'edit' });
  assert.deepEqual(h.calls[1].rows[0].data, updated);
  resolvers[1]({ error: null });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(dirty(h), {});
});

test('failed push retains queue and retries the latest version rather than an old snapshot', async () => {
  const values = new Map([[key, JSON.stringify([game])], [dirtyKey, JSON.stringify({ [game.id]: 'edit' })]]);
  const timers = [];
  const h = harness({ storage: values, timer: (fn, delay) => { if (delay === 3000) timers.push(fn); return timers.length; }, cancelTimer() {},
    upload: async (_rows, count) => count === 1 ? { error: { message: 'network' } } : { error: null } });
  await h.push();
  assert.deepEqual(dirty(h), { [game.id]: 'edit' });
  assert.equal(timers.length, 1);
  const updated = { ...game, winner: 'Reza' };
  h.markDirty(game.id, 'edit');
  h.localStorage.setItem(key, JSON.stringify([updated]));
  timers[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.calls[1].rows[0].data, updated);
  assert.deepEqual(dirty(h), {});
});

test('an old RLS error does not discard a newer edit', async () => {
  const values = new Map([[key, JSON.stringify([game])], [dirtyKey, JSON.stringify({ [game.id]: 'edit' })]]);
  let resolveFirst;
  const h = harness({ storage: values, upload: (_rows, count) => count === 1
    ? new Promise(resolve => { resolveFirst = resolve; }) : Promise.resolve({ error: null }) });
  const first = h.push();
  const updated = { ...game, winner: 'Reza' };
  h.markDirty(game.id, 'edit');
  h.localStorage.setItem(key, JSON.stringify([updated]));
  resolveFirst({ error: { code: '42501', message: 'denied' } });
  await first;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[1].rows[0].data, updated);
  assert.deepEqual(dirty(h), {});
});

test('mixed new and edited games retain ownership semantics and persist cleared state', async () => {
  const other = { id: 'game-2', winner: 'Reza', player1: 'Ali', player2: 'Reza' };
  const values = new Map([[key, JSON.stringify([game, other])], [dirtyKey, JSON.stringify({ [game.id]: 'add', [other.id]: 'edit', unrelated: 'edit' })]]);
  const h = harness({ storage: values, upload: async () => ({ error: null }) });
  await h.push();
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[0].rows[0].user_id, 'user-1');
  assert.equal('user_id' in h.calls[1].rows[0], false);
  assert.deepEqual(dirty(h), { unrelated: 'edit' });
});

test('RLS fallback clears successful games while preserving non-RLS failures', async () => {
  const other = { id: 'game-2', winner: 'Reza', player1: 'Ali', player2: 'Reza' };
  const values = new Map([[key, JSON.stringify([game, other])], [dirtyKey, JSON.stringify({ [game.id]: 'edit', [other.id]: 'edit' })]]);
  const h = harness({ storage: values, upload: async (_rows, count) => {
    if (count === 1) return { error: { code: '42501', message: 'denied' } };
    if (count === 2) return { error: null };
    return { error: { code: '503', message: 'server unavailable' } };
  } });
  await h.push();
  assert.equal(h.calls.length, 3);
  assert.deepEqual(dirty(h), { [other.id]: 'edit' });
});

test('a newer edit during an individual RLS fallback remains queued', async () => {
  const values = new Map([[key, JSON.stringify([game])], [dirtyKey, JSON.stringify({ [game.id]: 'edit' })]]);
  let resolveFallback, started;
  const fallbackStarted = new Promise(resolve => { started = resolve; });
  const h = harness({ storage: values, upload: (_rows, count) => {
    if (count === 1) return Promise.resolve({ error: { code: '42501', message: 'denied' } });
    if (count === 2) { started(); return new Promise(resolve => { resolveFallback = resolve; }); }
    return Promise.resolve({ error: null });
  } });
  const first = h.push();
  await fallbackStarted;
  const updated = { ...game, winner: 'Reza' };
  h.markDirty(game.id, 'edit');
  h.localStorage.setItem(key, JSON.stringify([updated]));
  resolveFallback({ error: { code: '42501', message: 'denied' } });
  await first;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.length, 3);
  assert.deepEqual(h.calls[2].rows[0].data, updated);
  assert.deepEqual(dirty(h), {});
});

test('a stalled request is aborted and cannot block the queued update forever', async () => {
  const values = new Map([[key, JSON.stringify([game])], [dirtyKey, JSON.stringify({ [game.id]: 'edit' })]]);
  const timers = new Map();
  let nextTimer = 0, signal;
  const h = harness({ storage: values,
    timer: (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
    cancelTimer: id => timers.delete(id),
    upload: (_rows, count) => count === 1
      ? { abortSignal(s) { signal = s; return never(); } }
      : Promise.resolve({ error: null }),
  });
  const first = h.push();
  const updated = { ...game, winner: 'Reza' };
  h.markDirty(game.id, 'edit');
  h.localStorage.setItem(key, JSON.stringify([updated]));
  await h.push();
  assert.equal(h.calls.length, 1);
  const timeout = [...timers.values()].find(t => t.delay === 12000);
  assert.ok(timeout);
  timeout.fn();
  await first;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(signal.aborted, true);
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[1].rows[0].data, updated);
  assert.deepEqual(dirty(h), {});
});
