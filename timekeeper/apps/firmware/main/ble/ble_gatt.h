#pragma once
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

#define TK_BLE_SERVICE_UUID      "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define TK_BLE_CHAR_EVENT_UUID   "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define TK_BLE_CHAR_ROUTINE_UUID "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
#define TK_BLE_CHAR_NUDGE_UUID   "6e400004-b5a3-f393-e0a9-e50e24dcca9e"

/**
 * Initializes the BLE stack and generates a random session passkey.
 */
void ble_init(void);

/**
 * Configures the Security Manager with the specific 4-digit passkey 
 * required for pairing with the React App.
 */
void ble_setup_security(uint32_t passkey);

bool ble_is_connected(void);

/**
 * Returns the 4-digit pairing code as a NUL-terminated numeric string (e.g., "8241").
 * This matches the code displayed on the SCR_PAIR screen and entered in the app[cite: 2].
 */
const char *ble_pair_code(void);

// Push a TaskEvent JSON line to the phone (notify on EVENT char).
void ble_push_event(const char *json_line);

// Register a handler for nudge bytes coming down from the phone.
typedef void (*ble_nudge_cb_t)(const char *json, size_t len);
void ble_set_nudge_handler(ble_nudge_cb_t cb);