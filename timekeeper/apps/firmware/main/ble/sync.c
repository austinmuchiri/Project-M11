// Routine + event sync over BLE.
// On connect: pull the latest Routine list from the phone (notify on
// the ROUTINE char) and persist via nvs_store. While disconnected,
// events are buffered to NVS and replayed when the link returns.

#include "ble_gatt.h"
#include <stdio.h>
#include <string.h>
#include "esp_log.h"

extern void scheduler_apply_routines_json(const char *json, size_t len);
extern int  nvs_store_buffer_event(const char *json_line);
extern int  nvs_store_drain_events(void (*emit)(const char *line));

static const char *TAG = "sync";

void sync_on_connect(void)
{
    ESP_LOGI(TAG, "connected — drain buffered events");
    nvs_store_drain_events(ble_push_event);
}

void sync_handle_routine_payload(const char *json, size_t len)
{
    ESP_LOGI(TAG, "routine sync: %u bytes", (unsigned)len);
    scheduler_apply_routines_json(json, len);
}

void sync_record_event(const char *json_line)
{
    if (ble_is_connected()) {
        ble_push_event(json_line);
    } else {
        nvs_store_buffer_event(json_line);
    }
}
