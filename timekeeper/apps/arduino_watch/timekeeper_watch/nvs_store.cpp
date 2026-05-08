// Persistent storage for offline event buffering + pairing state.
// Replaces ESP-IDF NVS with Arduino Preferences (built into ESP32 core).
// Each buffered event is stored under key "ev_N" in namespace "tk".

#include "nvs_store.h"
#include <Preferences.h>
#include <Arduino.h>
#include <stdio.h>

static Preferences s_prefs;

void nvs_store_init(void)
{
    // Preferences opens on first use; nothing to init explicitly.
    Serial.println("[nvs] Preferences storage ready");
}

int nvs_store_buffer_event(const char *json_line)
{
    s_prefs.begin("tk", false);
    uint32_t next = s_prefs.getUInt("ev_seq", 0);
    char key[16];
    snprintf(key, sizeof(key), "ev_%lu", (unsigned long)next);
    s_prefs.putString(key, json_line);
    s_prefs.putUInt("ev_seq", next + 1);
    s_prefs.end();
    return 0;
}

int nvs_store_drain_events(void (*emit)(const char *line))
{
    s_prefs.begin("tk", false);
    uint32_t total = s_prefs.getUInt("ev_seq", 0);
    int drained = 0;
    for (uint32_t i = 0; i < total; i++) {
        char key[16];
        snprintf(key, sizeof(key), "ev_%lu", (unsigned long)i);
        String val = s_prefs.getString(key, "");
        if (val.length() > 0) {
            emit(val.c_str());
            s_prefs.remove(key);
            drained++;
        }
    }
    s_prefs.putUInt("ev_seq", 0);
    s_prefs.end();
    return drained;
}
