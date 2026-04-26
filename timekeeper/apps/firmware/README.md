# TimeKeeper firmware — Waveshare ESP32-S3-Touch-AMOLED-2.06

Stack: ESP-IDF v5.1+ with LVGL 9.

## One-time setup

```bash
# macOS / Linux
mkdir -p ~/esp && cd ~/esp
git clone --recursive -b v5.1.4 https://github.com/espressif/esp-idf.git
cd esp-idf && ./install.sh esp32s3
. ./export.sh                  # source in every shell

# Linux: USB-serial perms
sudo usermod -a -G dialout $USER
```

Windows: install ESP-IDF via the official installer; it provides an "ESP-IDF
PowerShell" shortcut that wraps `export.bat` for you.

## Build & flash

```bash
cd timekeeper/apps/firmware
idf.py set-target esp32s3
idf.py menuconfig                # PSRAM=enabled, BLE=enabled, LVGL=enabled
idf.py build
# Hold BOOT, tap RST, release BOOT
idf.py -p /dev/cu.usbmodem* flash monitor   # macOS
idf.py -p COM3 flash monitor                # Windows
```

## Fonts

LVGL needs C-array fonts. Generate them with the [LVGL Font Converter](https://lvgl.io/tools/fontconverter):

| Family | Sizes (px) | Symbol |
| --- | --- | --- |
| Nunito Bold | 22, 28, 36, 52, 64, 96 | `font_nunito_<size>` |
| Nunito Sans Bold | 16, 18 | `font_nunito_sans_<size>` |
| JetBrains Mono Medium | 14 | `font_jetbrains_mono_14` |

Save outputs to `main/ui/fonts/` and add them to `main/CMakeLists.txt` `SRCS`.

## Project layout

```
main/
├── main.c              # boot, LVGL/clock tick tasks
├── ui/                 # 8 screens + theme + status bar
├── ble/                # NimBLE GATT server + sync
├── tasks/              # scheduler, haptics
└── storage/            # NVS-backed event buffer
```

## What's stubbed and what's real

| Module | Status |
| --- | --- |
| `ui_*.c` | Real LVGL widget code, ready to render once fonts are imported |
| `scheduler.c` | Real state machine; routine JSON parser is a TODO |
| `ble_gatt.c` | Skeleton — wire NimBLE host init + GATT table to UUIDs |
| `nvs_store.c` | Real, persists buffered events |
| `haptics.c` | Real, drives GPIO15 |
| `bsp_display_init` / `bsp_touch_attach` | Pull from [Waveshare's example repo](https://www.waveshare.com/wiki/ESP32-S3-Touch-AMOLED-2.06) — board-specific |

## OTA

Partition table reserves two 3 MB OTA slots. After first USB flash, the
caregiver app uploads new `app.bin` to Supabase Storage and triggers OTA
via a BLE characteristic write.

## Troubleshooting

- **Port not listed** → install [CP210x](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) driver
- **Flash fails at 100%** → `idf.py -b 460800 flash`
- **Display white/black** → check `sdkconfig` panel res = 410×502, RGB565
