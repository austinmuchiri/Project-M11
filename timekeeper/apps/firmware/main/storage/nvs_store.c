// Persistent storage for offline event buffering + pairing state.
// Uses ESP-IDF NVS. Each buffered event is stored under "ev_<seq>" so
// drain order matches insert order.

#include "esp_log.h"
#include "nvs.h"
#include "nvs_flash.h"
#include <stdio.h>
#include <string.h>

static const char *TAG = "nvs";
#define NS "tk"

void nvs_store_init(void)
{
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        err = nvs_flash_init();
    }
    if (err != ESP_OK) ESP_LOGE(TAG, "nvs_flash_init: %s", esp_err_to_name(err));
}

int nvs_store_buffer_event(const char *json_line)
{
    nvs_handle_t h;
    if (nvs_open(NS, NVS_READWRITE, &h) != ESP_OK) return -1;

    uint32_t next = 0;
    nvs_get_u32(h, "ev_seq", &next);
    char key[16];
    snprintf(key, sizeof(key), "ev_%lu", (unsigned long)next);
    nvs_set_str(h, key, json_line);
    nvs_set_u32(h, "ev_seq", next + 1);
    nvs_commit(h);
    nvs_close(h);
    return 0;
}

int nvs_store_drain_events(void (*emit)(const char *line))
{
    nvs_handle_t h;
    if (nvs_open(NS, NVS_READWRITE, &h) != ESP_OK) return 0;

    uint32_t total = 0;
    nvs_get_u32(h, "ev_seq", &total);

    int drained = 0;
    for (uint32_t i = 0; i < total; ++i) {
        char key[16];
        snprintf(key, sizeof(key), "ev_%lu", (unsigned long)i);
        size_t len = 0;
        if (nvs_get_str(h, key, NULL, &len) != ESP_OK) continue;
        char *buf = malloc(len);
        if (!buf) break;
        if (nvs_get_str(h, key, buf, &len) == ESP_OK) {
            emit(buf);
            ++drained;
        }
        nvs_erase_key(h, key);
        free(buf);
    }
    nvs_set_u32(h, "ev_seq", 0);
    nvs_commit(h);
    nvs_close(h);
    return drained;
}
