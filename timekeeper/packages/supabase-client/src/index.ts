import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Routine, TaskEvent, Device, Alert, LaptopHeartbeat, Nudge, BlockCommand, DeviceKind,
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
  dateOfBirth?: string; // ISO 'YYYY-MM-DD', stored as Postgres date
}

export interface KidSettings {
  missThreshold: number;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  lockOnTask: boolean;
  blockGames: boolean;
}

export const DEFAULT_KID_SETTINGS: KidSettings = {
  missThreshold: 3,
  quietHours: true,
  quietStart: '21:00',
  quietEnd: '07:00',
  lockOnTask: false,
  blockGames: false,
};

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
  updateKid(kid_id: string, patch: { name?: string; initials?: string; dateOfBirth?: string }): Promise<void>;

  // Data
  routines(kid_id: string): Promise<Routine[]>;
  events(kid_id: string, sinceTs?: number): Promise<TaskEvent[]>;
  devices(kid_id: string): Promise<Device[]>;
  alerts(kid_id: string): Promise<Alert[]>;
  heartbeat(kid_id: string): Promise<LaptopHeartbeat | null>;

  getSettings(kid_id: string): Promise<KidSettings>;
  saveSettings(kid_id: string, patch: Partial<KidSettings>): Promise<void>;
  createDevice(d: { kid_id: string; kind: DeviceKind; label: string; id?: string; hardwareId?: string }): Promise<Device>;
  findDeviceByDeviceId(deviceId: string): Promise<Device | null>;
  registerDevice(deviceId: string, hardwareId: string): Promise<void>;
  deleteDevice(deviceId: string): Promise<void>;


  createRoutine(routine: Routine): Promise<Routine>;
  updateRoutine(routineId: string, patch: { active?: boolean; tasks?: Routine['tasks']; name?: string; startTime?: string }): Promise<void>;
  deleteRoutine(routineId: string): Promise<void>;
  recordEvent(ev: TaskEvent): Promise<void>;
  sendNudge(n: Nudge): Promise<void>;
  pushHeartbeat(h: LaptopHeartbeat): Promise<void>;

  subscribeEvents(kid_id: string, cb: (e: TaskEvent) => void): () => void;
  subscribeHeartbeat(kid_id: string, cb: (h: LaptopHeartbeat) => void): () => void;
  subscribeNudges(kid_id: string, cb: (n: Nudge) => void): () => void;

  // Block commands — caregiver writes, laptop reads via realtime
  sendBlockCommand(cmd: BlockCommand): Promise<void>;
  subscribeBlockCommands(kid_id: string, cb: (cmd: BlockCommand) => void): () => void;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

// ─────────────────────────────────────────────────────────
// Real Supabase implementation
// ─────────────────────────────────────────────────────────

class SupabaseImpl implements TimekeeperClient {
  isMock = false;
  private sb: SupabaseClient;

