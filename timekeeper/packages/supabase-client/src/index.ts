import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Routine, TaskEvent, Device, Alert, LaptopHeartbeat, Nudge, BlockCommand,
} from '@timekeeper/schema';
import {
  MOCK_ROUTINES, MOCK_DEVICES, MOCK_ALERTS, MOCK_EVENTS_TODAY,
  MOCK_HEARTBEAT_LATEST, MOCK_KID_ID,
} from './mock-data.js';

export * from './mock-data.js';

// ─────────────────────────────────────────────────────────
// Public API — every surface (caregiver, laptop, simulator) goes
// through this. When credentials missing or TIMEKEEPER_DEMO=true,
// it falls back to an in-memory store with seeded data so demos
// run on any laptop with no network.
// ─────────────────────────────────────────────────────────

export interface AuthSession {
  userId: string;
  email: string;
}

export interface KidProfile {
  id: string;
  name: string;
  age: number;
  initials: string;
  avatarColor: string;
}

export interface TimekeeperClient {
  isMock: boolean;

  // Auth
  getSession(): Promise<AuthSession | null>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signUp(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  onAuthChange(cb: (s: AuthSession | null) => void): () => void;

  // Resolve the active kid for the signed-in user. Single-kid for now;
  // returns the first kids row owned by the user. Returns null if none.
  resolveKid(): Promise<KidProfile | null>;

  // Data
  routines(kidId: string): Promise<Routine[]>;
  events(kidId: string, sinceTs?: number): Promise<TaskEvent[]>;
  devices(kidId: string): Promise<Device[]>;
  alerts(kidId: string): Promise<Alert[]>;
  heartbeat(kidId: string): Promise<LaptopHeartbeat | null>;

  updateRoutine(routineId: string, patch: { active?: boolean; tasks?: Routine['tasks'] }): Promise<void>;
  recordEvent(ev: TaskEvent): Promise<void>;
  sendNudge(n: Nudge): Promise<void>;
  pushHeartbeat(h: LaptopHeartbeat): Promise<void>;

  subscribeEvents(kidId: string, cb: (e: TaskEvent) => void): () => void;
  subscribeHeartbeat(kidId: string, cb: (h: LaptopHeartbeat) => void): () => void;
  subscribeNudges(kidId: string, cb: (n: Nudge) => void): () => void;

  // Block commands — caregiver writes, laptop reads via realtime
  sendBlockCommand(cmd: BlockCommand): Promise<void>;
  subscribeBlockCommands(kidId: string, cb: (cmd: BlockCommand) => void): () => void;
}

// ─────────────────────────────────────────────────────────
// Real Supabase implementation
// ─────────────────────────────────────────────────────────

class SupabaseImpl implements TimekeeperClient {
  isMock = false;
  private sb: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.sb = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }

  async getSession(): Promise<AuthSession | null> {
    const { data } = await this.sb.auth.getSession();
    if (!data.session) return null;
    return { userId: data.session.user.id, email: data.session.user.email ?? '' };
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('No session after sign-in');
    return { userId: data.session.user.id, email: data.session.user.email ?? '' };
  }

  async signUp(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.sb.auth.signUp({ email, password });
    if (error) throw error;
    // Email confirmation may be required depending on project settings.
    if (!data.session) {
      // Try immediate sign-in (works if confirm-email is disabled)
      return this.signIn(email, password);
    }
    return { userId: data.session.user.id, email: data.session.user.email ?? '' };
  }

  async signOut(): Promise<void> {
    const { error } = await this.sb.auth.signOut();
    if (error) throw error;
  }

  onAuthChange(cb: (s: AuthSession | null) => void): () => void {
    const { data } = this.sb.auth.onAuthStateChange((_evt, session) => {
      if (!session) cb(null);
      else cb({ userId: session.user.id, email: session.user.email ?? '' });
    });
    return () => data.subscription.unsubscribe();
  }

