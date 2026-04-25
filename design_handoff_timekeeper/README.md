# Handoff: TimeKeeper

A multi-device system to help a single autistic kid (multi-kid later) follow daily routines.
Three surfaces, one source of truth in the cloud.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  KID WATCH   │  BLE    │  PHONE       │  HTTPS  │  LAPTOP      │
│  ESP32-S3    │ ◄─────► │  (Android)   │ ◄─────► │  (full OS    │
│  LVGL        │  + sync │  Capacitor   │  Sync   │   monitor)   │
└──────────────┘         └──────┬───────┘         └──────────────┘
                                │
                          ┌─────▼─────┐
                          │ FIREBASE  │  Firestore + FCM + Auth
                          └───────────┘
```

> **About these design files:** The HTML files in `design-references/` are
> *prototypes* — pixel-accurate look-and-feel, not production code. Recreate them
> in the target stack (React Native / Capacitor for the phone, LVGL/C for the
> watch, **Electron tray app for the laptop monitor — full OS-level visibility**).
> The laptop agent watches *all* foreground apps (browsers, games, IDEs, video
> players, system apps), not just Chrome tabs.

---

## Fidelity

**High-fidelity.** Final colors, type, spacing, copy, and interactions. Match the prototypes pixel-for-pixel using the codebase's existing primitives.

---

## Stack decisions (locked from earlier conversation)

| Surface       | Stack                                              |
| ---           | ---                                                |
| Caregiver app | React + Capacitor → **Android** APK only (no iOS)  |
| Watch         | **LVGL 9** + ESP-IDF on Waveshare ESP32-S3-Touch-AMOLED-2.06 |
| Laptop        | **Electron tray app** — full OS-level monitoring (foreground app, idle, lock, network) on macOS / Windows / Linux / ChromeOS-Linux container |
| Backend       | **Firebase** (Firestore + FCM + Auth)              |
| Repo layout   | **Monorepo** (pnpm workspaces + `apps/firmware`)   |

---

## Monorepo layout (target)

```
timekeeper/
├── apps/
│   ├── caregiver/         # React + Vite + Capacitor (Android)
│   ├── firmware/          # ESP-IDF + LVGL (C/C++)
│   └── laptop-monitor/    # Electron tray app — OS-level monitor
├── packages/
│   ├── schema/            # Shared TS types + Zod schemas (Routine, Task, Event)
│   ├── firebase-client/   # Firestore wrappers, auth, FCM
│   └── ui/                # Shared React primitives (only caregiver consumes)
├── docs/
│   ├── data-model.md
│   ├── ble-protocol.md
│   └── flashing.md
├── pnpm-workspace.yaml
└── package.json
```

---

## Surface 1 — Caregiver phone app

**Location:** `apps/caregiver/`
**Stack:** React 18 + Vite + Capacitor 6 (Android target only)
**Design reference:** `design-references/caregiver-app/Caregiver App.html`

### Screens (all live in the prototype)
1. **Today / Live status** — current task on watch + laptop focus app, dot ladder of routine progress, at-a-glance battery + connection
2. **Schedule** — preset routine grid (Morning / School / Evening / Weekend) + timeline detail
3. **Insights** — week bars, time-of-day breakdown, 12-week sparkline, PDF export
4. **Alerts** — gentle 3-miss escalation, grouped Today/Earlier
5. **Settings** — Devices card, miss-threshold stepper, quiet hours, haptic-only toggle
6. **Nudge** modal — quick text → push to watch via FCM
7. **Rewards** sub-screen — assign stars, define treats

### Capacitor plugins required
- `@capacitor/push-notifications` — receive FCM
- `@capacitor-community/bluetooth-le` — direct BLE to watch (fallback if cloud sync stale)
- `@capacitor/preferences` — local cache of routines
- `@capacitor/share` — export PDF report

### Build & install (Android)
```bash
cd apps/caregiver
pnpm install
pnpm build                    # web build
npx cap sync android
npx cap open android          # opens Android Studio → Run on device
# OR build APK headless:
cd android && ./gradlew assembleDebug
# APK lands at android/app/build/outputs/apk/debug/app-debug.apk
adb install -r app-debug.apk
```

---

## Surface 2 — Kid Watch (Waveshare ESP32-S3-Touch-AMOLED-2.06)

**Location:** `apps/firmware/`
**Stack:** ESP-IDF v5.1+ with **LVGL 9**, C/C++
**Design reference:** `design-references/watch-ui/Watch UI - LVGL.html`

### Hardware
- **MCU:** ESP32-S3 (dual-core Xtensa, Wi-Fi + BLE 5)
- **Display:** 2.06″ AMOLED, **410 × 502 px**, capacitive touch (CST816 family or similar — confirm in Waveshare schematic)
- **Inputs:** touch + 2 side buttons (BTN1 = wake/back, BTN2 = confirm/start)
- **Power:** Li-Po + USB-C charging
- **Sensors:** typically RTC + IMU (varies by board rev — read Waveshare wiki)

### Screens to implement (all annotated in the prototype)
1. **Home / clock face** — `lv_label` time + `lv_arc` routine progress + next-task panel
2. **Today list** — `lv_list` with 3 visible task rows
3. **Reminder** (buzz) — full-bleed icon + START button
4. **Active** — large `lv_arc` timer + Pause / Done
5. **Confirm** — hold-to-done arc fill (900ms `lv_anim`)
6. **Reward** — animated star + counter
7. **Missed** — gentle retry, Skip / Try Again
8. **BLE pairing** — 4-digit code + spinner

### Project skeleton
```
apps/firmware/
├── CMakeLists.txt
├── sdkconfig.defaults        # PSRAM, BLE, LVGL config
├── partitions.csv            # OTA-friendly layout
├── managed_components/       # LVGL pulled via idf-component-manager
└── main/
    ├── main.c                # app entry, init display + LVGL tick
    ├── ui/
    │   ├── ui_home.c / .h
    │   ├── ui_reminder.c
    │   ├── ui_active.c
    │   ├── ui_confirm.c
    │   ├── ui_reward.c
    │   ├── ui_missed.c
    │   ├── ui_list.c
    │   ├── ui_pair.c
    │   └── ui_theme.c        # color tokens, font registration
    ├── ble/
    │   ├── ble_gatt.c        # GATT server, custom service
    │   └── sync.c            # routine + event push/pull
    ├── tasks/
    │   ├── scheduler.c       # routine playback engine
    │   └── haptics.c         # buzz patterns
    └── storage/
        └── nvs_store.c       # persist routines + pairing
