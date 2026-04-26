// V2 "Calm" design tokens for LVGL — mirror packages/ui/src/tokens.ts.
// Hex values are identical to the React app and watch simulator.

#pragma once
#include "lvgl.h"

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

// Watch panel — 410 × 502
#define WATCH_W 410
#define WATCH_H 502

// Display fonts — generated with the LVGL Font Converter from
// Nunito (display) and Nunito Sans (body) at the listed sizes.
extern const lv_font_t font_nunito_22;
extern const lv_font_t font_nunito_28;
extern const lv_font_t font_nunito_36;
extern const lv_font_t font_nunito_52;
extern const lv_font_t font_nunito_64;
extern const lv_font_t font_nunito_96;
extern const lv_font_t font_nunito_sans_16;
extern const lv_font_t font_nunito_sans_18;
extern const lv_font_t font_jetbrains_mono_14;

// Theme initialiser — sets up the default screen background and
// applies a soft shadow style the screen modules reference.
void ui_theme_init(lv_disp_t *disp);

// Shared status-bar widget (top 44px row: clock, BLE indicator, battery).
lv_obj_t *ui_statusbar_create(lv_obj_t *parent);
void ui_statusbar_set_time(lv_obj_t *bar, const char *hhmm);
void ui_statusbar_set_battery(lv_obj_t *bar, int pct);
void ui_statusbar_set_ble(lv_obj_t *bar, bool connected);

// Screen registry — lets the scheduler swap screens via lv_scr_load_anim.
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
