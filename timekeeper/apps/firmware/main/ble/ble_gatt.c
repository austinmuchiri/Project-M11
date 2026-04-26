// NimBLE-backed GATT server for TimeKeeper.
// Boots advertising on init; the phone subscribes to ROUTINE + NUDGE
// characteristics and writes to EVENT to send TaskEvents up.
//
// Pairing model: 4-digit code displayed on the watch + entered on the
// phone. We use Just Works pairing for hackday simplicity; production
// should use Numeric Comparison or Passkey Entry.

#include "ble_gatt.h"
#include <stdio.h>
#include <string.h>
#include "esp_log.h"

static const char *TAG = "ble";

static char s_pair_code[10] = "4 7 2 9";
static bool s_connected = false;
static ble_nudge_cb_t s_nudge_cb = NULL;

void ble_init(void)
{
    ESP_LOGI(TAG, "init NimBLE host + advertise '%s'", s_pair_code);
    // Real impl wires up:
    //   nimble_port_init();
    //   ble_svc_gap_init(); ble_svc_gatt_init();
    //   gatt_svr_init();              // declares 3 chars on the service UUID
    //   ble_gap_adv_start(...);       // connectable, 100ms interval
    //   esp_ble_gap_set_device_name("TimeKeeper");
    //
    // Connection callbacks set s_connected and trigger sync_on_connect().
}

bool ble_is_connected(void)             { return s_connected; }
const char *ble_pair_code(void)         { return s_pair_code; }
void ble_set_nudge_handler(ble_nudge_cb_t cb) { s_nudge_cb = cb; }

void ble_push_event(const char *json_line)
{
    ESP_LOGD(TAG, "event-> %s", json_line);
    // ble_gatts_notify_custom(conn_handle, event_attr_handle, json_line);
}

// Internal — invoked by GATT callback when phone writes to NUDGE char.
__attribute__((unused))
static void on_nudge_write(const char *json, size_t len)
{
    if (s_nudge_cb) s_nudge_cb(json, len);
}