```

### Color tokens (mirror caregiver app, see `lvgl-tokens.jsx`)
```c
#define COLOR_BG          lv_color_hex(0xF4EFE6)
#define COLOR_BG_SOFT     lv_color_hex(0xEDE6DB)
#define COLOR_SURFACE     lv_color_hex(0xFFFFFF)
#define COLOR_INK         lv_color_hex(0x2E2E33)
#define COLOR_INK_DIM     lv_color_hex(0x8A8A92)
#define COLOR_BRAND       lv_color_hex(0x7FA38E)   // sage primary
#define COLOR_BRAND_SOFT  lv_color_hex(0xD7E4DB)
#define COLOR_ACCENT      lv_color_hex(0xC99466)
#define COLOR_WARN        lv_color_hex(0xD69A55)
#define COLOR_STAR        lv_color_hex(0xC99B3F)
```

### Fonts
Convert Nunito (display) and Nunito Sans (body) with the LVGL Font Converter at sizes: 13, 14, 16, 18, 22, 28, 36, 52, 64, 96. Register as `&font_nunito_64` etc.

---

## Flashing the watch (Waveshare ESP32-S3-Touch-AMOLED-2.06)

### One-time setup
```bash
# 1. Install ESP-IDF v5.1+ (macOS)
brew install cmake ninja dfu-util ccache
mkdir -p ~/esp && cd ~/esp
git clone --recursive -b v5.1.4 https://github.com/espressif/esp-idf.git
cd esp-idf && ./install.sh esp32s3
. ./export.sh                    # sources idf.py into PATH (run every shell)

