import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// Task / Routine
// ─────────────────────────────────────────────────────────

export const TaskIcon = z.enum([
  'sun', 'moon', 'brush', 'shirt', 'plate', 'bag', 'book',
  'pencil', 'shower', 'school', 'play', 'pause', 'star', 'dot',
]);
export type TaskIcon = z.infer<typeof TaskIcon>;

export const Task = z.object({
  id: z.string(),
  label: z.string().min(1).max(40),
  kidId: z.string(),
  icon: TaskIcon,
  expectedMinutes: z.number().int().positive().max(180),
  rewardStars: z.number().int().min(0).max(10),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/), // 'HH:MM'
});
export type Task = z.infer<typeof Task>;

export const Routine = z.object({
  id: z.string(),
  kidId: z.string(),
  name: z.string().min(1).max(40),
  tasks: z.array(Task).min(1).max(20),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // 'HH:MM'
  active: z.boolean(),
});
export type Routine = z.infer<typeof Routine>;

// ─────────────────────────────────────────────────────────
// Events — written by all 3 surfaces, replicated via Supabase realtime
// ─────────────────────────────────────────────────────────

export const TaskEventStatus = z.enum([
  'started', 'done', 'missed', 'skipped', 'retry', 'paused',
]);
export type TaskEventStatus = z.infer<typeof TaskEventStatus>;

export const EventSource = z.enum(['watch', 'phone', 'laptop', 'system']);
export type EventSource = z.infer<typeof EventSource>;

export const TaskEvent = z.object({
  id: z.string().uuid().optional(),
  kidId: z.string(),
  routineId: z.string(),
  taskId: z.string(),
  status: TaskEventStatus,
  source: EventSource,
  ts: z.number().int(), // epoch ms
  durationMs: z.number().int().nonnegative().optional(),
});
export type TaskEvent = z.infer<typeof TaskEvent>;

// ─────────────────────────────────────────────────────────
// Devices
// ─────────────────────────────────────────────────────────

export const DeviceKind = z.enum(['watch', 'laptop']);
export type DeviceKind = z.infer<typeof DeviceKind>;

export const Device = z.object({
  id: z.string(),
  kidId: z.string(),
  kind: DeviceKind,
  label: z.string(),
  battery: z.number().min(0).max(100).optional(),
  lastSeen: z.number().int(),
  fwVersion: z.string().optional(),
  paired: z.boolean(),
});
export type Device = z.infer<typeof Device>;

// ─────────────────────────────────────────────────────────
// Laptop heartbeat (foreground app, idle, lock state)
// ─────────────────────────────────────────────────────────

export const AppCategory = z.enum([
  'game', 'video', 'meeting', 'code', 'writing',
  'school', 'social', 'browser', 'system', 'other',
]);
export type AppCategory = z.infer<typeof AppCategory>;

export const LaptopHeartbeat = z.object({
  deviceId: z.string(),
  kidId: z.string(),
  ts: z.number().int(),
  focus: z.object({
    app: z.string(),
    title: z.string().optional(),
    url: z.string().optional(),
    category: AppCategory,
  }).nullable(),
  idleSec: z.number().int().nonnegative(),
  locked: z.boolean(),
  audioActive: z.boolean(),
});
export type LaptopHeartbeat = z.infer<typeof LaptopHeartbeat>;

// ─────────────────────────────────────────────────────────
// Nudge — caregiver → watch + laptop
// ─────────────────────────────────────────────────────────

export const NudgeTone = z.enum(['praise', 'start', 'break', 'reminder', 'custom']);
export type NudgeTone = z.infer<typeof NudgeTone>;

export const Nudge = z.object({
  id: z.string().uuid().optional(),
  kidId: z.string(),
  message: z.string().max(120),
  tone: NudgeTone,
  sentAt: z.number().int(),
  acknowledged: z.boolean().default(false),
});
export type Nudge = z.infer<typeof Nudge>;

// ─────────────────────────────────────────────────────────
// Alerts (escalation, reward, device, compliance)
// ─────────────────────────────────────────────────────────