  constructor(url: string, key: string, serviceRole = false) {
    this.sb = createClient(url, key, {
      auth: serviceRole ? { persistSession: false, autoRefreshToken: false } : undefined,
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }

  async getSession(): Promise<AuthSession | null> {
    const { data } = await this.sb.auth.getSession();
    console.log("userId:", data.session?.user.id);
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
    const dob: string | undefined = data.date_of_birth ?? undefined;
    return {
      id: data.id, name: data.name,
      age: dob ? calcAge(dob) : (data.age ?? 8),
      initials: data.initials ?? data.name[0]?.toUpperCase() ?? '?',
      avatarColor: data.avatar_color ?? '#C99466',
      dateOfBirth: dob,
    };
  }

  async updateKid(kid_id: string, patch: { name?: string; initials?: string; dateOfBirth?: string }): Promise<void> {
    const row: Record<string, unknown> = {};
    if (patch.name      !== undefined) row.name     = patch.name;
    if (patch.initials  !== undefined) row.initials = patch.initials;
    if (patch.dateOfBirth !== undefined) {
      row.date_of_birth = patch.dateOfBirth;
      row.age = calcAge(patch.dateOfBirth); // keep legacy column in sync
    }
    const { error } = await this.sb.from('kids').update(row).eq('id', kid_id);
    if (error) throw error;
  }

  async routines(kid_id: string): Promise<Routine[]> {
    const { data, error } = await this.sb
      .from('routines').select(`*,tasks (*)`).eq('kid_id', kid_id);
    if (error) throw error;
    return (data ?? []).map(rowToRoutine);
  }

  async events(kid_id: string, sinceTs = 0): Promise<TaskEvent[]> {
    const { data, error } = await this.sb
      .from('task_events').select('*')
      .eq('kid_id', kid_id).gte('ts', sinceTs).order('ts', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToEvent);
  }

  async devices(kid_id: string): Promise<Device[]> {
    const { data, error } = await this.sb
      .from('devices').select('*').eq('kid_id', kid_id);
    if (error) throw error;
    return (data ?? []).map(rowToDevice);
  }

  // Add to SupabaseImpl
async findDeviceByDeviceId(deviceId: string) {
  console.log(
    '[supabase-client] querying device:',
    deviceId
  );

  const { data, error } = await this.sb
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .maybeSingle();

  console.log(
    '[supabase-client] query result:',
    data
  );

  if (error) {
    console.error(
      '[supabase-client] query error:',
      error
    );

    throw error;
  }

  return data;
}

  async alerts(kid_id: string): Promise<Alert[]> {
    const { data, error } = await this.sb
      .from('alerts').select('*').eq('kid_id', kid_id).order('ts', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToAlert);
  }

  async heartbeat(kid_id: string): Promise<LaptopHeartbeat | null> {
    const { data, error } = await this.sb
      .from('laptop_heartbeat').select('*')
      .eq('kid_id', kid_id).order('ts', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data ? rowToHeartbeat(data) : null;
  }

  async getSettings(kid_id: string): Promise<KidSettings> {
    try {
      const { data } = await this.sb.from('kid_settings').select('*').eq('kid_id', kid_id).maybeSingle();
      if (!data) return { ...DEFAULT_KID_SETTINGS };
      return {
        missThreshold:  data.miss_threshold  ?? DEFAULT_KID_SETTINGS.missThreshold,
        quietHours:     data.quiet_hours     ?? DEFAULT_KID_SETTINGS.quietHours,
        quietStart:     data.quiet_start     ?? DEFAULT_KID_SETTINGS.quietStart,
        quietEnd:       data.quiet_end       ?? DEFAULT_KID_SETTINGS.quietEnd,
        lockOnTask:     data.lock_on_task    ?? DEFAULT_KID_SETTINGS.lockOnTask,
        blockGames:     data.block_games     ?? DEFAULT_KID_SETTINGS.blockGames,
      };
    } catch { return { ...DEFAULT_KID_SETTINGS }; }
  }

  async saveSettings(kid_id: string, patch: Partial<KidSettings>): Promise<void> {
    try {
      const row: Record<string, unknown> = { kid_id: kid_id };
      if (patch.missThreshold !== undefined) row.miss_threshold = patch.missThreshold;
      if (patch.quietHours    !== undefined) row.quiet_hours    = patch.quietHours;
      if (patch.quietStart    !== undefined) row.quiet_start    = patch.quietStart;
      if (patch.quietEnd      !== undefined) row.quiet_end      = patch.quietEnd;
      if (patch.lockOnTask    !== undefined) row.lock_on_task   = patch.lockOnTask;
      if (patch.blockGames    !== undefined) row.block_games    = patch.blockGames;
      const { error } = await this.sb.from('kid_settings').upsert(row, { onConflict: 'kid_id' });
      if (error) console.warn('Settings persist failed:', error.message);
    } catch { /* degrade gracefully if table missing */ }
  }

  async createDevice(payload: {
    kid_id: string;
    kind: string;
    label: string;
    id?: string;
    pairingCode?: string;
    hardware_id?: string | null;
  }) {
    const insertPayload = {
      id: payload.id,
      kid_id: payload.kid_id,
      kind: payload.kind,
      label: payload.label,

      pairing_code: payload.pairingCode ?? null,

      /*
        MUST start null.
        Electron tray later stamps this
        during successful handshake.
      */
      hardware_id: payload.hardware_id ?? null,
    };

    console.log('[supabase-client] insert device:', insertPayload);

    const { data, error } = await this.sb
      .from('devices')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[supabase-client] createDevice failed:', error);
      throw error;
    }

    return data;
  }

  async registerDevice(deviceId: string, hardwareId: string): Promise<void> {
    const { error } = await this.sb
      .from('devices')
      .update({ hardware_id: hardwareId, last_seen: Date.now() })
      .eq('id', deviceId);
      
    if (error) console.warn('[supabase] registerDevice failed:', error.message);
  }

  async deleteDevice(deviceId: string): Promise<void> {
    const { error } = await this.sb.from('devices').delete().eq('id', deviceId);
    if (error) throw error;
  }

  async createRoutine(r: Routine): Promise<Routine> {
    console.log("📤 Attempting to insert routine:", r);

  // Step 1: Insert routine
  const { data: routine, error } = await this.sb
    .from('routines')
    .insert({
      id: r.id,
      kid_id: r.kid_id,
      name: r.name,
      start_time: r.startTime,
      active: r.active,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Routine insert failed:", error);
    throw error;
  }

  // Step 2: Insert tasks
  if (r.tasks && r.tasks.length > 0) {
    const tasksToInsert = r.tasks.map((t, index) => ({
      id: t.id,
      routine_id: r.id,
      kid_id: r.kid_id,
      label: t.label,
      icon: t.icon,
      scheduled_time: t.scheduledTime,
      expected_minutes: t.expectedMinutes,
      reward_stars: t.rewardStars ?? 1,
      position: index,
    }));

    const { error: taskError } = await this.sb
      .from('tasks')
      .insert(tasksToInsert);

    if (taskError) {
      console.error("❌ Task insert failed:", taskError);
      throw taskError;
    }

    console.log("✅ Tasks inserted:", tasksToInsert);
  }

  console.log("✅ Routine inserted:", routine);

  return {
    id: routine.id,
    kid_id: routine.kid_id,
    name: routine.name,
    startTime: routine.start_time,
    active: routine.active,
    tasks: r.tasks ?? [],
  };
}



  async updateRoutine(
  routineId: string,
  patch: {
    active?: boolean;
    name?: string;
    tasks?: Routine['tasks'];
    startTime?: string;
  }
): Promise<void> {

  // STEP 0:
  // Fetch routine so we ALWAYS get authoritative kid_id
  const { data: routineRow, error: routineFetchError } = await this.sb
    .from('routines')
    .select('kid_id')
    .eq('id', routineId)
    .single();

  if (routineFetchError) throw routineFetchError;

  const kidId = routineRow.kid_id as string;

  // STEP 1:
  // Update routine metadata
  const routinePatch: Record<string, unknown> = {};

  if (patch.active !== undefined) {
    routinePatch.active = patch.active;
  }

  if (patch.name !== undefined) {
    routinePatch.name = patch.name;
  }

  if (patch.startTime !== undefined) {
    routinePatch.start_time = patch.startTime;
  }

  if (Object.keys(routinePatch).length > 0) {
    const { error } = await this.sb
      .from('routines')
      .update(routinePatch)
      .eq('id', routineId);

    if (error) throw error;
  }

  // STEP 2:
  // Replace tasks
  if (patch.tasks) {

    // Delete old tasks
    const { error: deleteError } = await this.sb
      .from('tasks')
      .delete()
      .eq('routine_id', routineId);

    if (deleteError) throw deleteError;

    // Insert new tasks
    if (patch.tasks.length > 0) {

      const tasksToInsert = patch.tasks.map((t, index) => ({
        id: t.id,
        routine_id: routineId,

        // IMPORTANT:
        // NEVER trust frontend kidId here
        kid_id: kidId,

        label: t.label,
        icon: t.icon,
        scheduled_time: t.scheduledTime,
        expected_minutes: t.expectedMinutes,
        reward_stars: t.rewardStars ?? 1,
        position: index,
      }));

      const { error: insertError } = await this.sb
        .from('tasks')
        .insert(tasksToInsert);

      if (insertError) {
        console.error("Task insert failed:", insertError);
        throw insertError;
      }
    }
  }
}
  async deleteRoutine(routineId: string): Promise<void> {
    const { error } = await this.sb.from('routines').delete().eq('id', routineId);
    if (error) throw error;
  }

  async recordEvent(ev: TaskEvent): Promise<void> {
    const { error } = await this.sb.from('task_events').insert(eventToRow(ev));
    if (error) throw error;
  }

  async sendNudge(n: Nudge): Promise<void> {
    const { error } = await this.sb.from('nudges').insert({
      kid_id: n.kid_id, message: n.message, tone: n.tone,
      sent_at: n.sentAt, acknowledged: n.acknowledged,
    });
    if (error) throw error;
  }

  async pushHeartbeat(h: LaptopHeartbeat): Promise<void> {
    const { error } = await this.sb.from('laptop_heartbeat').insert(heartbeatToRow(h));
    if (error) throw error;
  }

  subscribeEvents(kid_id: string, cb: (e: TaskEvent) => void): () => void {
    const ch = this.sb.channel(`events:${kid_id}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'task_events', filter: `kid_id=eq.${kid_id}` },
          (p) => cb(rowToEvent(p.new)))
      .subscribe();
    return () => { void this.sb.removeChannel(ch); };
  }

  subscribeHeartbeat(kid_id: string, cb: (h: LaptopHeartbeat) => void): () => void {
    const ch = this.sb.channel(`heartbeat:${kid_id}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'laptop_heartbeat', filter: `kid_id=eq.${kid_id}` },
          (p) => cb(rowToHeartbeat(p.new)))
      .subscribe();
    return () => { void this.sb.removeChannel(ch); };
  }

  subscribeNudges(kid_id: string, cb: (n: Nudge) => void): () => void {
    const ch = this.sb.channel(`nudges:${kid_id}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'nudges', filter: `kid_id=eq.${kid_id}` },
          (p) => cb({
            kid_id: p.new.kid_id, message: p.new.message, tone: p.new.tone,
            sentAt: p.new.sent_at, acknowledged: p.new.acknowledged,
          }))
      .subscribe();
    return () => { void this.sb.removeChannel(ch); };
  }

  async sendBlockCommand(cmd: BlockCommand): Promise<void> {
    const { error } = await this.sb.from('block_commands').insert({
      kid_id: cmd.kid_id, device_id: cmd.deviceId ?? null,
      action: cmd.action, payload: cmd.payload ?? null,
      expires_at: cmd.expiresAt ?? null, created_at: cmd.createdAt,
    });
    if (error) throw error;
  }

  subscribeBlockCommands(kid_id: string, cb: (cmd: BlockCommand) => void): () => void {
    const ch = this.sb.channel(`blocks:${kid_id}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'block_commands', filter: `kid_id=eq.${kid_id}` },
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
  private settingsStore: KidSettings = { ...DEFAULT_KID_SETTINGS };
  private bonusStarsStore = 0;

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
        // Load everything from storage
        const savedEvents = ls.getItem('tk_events');
        const savedRoutines = ls.getItem('tk_routines');
        const savedDevices = ls.getItem('tk_devices');
        const savedSettings = ls.getItem('tk_settings');

        if (savedEvents) this.eventsStore = JSON.parse(savedEvents);
        if (savedRoutines) this.routinesStore = JSON.parse(savedRoutines);
        if (savedDevices) this.devicesStore = JSON.parse(savedDevices);
        if (savedSettings) this.settingsStore = JSON.parse(savedSettings);
      } catch (e) { console.error("Mock load failed", e); }
    }
  }

