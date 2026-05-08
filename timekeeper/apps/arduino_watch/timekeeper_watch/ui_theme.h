// V2 "Calm" design tokens — mirror packages/ui/src/tokens.ts.
// Identical hex values to the React caregiver app and watch simulator.

#pragma once
#include <lvgl.h>

// ── Colour palette ────────────────────────────────────────────────────────────
#define COLOR_BG          lv_color_hex(0xF4EFE6)
#define COLOR_BG_SOFT     lv_color_hex(0xEDE6DB)
#define COLOR_SURFACE     lv_color_hex(0xFFFFFF)
#define COLOR_INK         lv_color_hex(0x2E2E33)
#define COLOR_INK_2       lv_color_hex(0x56565E)
#define COLOR_INK_DIM     lv_color_hex(0x8A8A92)
#define COLOR_INK_FAINT   lv_color_hex(0xB6B6BC)
#define COLOR_BRAND       lv_color_hex(0x7FA38E)
#define COLOR_BRAND_SOFT  lv_color_hex(0xD7E4DB)
#define COLOR_ACCENT      lv_color_hex(0xC99466)
#define COLOR_ACCENT_SOFT lv_color_hex(0xF1E2CF)
#define COLOR_WARN        lv_color_hex(0xD69A55)
#define COLOR_WARN_SOFT   lv_color_hex(0xF4E2C9)
#define COLOR_STAR        lv_color_hex(0xC99B3F)
#define COLOR_STAR_SOFT   lv_color_hex(0xF1E3C2)

// ── Watch panel 410 × 502 ─────────────────────────────────────────────────────
#define WATCH_W 410
#define WATCH_H 502

// ── Fonts ─────────────────────────────────────────────────────────────────────
// Custom Nunito / JetBrains Mono fonts are generated with the LVGL Font Converter
// (https://lvgl.io/tools/fontconverter) and placed as .c files in this sketch folder.
//
// Until you generate them, built-in Montserrat fonts are used as drop-in substitutes.
// Remove these #defines and uncomment the extern declarations once your fonts are ready.

#define font_nunito_22         lv_font_montserrat_22
#define font_nunito_28         lv_font_montserrat_28
#define font_nunito_36         lv_font_montserrat_36
#define font_nunito_52         lv_font_montserrat_48   // closest built-in
#define font_nunito_64         lv_font_montserrat_48   // closest built-in
#define font_nunito_96         lv_font_montserrat_48   // closest built-in
#define font_nunito_sans_16    lv_font_montserrat_16
#define font_nunito_sans_18    lv_font_montserrat_18
#define font_jetbrains_mono_14 lv_font_montserrat_14

// Uncomment once generated:
// extern const lv_font_t font_nunito_22;
// extern const lv_font_t font_nunito_28;
// extern const lv_font_t font_nunito_36;
// extern const lv_font_t font_nunito_52;
// extern const lv_font_t font_nunito_64;
// extern const lv_font_t font_nunito_96;
// extern const lv_font_t font_nunito_sans_16;
// extern const lv_font_t font_nunito_sans_18;
// extern const lv_font_t font_jetbrains_mono_14;

// ── Theme init ────────────────────────────────────────────────────────────────
// Call once after lv_init() and display driver registration.
void ui_theme_init(void);

// ── Status bar (top 44 px) ────────────────────────────────────────────────────
lv_obj_t *ui_statusbar_create(lv_obj_t *parent);
void       ui_statusbar_set_time(lv_obj_t *bar, const char *hhmm);
void       ui_statusbar_set_battery(lv_obj_t *bar, int pct);
void       ui_statusbar_set_ble(lv_obj_t *bar, bool connected);

// ── Screen registry ───────────────────────────────────────────────────────────
typedef enum {
    SCR_HOME = 0,
    SCR_LIST,
    SCR_REMINDER,
    SCR_ACTIVE,
    SCR_CONFIRM,
    SCR_REWARD,
    SCR_MISSED,
    SCR_PAIR,
    SCR_COUNT,
} screen_id_t;

void ui_show_screen(screen_id_t id);

// Show the pair screen and update the displayed passkey.
// The code string is read from ble_pair_code(); 'code' is passed for logging.
void ui_show_pair_screen(uint32_t code);
