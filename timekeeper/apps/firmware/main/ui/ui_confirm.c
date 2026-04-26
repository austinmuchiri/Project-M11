// 05 · Confirm — hold-to-done arc fill (900ms)
#include "ui_theme.h"

extern void scheduler_complete_current(void);
extern void haptics_buzz_success(void);

static void fill_anim_cb(void *obj, int32_t v) { lv_arc_set_value((lv_obj_t *)obj, v); }
static void on_release(lv_event_t *e);
static void on_press(lv_event_t *e);

static lv_obj_t *s_arc;

static void hold_complete_cb(lv_anim_t *a)
{
    (void)a;
    haptics_buzz_success();
    scheduler_complete_current();
    ui_show_screen(SCR_REWARD);
}

static void on_press(lv_event_t *e)
{
    (void)e;
    lv_anim_t a;
    lv_anim_init(&a);
    lv_anim_set_var(&a, s_arc);
    lv_anim_set_values(&a, 0, 100);
    lv_anim_set_time(&a, 900);
    lv_anim_set_path_cb(&a, lv_anim_path_linear);
    lv_anim_set_exec_cb(&a, fill_anim_cb);
    lv_anim_set_ready_cb(&a, hold_complete_cb);
    lv_anim_start(&a);
}

static void on_release(lv_event_t *e)
{
    (void)e;
    lv_anim_del(s_arc, fill_anim_cb);
    lv_arc_set_value(s_arc, 0);
}

lv_obj_t *ui_confirm_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);
    ui_statusbar_create(scr);

    lv_obj_t *cue = lv_label_create(scr);
    lv_label_set_text(cue, "CONFIRM");
    lv_obj_set_style_text_color(cue, COLOR_INK_DIM, 0);
    lv_obj_set_style_text_letter_space(cue, 2, 0);
    lv_obj_set_style_text_font(cue, &font_nunito_sans_16, 0);
    lv_obj_align(cue, LV_ALIGN_TOP_MID, 0, 60);

    s_arc = lv_arc_create(scr);
    lv_obj_set_size(s_arc, 290, 290);
    lv_arc_set_rotation(s_arc, 270);
    lv_arc_set_bg_angles(s_arc, 0, 360);
    lv_arc_set_value(s_arc, 0);
    lv_obj_align(s_arc, LV_ALIGN_TOP_MID, 0, 100);
    lv_obj_remove_style(s_arc, NULL, LV_PART_KNOB);
    lv_obj_set_style_arc_color(s_arc, COLOR_BRAND_SOFT, LV_PART_MAIN);
    lv_obj_set_style_arc_color(s_arc, COLOR_BRAND, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(s_arc, 16, LV_PART_MAIN);
    lv_obj_set_style_arc_width(s_arc, 16, LV_PART_INDICATOR);
    lv_obj_set_style_arc_rounded(s_arc, true, LV_PART_INDICATOR);

    lv_obj_t *hold_lbl = lv_label_create(scr);
    lv_label_set_text(hold_lbl, "Hold");
    lv_obj_set_style_text_color(hold_lbl, COLOR_INK, 0);
    lv_obj_set_style_text_font(hold_lbl, &font_nunito_22, 0);
    lv_obj_align_to(hold_lbl, s_arc, LV_ALIGN_CENTER, 0, 0);

    lv_obj_t *hint = lv_label_create(scr);
    lv_label_set_text(hint, "Keep holding to mark done");
    lv_obj_set_style_text_color(hint, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(hint, &font_nunito_sans_18, 0);
    lv_obj_align(hint, LV_ALIGN_BOTTOM_MID, 0, -32);

    lv_obj_add_event_cb(s_arc, on_press,   LV_EVENT_PRESSED, NULL);
    lv_obj_add_event_cb(s_arc, on_release, LV_EVENT_RELEASED, NULL);
    lv_obj_add_event_cb(s_arc, on_release, LV_EVENT_PRESS_LOST, NULL);

    return scr;
}
