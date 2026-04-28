# Routine Tracker — watch firmware mockup

A 4-screen demo you can flash to the Waveshare ESP32-S3-Touch-AMOLED-2.06
**right now** to see the Routine Tracker design language on real hardware.

This is a "hello, screen" mockup, not the production firmware. It boots,
draws, and lets you tap through Home → Reminder → Active → Reward. No BLE,
no scheduler, no NVS — just the visuals.

For the production project skeleton (BLE, scheduler, OTA), see
[`../firmware/`](../firmware/README.md).

---

## Prerequisites

- ESP-IDF v5.1+ installed and sourced (`. $IDF_PATH/export.sh` on macOS/Linux,
  or use the **ESP-IDF PowerShell** shortcut on Windows)
- A USB-C cable
- The Waveshare ESP32-S3-Touch-AMOLED-2.06 watch
- Drivers: install [CP210x](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) on Windows if your COM port doesn't appear

## Build & flash

In an **ESP-IDF PowerShell** (or any shell with `idf.py` on PATH):

```powershell
cd "C:\Users\muchiri.austin\OneDrive - Aga Khan University\Desktop\Hackcessible 2026\Group 1\M11_design_final\timekeeper\apps\firmware-mockup"

idf.py set-target esp32s3
idf.py build
```

The first build takes 5–10 min — it pulls LVGL and the Waveshare BSP from
the component registry, plus compiles the IDF SDK.

To flash:

1. Plug the watch in via USB-C
2. Hold **BOOT**, tap **RST**, release **BOOT** (puts the S3 in DFU mode)
3. ```powershell
   idf.py -p COM3 flash monitor
   ```
   Replace `COM3` with whatever your watch shows up as in Device Manager.
   Use `idf.py -p auto flash monitor` to let IDF guess.

Press <kbd>Ctrl</kbd>+<kbd>]</kbd> to exit the monitor.

## What you'll see

After the boot logs scroll, the screen shows:

1. **Home** — clock face, date, "2/5 MORNING" progress arc, "Next 7:30 Get Dressed" card
2. Tap → **Reminder** — sage halo, "TIME FOR Brush Teeth", green START button
3. Tap → **Active** — large countdown arc, BRUSH TEETH chip, "Tap to mark done" hint
4. Tap → **Reward** — gold halo, "Nice work! +1 star earned", ★ 184 chip
5. Tap → loops back to Home

## If the BSP component fails to fetch

Some IDF versions don't have `waveshare/esp32_s3_touch_amoled_2_06`
published yet. In that case:

1. Delete `main/idf_component.yml`'s last line (the Waveshare entry)
2. Add `espressif/esp_lcd_sh8601` and `espressif/esp_lcd_touch_cst816s`
   instead
3. Replace `bsp_display_start()` in `main.c` with manual init code from
   [Waveshare's wiki sample](https://www.waveshare.com/wiki/ESP32-S3-Touch-AMOLED-2.06)
   (the `ESP-IDF/01_LVGL_Porting` example is the closest match)

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `idf.py: command not found` | Source `export.sh` / open ESP-IDF PowerShell |
| Port not listed | Install CP210x USB-UART driver |
| Flash fails at 100% | Drop baud: `idf.py -b 460800 flash` |
| White or black screen | Check `sdkconfig` has `CONFIG_SPIRAM=y` |
| Touch doesn't advance | Tap firmly in the screen center, not the bezel |

## File layout

```
firmware-mockup/
├── CMakeLists.txt
├── sdkconfig.defaults    PSRAM + LVGL config
└── main/
    ├── CMakeLists.txt
    ├── idf_component.yml LVGL + Waveshare BSP
    └── main.c            Everything: tokens, screens, entry
```

Single file. Read `main.c` top-to-bottom and you'll see how each screen
maps to LVGL widgets — handy reference when you want to add a 5th screen
or wire BLE.
