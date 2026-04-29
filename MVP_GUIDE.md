# Routine Tracker — MVP Guide
**Hackcessible 2026 · Group 1**
Last updated: 2026-04-29

---

## Quick orientation

Three devices talk through one Supabase project.

```
CAREGIVER APP (Android / Vercel)
        │  writes routines, reads events,
        │  sends nudges + block commands
        ▼
   SUPABASE (realtime)
        │  broadcasts to all subscribers
        ├──────────────────────────────┐
        ▼                              ▼
LAPTOP MONITOR (Electron tray)    WATCH (ESP32-S3 via BLE)
  receives block_commands,          receives routines via BLE,
  shows focus overlay               reports task completions
```

**Demo mode** (no Supabase needed): leave `.env` blank. Both apps run on
in-memory mock data seeded with Munene's three routines.

**Live mode** (devices actually talk): complete §1 first, then §2–§4 in any order.

---

## §1 — Supabase setup (~30 min, gates everything)

> Skip this entire section if you only need the demo for the presentation.
> The apps start in mock mode automatically when no `.env` is filled in.

### 1.1 Create the project

1. Go to supabase.com → New project.
2. Name: `routine-tracker`  Region: pick the nearest.
3. Wait ~2 min for provisioning.
4. Go to **Project Settings → API** and copy:
   - **Project URL** (looks like `https://xyzxyz.supabase.co`)
   - **anon / public key** (long JWT string)

### 1.2 Apply the schema

1. In Supabase dashboard → **SQL Editor → New query**.
2. Open `timekeeper/packages/supabase-client/sql/schema.sql` from this repo.
3. Paste the entire file into the editor and click **Run**.
4. You should see "Success. No rows returned" — all tables, indexes, RLS policies,
   and realtime publications are created in one shot.

Tables created:
`kids`, `routines`, `task_events`, `devices`, `alerts`,
`laptop_heartbeat`, `nudges`, `block_commands`

### 1.3 Enable Auth

1. Authentication → Providers → **Email** → Enable.
2. **Disable** "Confirm email" (toggle off) — saves a step during demo.
3. Sign up your caregiver account: Authentication → Users → **Add user**
   - Email: your email
   - Password: something you'll remember
   - Copy the **User UID** shown after creation (e.g. `a1b2c3d4-...`)

### 1.4 Seed your data

Run this in the SQL Editor (replace the values in angle brackets):

```sql
-- 1. Create kid profile
insert into kids (id, user_id, name, age, initials, avatar_color)
values ('kid_munene', '<YOUR_USER_UID>', 'Munene', 8, 'M', '#C99466');

-- 2. Seed morning routine
insert into routines (id, kid_id, name, tasks, days_of_week, start_time)
values (
  'morning', 'kid_munene', 'Morning Routine',
  '[
    {"id":"t1","label":"Wake Up","icon":"sun","scheduledTime":"07:00","expectedMinutes":2,"rewardStars":1},
    {"id":"t2","label":"Brush Teeth","icon":"brush","scheduledTime":"07:10","expectedMinutes":3,"rewardStars":1},
    {"id":"t3","label":"Get Dressed","icon":"shirt","scheduledTime":"07:20","expectedMinutes":5,"rewardStars":1},
    {"id":"t4","label":"Breakfast","icon":"plate","scheduledTime":"07:30","expectedMinutes":10,"rewardStars":1},
    {"id":"t5","label":"Pack Bag","icon":"bag","scheduledTime":"07:40","expectedMinutes":5,"rewardStars":1}
  ]'::jsonb,
  '{1,2,3,4,5}', '07:00'
);

-- 3. Register the laptop device
insert into devices (id, kid_id, kind, label, battery, last_seen, paired)
values ('dev_laptop_munene', 'kid_munene', 'laptop', "Munene's Laptop", 100, 0, true);

-- 4. Register the watch device (once you have the board)
insert into devices (id, kid_id, kind, label, battery, last_seen, paired)
values ('dev_watch_munene', 'kid_munene', 'watch', "Munene's Watch", 80, 0, false);
```

### 1.5 Fill in `.env`