  async resolveKid(): Promise<KidProfile | null> {
    const { data, error } = await this.sb
      .from('kids').select('*').limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id, name: data.name, age: data.age ?? 8,
      initials: data.initials ?? data.name[0]?.toUpperCase() ?? '?',
      avatarColor: data.avatar_color ?? '#C99466',
    };
  }

  async routines(kidId: string): Promise<Routine[]> {
    const { data, error } = await this.sb
      .from('routines').select('*').eq('kid_id', kidId);
    if (error) throw error;
    return (data ?? []).map(rowToRoutine);
  }

  async events(kidId: string, sinceTs = 0): Promise<TaskEvent[]> {
    const { data, error } = await this.sb
      .from('task_events').select('*')
      .eq('kid_id', kidId).gte('ts', sinceTs).order('ts', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToEvent);
  }

  async devices(kidId: string): Promise<Device[]> {
    const { data, error } = await this.sb
      .from('devices').select('*').eq('kid_id', kidId);
    if (error) throw error;
    return (data ?? []).map(rowToDevice);
  }

  async alerts(kidId: string): Promise<Alert[]> {
    const { data, error } = await this.sb
      .from('alerts').select('*').eq('kid_id', kidId).order('ts', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToAlert);
  }

  async heartbeat(kidId: string): Promise<LaptopHeartbeat | null> {
    const { data, error } = await this.sb
      .from('laptop_heartbeat').select('*')
      .eq('kid_id', kidId).order('ts', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data ? rowToHeartbeat(data) : null;
  }

  async updateRoutine(routineId: string, patch: { active?: boolean; tasks?: Routine['tasks'] }): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.tasks !== undefined) row.tasks = patch.tasks;
    const { error } = await this.sb.from('routines').update(row).eq('id', routineId);
    if (error) throw error;
  }

  async recordEvent(ev: TaskEvent): Promise<void> {
    const { error } = await this.sb.from('task_events').insert(eventToRow(ev));
    if (error) throw error;
  }

  async sendNudge(n: Nudge): Promise<void> {
    const { error } = await this.sb.from('nudges').insert({
      kid_id: n.kidId, message: n.message, tone: n.tone,
      sent_at: n.sentAt, acknowledged: n.acknowledged,
    });
    if (error) throw error;
  }

  async pushHeartbeat(h: LaptopHeartbeat): Promise<void> {
    const { error } = await this.sb.from('laptop_heartbeat').insert(heartbeatToRow(h));
    if (error) throw error;
  }

  subscribeEvents(kidId: string, cb: (e: TaskEvent) => void): () => void {
    const ch = this.sb.channel(`events:${kidId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'task_events', filter: `kid_id=eq.${kidId}` },
          (p) => cb(rowToEvent(p.new)))
      .subscribe();
    return () => { void this.sb.removeChannel(ch); };
  }

  subscribeHeartbeat(kidId: string, cb: (h: LaptopHeartbeat) => void): () => void {
    const ch = this.sb.channel(`heartbeat:${kidId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'laptop_heartbeat', filter: `kid_id=eq.${kidId}` },
          (p) => cb(rowToHeartbeat(p.new)))
      .subscribe();
    return () => { void this.sb.removeChannel(ch); };
  }

  subscribeNudges(kidId: string, cb: (n: Nudge) => void): () => void {
    const ch = this.sb.channel(`nudges:${kidId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'nudges', filter: `kid_id=eq.${kidId}` },
          (p) => cb({
            kidId: p.new.kid_id, message: p.new.message, tone: p.new.tone,
            sentAt: p.new.sent_at, acknowledged: p.new.acknowledged,
          }))
      .subscribe();
    return () => { void this.sb.removeChannel(ch); };
  }

  async sendBlockCommand(cmd: BlockCommand): Promise<void> {
    const { error } = await this.sb.from('block_commands').insert({
      kid_id: cmd.kidId, device_id: cmd.deviceId ?? null,
      action: cmd.action, payload: cmd.payload ?? null,
      expires_at: cmd.expiresAt ?? null, created_at: cmd.createdAt,
    });
    if (error) throw error;
  }

  subscribeBlockCommands(kidId: string, cb: (cmd: BlockCommand) => void): () => void {
    const ch = this.sb.channel(`blocks:${kidId}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'block_commands', filter: `kid_id=eq.${kidId}` },
          (p) => cb(rowToBlockCommand(p.new)))
      .subscribe();
    return () => { void this.sb.removeChannel(ch); };
  }
}

// ─────────────────────────────────────────────────────────
// Mock implementation — in-memory pub/sub, persisted to localStorage
// when running in browser. Lets the whole demo run with no network.
// ─────────────────────────────────────────────────────────

type Listener<T> = (v: T) => void;

class MockImpl implements TimekeeperClient {
  isMock = true;
  private routinesStore = [...MOCK_ROUTINES];
  private eventsStore = [...MOCK_EVENTS_TODAY];
  private devicesStore = [...MOCK_DEVICES];
  private alertsStore = [...MOCK_ALERTS];
  private heartbeatStore: LaptopHeartbeat | null = MOCK_HEARTBEAT_LATEST;

