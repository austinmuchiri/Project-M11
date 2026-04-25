// Design tokens for the M11 Caregiver app.
// Calm + clinical: warm off-white surfaces, sage primary, soft charcoal ink.
// Borrowed from V2 "Calm" watch spec but pushed slightly more data-forward.

const APP = {
  // surfaces
  bg:        '#F4EFE6',
  bgSoft:    '#EDE6DB',
  surface:   '#FFFFFF',
  surfaceAlt:'#F9F5EE',
  border:    'rgba(58,58,63,0.08)',
  borderStrong: 'rgba(58,58,63,0.16)',

  // ink
  ink:       '#2E2E33',
  ink2:      '#56565E',
  inkDim:    '#8A8A92',
  inkFaint:  '#B6B6BC',

  // semantic
  brand:     '#7FA38E',     // deepened sage so it reads on white
  brandSoft: '#D7E4DB',
  brandInk:  '#1F2E27',
  accent:    '#C99466',     // muted peach-sand, slightly deepened
  accentSoft:'#F1E2CF',
  warn:      '#D69A55',
  warnSoft:  '#F4E2C9',
  danger:    '#C77676',
  dangerSoft:'#F1D9D9',
  star:      '#C99B3F',     // gold without going playful
  starSoft:  '#F1E3C2',
  info:      '#6B8DA8',
  infoSoft:  '#D6E2EB',

  // chart inks (data-forward)
  chart1:    '#7FA38E',     // sage
  chart2:    '#C99466',     // peach
  chart3:    '#6B8DA8',     // dusty blue
  chart4:    '#B07F9E',     // mauve
  chart5:    '#A8A268',     // olive

  // type
  font:      `'Nunito Sans', 'Nunito', system-ui, -apple-system, sans-serif`,
  fontDisp:  `'Nunito', system-ui, -apple-system, sans-serif`,
  fontMono:  `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`,

  // shape
  r:   12,
  rLg: 18,
  rXl: 24,

  // shadow (very subtle)
  shadowSm:  '0 1px 2px rgba(31,46,39,0.04), 0 1px 1px rgba(31,46,39,0.03)',
  shadow:    '0 4px 12px rgba(31,46,39,0.06), 0 1px 2px rgba(31,46,39,0.04)',
  shadowLg:  '0 12px 32px rgba(31,46,39,0.08)',
};

// Sample data for "Munene" (single kid)
const SAM = {
  name: 'Munene',
  age: 8,
  initials: 'M',
  avatarColor: '#C99466',

  // Live status — what the kid is doing right now
  live: {
    state: 'active',                    // idle | active | break | offline
    routine: 'Morning Routine',
    task: 'Brush Teeth',
    taskIcon: 'brush',
    taskColor: '#7FA38E',
    elapsed: 132,                       // seconds in this task
    expected: 180,                      // expected duration in seconds
    completed: 2,                       // tasks done in current routine
    routineTotal: 5,
    nextTask: 'Get Dressed',
    watch: { connected: true, battery: 64, lastSync: '12s ago' },
    laptop: { connected: true, focusApp: 'Khan Academy', lastSync: '4s ago' },
  },

  // Today's routines
  today: [
    { id: 'morning', name: 'Morning Routine', start: '07:00', end: '07:45',
      tasks: [
        { id: 't1', label: 'Wake Up',     time: '07:00', status: 'done',    finished: '07:02' },
        { id: 't2', label: 'Brush Teeth', time: '07:10', status: 'done',    finished: '07:12' },
        { id: 't3', label: 'Get Dressed', time: '07:20', status: 'active' },
        { id: 't4', label: 'Breakfast',   time: '07:30', status: 'pending' },
        { id: 't5', label: 'Pack Bag',    time: '07:40', status: 'pending' },
      ]},
    { id: 'school', name: 'School Block', start: '08:30', end: '15:00',
      tasks: [
        { id: 's1', label: 'Math',        time: '09:00', status: 'pending' },
        { id: 's2', label: 'Reading',     time: '10:30', status: 'pending' },
        { id: 's3', label: 'Lunch',       time: '12:00', status: 'pending' },
        { id: 's4', label: 'Science',     time: '13:30', status: 'pending' },
      ]},
    { id: 'evening', name: 'Evening Routine', start: '18:30', end: '20:30',
      tasks: [
        { id: 'e1', label: 'Dinner',      time: '18:30', status: 'pending' },
        { id: 'e2', label: 'Homework',    time: '19:00', status: 'pending' },
        { id: 'e3', label: 'Shower',      time: '19:45', status: 'pending' },
        { id: 'e4', label: 'Read',        time: '20:00', status: 'pending' },
        { id: 'e5', label: 'Sleep',       time: '20:30', status: 'pending' },
      ]},
  ],

  // 7-day completion %
  week: [
    { d: 'Mon', pct: 92 },
    { d: 'Tue', pct: 88 },
    { d: 'Wed', pct: 100 },
    { d: 'Thu', pct: 76 },
    { d: 'Fri', pct: 84 },
    { d: 'Sat', pct: 100 },
    { d: 'Sun', pct: 80 },     // today, partial
  ],

  // Time-of-day compliance (last 30d avg)
  timeOfDay: { morning: 91, school: 78, evening: 82 },

  streak: 12,
  starsThisWeek: 23,
  starsTotal: 184,

  // Notifications inbox (gentle escalation)
  notes: [
    { id: 'n1', kind: 'miss-streak', title: '3 missed in a row · School Block', body: 'Munene missed Math, Reading and a snack break this morning.', time: '11:42', read: false },
    { id: 'n2', kind: 'reward',      title: 'Streak milestone: 12 days', body: 'Auto-awarded ★5 to Munene.', time: '07:00', read: false },
    { id: 'n3', kind: 'device',      title: 'Watch battery 20%', body: 'Suggest charging at next break.', time: 'Yesterday 21:14', read: true },
    { id: 'n4', kind: 'compliance',  title: 'Weekly report ready', body: 'Apr 14–20 · 87% completion · -3% vs prior week.', time: 'Mon 09:00', read: true },
  ],
};

Object.assign(window, { APP, SAM });
