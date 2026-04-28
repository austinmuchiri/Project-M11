// Routine Tracker — watch firmware mockup
// Hardware: Waveshare ESP32-S3-Touch-AMOLED-2.06 (410 × 502 AMOLED + CST816 touch)
//
// What this does:
//   • Boots the display + touch via Waveshare's BSP component
//   • Shows the "V2 Calm" Routine Tracker design language on the real watch
//   • 4 demo screens: Home → Reminder → Active timer → Reward
//   • Tap anywhere to advance. Press-and-hold (>900 ms) on the Active screen
//     to mark the task done early and jump to Reward.
//
// What this is NOT:
//   • The full firmware — no BLE, no scheduler, no NVS persistence.
//     For that, see apps/firmware/ (the production project skeleton).
//
// Build & flash:
//   cd apps/firmware-mockup
//   idf.py set-target esp32s3
//   idf.py build
//   idf.py -p COM3 flash monitor   (Windows; use /dev/cu.usbmodem* on macOS)
//   Hold BOOT, tap RST, release BOOT before flashing.

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "lvgl.h"

// Waveshare BSP — exposes bsp_display_start() which inits the QSPI bus,
// SH8601 panel, CST816 touch, and starts an LVGL tick task. If your IDF
// component manager didn't fetch the BSP, replace this include + call with
// the manual init pattern from Waveshare's wiki example.
#include "bsp/esp-bsp.h"

static const char *TAG = "rt-mockup";

// ─────────────────────────────────────────────────────────
// V2 Calm color tokens — must match packages/ui/src/tokens.ts
// ─────────────────────────────────────────────────────────
#define C_BG          lv_color_hex(0xF4EFE6)
#define C_BG_SOFT     lv_color_hex(0xEDE6DB)
#define C_SURFACE     lv_color_hex(0xFFFFFF)
#define C_INK         lv_color_hex(0x2E2E33)
#define C_INK_2       lv_color_hex(0x56565E)
#define C_INK_DIM     lv_color_hex(0x8A8A92)
#define C_BRAND       lv_color_hex(0x7FA38E)
#define C_BRAND_SOFT  lv_color_hex(0xD7E4DB)
#define C_ACCENT      lv_color_hex(0xC99466)
#define C_STAR        lv_color_hex(0xC99B3F)
#define C_STAR_SOFT   lv_color_hex(0xF1E3C2)

// LVGL ships these built-in via the sdkconfig flags we enabled.
#define FONT_LG  &lv_font_montserrat_48
#define FONT_MD  &lv_font_montserrat_24
#define FONT_SM  &lv_font_montserrat_14

#define WW 410
#define WH 502

typedef enum { S_HOME, S_REMINDER, S_ACTIVE, S_REWARD, S_COUNT } screen_id_t;
static screen_id_t s_current = S_HOME;
static lv_obj_t *s_root = NULL;

static void show_screen(screen_id_t id);

// ─────────────────────────────────────────────────────────
// Reusable bits
// ─────────────────────────────────────────────────────────

