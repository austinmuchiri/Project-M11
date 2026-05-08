// TimeKeeper watch firmware — Arduino IDE port.
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  BOARD SETUP (Arduino IDE → Tools menu)                                 ║
// ║  Board      : ESP32S3 Dev Module                                         ║
// ║  Flash Size : 8MB (or match your board)                                  ║
// ║  PSRAM      : OPI PSRAM  (Waveshare ESP32-S3-Touch-AMOLED-2.06 has PSRAM)║
// ║  Partition  : Default 4MB with spiffs  (or huge app if using OTA)        ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// ── Required libraries (install via Arduino Library Manager) ─────────────────
//   • ESP32 Arduino Core  ≥ 3.0.0  (Espressif Systems)
//   • lvgl                8.3.x    (lv_conf.h is in THIS sketch folder)
//   • Arduino_GFX_Library ≥ 1.4.7  (moononournation)
//   • NimBLE-Arduino      ≥ 1.4.1  (h2zero)
//   • Preferences         built-in with ESP32 core
//
// ── Boot sequence ─────────────────────────────────────────────────────────────
//   NVS → Haptics → Display+LVGL → UI screens → Scheduler seed → BLE
//   If not yet paired → show SCR_PAIR with 4-digit passkey.
//
// ── Main loop ─────────────────────────────────────────────────────────────────
//   lv_timer_handler() every 5 ms  (cooperative LVGL tick)
//   scheduler_tick()   every 1 s   (millis-based, no FreeRTOS needed)

#define LV_CONF_INCLUDE_SIMPLE  // tell lvgl to look for lv_conf.h in this folder
#include <lvgl.h>

#include "bsp_display.h"
#include "haptics.h"
#include "nvs_store.h"
#include "scheduler.h"
#include "ble_gatt.h"
#include "ui_theme.h"

// ─────────────────────────────────────────────────────────────────────────────
static unsigned long s_last_clock_ms = 0;

void setup()
{
    Serial.begin(115200);
    Serial.println("\n[tk] TimeKeeper booting");

    // 1. Persistent storage (Preferences — must come before BLE generates a code).
    nvs_store_init();

    // 2. Haptic motor GPIO.
    haptics_init();

    // 3. Display, touch, and LVGL (lv_init() is called inside bsp_display_init).
    bsp_display_init();
    bsp_touch_attach();

    // 4. Build all LVGL screens and load the home screen.
    ui_theme_init();

    // 5. Seed the default Morning routine (replaced on first BLE connect).
    scheduler_init();

    // 6. Start BLE — generates a random 4-digit session passkey.
    ble_init();

    // 7. If not already paired, show the pair screen so the caregiver can connect.
    if (!ble_is_connected()) {
        // ble_init() has already stored the passkey; just display it.
        uint32_t code = (uint32_t)strtoul(ble_pair_code(), nullptr, 10);
        ble_setup_security(code);
        ui_show_pair_screen(code);
    }

    Serial.println("[tk] boot complete");
}

void loop()
{
    // Drive LVGL (renders pending animations, handles touch events, etc.).
    lv_timer_handler();

    // 1 Hz scheduler tick — walks the routine list and triggers reminders.
    unsigned long now = millis();
    if (now - s_last_clock_ms >= 1000UL) {
        s_last_clock_ms = now;

        // Use uptime-derived minute-of-day as a clock proxy.
        // Wire to an RTC (e.g. DS3231 or ESP32-S3 internal RTC via time.h)
        // to get an accurate wall-clock time.
        unsigned long sec_of_day = (now / 1000UL) % 86400UL;
        int min_of_day = (int)(sec_of_day / 60);
        int weekday    = 0;  // 0 = Sunday; replace with RTC weekday

        scheduler_tick(min_of_day, weekday);
    }

    delay(5);
}