# 2. udev rules for USB-serial (Linux only)
sudo usermod -a -G dialout $USER
# logout/in
```

### Build & flash
```bash
cd timekeeper/apps/firmware
idf.py set-target esp32s3
idf.py menuconfig                # enable PSRAM, BLE, LVGL
idf.py build
# Plug watch in via USB-C. Hold BOOT, tap RST, release BOOT (puts S3 in DFU)
idf.py -p /dev/cu.usbmodem* flash monitor
# Ctrl-] to exit monitor
```

### OTA updates (after first flash)
The watch has a built-in OTA endpoint. After it's paired & on Wi-Fi:
```bash
idf.py build
# Upload app.bin to Firebase Storage, then trigger OTA from caregiver app
# (see apps/caregiver/src/devices/ota.ts)
```

### Troubleshooting
- **Port not listed** → install [CP210x](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) or CH340 driver
- **Flash fails at 100%** → drop baud: `idf.py -b 460800 flash`
- **Display is white/black** → check `sdkconfig` panel res = 410×502, RGB565

---

## Surface 3 — Laptop monitor (full OS-level)

**Location:** `apps/laptop-monitor/`
**Goal:** detect *whatever app* the kid is using on the laptop — browsers, games (Roblox, Minecraft launcher), video apps (YouTube, Netflix desktop), IDEs, terminal, system Settings — push to Firestore so the caregiver app shows live status, and (optionally) lock the screen during scheduled tasks.

> **Why not a Chrome extension?** A browser extension only sees Chrome tabs.
> A kid running a non-browser game or sideloaded app would appear "idle."
> We need OS-level foreground-window introspection.

### Stack — Electron tray app

```
apps/laptop-monitor/
├── package.json
├── electron-builder.yml       # signed installers per OS
├── src/
│   ├── main.ts                # main process — tray, window watcher, Firestore client
│   ├── watcher.ts             # foreground-window + idle polling loop
│   ├── lockscreen.ts          # native overlay during routines
│   ├── auth.ts                # device-pairing flow with caregiver app
│   └── tray-popup/            # small renderer for the tray status UI
└── assets/                    # tray icons (template + colored states)
```

### What gets monitored (OS-level)

| Signal              | Source (npm package)                            | Sample rate  |
| ---                 | ---                                              | ---          |
| Foreground app      | `active-win` (returns `{ owner, title, url? }`)  | every 2 s    |
| User-idle seconds   | `electron.powerMonitor.getSystemIdleTime()`      | every 5 s    |
| Lock / unlock       | `powerMonitor` `lock-screen` / `unlock-screen`   | event-driven |
| Sleep / wake        | `powerMonitor` `suspend` / `resume`              | event-driven |
| Network state       | `Electron net` / `navigator.onLine`              | event-driven |
| Audio playing       | `loudness` (mac/win) — flags video & games       | every 5 s    |

`active-win` returns the **process name + window title** for whatever is focused — Chrome tab, Roblox, Discord, VS Code, Spotify, system Settings — so the caregiver dashboard can show e.g. *"Munene · Roblox · 14m"* not just "Chrome."

### Categorization

Map raw process names → high-level categories the caregiver actually cares about. Keep keyword maps in `packages/schema` so the caregiver app and the laptop agent share definitions. Categories: `game`, `video`, `meeting`, `code`, `writing`, `school`, `social`, `other`.

### Lockscreen during routines

When a routine is active and the caregiver enables "focus lock":
- Render a frameless, always-on-top, fullscreen Electron `BrowserWindow` with `setKiosk(true)` + `setAlwaysOnTop('screen-saver')`
- Show: current task name, big watch-style timer, "Tap watch DONE to unlock"
- Listen for `task.done` Firestore event → close the lock window

### Per-OS notes

- **macOS** — first launch prompts for *Screen Recording* and *Accessibility* permissions (`active-win` needs them for window titles). Sign the app with a Developer ID so Gatekeeper doesn't block it.
- **Windows** — install as Squirrel/MSI; auto-launch via `app.setLoginItemSettings({ openAtLogin: true })`. No special perms needed.
- **Linux / ChromeOS Linux container** — package as `.deb` or AppImage. On ChromeOS, requires the **Linux (Crostini)** environment enabled. `active-win` works under X11; on Wayland use `active-win-wayland`.
- **Pure ChromeOS (no Crostini)** — fall back to a Chrome Extension stub *as a secondary signal only*; flag the laptop as `coverage: "browser-only"` in Firestore so the caregiver UI shows a "limited monitoring" badge.

### Install flow

1. Caregiver app → Settings → Devices → "Add laptop" → shows a 4-digit pair code
2. On the laptop, download `TimeKeeper-Monitor-{os}.{dmg|exe|AppImage}` (built via `electron-builder`, hosted on Firebase Storage)
3. Run installer → tray icon appears → opens pair-code prompt
4. Enter code → exchanges for a Firebase custom token tied to that device
5. Tray icon turns green when paired and reporting

### Firestore schema for laptop events
```ts
/devices/{laptopId}/heartbeat     // { ts, focus: { app: 'Roblox', title: 'Bloxburg', category: 'game' }, idleSec: 12, locked: false, audioActive: true }
/devices/{laptopId}/locks         // when caregiver triggers lockdown during routine
/devices/{laptopId}/sessions      // rolled-up: { app, category, startedAt, durationMs }
```

The caregiver app's **Today** screen subscribes to `heartbeat` and renders the
"Laptop · Roblox · 14m" line you see in the live-status hero. Insights
aggregates `sessions` for screen-time-by-category charts.

---

## Data model (shared schema, `packages/schema/`)

```ts
type Routine = {
  id: string;
  name: 'Morning' | 'School' | 'Evening' | 'Weekend' | string;
  tasks: Task[];
  daysOfWeek: number[];     // 0=Sun
  startTime: string;        // 'HH:MM'
};

