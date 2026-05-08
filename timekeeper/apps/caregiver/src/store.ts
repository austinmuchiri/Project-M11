import { useEffect, useSyncExternalStore } from 'react';
import {
  createTimekeeperClient, MOCK_KID, DEFAULT_KID_SETTINGS,
  type TimekeeperClient, type AuthSession, type KidProfile, type KidSettings, 
} from '@timekeeper/supabase-client';
import type {
  Routine, Task, TaskEvent, Device, Alert, LaptopHeartbeat, Nudge, BlockCommand, DeviceKind,
} from '@timekeeper/schema';



let _client: TimekeeperClient | null = null;

export function getClient(): TimekeeperClient {
  if (!_client) {
    _client = createTimekeeperClient();
  }
  return _client;
}

export interface State {
  ready: boolean;
  isMock: boolean;
  session: AuthSession | null;
  kid: KidProfile;
  routines: Routine[];
  events: TaskEvent[];
  devices: Device[];
  alerts: Alert[];
  heartbeat: LaptopHeartbeat | null;
  bootstrapError: string | null;
  activeBlock: BlockCommand | null;
  settings: KidSettings;
  bonusStars: number;
  setupMode: boolean;
  pendingUnlockRequests: BlockCommand[];
}

let state: State = {
  ready: false,
  isMock: true,
  session: null,
  kid: MOCK_KID,
  routines: [],
  events: [],
  devices: [],
  alerts: [],
  heartbeat: null,
  bootstrapError: null,
  activeBlock: null,
  settings: DEFAULT_KID_SETTINGS,
  bonusStars: 0,
  setupMode: false,
  pendingUnlockRequests: [],
};


const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };

  // persist key offline data
  if (patch.routines) localStorage.setItem("tk_routines", JSON.stringify(patch.routines));
  if (patch.events) localStorage.setItem("tk_events", JSON.stringify(patch.events));

  listeners.forEach(l => l());
};


// Per-selector memo cache. useSyncExternalStore requires getSnapshot to
// return a stable reference between calls when nothing relevant changed,
// otherwise it loops. Selectors like resolveTodayTasks build a fresh
// array each call — without this cache, every render schedules another.
const selectorCache = new WeakMap<(s: State) => unknown, { state: State; result: unknown }>();

function memo<T>(selector: (s: State) => T): T {
  const hit = selectorCache.get(selector as (s: State) => unknown);
  if (hit && hit.state === state) return hit.result as T;
  const result = selector(state);
  selectorCache.set(selector as (s: State) => unknown, { state, result });
  return result;
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => memo(selector), () => memo(selector));
}

/* ─────────────────────────────────────────────
   OFFLINE QUEUE SYSTEM
──────────────────────────────────────────── */
type Mutation =
  | { id: string; type: "createRoutine"; payload: Routine }
  | { id: string; type: "updateRoutine"; payload: { id: string; patch: Partial<Routine> } }
  | { id: string; type: "deleteRoutine"; payload: { id: string } }
  | { id: string; type: "updateTasks"; payload: { routineId: string; tasks: Task[] } }
  | { id: string; type: "recordEvent"; payload: TaskEvent };

const mutationQueue: Mutation[] = JSON.parse(
  localStorage.getItem("tk_queue") || "[]"
);

function persistQueue() {
  localStorage.setItem("tk_queue", JSON.stringify(mutationQueue));
}

type MutationInput = Omit<Mutation, "id">;

function queueMutation(item: MutationInput) {
  mutationQueue.push({
    ...item,
    id: crypto.randomUUID(),
  } as Mutation);

  persistQueue();
}


