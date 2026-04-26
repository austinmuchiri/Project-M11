# TimeKeeper

A multi-device routine assistant for autistic kids. Three surfaces, one source
of truth in Supabase.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  KID WATCH   │  BLE    │  PHONE       │  HTTPS  │  LAPTOP      │
│  ESP32-S3    │ ◄─────► │  (Android)   │ ◄─────► │  (Electron   │
│  LVGL 9      │  + sync │  Capacitor   │  Sync   │   tray)      │
└──────────────┘         └──────┬───────┘         └──────────────┘
                                │
                          ┌─────▼─────┐
                          │ SUPABASE  │  Postgres + Realtime + Auth
                          └───────────┘
```

## Quick start (demo)

```bash
# 1. Install
pnpm install

# 2. Run everything (4 separate terminals — or use the demo script below)
pnpm dev:caregiver       # → http://localhost:5173   React app, mock-mode
pnpm dev:watch           # → http://localhost:5174   watch simulator
pnpm dev:laptop          # opens an Electron tray app + popup
pnpm dev:presentation    # → http://localhost:4000   slide deck w/ embeds
```

The deck embeds the watch simulator + tray popup + lockscreen + caregiver app
via iframes — start the deck last after the others are running.

## Live demo on this laptop — single command

```bash
node scripts/demo.cjs
```

Spawns all 4 dev servers in parallel and opens the presentation.

## Mock mode vs Supabase

By default everything runs in **mock mode** — in-memory data seeded from
`packages/supabase-client/src/mock-data.ts`, persisted to localStorage so the
caregiver app survives a refresh. No network, no creds.

To wire up real Supabase:

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# then apply the schema:
psql "$SUPABASE_DB_URL" -f packages/supabase-client/sql/schema.sql
```

The client auto-detects: if either env var is missing or `TIMEKEEPER_DEMO=true`,
it uses the mock; otherwise it connects to Supabase.

## Repo layout

```
timekeeper/
├── apps/
│   ├── caregiver/         React 18 + Vite + Capacitor (Android target)
│   ├── firmware/          ESP-IDF + LVGL 9 watch firmware
│   ├── laptop-monitor/    Electron tray app · active-win foreground watcher
│   └── watch-simulator/   Browser stand-in for the watch UI (live demo)
├── packages/
│   ├── schema/            Zod types — TaskEvent, Routine, LaptopHeartbeat…
│   ├── supabase-client/   Realtime wrappers + in-memory mock fallback
│   └── ui/                Shared React primitives (Card, Pill, RingGauge…)
├── presentation/          HTML deck served from project root
└── pnpm-workspace.yaml
```

## Build production artefacts

```bash
pnpm build:caregiver        # web build → apps/caregiver/dist
pnpm build:android          # APK     → apps/caregiver/android/app/build/outputs/apk/debug/app-debug.apk
pnpm build:laptop           # tsc + copy renderer assets
pnpm build:laptop:installers # NSIS / dmg / AppImage installers per OS
```

The watch firmware builds with ESP-IDF — see `apps/firmware/README.md`.

## What's working today

| Surface | Status | Stack |
| --- | --- | --- |
| Caregiver app | ✅ Runs | React 18 · Vite · Capacitor 6 |
| Laptop monitor | ✅ Runs | Electron 33 · active-win |
| Watch simulator | ✅ Runs | React via CDN, single HTML |
| Presentation deck | ✅ Runs | Vanilla HTML + iframes |
| Shared schema + Supabase client | ✅ Typechecks | TypeScript · Zod |
| Watch firmware | 🛠 Skeleton | ESP-IDF · LVGL 9 |

## License

Hackcessible 2026 entry · Group 1.