  private eventListeners = new Set<Listener<TaskEvent>>();
  private heartbeatListeners = new Set<Listener<LaptopHeartbeat>>();
  private nudgeListeners = new Set<Listener<Nudge>>();
  private blockCommandListeners = new Set<Listener<BlockCommand>>();
  private authListeners = new Set<(s: AuthSession | null) => void>();
  private session: AuthSession | null = { userId: 'mock-user', email: 'demo@local' };

  constructor() {
    const ls = getLocalStorage();
    if (ls) {
      try {
        const saved = ls.getItem('tk_events');
        if (saved) this.eventsStore = JSON.parse(saved) as TaskEvent[];
      } catch { /* ignore */ }
    }
  }

  private persist() {
    const ls = getLocalStorage();
    if (!ls) return;
    try { ls.setItem('tk_events', JSON.stringify(this.eventsStore)); }
    catch { /* ignore */ }
  }

  async getSession() { return this.session; }
  async signIn(email: string, _pw: string) {
    this.session = { userId: 'mock-user', email };
    this.authListeners.forEach(l => l(this.session));
    return this.session;
  }
  async signUp(email: string, pw: string) { return this.signIn(email, pw); }
  async signOut() {
    this.session = null;
    this.authListeners.forEach(l => l(null));
  }
  onAuthChange(cb: (s: AuthSession | null) => void) {
    this.authListeners.add(cb);
    return () => { this.authListeners.delete(cb); };
  }
  async resolveKid(): Promise<KidProfile | null> {
    return { id: MOCK_KID_ID, name: 'Munene', age: 8, initials: 'M', avatarColor: '#C99466' };
  }

  async routines(kidId: string) { return this.routinesStore.filter(r => r.kidId === kidId); }
  async events(kidId: string, sinceTs = 0) {
    return this.eventsStore.filter(e => e.kidId === kidId && e.ts >= sinceTs);
  }
  async devices(kidId: string) { return this.devicesStore.filter(d => d.kidId === kidId); }
  async alerts(kidId: string) { return this.alertsStore.filter(a => a.kidId === kidId); }
  async heartbeat(_kidId: string) { return this.heartbeatStore; }

  async updateRoutine(routineId: string, patch: { active?: boolean; tasks?: Routine['tasks'] }) {
    this.routinesStore = this.routinesStore.map(r =>
      r.id === routineId ? { ...r, ...patch } : r
    );
  }

  async recordEvent(ev: TaskEvent) {
    this.eventsStore.push(ev);
    this.persist();
    this.eventListeners.forEach(l => l(ev));
  }

  async sendNudge(n: Nudge) {
    this.nudgeListeners.forEach(l => l(n));
  }

  async pushHeartbeat(h: LaptopHeartbeat) {
    this.heartbeatStore = h;
    this.heartbeatListeners.forEach(l => l(h));
  }

  subscribeEvents(_kidId: string, cb: Listener<TaskEvent>) {
    this.eventListeners.add(cb);
    return () => { this.eventListeners.delete(cb); };
  }
  subscribeHeartbeat(_kidId: string, cb: Listener<LaptopHeartbeat>) {
    this.heartbeatListeners.add(cb);
    return () => { this.heartbeatListeners.delete(cb); };
  }
  subscribeNudges(_kidId: string, cb: Listener<Nudge>) {
    this.nudgeListeners.add(cb);
    return () => { this.nudgeListeners.delete(cb); };
  }

  async sendBlockCommand(cmd: BlockCommand) {
    this.blockCommandListeners.forEach(l => l(cmd));
  }

  subscribeBlockCommands(_kidId: string, cb: Listener<BlockCommand>) {
    this.blockCommandListeners.add(cb);
    return () => { this.blockCommandListeners.delete(cb); };
  }
}

// ─────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────

export interface ClientConfig {
  url?: string;
  anonKey?: string;
  forceMock?: boolean;
}

export function createTimekeeperClient(cfg: ClientConfig = {}): TimekeeperClient {
  const url = cfg.url ?? readEnv('VITE_SUPABASE_URL') ?? readEnv('SUPABASE_URL');
  const key = cfg.anonKey ?? readEnv('VITE_SUPABASE_ANON_KEY') ?? readEnv('SUPABASE_ANON_KEY');
  const demo = readEnv('TIMEKEEPER_DEMO') === 'true' || readEnv('VITE_TIMEKEEPER_DEMO') === 'true';

  if (cfg.forceMock || demo || !url || !key || url.includes('your-project-ref')) {
    return new MockImpl();
  }
  return new SupabaseImpl(url, key);
}