Edit `timekeeper/.env` (copy from `.env.example` if it doesn't exist):

```env
VITE_SUPABASE_URL=https://xyzxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...
SUPABASE_URL=https://xyzxyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...
TIMEKEEPER_DEMO=false
```

> If `TIMEKEEPER_DEMO` stays `true` or is absent, apps ignore Supabase entirely
> and use seeded in-memory data — useful if the internet drops during the demo.

---

## §2 — Caregiver app

### 2A — Run locally (fastest, recommended for demo day)

Prerequisites: Node 20+, pnpm 9+

```bash
# From the repo root
cd timekeeper
pnpm install          # first time only
pnpm dev:caregiver    # opens http://localhost:5173
```

Open in Chrome on the tablet's browser (or install as a PWA: address bar → ⋮ → Install).

Sign in with the caregiver account you created in §1.3.
If `.env` is blank → mock mode banner appears at the top, no sign-in needed.

### 2B — Deploy to Vercel (permanent public URL)

`vercel.json` is already at the repo root. Just run:

```bash
npx vercel --prod
```

- First time: it asks you to log in and create a project — follow the prompts.
- Subsequent deploys: same command, URL stays the same.
- The build command inside `vercel.json` is pre-configured:
  `cd timekeeper && pnpm install --frozen-lockfile && pnpm --filter @timekeeper/caregiver build`
- Output directory: `timekeeper/apps/caregiver/dist`

The deployed URL works on any device including the Android tablet browser.

### 2C — Android APK (optional)

Prerequisites: Android Studio + Android SDK installed.

```bash
cd timekeeper
pnpm build:android
# APK lands at: apps/caregiver/android/app/build/outputs/apk/debug/app-debug.apk
```

Install on the tablet:
```bash
adb install apps/caregiver/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## §3 — Laptop monitor (Electron tray)

### 3A — Run in dev mode (works right now, no build needed)

```bash
cd timekeeper/apps/laptop-monitor
pnpm dev
```

A tray icon appears in the system tray (bottom-right). Right-click it to see the menu.

In mock mode (default): the tray auto-pairs to the mock Munene profile.
In live mode: right-click → "Pair with caregiver…" to associate with a real kid.

### 3B — Launch the pre-built app (no Node required)

The app is already packaged at:
```
timekeeper/apps/laptop-monitor/release/win-unpacked/TimeKeeper Monitor.exe
```

Double-click that `.exe`, or use the launcher:
```
timekeeper/apps/laptop-monitor/release/Launch TimeKeeper Monitor.bat
```

> The `TimeKeeper Monitor.exe` runs fully — the only missing piece is the
> single-file portable wrapper (blocked by a GitHub network restriction on this
> machine). Distribute the entire `win-unpacked/` folder as a zip.

### 3C — Pairing the laptop to a real kid (live mode only)

1. Make sure `.env` has real Supabase credentials and the laptop monitor is running.
2. Right-click tray icon → **Pair with caregiver…**
3. In the popup, enter:
   - Kid ID: `kid_munene` (or whatever you inserted in §1.4)
   - Device ID: `dev_laptop_munene`
4. Click Pair. The tray icon turns green and shows "Paired · Munene".

From this point:
- The laptop pushes a heartbeat to `laptop_heartbeat` every 2 s (foreground app, idle time, lock state).
- The caregiver app's Today screen shows the live foreground app name under "Laptop".
- Block commands from the caregiver app arrive via Supabase realtime and trigger overlays.

### 3D — Testing the focus controls

1. Open the caregiver app → Today screen → **Focus controls** card.
2. Tap **🔒 Lock laptop** → the laptop's lockscreen overlay appears within ~1 s.
3. Tap **Override · Unlock now** → overlay disappears.
4. Tap **🚫 Block apps** → choose Roblox → if Roblox is the foreground app, the
   soft overlay appears.

---

## §4 — Watch (ESP32-S3-Touch-AMOLED)

> See `timekeeper/apps/firmware/WATCH_GUIDE.md` for the full step-by-step
> toolchain, font generation, BLE wiring, and flash instructions.
> This section is the condensed version.

### 4.1 Prerequisites (one-time, ~30 min)

1. Download **ESP-IDF Windows Installer v5.1.4** from the Espressif download page.
   Install to `C:\Espressif`. Choose target: ESP32-S3.
2. Install **CP210x USB-UART driver** from Silicon Labs if not already present.
3. Clone the Waveshare BSP alongside the project:
   ```bash
   git clone https://github.com/waveshare/ESP32-S3-Touch-LCD-2.06 waveshare-bsp
   ```
4. Copy these four files from `waveshare-bsp/examples/lvgl_demo/main/` into
   `timekeeper/apps/firmware/main/bsp/`:
   - `bsp_display.c`
   - `bsp_display.h`
   - `bsp_touch.c`
   - `bsp_touch.h`

### 4.2 Generate fonts (one-time, ~10 min)

Go to **lvgl.io/tools/fontconverter** and generate 9 `.c` files.
Save them to `timekeeper/apps/firmware/main/ui/fonts/`.

| Family | Weight | Size | Output filename |
|---|---|---|---|
| Nunito | Bold 700 | 22px | `font_nunito_22` |
| Nunito | Bold 700 | 28px | `font_nunito_28` |
| Nunito | Bold 700 | 36px | `font_nunito_36` |
| Nunito | ExtraBold 800 | 52px | `font_nunito_52` |
| Nunito | ExtraBold 800 | 64px | `font_nunito_64` |
| Nunito | Black 900 | 96px | `font_nunito_96` |
| Nunito Sans | Bold 700 | 16px | `font_nunito_sans_16` |
| Nunito Sans | Bold 700 | 18px | `font_nunito_sans_18` |
| JetBrains Mono | Medium 500 | 14px | `font_jetbrains_mono_14` |

Settings for all: Bpp = 4, Range = `0x20-0x7E, 0xE000-0xE003`.

### 4.3 Wire NimBLE (the one missing code block)

Open `timekeeper/apps/firmware/main/ble/ble_gatt.c`.
The `ble_init()` and `ble_push_event()` functions are stubs with comments.
Replace them with the full implementation in `WATCH_GUIDE.md §5`.

Also run `idf.py menuconfig` and enable:
- Component config → Bluetooth → Enabled
- Component config → Bluetooth → NimBLE → Enabled
- Component config → LVGL → PSRAM draw buffer → Enabled

### 4.4 Build and flash

Open the **ESP-IDF 5.1 PowerShell** shortcut (installed by the toolchain):

```powershell
cd "...\M11_design_final\timekeeper\apps\firmware"
idf.py set-target esp32s3
idf.py build
# Hold BOOT, tap RST, release BOOT to enter flash mode
idf.py -p COM3 flash monitor   # replace COM3 with your port
```

Find your COM port: Device Manager → Ports → "Silicon Labs CP210x".

### 4.5 Pair watch with caregiver app

1. Watch boots → shows **Pair screen** with spinning BLE ring and a 4-digit code.
2. Caregiver app → Settings → Devices → **Pair new device**.
3. App scans BLE and finds "TimeKeeper". Tap it. Enter the 4-digit code.
4. Watch receives the morning routine over BLE → transitions to **Home screen**.
5. From now on, every DONE tap on the watch sends a JSON event to the caregiver app,
   which writes it to Supabase `task_events` and updates the Today screen in real time.

### 4.6 Full system test sequence

Run in this order:

- [ ] Watch powers on → Pair screen with code appears
- [ ] Watch pairs with caregiver app → Home screen shows Morning Routine
- [ ] Tap a task → Reminder screen buzzes haptic
- [ ] Tap START → Active screen with countdown arc
- [ ] Tap DONE → Confirm → hold 900 ms → Reward screen + haptic success
- [ ] Caregiver app Today screen: dot-ladder updates, task shows "done"
- [ ] Caregiver app: send Nudge → watch shows toast notification
- [ ] Caregiver app: tap "Lock laptop" → laptop overlay appears
- [ ] Laptop overlay shows the active task name + countdown ring
- [ ] Override unlock → overlay clears, laptop is free
- [ ] Check Supabase SQL editor: `task_events` table has the row from the watch

---

## §5 — Report: what is done vs what is left

### Done

#### Infrastructure
- [x] pnpm monorepo with workspace packages: `schema`, `supabase-client`, `ui`
- [x] Supabase SQL schema (all tables, RLS, realtime publications, `block_commands`)
- [x] Dual-mode Supabase client: real mode + mock mode with full in-memory data
- [x] `.env` / `TIMEKEEPER_DEMO` flag controls which mode loads
- [x] `vercel.json` at repo root — one-command Vercel deploy

#### Caregiver app (`apps/caregiver`)
- [x] React + Vite + Capacitor scaffold
- [x] Sign-in / sign-out (Supabase Auth, mock auto-signs in)
- [x] **Today screen**: live hero card (watch face, active task, elapsed bar, dot-ladder, device strip)
- [x] **Focus controls card**: lock laptop now, block apps picker (Roblox / YouTube / Browser), override unlock, toast feedback, active block status badge
- [x] **Schedule screen**: routine tile grid with toggles, timeline task list, Add task modal, Edit task modal, Sync to watch button
- [x] **Insights screen**: week bar chart, time-of-day breakdown, 12-week sparkline, streak + stars stat cards, PDF export button
- [x] **Alerts screen**: gentle 3-miss escalation banner, grouped alert list, Nudge + Reschedule actions
- [x] **Settings screen**: devices list with live status dots, miss-threshold stepper, quiet-hours toggle, mirror-to-nanny toggle, Focus & Blocking section (lock-on-task + block-games toggles + app blocklist chips)
- [x] **Nudge sub-flow**: mini watch face preview, 4 quick-nudge cards, custom text area, Send
- [x] **Rewards sub-flow**: star total card, reward catalog with cost gating
- [x] Store: Zustand-style external store with `useSyncExternalStore`, memo cache
- [x] Actions: `lockLaptop`, `unlockLaptop`, `blockApp`, `toggleRoutineActive`, `addTaskToRoutine`, `updateTaskInRoutine`, `sendNudge`, `recordEvent`
- [x] Real-time subscriptions: `task_events`, `laptop_heartbeat`
- [x] Android project scaffold (Capacitor) — gradlew present

#### Laptop monitor (`apps/laptop-monitor`)
- [x] Electron tray app: green/grey tray icon, context menu with live status
- [x] Foreground app watcher (`active-win`): polls every 2 s, categorises apps
- [x] **Lockscreen overlay**: full-screen sage→ink radial gradient, task label, countdown ring, "tap watch DONE to unlock" hint
- [x] **App-block overlay**: softer fullscreen overlay, blocked-app name, focus message
- [x] **Tray popup** (360×460): live focus app, idle seconds, lock state, paired kid
- [x] Supabase realtime subscription to `block_commands` — pure command receiver
- [x] Command handler: `lock_screen` → showLockscreen, `unlock_screen` → hide, `block_app` → start watcher + overlay, `unblock_app` → stop
- [x] Laptop heartbeat: pushes focus snapshot to `laptop_heartbeat` every 2 s
- [x] Nudge subscription: logs received nudges (toast display not yet wired)
- [x] Request-unlock flow: kid taps tray menu → writes `unlock_screen` row back
- [x] Pairing: `pairing.json` persists to userData; auto-pairs to mock kid in demo mode
- [x] `release/win-unpacked/TimeKeeper Monitor.exe` — built and runnable
- [x] `release/Launch TimeKeeper Monitor.bat` — one-click launcher

#### Watch firmware (`apps/firmware`)
- [x] ESP-IDF project scaffold: `CMakeLists.txt`, `sdkconfig.defaults`, `partitions.csv`
- [x] All 8 LVGL screens implemented: Home, List, Reminder, Active, Confirm, Reward, Missed, Pair
- [x] V2 "Calm" design system tokens in `ui_theme.h` / `ui_theme.c`
- [x] Screen registry: `ui_show_screen(SCR_*)` switches screens
- [x] Scheduler state machine: seeds Morning Routine at boot, handles task transitions
- [x] Haptic driver: GPIO 15, three patterns (short / success / retry)
- [x] NVS event buffer: stores task events offline, survives reboot
- [x] BLE sync module: drains buffer on connect, pushes events via notify
- [x] `ble_gatt.h` with UUID constants, function declarations
- [x] `WATCH_GUIDE.md` — full toolchain, font, NimBLE wiring, flash, pairing instructions

#### Design handoff (`design_handoff_timekeeper`)
- [x] Watch UI — LVGL.html: 8-screen carousel in hardware bezel, V2 Calm tokens
- [x] Caregiver App.html: iOS + Android side-by-side, all 7 screens + Focus & Blocking screen
- [x] Focus controls card on Today screen (interactive: tap to lock, block apps, override)
- [x] FocusBlockingScreen: architecture trace, live controls, "what the kid sees" panel, audit trail, auto-blocking rule toggles
- [x] Focus & Blocking section in Settings (toggles + app chip list with × buttons)
- [x] "NEW" badge on Focus & Blocking button in the screen switcher

---

### Left to do

#### Must-have before demo

| # | Task | Where | Estimated time |
|---|---|---|---|
| 1 | Fill in `.env` with real Supabase credentials | `timekeeper/.env` | 5 min |
| 2 | Run schema SQL in Supabase SQL editor | Supabase dashboard | 5 min |
| 3 | Seed `kids`, `routines`, `devices` rows | Supabase SQL editor | 5 min |
| 4 | Copy 4 Waveshare BSP files into `main/bsp/` | `apps/firmware/main/bsp/` | 10 min |
| 5 | Generate 9 LVGL font `.c` files at lvgl.io/tools/fontconverter | `apps/firmware/main/ui/fonts/` | 10 min |
| 6 | Replace `ble_init()` stub in `ble_gatt.c` with the full NimBLE code (in `WATCH_GUIDE.md §5`) | `apps/firmware/main/ble/ble_gatt.c` | 20 min |
| 7 | Wire `scheduler_apply_routines_json()` with cJSON (code in `WATCH_GUIDE.md §6`) | `apps/firmware/main/tasks/scheduler.c` | 20 min |
| 8 | Run `idf.py build && idf.py flash` and confirm Pair screen appears | `apps/firmware/` | 30 min |
| 9 | Pair watch with caregiver app, confirm task events appear in Supabase | Live test | 15 min |

**Total remaining: ~2 hours if no surprises.**

#### Nice-to-have (post-demo)

| Task | Notes |
|---|---|
| Nudge toast on laptop | `subscribeNudges` fires the callback but doesn't yet show a popup — add `new Notification(...)` in main.ts |
| Nudge toast on watch | `ble_gatt.c` NUDGE char write handler needs to call `ui_show_toast()` |
| APK build + sideload | Requires Android Studio; `pnpm build:android` is wired, just needs the SDK |
| Single-file Electron `.exe` | Blocked by GitHub network restriction; works if network allows or VS Build Tools installed |
| BTN1 / BTN2 hardware buttons | Wire `gpio_isr_handler_add()` in `main.c` for physical navigation |
| Multi-kid support | Schema supports it (user → kids 1:many); caregiver app assumes single kid |
| OTA firmware update | Electron → Supabase Storage → watch BLE; fully post-demo |
| Offline caregiver app sync | Currently requires internet for live mode; add local IndexedDB cache |
| Automatic routine push on BLE reconnect | `sync.c` drains events but doesn't yet re-push routine JSON if scheduler is empty |

---

## §6 — Quick-start cheatsheet

```
DEMO MODE (no internet needed)
──────────────────────────────
1.  cd timekeeper && pnpm install && pnpm dev:caregiver
    → opens http://localhost:5173 (mock banner shown)
2.  cd apps/laptop-monitor && pnpm dev
    → tray icon appears, auto-pairs to mock Munene
3.  Open caregiver app → Today → Focus controls → Lock laptop
    → laptop overlay appears
4.  Open Caregiver App.html in browser for the presentation slides

LIVE MODE (Supabase connected)
──────────────────────────────
1.  Complete §1 (Supabase setup)
2.  Fill timekeeper/.env with real credentials
3.  pnpm dev:caregiver  →  sign in with caregiver account
4.  pnpm dev (in laptop-monitor)  →  right-click tray → Pair
5.  Flash watch firmware  →  pair via BLE → test full loop
```
