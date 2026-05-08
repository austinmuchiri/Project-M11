// BLE GATT server — NimBLE-Arduino port.
//
// Library required: NimBLE-Arduino (install via Arduino Library Manager)
//   Replaces ESP-IDF host/ble_hs.h NimBLE headers.
//
// GATT layout:
//   Service  TK_BLE_SERVICE_UUID
//     EVENT   (NOTIFY)  — watch → phone (TaskEvent JSON)
//     ROUTINE (WRITE)   — phone → watch (Routine JSON)
//     NUDGE   (WRITE)   — phone → watch (Nudge JSON)
//
// Security: passkey-based pairing (watch displays, phone enters the 4-digit code).

#include "ble_gatt.h"
#include <NimBLEDevice.h>
#include <Arduino.h>
#include <stdio.h>
#include <string.h>

// Forward declarations for sync callbacks.
extern "C" void sync_on_connect(void);
extern "C" void sync_handle_routine_payload(const char *json, size_t len);

static NimBLEServer         *s_server      = nullptr;
static NimBLECharacteristic *s_event_char  = nullptr;

static bool              s_connected      = false;
static char              s_pair_code[10]  = "0000";
static ble_nudge_cb_t    s_nudge_cb       = nullptr;

// ─────────────────────────────────────────────────────────────────────────────
// Connection callbacks
// ─────────────────────────────────────────────────────────────────────────────
class TKServerCallbacks : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer *pSrv) override {
        s_connected = true;
        Serial.println("[ble] phone connected");
        sync_on_connect();
    }
    void onDisconnect(NimBLEServer *pSrv) override {
        s_connected = false;
        Serial.println("[ble] disconnected — restarting advertising");
        NimBLEDevice::startAdvertising();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Characteristic write callbacks
// ─────────────────────────────────────────────────────────────────────────────
class RoutineCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic *pChar) override {
        std::string val = pChar->getValue();
        if (!val.empty())
            sync_handle_routine_payload(val.c_str(), val.size());
    }
};

class NudgeCallbacks : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic *pChar) override {
        if (s_nudge_cb) {
            std::string val = pChar->getValue();
            if (!val.empty())
                s_nudge_cb(val.c_str(), val.size());
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
void ble_setup_security(uint32_t passkey)
{
    snprintf(s_pair_code, sizeof(s_pair_code), "%04lu", (unsigned long)passkey);
    NimBLEDevice::setSecurityPasskey(passkey);
    Serial.printf("[ble] security passkey set: %s\n", s_pair_code);
}

void ble_init(void)
{
    // Generate a random 4-digit session code.
    uint32_t passkey = 1000 + (esp_random() % 9000);
    snprintf(s_pair_code, sizeof(s_pair_code), "%04lu", (unsigned long)passkey);

    NimBLEDevice::init("TimeKeeper");

    // Passkey security: watch displays the code, phone enters it.
    NimBLEDevice::setSecurityPasskey(passkey);
    NimBLEDevice::setSecurityIOCap(BLE_HS_IO_CAP_DISP_ONLY);
    NimBLEDevice::setSecurityAuth(
        BLE_SM_PAIR_AUTHREQ_SC | BLE_SM_PAIR_AUTHREQ_BOND);

    s_server = NimBLEDevice::createServer();
    s_server->setCallbacks(new TKServerCallbacks());

    NimBLEService *svc = s_server->createService(TK_BLE_SERVICE_UUID);

    // EVENT characteristic — watch notifies the phone.
    s_event_char = svc->createCharacteristic(
        TK_BLE_CHAR_EVENT_UUID,
        NIMBLE_PROPERTY::NOTIFY);

    // ROUTINE characteristic — phone writes the schedule JSON.
    NimBLECharacteristic *routine_char = svc->createCharacteristic(
        TK_BLE_CHAR_ROUTINE_UUID,
        NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
    routine_char->setCallbacks(new RoutineCallbacks());

    // NUDGE characteristic — phone writes an interrupt message.
    NimBLECharacteristic *nudge_char = svc->createCharacteristic(
        TK_BLE_CHAR_NUDGE_UUID,
        NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
    nudge_char->setCallbacks(new NudgeCallbacks());

    svc->start();

    NimBLEAdvertising *adv = NimBLEDevice::getAdvertising();
    adv->addServiceUUID(TK_BLE_SERVICE_UUID);
    adv->setScanResponse(true);
    adv->start();

    Serial.printf("[ble] advertising as 'TimeKeeper' — pair code: %s\n", s_pair_code);
}

bool ble_is_connected(void)
{
    return s_connected;
}

const char *ble_pair_code(void)
{
    return s_pair_code;
}

void ble_push_event(const char *json_line)
{
    if (!s_event_char || !s_connected) return;
    s_event_char->setValue(json_line);
    s_event_char->notify();
}

void ble_set_nudge_handler(ble_nudge_cb_t cb)
{
    s_nudge_cb = cb;
}
