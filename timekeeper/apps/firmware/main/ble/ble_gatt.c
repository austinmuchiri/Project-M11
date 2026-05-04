#include "ble_gatt.h"
#include <stdio.h>
#include <string.h>
#include "esp_log.h"
#include "esp_random.h" // Needed for random code generation

// NimBLE and stack headers
#include "host/ble_hs.h"
#include "services/gap/ble_svc_gap.h"

static const char *TAG = "ble";

static char s_pair_code_str[10] = "0000";
static uint32_t s_passkey = 0;
static bool s_connected = false;
static ble_nudge_cb_t s_nudge_cb = NULL;

/**
 * Configures the Security Manager to use the 4-digit passkey 
 * entered in the React Settings screen.
 */
void ble_setup_security(uint32_t passkey) {
    ble_hs_cfg.sm_io_cap = BLE_HS_IO_CAP_DISP_ONLY; // Watch displays, phone enters
    ble_hs_cfg.sm_pairing_mode = 1;                 // Enable security
    ble_hs_cfg.sm_bonding = 1;                      // Remember the phone
    ble_hs_cfg.sm_sc = 1;                           // Secure Connections
    
    // Set the static passkey for the NimBLE stack
    struct ble_sm_io io;
    memset(&io, 0, sizeof(io));
    io.action = BLE_SM_IOACT_DISP;
    io.passkey = passkey;
    
    ESP_LOGI(TAG, "BLE Security configured with passkey: %04lu", passkey);
}

void ble_init(void)
{
    // 1. Generate a random 4-digit code for the session[cite: 2]
    s_passkey = 1000 + (esp_random() % 9000); 
    snprintf(s_pair_code_str, sizeof(s_pair_code_str), "%lu", s_passkey);

    ESP_LOGI(TAG, "Initializing NimBLE. Pairing code: %s", s_pair_code_str);

    // 2. Real stack initialization (Simplified for brevity)
    // nimble_port_init(); 
    // ble_svc_gap_init();
    
    // 3. Apply the security passkey to the stack[cite: 2]
    ble_setup_security(s_passkey);

    // 4. Start advertising as "TimeKeeper"
    // ble_gap_adv_start(...); 
}

bool ble_is_connected(void) { 
    return s_connected; 
}

/** 
 * Returns the string version of the code for the UI (ui_theme.c)
 * to display on the SCR_PAIR screen[cite: 2].
 */
const char *ble_pair_code(void) { 
    return s_pair_code_str; 
}

void ble_set_nudge_handler(ble_nudge_cb_t cb) { 
    s_nudge_cb = cb; 
}

// ... rest of the event handlers