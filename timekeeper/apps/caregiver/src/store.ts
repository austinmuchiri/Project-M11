import { useEffect, useSyncExternalStore } from 'react';
import {
  createTimekeeperClient, MOCK_KID,
  type TimekeeperClient, type AuthSession, type KidProfile,
} from '@timekeeper/supabase-client';
import type {
  Routine, Task, TaskEvent, Device, Alert, LaptopHeartbeat, Nudge, BlockCommand,
} from '@timekeeper/schema';

export const client: TimekeeperClient = createTimekeeperClient();

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
}

let state: State = {
  ready: false,
  isMock: client.isMock,
  session: null,
  kid: MOCK_KID,
  routines: [],
  events: [],
  devices: [],
  alerts: [],
  heartbeat: null,
  bootstrapError: null,
  activeBlock: null,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
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

let bootstrapped = false;
let unsubAuth: (() => void) | null = null;

export async function bootstrapAuth() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Restore session from local storage if any
  const session = await client.getSession().catch(() => null);
  set({ session });

  // React to subsequent auth changes (sign-in / sign-out)
  unsubAuth = client.onAuthChange((s) => {
    set({ session: s, ready: false });
    if (s) void loadKidData();
    else  set({ routines: [], events: [], devices: [], alerts: [], heartbeat: null });
  });

  if (session) await loadKidData();
  else set({ ready: true });   // unauth state still "ready" — show login
}

async function loadKidData() {
  try {
    const kid = await client.resolveKid();
    if (!kid) {
      set({
        ready: true,
        bootstrapError: 'No kid profile found for your account. Add one via the SQL editor (see IMPLEMENTATION.md §1).',
      });
      return;
    }
    const kidId = kid.id;
    const [routines, events, devices, alerts, heartbeat] = await Promise.all([
      client.routines(kidId),
      client.events(kidId, Date.now() - 24 * 60 * 60 * 1000),
      client.devices(kidId),
      client.alerts(kidId),
      client.heartbeat(kidId),
    ]);
    set({ ready: true, kid, routines, events, devices, alerts, heartbeat, bootstrapError: null });

    client.subscribeEvents(kidId, (e) => set({ events: [...state.events, e] }));
    client.subscribeHeartbeat(kidId, (h) => set({ heartbeat: h }));
  } catch (err) {
    set({ ready: true, bootstrapError: err instanceof Error ? err.message : 'Failed to load data' });
  }
}

export async function signOut() {
  await client.signOut();
  if (unsubAuth) { unsubAuth(); unsubAuth = null; }
  bootstrapped = false;
}

export async function recordEvent(ev: TaskEvent) {
  await client.recordEvent(ev);
  if (client.isMock) set({ events: [...state.events, ev] });
}

export async function sendNudge(n: Nudge) { await client.sendNudge(n); }

export async function toggleRoutineActive(routineId: string) {
  const r = state.routines.find(r => r.id === routineId);
  if (!r) return;
  const active = !r.active;
  set({ routines: state.routines.map(r => r.id === routineId ? { ...r, active } : r) });
  await client.updateRoutine(routineId, { active });
}

export async function addTaskToRoutine(routineId: string, task: Task) {
  const r = state.routines.find(r => r.id === routineId);
  if (!r) return;
  const tasks = [...r.tasks, task];
  set({ routines: state.routines.map(r => r.id === routineId ? { ...r, tasks } : r) });
  await client.updateRoutine(routineId, { tasks });
}

export async function updateTaskInRoutine(routineId: string, taskId: string, patch: Partial<Task>) {
  const r = state.routines.find(r => r.id === routineId);
  if (!r) return;
  const tasks = r.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t);
  set({ routines: state.routines.map(r => r.id === routineId ? { ...r, tasks } : r) });
  await client.updateRoutine(routineId, { tasks });
}

export async function lockLaptop(kidId: string, task?: { taskId: string; label: string; expectedMinutes: number }) {
  const cmd: BlockCommand = {
    kidId, action: 'lock_screen',
    payload: task ? { taskId: task.taskId, taskLabel: task.label, expectedSec: task.expectedMinutes * 60 } : undefined,
    createdAt: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // auto-release after 2 h
  };
  set({ activeBlock: cmd });
  await client.sendBlockCommand(cmd);
}

export async function unlockLaptop(kidId: string) {
  const cmd: BlockCommand = { kidId, action: 'unlock_screen', createdAt: Date.now() };
  set({ activeBlock: null });
  await client.sendBlockCommand(cmd);
}

export async function blockApp(kidId: string, appName: string, task?: { taskId: string; label: string }) {
  const cmd: BlockCommand = {
    kidId, action: 'block_app',
    payload: { appName, taskId: task?.taskId, taskLabel: task?.label },
    createdAt: Date.now(),
  };
  set({ activeBlock: cmd });
  await client.sendBlockCommand(cmd);
}

export function useBootstrap() {
  useEffect(() => { void bootstrapAuth(); }, []);
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
