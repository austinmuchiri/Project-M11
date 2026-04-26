// 04 · Active — countdown arc + Pause/Done buttons
#include "ui_theme.h"

extern void scheduler_pause_current(void);
extern void scheduler_complete_current(void);

static void on_pause(lv_event_t *e) { (void)e; scheduler_pause_current(); }
static void on_done(lv_event_t *e)  { (void)e; ui_show_screen(SCR_CONFIRM); }

lv_obj_t *ui_active_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);
    ui_statusbar_create(scr);

    // Big arc + remaining time
    lv_obj_t *arc = lv_arc_create(scr);
    lv_obj_set_size(arc, 250, 250);
    lv_arc_set_rotation(arc, 270);
    lv_arc_set_bg_angles(arc, 0, 360);
    lv_arc_set_value(arc, 62);
    lv_obj_align(arc, LV_ALIGN_TOP_MID, 0, 70);
    lv_obj_remove_style(arc, NULL, LV_PART_KNOB);
    lv_obj_set_style_arc_color(arc, COLOR_BG_SOFT, LV_PART_MAIN);
    lv_obj_set_style_arc_color(arc, COLOR_BRAND, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(arc, 14, LV_PART_MAIN);
    lv_obj_set_style_arc_width(arc, 14, LV_PART_INDICATOR);
    lv_obj_set_style_arc_rounded(arc, true, LV_PART_INDICATOR);

    lv_obj_t *time_lbl = lv_label_create(scr);
    lv_label_set_text(time_lbl, "2:12");
    lv_obj_set_style_text_font(time_lbl, &font_nunito_64, 0);
    lv_obj_set_style_text_color(time_lbl, COLOR_INK, 0);
    lv_obj_align_to(time_lbl, arc, LV_ALIGN_CENTER, 0, -10);

    lv_obj_t *of_lbl = lv_label_create(scr);
    lv_label_set_text(of_lbl, "OF 3:00");
    lv_obj_set_style_text_color(of_lbl, COLOR_INK_DIM, 0);
    lv_obj_set_style_text_letter_space(of_lbl, 2, 0);
    lv_obj_set_style_text_font(of_lbl, &font_nunito_sans_16, 0);
    lv_obj_align_to(of_lbl, time_lbl, LV_ALIGN_OUT_BOTTOM_MID, 0, 4);

    // Task chip
    lv_obj_t *chip = lv_obj_create(scr);
    lv_obj_remove_style_all(chip);
    lv_obj_set_size(chip, LV_SIZE_CONTENT, 30);
    lv_obj_set_style_radius(chip, 999, 0);
    lv_obj_set_style_bg_color(chip, COLOR_BRAND_SOFT, 0);
    lv_obj_set_style_bg_opa(chip, LV_OPA_COVER, 0);
    lv_obj_set_style_pad_hor(chip, 16, 0);
    lv_obj_align(chip, LV_ALIGN_TOP_MID, 0, 348);

    lv_obj_t *chip_lbl = lv_label_create(chip);
    lv_label_set_text(chip_lbl, "BRUSH TEETH");
    lv_obj_set_style_text_color(chip_lbl, COLOR_BRAND, 0);
    lv_obj_set_style_text_font(chip_lbl, &font_nunito_sans_18, 0);
    lv_obj_set_style_text_letter_space(chip_lbl, 1, 0);
    lv_obj_center(chip_lbl);

    // Pause + DONE buttons
    lv_obj_t *btn_pause = lv_btn_create(scr);
    lv_obj_set_size(btn_pause, 168, 70);
    lv_obj_align(btn_pause, LV_ALIGN_BOTTOM_LEFT, 24, -24);
    lv_obj_set_style_bg_color(btn_pause, COLOR_SURFACE, 0);
    lv_obj_set_style_border_color(btn_pause, COLOR_INK_FAINT, 0);
    lv_obj_set_style_border_width(btn_pause, 2, 0);
    lv_obj_set_style_radius(btn_pause, 18, 0);
    lv_obj_set_style_shadow_width(btn_pause, 0, 0);
    lv_obj_t *plbl = lv_label_create(btn_pause);
    lv_label_set_text(plbl, "PAUSE");
    lv_obj_set_style_text_color(plbl, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(plbl, &font_nunito_22, 0);
    lv_obj_center(plbl);
    lv_obj_add_event_cb(btn_pause, on_pause, LV_EVENT_CLICKED, NULL);

    lv_obj_t *btn_done = lv_btn_create(scr);
    lv_obj_set_size(btn_done, 168, 70);
    lv_obj_align(btn_done, LV_ALIGN_BOTTOM_RIGHT, -24, -24);
    lv_obj_set_style_bg_color(btn_done, COLOR_BRAND, 0);
    lv_obj_set_style_radius(btn_done, 18, 0);
    lv_obj_set_style_shadow_width(btn_done, 0, 0);
    lv_obj_t *dlbl = lv_label_create(btn_done);
    lv_label_set_text(dlbl, "DONE");
    lv_obj_set_style_text_color(dlbl, lv_color_white(), 0);
    lv_obj_set_style_text_font(dlbl, &font_nunito_22, 0);
    lv_obj_set_style_text_letter_space(dlbl, 1, 0);
    lv_obj_center(dlbl);
    lv_obj_add_event_cb(btn_done, on_done, LV_EVENT_CLICKED, NULL);

    return scr;
}