async function flushQueue() {
  const client = getClient();

  const queueSnapshot = [...mutationQueue];

  for (const item of queueSnapshot) {
    try {
      switch (item.type) {
        case "createRoutine":
          await client.createRoutine(item.payload);
          break;

        case "updateRoutine":
          await client.updateRoutine(item.payload.id, item.payload.patch);
          break;

        case "deleteRoutine":
          await client.deleteRoutine(item.payload.id);
          break;

        case "updateTasks":
          await client.updateRoutine(item.payload.routineId, {
            tasks: item.payload.tasks,
          });
          break;

        case "recordEvent":
          await client.recordEvent(item.payload);
          break;
      }

      // only remove AFTER success
      const index = mutationQueue.findIndex(m => m.id === item.id);
      if (index !== -1) mutationQueue.splice(index, 1);
      persistQueue();

    } catch (err) {
      console.warn("Sync failed, will retry later:", item, err);
      // DO NOT break → allows remaining queue to continue
      continue;
    }
  }

  persistQueue();
}

window.addEventListener("online", flushQueue);


// Safe Wrapper

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.warn("Offline fallback triggered:", e);
    return fallback;
  }
}



let bootstrapped = false;
let unsubAuth: (() => void) | null = null;
let unsubHeartbeat: (() => void) | null = null;
let unsubIncomingBlocks: (() => void) | null = null;

// store.ts

export async function bootstrapAuth() {
  console.log("🚀 Bootstrap starting...");
  if (bootstrapped) return;
  bootstrapped = true;

  try {
    const client = getClient();
    console.log("📡 Checking session...");
     
    // CHANGE THIS LINE: Use client.getSession() instead of client.auth.getSession()
    const session = await client.getSession().catch(err => {
        console.error("Auth session fetch failed", err);
        return null; 
    });

    console.log("🔑 Session found:", !!session);
    set({ session, isMock: client.isMock });

    if (session) {
      await loadKidData();
    }
  } catch (err) {
    console.error("💥 Bootstrap critical error:", err);
    set({ bootstrapError: "Failed to initialize app" });
  } finally {
    console.log("🏁 App is now ready");
    set({ ready: true });
  }
}

async function loadKidData() {
  console.log("🛠️ Starting loadKidData...");
  try {
    const kid = await getClient().resolveKid();
    console.log("👦 Kid resolved:", kid);

    if (!kid) {
      console.warn("⚠️ No kid found — entering setup mode");
      set({ ready: true, setupMode: true, bootstrapError: null });
      return;
    }

    console.log("📡 Fetching routines, events, etc...");
    const [routines, events, devices, alerts, heartbeat, settings] = await Promise.all([
      safe(() => getClient().routines(kid.id), []),
      safe(() => getClient().events(kid.id, Date.now() - 7 * 24 * 60 * 60 * 1000), []),
      safe(() => getClient().devices(kid.id), []),
      safe(() => getClient().alerts(kid.id), []),
      safe(() => getClient().heartbeat(kid.id), null),
      safe(() => getClient().getSettings(kid.id), DEFAULT_KID_SETTINGS),
    ]);

    console.log("✅ Data fetch complete!");
    set({ ready: true, kid, routines, events, devices, alerts, heartbeat, settings, bootstrapError: null });
    
    // Live heartbeat subscription
    if (unsubHeartbeat) unsubHeartbeat();
    unsubHeartbeat = getClient().subscribeHeartbeat(kid.id, (hb) => {
      set({ heartbeat: hb });
    });

    // Subscribe to incoming block commands so the caregiver UI can surface
    // request_unlock notifications sent by the laptop.
    if (unsubIncomingBlocks) unsubIncomingBlocks();
    unsubIncomingBlocks = getClient().subscribeBlockCommands(kid.id, (cmd) => {
      if (cmd.action === 'request_unlock') {
        set({ pendingUnlockRequests: [...state.pendingUnlockRequests, cmd] });
      }
    });

  } catch (err) {
    console.error("❌ Bootstrap failed:", err);
    set({
      ready: true,
      bootstrapError: err instanceof Error ? err.message : 'No Internet Connection',
    });
  }
}

