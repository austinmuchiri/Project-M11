import { powerMonitor } from 'electron';
import { categorize, type AppCategory } from '@timekeeper/schema';

export interface WatcherSnapshot {
  ts: number;
  focus: {
    app: string;
    title?: string;
    url?: string;
    category: AppCategory;
  } | null;
  idleSec: number;
  locked: boolean;
  audioActive: boolean;
}

type Listener = (snap: WatcherSnapshot) => void;

let timer: NodeJS.Timeout | null = null;
let listener: Listener | null = null;
let last: WatcherSnapshot | null = null;

const FOCUS_INTERVAL_MS = 2000;

export async function startWatcher(cb: Listener) {
  listener = cb;
  await tick();
  timer = setInterval(() => { void tick(); }, FOCUS_INTERVAL_MS);
}

export function stopWatcher() {
  if (timer) clearInterval(timer);
  timer = null;
  listener = null;
}

export function getCurrentSnapshot(): WatcherSnapshot | null {
  return last;
}

async function tick() {
  try {
    const win = await getActiveWindow();
    const idleSec = powerMonitor.getSystemIdleTime();
    // Querying screen-locked state requires native APIs; for now treat
    // long idle (> 5 min) as locked. The system lock-screen events in
    // main.ts handle the immediate transitions.
    const locked = idleSec > 300;

    const snap: WatcherSnapshot = {
      ts: Date.now(),
      focus: win ? {
        app: win.app,
        title: win.title,
        url: win.url,
        category: categorize(win.app, win.title),
      } : null,
      idleSec,
      locked,
      audioActive: false, // hook up `loudness` package later
    };

    if (snapDiff(last, snap)) {
      last = snap;
      listener?.(snap);
    } else {
      last = snap;
    }
  } catch (err) {
    console.error('[watcher] tick failed', err);
  }
}

interface ActiveWin { app: string; title?: string; url?: string; }

async function getActiveWindow(): Promise<ActiveWin | null> {
  // active-win is an ESM-only module from v8+; load via dynamic import.
  try {
    const mod = await import('active-win');
    const fn = (mod as { default: () => Promise<unknown> }).default;
    const res = (await fn()) as
      | { owner?: { name?: string }; title?: string; url?: string }
      | undefined;
    if (!res) return null;
    return {
      app: res.owner?.name ?? 'unknown',
      title: res.title,
      url: res.url,
    };
  } catch (err) {
    console.warn('[watcher] active-win unavailable', err);
    return null;
  }
}

function snapDiff(a: WatcherSnapshot | null, b: WatcherSnapshot): boolean {
  if (!a) return true;
  return (
    a.focus?.app !== b.focus?.app ||
    a.focus?.title !== b.focus?.title ||
    Math.abs(a.idleSec - b.idleSec) > 5 ||
    a.locked !== b.locked
  );
}
