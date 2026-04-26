# TimeKeeper — Implementation & showcase guide

This is the runbook for getting all three apps live on a fresh laptop and
walking through the demo on stage. Read top-to-bottom for first-time setup;
jump to **§3 Demo flow** if everything's already installed.

---

## 1. Prerequisites

Install once per machine:

| Tool | Version | Why | Install |
| --- | --- | --- | --- |
| Node.js | ≥ 20 | Runs everything JS-side | <https://nodejs.org/> (or `winget install OpenJS.NodeJS.LTS`) |
| pnpm | ≥ 9 | Workspace manager | `npm install -g pnpm` |
| Git | any | Clone the repo | `winget install Git.Git` |
| Android Studio | Hedgehog+ | Build the caregiver APK | <https://developer.android.com/studio> |
| ESP-IDF | v5.1+ | Flash the watch | <https://docs.espressif.com/projects/esp-idf/en/v5.1.4/esp32s3/get-started/> |

The watch firmware is **only** needed if you have a Waveshare ESP32-S3-Touch-AMOLED-2.06
on hand. The browser watch simulator is the demo stand-in otherwise.

---

## 2. Clone & install

```bash
git clone <repo-url>
cd <repo>/timekeeper
pnpm install
```

That's the full install. It pulls 486 packages including Electron, Vite,
Capacitor, Supabase, and React. ~2 minutes on a warm cache.

### Optional — wire up real Supabase

Out of the box everything runs in **mock mode** (in-memory, seeded data).
To use a real Supabase project:

```bash
cp .env.example .env
# Edit .env and fill in:
#   VITE_SUPABASE_URL=https://xxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJhbG...
```

Then apply the schema:

```bash
# Either via the Supabase SQL editor — paste packages/supabase-client/sql/schema.sql
# or via psql:
psql "postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres" \
  -f packages/supabase-client/sql/schema.sql
```

The clients auto-detect: if `VITE_SUPABASE_URL` is missing or contains
`your-project-ref`, mock mode kicks in. To force mock mode even with creds,
set `TIMEKEEPER_DEMO=true` in `.env`.

---

## 3. Demo flow (live, on stage)

### 3.1 Boot everything

Open **two terminals** in the `timekeeper/` directory:

```bash
# Terminal 1 — caregiver + watch sim + presentation deck
node scripts/demo.cjs

# Terminal 2 — laptop monitor (Electron tray)
pnpm dev:laptop
```

What happens:

| Window / surface | URL or location |
| --- | --- |
| Presentation deck | <http://localhost:4000> (auto-opens) |
| Caregiver app (live, embedded in slide 4) | <http://localhost:5173> |
| Watch simulator (live, embedded in slide 5) | <http://localhost:5174> |
| Laptop monitor tray icon | system tray (right-click → Show status) |

Wait ~5 seconds for Vite to compile. The deck's iframes show "loading" until
the dev servers respond, then snap into place.

### 3.2 Slide-by-slide narration

The deck has 8 slides. Press <kbd>F</kbd> for fullscreen, <kbd>→</kbd> to advance,
<kbd>1–8</kbd> to jump.

| # | Slide | What to demo / say |
| --- | --- | --- |
| 1 | **Cover** | "TimeKeeper — three surfaces, one source of truth." 30 sec. |
| 2 | **Problem** | "Routines fall apart in the gap between *told* and *doing*." |
| 3 | **System** | Walk the diagram: watch ⇄ phone ⇄ laptop ⇄ Supabase. |
| 4 | **Phone** | Click into the embedded caregiver app. Tab through Today → Schedule → Insights → Alerts → Settings. Tap **Nudge** to show the modal. |
| 5 | **Watch** | Click the side buttons on the simulator, or hit **▶ Auto-play flow** for a 28-second tour through all 8 screens. Press-and-hold the Confirm ring to demo the 0.9s hold gesture. |
| 6 | **Laptop** | Tray popup live on the left, focus-lock screen on the right. Switch a real foreground window (open Roblox/YouTube) and see the tray popup update its `Focus / Category` row. Click **Test lock** in the tray menu to fire a real fullscreen lockscreen. |
| 7 | **Data** | Point at the schema: "this Zod type is the contract." |
| 8 | **Status** | "Three apps that run today, one firmware skeleton ready to flash." |

### 3.3 Killer demo moment — cross-surface event

