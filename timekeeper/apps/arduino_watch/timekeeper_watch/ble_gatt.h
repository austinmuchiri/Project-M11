#pragma once
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

// Service + characteristic UUIDs — must match the React caregiver app.
#define TK_BLE_SERVICE_UUID      "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define TK_BLE_CHAR_EVENT_UUID   "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define TK_BLE_CHAR_ROUTINE_UUID "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
#define TK_BLE_CHAR_NUDGE_UUID   "6e400004-b5a3-f393-e0a9-e50e24dcca9e"

#ifdef __cplusplus
extern "C" {
#endif

void ble_init(void);
void ble_setup_security(uint32_t passkey);

bool        ble_is_connected(void);
const char *ble_pair_code(void);

// Push a TaskEvent JSON line to the phone via NOTIFY on the EVENT characteristic.
void ble_push_event(const char *json_line);

// Register a callback invoked when the phone writes a nudge.
typedef void (*ble_nudge_cb_t)(const char *json, size_t len);
void ble_set_nudge_handler(ble_nudge_cb_t cb);

#ifdef __cplusplus
}
#endif
