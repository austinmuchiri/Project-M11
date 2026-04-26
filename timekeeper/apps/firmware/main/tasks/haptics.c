// Haptic patterns — drives the linear vibration motor on GPIO_HAPTIC.
// Three short pulses for reminders, one long for success, escalating
// triple for retry. Quiet-hours flag is honoured: caller should check
// sched config before triggering.

#include "driver/gpio.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"

#define GPIO_HAPTIC GPIO_NUM_15

static const char *TAG = "haptic";

static void buzz_for_ms(int ms)
{
    gpio_set_level(GPIO_HAPTIC, 1);
    vTaskDelay(pdMS_TO_TICKS(ms));
    gpio_set_level(GPIO_HAPTIC, 0);
}

void haptics_init(void)
{
    gpio_config_t cfg = {
        .pin_bit_mask = (1ULL << GPIO_HAPTIC),
        .mode = GPIO_MODE_OUTPUT,
    };
    gpio_config(&cfg);
    ESP_LOGI(TAG, "ready on GPIO%d", GPIO_HAPTIC);
}

void haptics_buzz_short(void)
{
    buzz_for_ms(80);
    vTaskDelay(pdMS_TO_TICKS(80));
    buzz_for_ms(80);
}

void haptics_buzz_success(void)
{
    buzz_for_ms(220);
}

void haptics_buzz_retry(void)
{
    for (int i = 0; i < 3; ++i) {
        buzz_for_ms(60);
        vTaskDelay(pdMS_TO_TICKS(60));
    }
}