type Task = {
  id: string;
  label: string;
  icon: 'brush' | 'shirt' | 'plate' | 'bag' | 'book' | 'sun' | 'moon' | string;
  expectedMinutes: number;
  rewardStars: number;
};

type TaskEvent = {
  taskId: string;
  routineId: string;
  ts: number;               // epoch ms
  status: 'started' | 'done' | 'missed' | 'skipped' | 'retry';
  source: 'watch' | 'phone' | 'laptop';
  durationMs?: number;
};

type Device = {
  id: string;
  kind: 'watch' | 'laptop' | 'phone';
  battery?: number;
  lastSeen: number;
  fwVersion?: string;
};
```

All three surfaces read/write to `/users/{uid}/...` collections. Watch BLE
protocol mirrors `TaskEvent` exactly so the phone can buffer offline events.

---

## Backend — Firebase

- **Firestore** rules: lock to `request.auth.uid == userId`. Caregiver and nanny share the same uid (or use Firebase Auth multi-user with custom claim `role: 'caregiver' | 'nanny'`).
- **FCM** topics: `kid_{kidId}_alerts` for nanny mirror.
- **Cloud Functions:**
  - `onTaskEvent` → recompute streak, daily compliance %, time-of-day buckets
  - `escalation` → after N missed in a row (default 3), push FCM to caregiver
  - `dailyDigest` → optional 8pm summary

---

## Design tokens (single source of truth)

See `design-references/v2-calm-spec.md`. Both the React app and LVGL firmware
must use these exact hex values.

| Token         | Hex       | Purpose                |
| ---           | ---       | ---                    |
| `bg`          | `#F4EFE6` | App background         |
| `bgSoft`      | `#EDE6DB` | Card/section bg        |
| `surface`     | `#FFFFFF` | Inset surfaces         |
| `ink`         | `#2E2E33` | Primary text           |
| `ink2`        | `#56565E` | Secondary text         |
| `inkDim`      | `#8A8A92` | Hint / metadata        |
| `brand`       | `#7FA38E` | Sage primary, success  |
| `brandSoft`   | `#D7E4DB` | Brand background tint  |
| `accent`      | `#C99466` | Active task accent     |
| `warn`        | `#D69A55` | Missed/retry           |
| `star`        | `#C99B3F` | Rewards                |

Type: **Nunito** (display, 700/800/900) + **Nunito Sans** (body, 600/700/800) + **JetBrains Mono** (numerics).

---

## Build order recommended for Claude Code

1. `packages/schema` — types + Zod schemas first
2. `packages/firebase-client` — auth + Firestore wrappers
3. `apps/caregiver` — get the React app running locally, point at Firebase emulator
4. `apps/firmware` — get LVGL "hello world" on the watch, then port screens one-by-one (start with Home → Reminder → Active → Confirm → Reward)
5. BLE protocol — pair watch ↔ phone, sync routines down, sync events up
6. `apps/laptop-monitor` — Electron tray app; build the watcher loop first, lockscreen second
7. `apps/caregiver` — wrap with Capacitor, ship Android APK

---

## Files in this bundle

```
design-references/
├── caregiver-app/
│   ├── Caregiver App.html       # entry point — open this in a browser
│   ├── app-tokens.jsx           # color/spacing/typography tokens
│   ├── app-shell.jsx            # tab bar + frame switcher
│   ├── app-screens.jsx          # all 5 main screens
│   ├── app-ui.jsx               # primitives (Card, Stat, etc.)
│   ├── ios-frame.jsx
│   ├── android-frame.jsx
│   └── icons.jsx
├── watch-ui/
│   ├── Watch UI - LVGL.html     # entry point — 8 screens with LVGL callouts
│   ├── lvgl-tokens.jsx          # color tokens (mirror in C macros)
│   ├── lvgl-screens.jsx         # all 8 watch screens
│   └── design-canvas.jsx
└── v2-calm-spec.md              # original design language spec
```