export const AlertKind = z.enum(['miss-streak', 'reward', 'device', 'compliance']);
export type AlertKind = z.infer<typeof AlertKind>;

export const Alert = z.object({
  id: z.string(),
  kidId: z.string(),
  kind: AlertKind,
  title: z.string(),
  body: z.string(),
  ts: z.number().int(),
  read: z.boolean(),
});
export type Alert = z.infer<typeof Alert>;

// ─────────────────────────────────────────────────────────
// Categorization map — process name → category
// Shared between caregiver app and laptop monitor
// ─────────────────────────────────────────────────────────

export const CATEGORY_MAP: Record<string, AppCategory> = {
  // games
  'roblox': 'game', 'minecraft': 'game', 'steam': 'game', 'fortnite': 'game',
  'epic games launcher': 'game',
  // video
  'youtube': 'video', 'netflix': 'video', 'vlc': 'video',
  'quicktime player': 'video', 'mpv': 'video',
  // meeting
  'zoom': 'meeting', 'microsoft teams': 'meeting', 'google meet': 'meeting',
  'webex': 'meeting',
  // code
  'code': 'code', 'visual studio code': 'code', 'cursor': 'code',
  'intellij idea': 'code', 'pycharm': 'code', 'webstorm': 'code',
  'terminal': 'code', 'iterm2': 'code', 'windows terminal': 'code',
  // writing
  'word': 'writing', 'microsoft word': 'writing', 'google docs': 'writing',
  'notion': 'writing', 'obsidian': 'writing', 'pages': 'writing',
  // school / learning
  'khan academy': 'school', 'duolingo': 'school', 'scratch': 'school',
  // social
  'discord': 'social', 'whatsapp': 'social', 'telegram': 'social',
  'slack': 'social', 'instagram': 'social',
  // browsers (use title/url to narrow further)
  'chrome': 'browser', 'google chrome': 'browser',
  'firefox': 'browser', 'safari': 'browser', 'edge': 'browser',
  'microsoft edge': 'browser',
  // system
  'finder': 'system', 'explorer.exe': 'system', 'system settings': 'system',
  'system preferences': 'system', 'settings': 'system',
};

export function categorize(processName: string, title?: string): AppCategory {
  const key = processName.toLowerCase().trim();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key]!;
  if (title) {
    const t = title.toLowerCase();
    if (/youtube|netflix|hulu|disney/.test(t)) return 'video';
    if (/khan academy|duolingo|brilliant/.test(t)) return 'school';
    if (/docs\.google|notion\.so|obsidian/.test(t)) return 'writing';
    if (/github|gitlab|stackoverflow/.test(t)) return 'code';
  }
  return 'other';
}

// ─────────────────────────────────────────────────────────
// Block commands — caregiver → laptop (realtime control plane)
// One source of truth: all locks/unblocks are rows; both sides subscribe.
// ─────────────────────────────────────────────────────────

export const BlockAction = z.enum(['lock_screen', 'unlock_screen', 'block_app', 'unblock_app']);
export type BlockAction = z.infer<typeof BlockAction>;

export const BlockCommand = z.object({
  id: z.string().uuid().optional(),
  kidId: z.string(),
  deviceId: z.string().optional(),
  action: BlockAction,
  payload: z.object({
    taskId: z.string().optional(),
    taskLabel: z.string().optional(),
    expectedSec: z.number().optional(),
    appName: z.string().optional(),
  }).optional(),
  expiresAt: z.number().int().optional(), // auto-release epoch ms, null = manual only
  createdAt: z.number().int(),
});
export type BlockCommand = z.infer<typeof BlockCommand>;

// ─────────────────────────────────────────────────────────
// BLE protocol — watch ↔ phone (mirrors TaskEvent for offline buffering)
// ─────────────────────────────────────────────────────────

export const BLE_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const BLE_CHAR_EVENT_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // write
export const BLE_CHAR_ROUTINE_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // read/notify
export const BLE_CHAR_NUDGE_UUID = '6e400004-b5a3-f393-e0a9-e50e24dcca9e'; // notify