static lv_obj_t *make_status_bar(lv_obj_t *parent, const char *time_str, int batt_pct)
{
    lv_obj_t *bar = lv_obj_create(parent);
    lv_obj_remove_style_all(bar);
    lv_obj_set_size(bar, WW, 44);
    lv_obj_align(bar, LV_ALIGN_TOP_MID, 0, 0);
    lv_obj_set_style_pad_hor(bar, 24, 0);
    lv_obj_set_style_pad_top(bar, 14, 0);
    lv_obj_set_flex_flow(bar, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(bar, LV_FLEX_ALIGN_SPACE_BETWEEN,
                          LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);

    lv_obj_t *t = lv_label_create(bar);
    lv_label_set_text(t, time_str);
    lv_obj_set_style_text_color(t, C_INK_2, 0);
    lv_obj_set_style_text_font(t, FONT_SM, 0);

    char buf[12];
    snprintf(buf, sizeof(buf), LV_SYMBOL_BLUETOOTH "  %d%%", batt_pct);
    lv_obj_t *r = lv_label_create(bar);
    lv_label_set_text(r, buf);
    lv_obj_set_style_text_color(r, C_INK_2, 0);
    lv_obj_set_style_text_font(r, FONT_SM, 0);
    return bar;
}

static lv_obj_t *make_circle(lv_obj_t *parent, int size, lv_color_t fill,
                             lv_color_t border, int border_w)
{
    lv_obj_t *c = lv_obj_create(parent);
    lv_obj_remove_style_all(c);
    lv_obj_set_size(c, size, size);
    lv_obj_set_style_radius(c, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_bg_color(c, fill, 0);
    lv_obj_set_style_bg_opa(c, LV_OPA_COVER, 0);
    if (border_w > 0) {
        lv_obj_set_style_border_color(c, border, 0);
        lv_obj_set_style_border_width(c, border_w, 0);
    }
    return c;
}

// ─────────────────────────────────────────────────────────
// Screen builders — all draw onto s_root
// ─────────────────────────────────────────────────────────

static void build_home(void)
{
    make_status_bar(s_root, "7:23", 64);

    lv_obj_t *time_lbl = lv_label_create(s_root);
    lv_label_set_text(time_lbl, "7:23");
    lv_obj_set_style_text_font(time_lbl, FONT_LG, 0);
    lv_obj_set_style_text_color(time_lbl, C_INK, 0);
    lv_obj_align(time_lbl, LV_ALIGN_TOP_MID, 0, 80);

    lv_obj_t *date_lbl = lv_label_create(s_root);
    lv_label_set_text(date_lbl, "SUN  APR 27");
    lv_obj_set_style_text_color(date_lbl, C_INK_DIM, 0);
    lv_obj_set_style_text_font(date_lbl, FONT_SM, 0);
    lv_obj_set_style_text_letter_space(date_lbl, 2, 0);
    lv_obj_align(date_lbl, LV_ALIGN_TOP_MID, 0, 150);

    lv_obj_t *arc = lv_arc_create(s_root);
    lv_obj_set_size(arc, 230, 230);
    lv_arc_set_rotation(arc, 270);
    lv_arc_set_bg_angles(arc, 0, 360);
    lv_arc_set_value(arc, 40);
    lv_obj_remove_style(arc, NULL, LV_PART_KNOB);
    lv_obj_set_style_arc_color(arc, C_BRAND_SOFT, LV_PART_MAIN);
    lv_obj_set_style_arc_color(arc, C_BRAND, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(arc, 12, LV_PART_MAIN);
    lv_obj_set_style_arc_width(arc, 12, LV_PART_INDICATOR);
    lv_obj_set_style_arc_rounded(arc, true, LV_PART_INDICATOR);
    lv_obj_align(arc, LV_ALIGN_TOP_MID, 0, 200);

    lv_obj_t *count = lv_label_create(s_root);
    lv_label_set_text(count, "2/5");
    lv_obj_set_style_text_font(count, FONT_LG, 0);
    lv_obj_set_style_text_color(count, C_INK, 0);
    lv_obj_align_to(count, arc, LV_ALIGN_CENTER, 0, -10);

    lv_obj_t *routine = lv_label_create(s_root);
    lv_label_set_text(routine, "MORNING");
    lv_obj_set_style_text_color(routine, C_INK_DIM, 0);
    lv_obj_set_style_text_font(routine, FONT_SM, 0);
    lv_obj_set_style_text_letter_space(routine, 2, 0);
    lv_obj_align_to(routine, count, LV_ALIGN_OUT_BOTTOM_MID, 0, 6);

    lv_obj_t *card = lv_obj_create(s_root);
    lv_obj_remove_style_all(card);
    lv_obj_set_size(card, WW - 48, 78);
    lv_obj_align(card, LV_ALIGN_BOTTOM_MID, 0, -22);
    lv_obj_set_style_bg_color(card, C_SURFACE, 0);
    lv_obj_set_style_bg_opa(card, LV_OPA_COVER, 0);
    lv_obj_set_style_radius(card, 18, 0);
    lv_obj_set_style_pad_hor(card, 18, 0);
    lv_obj_set_flex_flow(card, LV_FLEX_FLOW_COLUMN);
    lv_obj_set_flex_align(card, LV_FLEX_ALIGN_CENTER,
                          LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_START);

    lv_obj_t *next_label = lv_label_create(card);
    lv_label_set_text(next_label, "NEXT  7:30");
    lv_obj_set_style_text_color(next_label, C_INK_DIM, 0);
    lv_obj_set_style_text_font(next_label, FONT_SM, 0);
    lv_obj_set_style_text_letter_space(next_label, 2, 0);

    lv_obj_t *next_task = lv_label_create(card);
    lv_label_set_text(next_task, "Get Dressed");
    lv_obj_set_style_text_color(next_task, C_INK, 0);
    lv_obj_set_style_text_font(next_task, FONT_MD, 0);
}

static void build_reminder(void)
{
    make_status_bar(s_root, "7:30", 64);

    lv_obj_t *halo = make_circle(s_root, 220, C_BRAND_SOFT, C_BRAND, 4);
    lv_obj_align(halo, LV_ALIGN_TOP_MID, 0, 90);

    lv_obj_t *icon = lv_label_create(halo);
    lv_label_set_text(icon, LV_SYMBOL_OK);  // placeholder — swap for tooth/shirt glyph later
    lv_obj_set_style_text_color(icon, C_BRAND, 0);
    lv_obj_set_style_text_font(icon, FONT_LG, 0);
    lv_obj_center(icon);

    lv_obj_t *cue = lv_label_create(s_root);
    lv_label_set_text(cue, "TIME FOR");
    lv_obj_set_style_text_color(cue, C_INK_DIM, 0);
    lv_obj_set_style_text_font(cue, FONT_SM, 0);
    lv_obj_set_style_text_letter_space(cue, 2, 0);
    lv_obj_align(cue, LV_ALIGN_TOP_MID, 0, 320);

    lv_obj_t *task = lv_label_create(s_root);
    lv_label_set_text(task, "Brush Teeth");
    lv_obj_set_style_text_color(task, C_INK, 0);
    lv_obj_set_style_text_font(task, FONT_LG, 0);
    lv_obj_align(task, LV_ALIGN_TOP_MID, 0, 348);

    lv_obj_t *btn = lv_obj_create(s_root);
    lv_obj_remove_style_all(btn);
    lv_obj_set_size(btn, 270, 80);
    lv_obj_align(btn, LV_ALIGN_BOTTOM_MID, 0, -28);
    lv_obj_set_style_bg_color(btn, C_BRAND, 0);
    lv_obj_set_style_bg_opa(btn, LV_OPA_COVER, 0);
    lv_obj_set_style_radius(btn, 22, 0);
    lv_obj_t *blbl = lv_label_create(btn);
    lv_label_set_text(blbl, "START");
    lv_obj_set_style_text_color(blbl, lv_color_white(), 0);
    lv_obj_set_style_text_font(blbl, FONT_MD, 0);
    lv_obj_set_style_text_letter_space(blbl, 2, 0);
    lv_obj_center(blbl);
}

static void build_active(void)
{
    make_status_bar(s_root, "7:32", 63);

    lv_obj_t *arc = lv_arc_create(s_root);
    lv_obj_set_size(arc, 270, 270);
    lv_arc_set_rotation(arc, 270);
    lv_arc_set_bg_angles(arc, 0, 360);
    lv_arc_set_value(arc, 62);
    lv_obj_remove_style(arc, NULL, LV_PART_KNOB);
    lv_obj_set_style_arc_color(arc, C_BG_SOFT, LV_PART_MAIN);
    lv_obj_set_style_arc_color(arc, C_BRAND, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(arc, 14, LV_PART_MAIN);
    lv_obj_set_style_arc_width(arc, 14, LV_PART_INDICATOR);
    lv_obj_set_style_arc_rounded(arc, true, LV_PART_INDICATOR);
    lv_obj_align(arc, LV_ALIGN_TOP_MID, 0, 70);

    lv_obj_t *time_lbl = lv_label_create(s_root);
    lv_label_set_text(time_lbl, "2:12");
    lv_obj_set_style_text_color(time_lbl, C_INK, 0);
    lv_obj_set_style_text_font(time_lbl, FONT_LG, 0);
    lv_obj_align_to(time_lbl, arc, LV_ALIGN_CENTER, 0, -10);

    lv_obj_t *of_lbl = lv_label_create(s_root);
    lv_label_set_text(of_lbl, "OF 3:00");
    lv_obj_set_style_text_color(of_lbl, C_INK_DIM, 0);
    lv_obj_set_style_text_font(of_lbl, FONT_SM, 0);
    lv_obj_set_style_text_letter_space(of_lbl, 2, 0);
    lv_obj_align_to(of_lbl, time_lbl, LV_ALIGN_OUT_BOTTOM_MID, 0, 4);

    lv_obj_t *chip = lv_obj_create(s_root);
    lv_obj_remove_style_all(chip);
    lv_obj_set_size(chip, LV_SIZE_CONTENT, 32);
    lv_obj_set_style_radius(chip, 999, 0);
    lv_obj_set_style_bg_color(chip, C_BRAND_SOFT, 0);
    lv_obj_set_style_bg_opa(chip, LV_OPA_COVER, 0);
    lv_obj_set_style_pad_hor(chip, 18, 0);
    lv_obj_align(chip, LV_ALIGN_TOP_MID, 0, 360);
    lv_obj_t *cl = lv_label_create(chip);
    lv_label_set_text(cl, "BRUSH TEETH");
    lv_obj_set_style_text_color(cl, C_BRAND, 0);
    lv_obj_set_style_text_font(cl, FONT_SM, 0);
    lv_obj_set_style_text_letter_space(cl, 2, 0);
    lv_obj_center(cl);

    lv_obj_t *hint = lv_label_create(s_root);
    lv_label_set_text(hint, "Tap to mark done");
    lv_obj_set_style_text_color(hint, C_INK_DIM, 0);
    lv_obj_set_style_text_font(hint, FONT_SM, 0);
    lv_obj_align(hint, LV_ALIGN_BOTTOM_MID, 0, -28);
}

static void build_reward(void)
{
    make_status_bar(s_root, "7:35", 63);

    lv_obj_t *halo = make_circle(s_root, 210, C_STAR_SOFT, C_STAR, 4);
    lv_obj_align(halo, LV_ALIGN_TOP_MID, 0, 100);

    lv_obj_t *star = lv_label_create(halo);
    lv_label_set_text(star, LV_SYMBOL_OK);
    lv_obj_set_style_text_color(star, C_STAR, 0);
    lv_obj_set_style_text_font(star, FONT_LG, 0);
    lv_obj_center(star);

    lv_obj_t *praise = lv_label_create(s_root);
    lv_label_set_text(praise, "Nice work!");
    lv_obj_set_style_text_color(praise, C_INK, 0);
    lv_obj_set_style_text_font(praise, FONT_LG, 0);
    lv_obj_align(praise, LV_ALIGN_TOP_MID, 0, 330);

    lv_obj_t *meta = lv_label_create(s_root);
    lv_label_set_text(meta, "+1 star earned");
    lv_obj_set_style_text_color(meta, C_INK_2, 0);
    lv_obj_set_style_text_font(meta, FONT_MD, 0);
    lv_obj_align(meta, LV_ALIGN_TOP_MID, 0, 380);

    lv_obj_t *chip = lv_obj_create(s_root);
    lv_obj_remove_style_all(chip);
    lv_obj_set_size(chip, LV_SIZE_CONTENT, 50);
    lv_obj_set_style_radius(chip, 999, 0);
    lv_obj_set_style_bg_color(chip, C_BRAND, 0);
    lv_obj_set_style_bg_opa(chip, LV_OPA_COVER, 0);
    lv_obj_set_style_pad_hor(chip, 24, 0);
    lv_obj_align(chip, LV_ALIGN_BOTTOM_MID, 0, -28);
    lv_obj_t *cl = lv_label_create(chip);
    lv_label_set_text(cl, LV_SYMBOL_OK "  184");
    lv_obj_set_style_text_color(cl, lv_color_white(), 0);
    lv_obj_set_style_text_font(cl, FONT_MD, 0);
    lv_obj_center(cl);
}

// ─────────────────────────────────────────────────────────
// Screen swapper — wipes the active screen and rebuilds
// ─────────────────────────────────────────────────────────

static void show_screen(screen_id_t id)
{
    s_current = id;
    lv_obj_clean(s_root);

    switch (id) {
        case S_HOME:     build_home();     break;
        case S_REMINDER: build_reminder(); break;
        case S_ACTIVE:   build_active();   break;
        case S_REWARD:   build_reward();   break;
        default: break;
    }
    ESP_LOGI(TAG, "showing screen %d", id);
}

static void on_screen_tap(lv_event_t *e)
{
    (void)e;
    show_screen((s_current + 1) % S_COUNT);
}

// ─────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────

void app_main(void)
{
    ESP_LOGI(TAG, "Routine Tracker mockup booting");

    // Waveshare BSP brings up display + touch + LVGL tick.
    bsp_display_start();
    bsp_display_backlight_on();

    // bsp_display_lock takes the LVGL mutex so we can build the UI safely
    // from this task while LVGL renders on its own task.
    bsp_display_lock(0);

    s_root = lv_scr_act();
    lv_obj_set_style_bg_color(s_root, C_BG, 0);
    lv_obj_set_style_bg_opa(s_root, LV_OPA_COVER, 0);
    lv_obj_clear_flag(s_root, LV_OBJ_FLAG_SCROLLABLE);

    // Tap-anywhere: cycle through demo screens.
    lv_obj_add_flag(s_root, LV_OBJ_FLAG_CLICKABLE);
    lv_obj_add_event_cb(s_root, on_screen_tap, LV_EVENT_CLICKED, NULL);

    show_screen(S_HOME);

    bsp_display_unlock();

    ESP_LOGI(TAG, "ready — tap the screen to advance");
}