export async function signOut() {
  await getClient().signOut();
  if (unsubAuth) { unsubAuth(); unsubAuth = null; }
  if (unsubHeartbeat) { unsubHeartbeat(); unsubHeartbeat = null; }
  if (unsubIncomingBlocks) { unsubIncomingBlocks(); unsubIncomingBlocks = null; }
  bootstrapped = false;
}

export function dismissUnlockRequest(cmdId: string | undefined) {
  set({ pendingUnlockRequests: state.pendingUnlockRequests.filter(r => r.id !== cmdId) });
}

export async function completeSetup() {
  set({ setupMode: false, bootstrapError: null });
  bootstrapped = false;
  await bootstrapAuth();
}

export async function recordEvent(ev: TaskEvent) {
  set({ events: [...state.events, ev] });

  try {
    await getClient().recordEvent(ev);
  } catch {
    queueMutation({ type: "recordEvent", payload: ev });
  }
}

export async function sendNudge(n: Nudge) { await getClient().sendNudge(n); }

export async function createRoutine(params: { id: string; name: string; startTime: string }) {
  const routine: Routine = {
    id: params.id,
    kidId: state.kid.id,
    name: params.name,
    tasks: [],
    startTime: params.startTime,
    active: true,
  };

  set({ routines: [...state.routines, routine] });

  try {
    await getClient().createRoutine(routine);
  } catch {
    queueMutation({ type: "createRoutine", payload: routine });
  }
}

/**
 * Updates basic routine metadata (name, startTime, active status)
 */

export async function updateRoutine(id: string, patch: Partial<Routine>) {
  set({
    routines: state.routines.map(r => r.id === id ? { ...r, ...patch } : r),
  });

  try {
    await getClient().updateRoutine(id, patch);
  } catch {
    queueMutation({ type: "updateRoutine", payload: { id, patch } });
  }
}

export async function toggleRoutineActive(routineId: string) {
  const r = state.routines.find(r => r.id === routineId);
  if (!r) return;
  await updateRoutine(routineId, { active: !r.active });
}

export async function updateKid(patch: { name?: string; dateOfBirth?: string }) {
  const kidId = state.kid.id;
  const initials = patch.name?.trim()[0]?.toUpperCase() ?? state.kid.initials;
  // Optimistic update
  const optimistic: Partial<typeof state.kid> = {};
  if (patch.name !== undefined) { optimistic.name = patch.name; optimistic.initials = initials; }
  set({ kid: { ...state.kid, ...optimistic } });
  await getClient().updateKid(kidId, { name: patch.name, initials: patch.name ? initials : undefined, dateOfBirth: patch.dateOfBirth });
  const fresh = await getClient().resolveKid();
  if (fresh) set({ kid: fresh });
}

export async function saveSettings(patch: Partial<KidSettings>) {
  set({ settings: { ...state.settings, ...patch } });
  await getClient().saveSettings(state.kid.id, patch);
}

// store.ts

export async function pairDevice(kind: DeviceKind, label: string, code?: string) {
  const client = getClient();
  const payload: { kidId: string; kind: DeviceKind; label: string; id?: string; pairingCode?: string } = {
    kidId: state.kid.id,
    kind,
    label,
  };

  if (kind === 'laptop' && code) {
    payload.id = code; // device ID copied from the tray popup — used as the DB primary key
  } else if (kind === 'watch' && code) {
    payload.pairingCode = code; // 4-digit PIN shown on watch display
  }

  const device = await client.createDevice(payload);
  set({ devices: [...state.devices, device] });
}

export async function removeDevice(deviceId: string) {
  set({ devices: state.devices.filter(d => d.id !== deviceId) });
  await getClient().deleteDevice(deviceId);
}

export function awardStars(amount: number) {
  set({ bonusStars: state.bonusStars + amount });
}

export async function deleteRoutine(routineId: string) {
  set({
    routines: state.routines.filter(r => r.id !== routineId),
  });

  try {
    await getClient().deleteRoutine(routineId);
  } catch {
    queueMutation({ type: "deleteRoutine", payload: { id: routineId } });
  }
}



