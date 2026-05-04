// TimeKeeper watch firmware entry point.
// Boot order: NVS → display → LVGL → BLE → scheduler → 1Hz tick.

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "lvgl.h"

#include "ui_theme.h"
#include "ble_gatt.h"
#include "scheduler.h"

extern void nvs_store_init(void);
extern void haptics_init(void);

static const char *TAG = "main";

// Forward decls — these live in a board-specific bsp file the user
// pulls from the Waveshare repo (display init + touch driver).
extern void bsp_display_init(lv_disp_t **out_disp);
extern void bsp_touch_attach(lv_disp_t *disp);

static void lvgl_tick(void *arg)
{
    (void)arg;
    while (1) {
        lv_timer_handler();
        vTaskDelay(pdMS_TO_TICKS(5));
    }
}

static void clock_tick(void *arg)
{
    (void)arg;
    while (1) {
        // 1 Hz scheduler tick. In production wire to RTC; for now use
        // esp_timer_get_time() converted to a clock-of-day value.
        int64_t us = esp_timer_get_time();
        int sec_of_day = (int)((us / 1000000) % 86400);
        int min_of_day = sec_of_day / 60;
        int weekday = 0; // wire to RTC + tzset()
        scheduler_tick(min_of_day, weekday);
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "TimeKeeper booting");

    nvs_store_init();
    haptics_init();

    lv_disp_t *disp = NULL;
    bsp_display_init(&disp);
    bsp_touch_attach(disp);

    ui_theme_init(disp);
    scheduler_init();
    ble_init();

    xTaskCreate(lvgl_tick, "lvgl",  6 * 1024, NULL, 4, NULL);
    xTaskCreate(clock_tick, "clock", 3 * 1024, NULL, 3, NULL);

    if (!ble_is_connected()) {
        // Generate a random 4-digit code
        uint32_t pairing_code = 1000 + (esp_random() % 9000); 
        
        // Apply to BLE stack
        ble_setup_security(pairing_code);
        
        // Update UI to show this specific code
        ui_show_pair_screen(pairing_code); 
    }
}