To show real-time replication on stage:

1. Open the caregiver app (slide 4) in one window.
2. Open the watch simulator (slide 5) in another.
3. On the watch sim, click the side buttons to advance to **05 · Active**, then **06 · Confirm**, then press-and-hold the ring.
4. The watch flips to **Reward**. In the same beat, the caregiver app's hero card flips its task from "Brush Teeth" to "Get Dressed" (mock mode replays events through the same in-memory store).

This proves the contract works without any real Supabase connection.

### 3.4 If you have the real watch hardware

Skip slide 5's simulator and demo the actual board:

```bash
cd timekeeper/apps/firmware
. $IDF_PATH/export.sh
idf.py -p /dev/cu.usbmodem* flash monitor
```

Boot lands on the **Pair** screen (4-digit code). Open caregiver app → Settings →
Pair new device, enter the code, watch flips to **Home**.

---

## 4. Per-app deep dive

### 4.1 Caregiver phone app

```bash
pnpm dev:caregiver       # http://localhost:5173 — Vite hot reload
pnpm build:caregiver     # outputs apps/caregiver/dist/
pnpm build:android       # full APK in android/app/build/outputs/apk/debug/
```

The Android platform is already added (`apps/caregiver/android/`). To run on
a connected phone:

```bash
cd apps/caregiver
pnpm build && npx cap sync android
npx cap open android       # opens Android Studio → Run on device
# OR headless:
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

**Screens:** Today, Schedule, Insights, Alerts, Settings + Nudge modal +
Rewards sub-screen. State lives in `apps/caregiver/src/store.ts` — a tiny
external store backed by `useSyncExternalStore`. Subscribes to the
Supabase client's realtime channels for `task_events`, `laptop_heartbeat`,
and `nudges`.

### 4.2 Laptop monitor

```bash
pnpm dev:laptop          # tsc → copy assets → electron .
pnpm dist:win            # → release/TimeKeeper Monitor Setup.exe
```

The tray app:
- Polls the foreground window every **2 s** via `active-win`
- Polls system idle time every **5 s** via `powerMonitor.getSystemIdleTime()`
- Categorises process names → 10 categories (game / video / school / code /
  social / etc.) via the shared map in `packages/schema/src/index.ts`
- Pushes a `LaptopHeartbeat` to Supabase on every meaningful change
- Renders a fullscreen kiosk-mode `BrowserWindow` for **focus-lock** during
  routines, dismissed by a `task.done` event from the watch

**On macOS first launch**: grant *Screen Recording* + *Accessibility* in
System Settings — `active-win` needs them to read window titles. Sign with
a Developer ID before distributing.

### 4.3 Watch firmware

```bash
cd apps/firmware
. $IDF_PATH/export.sh
idf.py set-target esp32s3
idf.py build flash monitor
```

The skeleton is real LVGL 9 widget code — `lv_arc`, `lv_label`, `lv_btn`,
animations matching the design language. **Not yet connected**:

- `bsp_display_init()` / `bsp_touch_attach()` — pull from [Waveshare's example repo](https://www.waveshare.com/wiki/ESP32-S3-Touch-AMOLED-2.06)
- LVGL fonts — generate with the [LVGL Font Converter](https://lvgl.io/tools/fontconverter); details in `apps/firmware/README.md`
- BLE GATT host wiring — `ble_init()` is a stub; complete with `nimble_port_init()` + `ble_svc_gap/gatt_init()`

Everything else (scheduler state machine, NVS event buffering, haptics
GPIO, screen registry) is real and ready to compile.

### 4.4 Watch simulator

```bash
pnpm dev:watch           # http://localhost:5174
```

A single static HTML + JSX file (`apps/watch-simulator/simulator.jsx`) that
mirrors the firmware's screens 1:1. Side buttons advance / retreat through the
8-screen flow; the **Confirm** screen has real press-and-hold logic.

Use this for the demo when the physical watch isn't on stage.

---

## 5. Distributing to colleagues

### 5.1 Web preview only (no install)

```bash
cd timekeeper
pnpm install
node scripts/demo.cjs     # opens the deck at http://localhost:4000
```

That's enough to see everything — caregiver, watch simulator, presentation.

### 5.2 Install caregiver APK on Android

```bash
pnpm build:android
# scp the resulting APK to the phone, or:
adb install -r apps/caregiver/android/app/build/outputs/apk/debug/app-debug.apk
```

### 5.3 Distribute laptop monitor installer

```bash
pnpm build:laptop:installers
# Outputs in apps/laptop-monitor/release/:
#   Windows: TimeKeeper Monitor Setup 0.1.0.exe
#   Mac:     TimeKeeper Monitor-0.1.0.dmg
#   Linux:   TimeKeeper Monitor-0.1.0.AppImage
```

Each installer is signed with electron-builder defaults — for production,
provide your code-signing certs in `electron-builder.yml`.

---

## 6. Repo map (what lives where)

```
timekeeper/
├── apps/
│   ├── caregiver/          React 18 + Vite + Capacitor → Android APK
│   │   ├── src/screens/    7 screens (Home, Schedule, Insights, …)
│   │   ├── src/store.ts    External store + realtime subscriptions
│   │   ├── android/        Capacitor-generated Gradle project
│   │   └── capacitor.config.ts
│   │
│   ├── laptop-monitor/     Electron tray + active-win
│   │   ├── src/main.ts     Tray, lifecycle, IPC
│   │   ├── src/watcher.ts  2s foreground poll + idle/lock state
│   │   ├── src/lockscreen.ts   Fullscreen kiosk overlay
│   │   ├── src/tray-popup/index.html   Live status renderer
│   │   └── src/lockscreen/index.html
│   │
│   ├── firmware/           ESP-IDF + LVGL 9 (C)
│   │   └── main/
│   │       ├── ui/         8 screen builders + theme
│   │       ├── ble/        NimBLE GATT + sync
│   │       ├── tasks/      Scheduler + haptics
│   │       └── storage/    NVS event buffer
│   │
│   └── watch-simulator/    Browser stand-in
│       └── simulator.jsx   8 screens, identical visuals
│
├── packages/
│   ├── schema/             Zod TS types — Routine, TaskEvent, …
│   ├── supabase-client/    Realtime wrappers + mock fallback
│   │   ├── src/index.ts    SupabaseImpl + MockImpl
│   │   ├── src/mock-data.ts  Seeded "Munene" demo data
│   │   └── sql/schema.sql  Postgres DDL + RLS policies
│   └── ui/                 Shared React primitives
│
├── presentation/
│   ├── index.html          8-slide deck
│   └── serve.js            Static server with iframe routing
│
├── scripts/demo.cjs        One-command parallel launcher
├── pnpm-workspace.yaml
├── package.json
├── README.md               Quickstart
└── IMPLEMENTATION.md       This file
```

---

## 7. Troubleshooting

### Caregiver app shows blank page

- Open browser DevTools console — Vite errors are loud.
- Most common: missing `node_modules` after a fresh clone. Re-run `pnpm install`.

### Laptop monitor tray icon doesn't appear (Windows)

- Tray icons live in *hidden icons* by default on Windows 11 — click the `^`
  arrow in the system tray. Drag the TimeKeeper icon to the always-shown row.

### Watch simulator iframe is blank in the deck

- The deck server (port 4000) and the watch sim server (port 5174) both need
  to be running. `node scripts/demo.cjs` spawns both; verify with
  `curl http://localhost:5174`.

### `pnpm install` fails on Windows with EPERM

- OneDrive-synced folders sometimes lock files mid-install. Either move the
  project out of OneDrive, or pause OneDrive sync during `pnpm install`.

### Supabase realtime not pushing

- Check `packages/supabase-client/sql/schema.sql` was applied **including**
  the `alter publication supabase_realtime add table …` lines.
- Check RLS — the helper `tk_owns_kid()` requires a `kids` row with
  `user_id = auth.uid()`. If you're testing with the anon key, either disable
  RLS on the test tables or sign in with a real auth user.

---

## 8. Roadmap — what's next after the hack

1. **Real BLE pairing** in firmware — Just Works → Numeric Comparison
2. **OTA pipeline** — caregiver app uploads `app.bin` to Supabase Storage,
   triggers a flash via BLE characteristic write
3. **Multi-kid support** — currently scoped to single kid; schema already
   supports it via `kids.id`
4. **Voice nudge** — Whisper on-device transcription, push as Nudge
5. **Therapist export** — weekly PDF with longitudinal trends; the data is
   already aggregated by `task_events.ts` queries

---

Last updated: 2026-04-26