export async function addTaskToRoutine(routineId: string, task: Task) {
  const r = state.routines.find(r => r.id === routineId);
  if (!r) return;

  const tasks = [...r.tasks, task];

  set({
    routines: state.routines.map(r =>
      r.id === routineId ? { ...r, tasks } : r
    ),
  });

  try {
    await getClient().updateRoutine(routineId, { tasks });
  } catch {
    queueMutation({ type: "updateTasks", payload: { routineId, tasks } });
  }
}

export async function updateTaskInRoutine(routineId: string,taskId: string,patch: Partial<Task>) {
  const r = state.routines.find(r => r.id === routineId);
  if (!r) return;

  const tasks = r.tasks.map(t =>
    t.id === taskId ? { ...t, ...patch } : t
  );

  set({
    routines: state.routines.map(r =>
      r.id === routineId ? { ...r, tasks } : r
    ),
  });

  try {
    await getClient().updateRoutine(routineId, { tasks });
  } catch {
    queueMutation({ type: "updateTasks", payload: { routineId, tasks } });
  }
}

export async function deleteTaskFromRoutine(routineId: string, taskId: string) {
  const r = state.routines.find(r => r.id === routineId);
  if (!r) return;

  const tasks = r.tasks.filter(t => t.id !== taskId);

  set({
    routines: state.routines.map(r =>
      r.id === routineId ? { ...r, tasks } : r
    ),
  });

  try {
    await getClient().updateRoutine(routineId, { tasks });
  } catch {
    queueMutation({ type: "updateTasks", payload: { routineId, tasks } });
  }
}

export async function lockLaptop(kidId: string, task?: { taskId: string; label: string; expectedMinutes: number }) {
  const cmd: BlockCommand = {
    kidId, action: 'lock_screen',
    payload: task ? { taskId: task.taskId, taskLabel: task.label, expectedSec: task.expectedMinutes * 60 } : undefined,
    createdAt: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // auto-release after 2 h
  };
  set({ activeBlock: cmd });
  await getClient().sendBlockCommand(cmd);
}

export async function unlockLaptop(kidId: string) {
  const cmd: BlockCommand = { kidId, action: 'unlock_screen', createdAt: Date.now() };
  set({ activeBlock: null });
  await getClient().sendBlockCommand(cmd);
}

export async function blockApp(kidId: string, appName: string, task?: { taskId: string; label: string }) {
  const cmd: BlockCommand = {
    kidId, action: 'block_app',
    payload: { appName, taskId: task?.taskId, taskLabel: task?.label },
    createdAt: Date.now(),
  };
  set({ activeBlock: cmd });
  await getClient().sendBlockCommand(cmd);
}

export function useBootstrap() {
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  useEffect(() => {
    window.addEventListener("online", flushQueue);
    flushQueue(); // run once on boot

    return () => {
      window.removeEventListener("online", flushQueue);
    };
  }, []);
}

// ─────────────────────────────────────────────────────────
// Derived selectors — pure functions over the store
// ─────────────────────────────────────────────────────────

export interface ResolvedTask {
  taskId: string;
  routineId: string;
  routineName: string;
  label: string;
  icon: string;
  scheduledTime: string;
  expectedMinutes: number;
  status: 'done' | 'active' | 'pending' | 'missed';
  finishedAt?: number;
  startedAt?: number;
}

export function resolveTodayTasks(s: State): ResolvedTask[] {
  const out: ResolvedTask[] = [];
  for (const r of s.routines) {
    if (!r.active) continue;
    for (const t of r.tasks) {
      const ev = [...s.events]
        .filter(e => e.routineId === r.id && e.taskId === t.id)
        .sort((a, b) => b.ts - a.ts)[0];
      let status: ResolvedTask['status'] = 'pending';
      if (ev?.status === 'done') status = 'done';
      else if (ev?.status === 'started' || ev?.status === 'paused') status = 'active';
      else if (ev?.status === 'missed') status = 'missed';
      out.push({
        taskId: t.id, routineId: r.id, routineName: r.name, label: t.label,
        icon: t.icon, scheduledTime: t.scheduledTime,
        expectedMinutes: t.expectedMinutes,
        status,
        finishedAt: ev?.status === 'done' ? ev.ts : undefined,
        startedAt:  ev?.status === 'started' ? ev.ts : undefined,
      });
    }
  }
  return out;
}

