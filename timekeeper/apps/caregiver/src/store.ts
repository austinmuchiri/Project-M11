import { useEffect, useSyncExternalStore } from 'react';
import {
  createTimekeeperClient, MOCK_KID_ID, MOCK_KID,
  type TimekeeperClient,
} from '@timekeeper/supabase-client';
import type {
  Routine, TaskEvent, Device, Alert, LaptopHeartbeat, Nudge,
} from '@timekeeper/schema';

const client: TimekeeperClient = createTimekeeperClient();

export interface State {
  ready: boolean;
  isMock: boolean;
  kid: typeof MOCK_KID;
  routines: Routine[];
  events: TaskEvent[];
  devices: Device[];
  alerts: Alert[];
  heartbeat: LaptopHeartbeat | null;
}

let state: State = {
  ready: false,
  isMock: client.isMock,
  kid: MOCK_KID,
  routines: [],
  events: [],
  devices: [],
  alerts: [],
  heartbeat: null,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getState = () => state;
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getState()), () => selector(state));
}

let bootstrapped = false;

export async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  const kidId = MOCK_KID_ID;
  const [routines, events, devices, alerts, heartbeat] = await Promise.all([
    client.routines(kidId),
    client.events(kidId, Date.now() - 24 * 60 * 60 * 1000),
    client.devices(kidId),
    client.alerts(kidId),
    client.heartbeat(kidId),
  ]);
  set({ ready: true, routines, events, devices, alerts, heartbeat });

  client.subscribeEvents(kidId, (e) => set({ events: [...state.events, e] }));
  client.subscribeHeartbeat(kidId, (h) => set({ heartbeat: h }));
}

export async function recordEvent(ev: TaskEvent) {
  await client.recordEvent(ev);
  if (client.isMock) set({ events: [...state.events, ev] });
}

export async function sendNudge(n: Nudge) { await client.sendNudge(n); }

export function useBootstrap() {
  useEffect(() => { void bootstrap(); }, []);
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
