import type { Routine, TaskEvent, Device, Alert, LaptopHeartbeat } from '@timekeeper/schema';

export const MOCK_KID_ID = 'kid_munene';

export const MOCK_KID = {
  id: MOCK_KID_ID,
  name: 'Munene',
  age: 8,
  initials: 'M',
  avatarColor: '#C99466',
};

export const MOCK_ROUTINES: Routine[] = [
  {
    id: 'morning',
    kidId: MOCK_KID_ID,
    name: 'Morning Routine',
    startTime: '07:00',
    active: true,
    tasks: [
      { id: 't1',  kidId: 'kid_munene', label: 'Wake Up',     icon: 'sun',    expectedMinutes: 2,  rewardStars: 1, scheduledTime: '07:00' },
      { id: 't2', kidId: 'kid_munene',  label: 'Brush Teeth', icon: 'brush',  expectedMinutes: 3,  rewardStars: 1, scheduledTime: '07:10' },
      { id: 't3', kidId: 'kid_munene',  label: 'Get Dressed', icon: 'shirt',  expectedMinutes: 5,  rewardStars: 1, scheduledTime: '07:20' },
      { id: 't4', kidId: 'kid_munene', label: 'Breakfast',   icon: 'plate',  expectedMinutes: 10, rewardStars: 1, scheduledTime: '07:30' },
      { id: 't5', kidId: 'kid_munene', label: 'Pack Bag',    icon: 'bag',    expectedMinutes: 5,  rewardStars: 1, scheduledTime: '07:40' },
    ],
  },
  {
    id: 'school',
    kidId: MOCK_KID_ID,
    name: 'School Block',
    startTime: '08:30',
    active: true,
    tasks: [
      { id: 's1', kidId: 'kid_munene', label: 'Math',    icon: 'pencil', expectedMinutes: 45, rewardStars: 2, scheduledTime: '09:00' },
      { id: 's2', kidId: 'kid_munene', label: 'Reading', icon: 'book',   expectedMinutes: 30, rewardStars: 2, scheduledTime: '10:30' },
      { id: 's3', kidId: 'kid_munene', label: 'Lunch',   icon: 'plate',  expectedMinutes: 30, rewardStars: 1, scheduledTime: '12:00' },
      { id: 's4', kidId: 'kid_munene', label: 'Science', icon: 'book',   expectedMinutes: 45, rewardStars: 2, scheduledTime: '13:30' },
    ],
  },
  {
    id: 'evening',
    kidId: MOCK_KID_ID,
    name: 'Evening Routine',
    startTime: '18:30',
    active: true,
    tasks: [
      { id: 'e1', kidId: 'kid_munene',label: 'Dinner',   icon: 'plate',  expectedMinutes: 30, rewardStars: 1, scheduledTime: '18:30' },
      { id: 'e2', kidId: 'kid_munene',label: 'Homework', icon: 'pencil', expectedMinutes: 30, rewardStars: 2, scheduledTime: '19:00' },
      { id: 'e3', kidId: 'kid_munene',label: 'Shower',   icon: 'shower', expectedMinutes: 15, rewardStars: 1, scheduledTime: '19:45' },
      { id: 'e4', kidId: 'kid_munene',label: 'Read',     icon: 'book',   expectedMinutes: 20, rewardStars: 1, scheduledTime: '20:00' },
      { id: 'e5', kidId: 'kid_munene',label: 'Sleep',    icon: 'moon',   expectedMinutes: 1,  rewardStars: 1, scheduledTime: '20:30' },
    ],
  },
];

export const MOCK_DEVICES: Device[] = [
  { id: 'dev_watch_munene', kidId: MOCK_KID_ID, kind: 'watch',  label: "Munene's Watch",
    battery: 64, lastSeen: Date.now() - 12_000, fwVersion: '0.4.1', paired: true },
  { id: 'dev_laptop_munene', kidId: MOCK_KID_ID, kind: 'laptop', label: "Munene's Laptop",
    lastSeen: Date.now() - 4_000, paired: true }
];

export const MOCK_ALERTS: Alert[] = [
  { id: 'n1', kidId: MOCK_KID_ID, kind: 'miss-streak',
    title: '3 missed in a row · School Block',
    body: 'Munene missed Math, Reading and a snack break this morning.',
    ts: Date.now() - 5 * 60_000, read: false },
  { id: 'n2', kidId: MOCK_KID_ID, kind: 'reward',
    title: 'Streak milestone: 12 days',
    body: 'Auto-awarded ★5 to Munene.',
    ts: Date.now() - 60 * 60_000, read: false },
  { id: 'n3', kidId: MOCK_KID_ID, kind: 'device',
    title: 'Watch battery 20%',
    body: 'Suggest charging at next break.',
    ts: Date.now() - 12 * 60 * 60_000, read: true },
  { id: 'n4', kidId: MOCK_KID_ID, kind: 'compliance',
    title: 'Weekly report ready',
    body: 'Apr 14–20 · 87% completion · -3% vs prior week.',
    ts: Date.now() - 5 * 24 * 60 * 60_000, read: true },
];

// Today's events — 2 done, 1 active, rest pending
export const MOCK_EVENTS_TODAY: TaskEvent[] = [
  { kidId: MOCK_KID_ID, routineId: 'morning', taskId: 't1', status: 'done',
    source: 'watch', ts: Date.now() - 25 * 60_000, durationMs: 90_000 },
  { kidId: MOCK_KID_ID, routineId: 'morning', taskId: 't2', status: 'done',
    source: 'watch', ts: Date.now() - 13 * 60_000, durationMs: 145_000 },
  { kidId: MOCK_KID_ID, routineId: 'morning', taskId: 't3', status: 'started',
    source: 'watch', ts: Date.now() - 132 * 1000 },
];

export const MOCK_HEARTBEAT_LATEST: LaptopHeartbeat = {
  deviceId: 'dev_laptop_munene',
  kidId: MOCK_KID_ID,
  ts: Date.now() - 4_000,
  focus: { app: 'Khan Academy', title: 'Multiplication tables · Khan Academy',
           url: 'https://www.khanacademy.org', category: 'school' },
  idleSec: 12,
  locked: false,
  audioActive: false,
};

export const MOCK_WEEK_COMPLIANCE = [
  { d: 'Mon', pct: 92 }, { d: 'Tue', pct: 88 }, { d: 'Wed', pct: 100 },
  { d: 'Thu', pct: 76 }, { d: 'Fri', pct: 84 }, { d: 'Sat', pct: 100 },
  { d: 'Sun', pct: 80 },
];

export const MOCK_TIME_OF_DAY = { morning: 91, school: 78, evening: 82 };

export const MOCK_TREND_12_WEEK = [78, 84, 80, 88, 85, 92, 87, 90, 84, 88, 91, 87];