export function activeTask(s: State): ResolvedTask | null {
  return resolveTodayTasks(s).find(t => t.status === 'active') ?? null;
}

export function unreadAlertCount(s: State): number {
  return s.alerts.filter(a => !a.read).length;
}

export function computeStreak(s: State): number {
  const doneByDay = new Set<string>();
  for (const ev of s.events) {
    if (ev.status === 'done') doneByDay.add(new Date(ev.ts).toDateString());
  }
  let streak = 0;
  const d = new Date();
  while (doneByDay.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function computeWeeklyStars(s: State): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let stars = 0;
  for (const ev of s.events) {
    if (ev.status !== 'done' || ev.ts < weekAgo) continue;
    for (const r of s.routines) {
      const task = r.tasks.find(t => t.id === ev.taskId);
      if (task) { stars += task.rewardStars; break; }
    }
  }
  return stars;
}

export function computeTotalStars(s: State): number {
  let earned = 0;
  for (const ev of s.events) {
    if (ev.status !== 'done') continue;
    for (const r of s.routines) {
      const task = r.tasks.find(t => t.id === ev.taskId);
      if (task) { earned += task.rewardStars; break; }
    }
  }
  return earned + s.bonusStars;
}

export function computeWeekCompliance(s: State): { d: string; pct: number }[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const total = s.routines.filter(r => r.active).reduce((sum, r) => sum + r.tasks.length, 0);

  return labels.map((d, i) => {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    if (total === 0) return { d, pct: 0 };
    const done = s.events.filter(ev =>
      ev.status === 'done' && ev.ts >= dayStart.getTime() && ev.ts < dayEnd.getTime()
    ).length;
    return { d, pct: Math.round(Math.min(100, (done / total) * 100)) };
  });
}

export function computeTimeOfDay(s: State): { morning: number; school: number; evening: number } {
  const bucket = (
  startTime: string | undefined | null
): 'morning' | 'school' | 'evening' => {
  if (!startTime || !startTime.includes(':')) return 'morning';

  const [hourStr] = startTime.split(':');
  const h = Number(hourStr);

  if (Number.isNaN(h)) return 'morning';
  if (h < 12) return 'morning';
  if (h < 17) return 'school';
  return 'evening';
};
  const totals = { morning: 0, school: 0, evening: 0 };
  const done   = { morning: 0, school: 0, evening: 0 };
  for (const r of s.routines) {
    if (!r.active) continue;
    const b = bucket(r.startTime);
    totals[b] += r.tasks.length;
    for (const ev of s.events) {
      if (ev.status === 'done' && ev.routineId === r.id) done[b]++;
    }
  }
  return {
    morning: totals.morning ? Math.round((done.morning / totals.morning) * 100) : 0,
    school:  totals.school  ? Math.round((done.school  / totals.school)  * 100) : 0,
    evening: totals.evening ? Math.round((done.evening / totals.evening) * 100) : 0,
  };
}

export function computeTrendWeeks(s: State): number[] {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const total = s.routines.filter(r => r.active).reduce((sum, r) => sum + r.tasks.length, 0) * 7;
  return Array.from({ length: 12 }, (_, i) => {
    const weekEnd = now - (11 - i) * weekMs;
    const weekStart = weekEnd - weekMs;
    if (total === 0) return 0;
    const done = s.events.filter(ev =>
      ev.status === 'done' && ev.ts >= weekStart && ev.ts < weekEnd
    ).length;
    return Math.round(Math.min(100, (done / total) * 100));
  });
}