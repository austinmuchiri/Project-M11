// Routine + event sync over BLE.
// On connect: drain buffered events (written while disconnected) and push them.
// On routine write: forward JSON to the scheduler.
// On task event: push immediately if connected, buffer to Preferences otherwise.

#include "ble_gatt.h"
#include "nvs_store.h"
#include <Arduino.h>
#include <string.h>

extern "C" void scheduler_apply_routines_json(const char *json, size_t len);

extern "C" void sync_on_connect(void)
{
    Serial.println("[sync] connected — draining buffered events");
    nvs_store_drain_events(ble_push_event);
}

extern "C" void sync_handle_routine_payload(const char *json, size_t len)
{
    Serial.printf("[sync] routine sync: %u bytes\n", (unsigned)len);
    scheduler_apply_routines_json(json, len);
}

extern "C" void sync_record_event(const char *json_line)
{
    if (ble_is_connected()) {
        ble_push_event(json_line);
    } else {
        nvs_store_buffer_event(json_line);
    }
}