// Browser builds (Vite) call setBrowserEnv() once at app start to stash
// import.meta.env into a global shim, since `import.meta` is a syntax
// error in CommonJS — which is what Electron's main process compiles to.
declare global {
  interface GlobalThis {
    __TK_ENV__?: Record<string, string | undefined>;
    localStorage?: Storage;
  }
}

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function setBrowserEnv(env: Record<string, string | undefined>) {
  (globalThis as { __TK_ENV__?: Record<string, string | undefined> }).__TK_ENV__ = env;
}

function getLocalStorage(): Storage | undefined {
  return (globalThis as { localStorage?: Storage }).localStorage;
}

function readEnv(k: string): string | undefined {
  // Node/Electron — always available in CJS or ESM
  if (typeof process !== 'undefined' && process.env && process.env[k]) return process.env[k];
  // Vite browser — set once at boot via setBrowserEnv(import.meta.env)
  const vite = (globalThis as { __TK_ENV__?: Record<string, string | undefined> }).__TK_ENV__;
  if (vite && vite[k]) return vite[k];
  return undefined;
}

// ─────────────────────────────────────────────────────────
// Row mappers (Supabase snake_case ↔ schema camelCase)
// ─────────────────────────────────────────────────────────

function rowToRoutine(r: Record<string, unknown>): Routine {
  return {
    id: r.id as string,
    kidId: r.kid_id as string,
    name: r.name as string,
    tasks: (r.tasks as Routine['tasks']) ?? [],
    daysOfWeek: (r.days_of_week as number[]) ?? [],
    startTime: r.start_time as string,
    active: r.active as boolean,
  };
}

function rowToEvent(r: Record<string, unknown>): TaskEvent {
  return {
    id: r.id as string | undefined,
    kidId: r.kid_id as string,
    routineId: r.routine_id as string,
    taskId: r.task_id as string,
    status: r.status as TaskEvent['status'],
    source: r.source as TaskEvent['source'],
    ts: r.ts as number,
    durationMs: r.duration_ms as number | undefined,
  };
}

function eventToRow(e: TaskEvent): Record<string, unknown> {
  return {
    kid_id: e.kidId, routine_id: e.routineId, task_id: e.taskId,
    status: e.status, source: e.source, ts: e.ts, duration_ms: e.durationMs ?? null,
  };
}

function rowToDevice(r: Record<string, unknown>): Device {
  return {
    id: r.id as string, kidId: r.kid_id as string, kind: r.kind as Device['kind'],
    label: r.label as string, battery: r.battery as number | undefined,
    lastSeen: r.last_seen as number, fwVersion: r.fw_version as string | undefined,
    paired: r.paired as boolean,
  };
}

function rowToAlert(r: Record<string, unknown>): Alert {
  return {
    id: r.id as string, kidId: r.kid_id as string, kind: r.kind as Alert['kind'],
    title: r.title as string, body: r.body as string,
    ts: r.ts as number, read: r.read as boolean,
  };
}

function rowToHeartbeat(r: Record<string, unknown>): LaptopHeartbeat {
  return {
    deviceId: r.device_id as string, kidId: r.kid_id as string,
    ts: r.ts as number,
    focus: r.focus as LaptopHeartbeat['focus'],
    idleSec: r.idle_sec as number, locked: r.locked as boolean,
    audioActive: r.audio_active as boolean,
  };
}

function heartbeatToRow(h: LaptopHeartbeat): Record<string, unknown> {
  return {
    device_id: h.deviceId, kid_id: h.kidId, ts: h.ts,
    focus: h.focus, idle_sec: h.idleSec, locked: h.locked,
    audio_active: h.audioActive,
  };
}

function rowToBlockCommand(r: Record<string, unknown>): BlockCommand {
  return {
    id: r.id as string | undefined,
    kidId: r.kid_id as string,
    deviceId: r.device_id as string | undefined,
    action: r.action as BlockCommand['action'],
    payload: r.payload as BlockCommand['payload'],
    expiresAt: r.expires_at as number | undefined,
    createdAt: r.created_at as number,
  };
}

export { MOCK_KID_ID };