  private persist(key: 'tk_events' | 'tk_routines' | 'tk_devices' | 'tk_settings', data: any) {
    const ls = getLocalStorage();
    if (!ls) return;
    try { ls.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn(`Mock save failed for ${key}`, e); }
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
  private mockKid: KidProfile = {
    id: MOCK_KID_ID, name: 'Munene', age: 8, initials: 'M',
    avatarColor: '#C99466', dateOfBirth: '2016-03-15',
  };

  async resolveKid(): Promise<KidProfile | null> {
    return { ...this.mockKid };
  }

  async updateKid(_kid_id: string, patch: { name?: string; initials?: string; dateOfBirth?: string }): Promise<void> {
    if (patch.name      !== undefined) this.mockKid.name     = patch.name;
    if (patch.initials  !== undefined) this.mockKid.initials = patch.initials;
    if (patch.dateOfBirth !== undefined) {
      this.mockKid.dateOfBirth = patch.dateOfBirth;
      this.mockKid.age = calcAge(patch.dateOfBirth);
    }
  }

  async routines(kid_id: string) { return this.routinesStore.filter(r => r.kid_id === kid_id); }

  async events(kid_id: string, sinceTs = 0) {
    return this.eventsStore.filter(e => e.kid_id === kid_id && e.ts >= sinceTs);
  }
  async devices(kid_id: string) { return this.devicesStore.filter(d => d.kid_id === kid_id); }

  async findDeviceByDeviceId(deviceId: string): Promise<Device | null> {
    const device = this.devicesStore.find(d => d.id === deviceId);
    return device ? { ...device } : null;
  }

  async alerts(kid_id: string) { return this.alertsStore.filter(a => a.kid_id === kid_id); }

  async heartbeat(_kid_id: string) { return this.heartbeatStore; }

  async getSettings(_kid_id: string): Promise<KidSettings> { return { ...this.settingsStore }; }

  async saveSettings(_kid_id: string, patch: Partial<KidSettings>): Promise<void> {
    this.settingsStore = { ...this.settingsStore, ...patch };
    this.persist('tk_settings', this.settingsStore);  
  }
  
  async createDevice(d: { kid_id: string; kind: DeviceKind; label: string; id?: string; hardwareId?: string }): Promise<Device> {
    const device: Device = {
      id: d.id ?? `dev_${d.kind}_${Date.now()}`, kid_id: d.kid_id, kind: d.kind,
      label: d.label, lastSeen: Date.now(), paired: true,
      hardwareId: d.hardwareId,
    };
    const existing = this.devicesStore.findIndex(x => x.id === device.id);
    if (existing >= 0) this.devicesStore[existing] = device;
    else this.devicesStore.push(device);
    this.persist('tk_devices', this.devicesStore);
    return device;
  }

  async registerDevice(deviceId: string, hardwareId: string): Promise<void> {
    const device = this.devicesStore.find(d => d.id === deviceId);
    if (device) {
      device.hardwareId = hardwareId;
      device.lastSeen = Date.now();
      this.persist('tk_devices', this.devicesStore);
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    this.devicesStore = this.devicesStore.filter(d => d.id !== deviceId);
    this.persist('tk_devices', this.devicesStore);
  }

  async createRoutine(r: Routine): Promise<Routine> {
      this.routinesStore.push(r);
      this.persist('tk_routines', this.routinesStore);
      return r;
  }

  async updateRoutine(routineId: string, patch: any) {
    this.routinesStore = this.routinesStore.map(r =>
      r.id === routineId ? { ...r, ...patch } : r
    );
    this.persist('tk_routines', this.routinesStore);
  }

  async deleteRoutine(routineId: string) {
    this.routinesStore = this.routinesStore.filter(r => r.id !== routineId);
    this.persist('tk_routines', this.routinesStore);
  }

  async recordEvent(ev: TaskEvent) {
    this.eventsStore.push(ev);
    this.persist('tk_events', this.eventsStore);
    this.eventListeners.forEach(l => l(ev));
  }

  async sendNudge(n: Nudge) {
    this.nudgeListeners.forEach(l => l(n));
  }

  async pushHeartbeat(h: LaptopHeartbeat) {
    this.heartbeatStore = h;
    this.heartbeatListeners.forEach(l => l(h));
  }

  subscribeEvents(_kid_id: string, cb: Listener<TaskEvent>) {
    this.eventListeners.add(cb);
    return () => { this.eventListeners.delete(cb); };
  }

  subscribeHeartbeat(_kid_id: string, cb: Listener<LaptopHeartbeat>) {
    this.heartbeatListeners.add(cb);
    return () => { this.heartbeatListeners.delete(cb); };
  }

  subscribeNudges(_kid_id: string, cb: Listener<Nudge>) {
    this.nudgeListeners.add(cb);
    return () => { this.nudgeListeners.delete(cb); };
  }

  async sendBlockCommand(cmd: BlockCommand) {
    this.blockCommandListeners.forEach(l => l(cmd));
  }

  subscribeBlockCommands(_kid_id: string, cb: Listener<BlockCommand>) {
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
  serviceRoleKey?: string;
  forceMock?: boolean;
}

export function createTimekeeperClient(cfg: ClientConfig = {}): TimekeeperClient {
  const url        = cfg.url            ?? readEnv('SUPABASE_URL')              ?? readEnv('VITE_SUPABASE_URL');
  const serviceKey = cfg.serviceRoleKey ?? readEnv('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey    = cfg.anonKey        ?? readEnv('SUPABASE_ANON_KEY')         ?? readEnv('VITE_SUPABASE_ANON_KEY');
  const key        = serviceKey ?? anonKey;
  const demo = readEnv('TIMEKEEPER_DEMO') === 'true' || readEnv('VITE_TIMEKEEPER_DEMO') === 'true';

  if (cfg.forceMock || demo || !url || !key || url.includes('your-project-ref')) {
    return new MockImpl();
  }
  return new SupabaseImpl(url, key, !!serviceKey);
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


function rowToRoutine(r: Record<string, unknown>): Routine {
  return {
    id: r.id as string,
    kid_id: r.kid_id as string,
    name: r.name as string,
    tasks: (Array.isArray(r.tasks) ? r.tasks : []).map((t: any) => ({
      id: t.id,
      kid_id: t.kid_id ?? r.kid_id,
      label: t.label,
      icon: t.icon,
      scheduledTime: t.scheduled_time,
      expectedMinutes: t.expected_minutes,
      rewardStars: t.reward_stars,
    })),
    startTime: r.start_time as string,
    active: r.active as boolean,
  };
}

function rowToEvent(r: Record<string, unknown>): TaskEvent {
  return {
    id: r.id as string | undefined,
    kid_id: r.kid_id as string,
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
    kid_id: e.kid_id, routine_id: e.routineId, task_id: e.taskId,
    status: e.status, source: e.source, ts: e.ts, duration_ms: e.durationMs ?? null,
  };
}

function rowToDevice(r: Record<string, unknown>): Device {
  return {
    id: r.id as string, kid_id: r.kid_id as string, kind: r.kind as Device['kind'],
    label: r.label as string, battery: r.battery as number | undefined,
    lastSeen: r.last_seen as number, fwVersion: r.fw_version as string | undefined,
    hardwareId: r.hardware_id as string | undefined,
    paired: r.paired as boolean,
  };
}

function rowToAlert(r: Record<string, unknown>): Alert {
  return {
    id: r.id as string, kid_id: r.kid_id as string, kind: r.kind as Alert['kind'],
    title: r.title as string, body: r.body as string,
    ts: r.ts as number, read: r.read as boolean,
  };
}

function rowToHeartbeat(r: Record<string, unknown>): LaptopHeartbeat {
  return {
    deviceId: r.device_id as string, kid_id: r.kid_id as string,
    ts: r.ts as number,
    focus: r.focus as LaptopHeartbeat['focus'],
    idleSec: r.idle_sec as number, locked: r.locked as boolean,
    audioActive: r.audio_active as boolean,
  };
}

function heartbeatToRow(h: LaptopHeartbeat): Record<string, unknown> {
  return {
    device_id: h.deviceId, kid_id: h.kid_id, ts: h.ts,
    focus: h.focus, idle_sec: h.idleSec, locked: h.locked,
    audio_active: h.audioActive,
  };
}

function rowToBlockCommand(r: Record<string, unknown>): BlockCommand {
  return {
    id: r.id as string | undefined,
    kid_id: r.kid_id as string,
    deviceId: r.device_id as string | undefined,
    action: r.action as BlockCommand['action'],
    payload: r.payload as BlockCommand['payload'],
    expiresAt: r.expires_at as number | undefined,
    createdAt: r.created_at as number,
  };
}

export { MOCK_KID_ID };