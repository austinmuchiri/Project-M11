// Theme init, status-bar widget, and screen registry.
// Ported from ESP-IDF ui_theme.c:
//   lv_disp_t *disp param removed — uses lv_scr_act() (LVGL 8 default display).
//   lv_malloc() → malloc() (stdlib).

#include "ui_theme.h"
#include <Arduino.h>
#include <stdlib.h>
#include <stdio.h>

// Screen builder declarations — defined in their own .cpp files.
extern lv_obj_t *ui_home_create(void);
extern lv_obj_t *ui_list_create(void);
extern lv_obj_t *ui_reminder_create(void);
extern lv_obj_t *ui_active_create(void);
extern lv_obj_t *ui_confirm_create(void);
extern lv_obj_t *ui_reward_create(void);
extern lv_obj_t *ui_missed_create(void);
extern lv_obj_t *ui_pair_create(void);

static lv_obj_t *s_screens[SCR_COUNT];

void ui_theme_init(void)
{
    lv_obj_t *root = lv_scr_act();
    lv_obj_set_style_bg_color(root, COLOR_BG, LV_PART_MAIN);
    lv_obj_set_style_bg_opa(root,  LV_OPA_COVER, LV_PART_MAIN);

    s_screens[SCR_HOME]     = ui_home_create();
    s_screens[SCR_LIST]     = ui_list_create();
    s_screens[SCR_REMINDER] = ui_reminder_create();
    s_screens[SCR_ACTIVE]   = ui_active_create();
    s_screens[SCR_CONFIRM]  = ui_confirm_create();
    s_screens[SCR_REWARD]   = ui_reward_create();
    s_screens[SCR_MISSED]   = ui_missed_create();
    s_screens[SCR_PAIR]     = ui_pair_create();

    lv_scr_load(s_screens[SCR_HOME]);
}

void ui_show_screen(screen_id_t id)
{
    if (id >= SCR_COUNT || !s_screens[id]) return;
    lv_scr_load_anim(s_screens[id], LV_SCR_LOAD_ANIM_FADE_IN, 220, 0, false);
}

void ui_show_pair_screen(uint32_t code)
{
    // The pair screen reads ble_pair_code() internally; just navigate.
    Serial.printf("[ui] showing pair screen — code: %04lu\n", (unsigned long)code);
    ui_show_screen(SCR_PAIR);
}

// ─────────────────────────────────────────────────────────────────────────────
// Status bar widget
// ─────────────────────────────────────────────────────────────────────────────

typedef struct {
    lv_obj_t *time_lbl;
    lv_obj_t *batt_lbl;
    lv_obj_t *ble_lbl;
} statusbar_t;

lv_obj_t *ui_statusbar_create(lv_obj_t *parent)
{
    lv_obj_t *bar = lv_obj_create(parent);
    lv_obj_remove_style_all(bar);
    lv_obj_set_size(bar, WATCH_W, 44);
    lv_obj_align(bar, LV_ALIGN_TOP_MID, 0, 0);
    lv_obj_set_style_pad_hor(bar, 24, 0);
    lv_obj_set_style_pad_top(bar, 14, 0);
    lv_obj_set_flex_flow(bar, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(bar,
        LV_FLEX_ALIGN_SPACE_BETWEEN,
        LV_FLEX_ALIGN_CENTER,
        LV_FLEX_ALIGN_CENTER);

    statusbar_t *s = (statusbar_t *)malloc(sizeof(statusbar_t));

    s->time_lbl = lv_label_create(bar);
    lv_label_set_text(s->time_lbl, "7:23");
    lv_obj_set_style_text_color(s->time_lbl, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(s->time_lbl, &font_jetbrains_mono_14, 0);

    lv_obj_t *right = lv_obj_create(bar);
    lv_obj_remove_style_all(right);
    lv_obj_set_size(right, LV_SIZE_CONTENT, LV_SIZE_CONTENT);
    lv_obj_set_flex_flow(right, LV_FLEX_FLOW_ROW);
    lv_obj_set_style_pad_column(right, 6, 0);

    s->ble_lbl = lv_label_create(right);
    lv_label_set_text(s->ble_lbl, LV_SYMBOL_BLUETOOTH);
    lv_obj_set_style_text_color(s->ble_lbl, COLOR_BRAND, 0);

    s->batt_lbl = lv_label_create(right);
    lv_label_set_text(s->batt_lbl, "64%");
    lv_obj_set_style_text_color(s->batt_lbl, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(s->batt_lbl, &font_jetbrains_mono_14, 0);

    lv_obj_set_user_data(bar, s);
    return bar;
}

void ui_statusbar_set_time(lv_obj_t *bar, const char *hhmm)
{
    statusbar_t *s = (statusbar_t *)lv_obj_get_user_data(bar);
    if (s && s->time_lbl) lv_label_set_text(s->time_lbl, hhmm);
}

void ui_statusbar_set_battery(lv_obj_t *bar, int pct)
{
    statusbar_t *s = (statusbar_t *)lv_obj_get_user_data(bar);
    if (!s || !s->batt_lbl) return;
    char buf[8];
    snprintf(buf, sizeof(buf), "%d%%", pct);
    lv_label_set_text(s->batt_lbl, buf);
}

void ui_statusbar_set_ble(lv_obj_t *bar, bool connected)
{
    statusbar_t *s = (statusbar_t *)lv_obj_get_user_data(bar);
    if (!s || !s->ble_lbl) return;
    lv_obj_set_style_text_color(s->ble_lbl,
        connected ? COLOR_BRAND : COLOR_INK_FAINT, 0);
}
