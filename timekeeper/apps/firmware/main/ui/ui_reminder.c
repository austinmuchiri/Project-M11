// 03 · Reminder — slow breathe + START
#include "ui_theme.h"

extern void haptics_buzz_short(void);

static void breathe_anim_cb(void *obj, int32_t v)
{
    lv_obj_set_style_transform_scale((lv_obj_t *)obj, v, 0);
}

lv_obj_t *ui_reminder_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);
    ui_statusbar_create(scr);

    // Big breathing circle with task icon
    lv_obj_t *circle = lv_obj_create(scr);
    lv_obj_remove_style_all(circle);
    lv_obj_set_size(circle, 210, 210);
    lv_obj_set_style_radius(circle, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_bg_color(circle, COLOR_BRAND_SOFT, 0);
    lv_obj_set_style_bg_opa(circle, LV_OPA_COVER, 0);
    lv_obj_set_style_border_color(circle, COLOR_BRAND, 0);
    lv_obj_set_style_border_width(circle, 4, 0);
    lv_obj_align(circle, LV_ALIGN_TOP_MID, 0, 80);

    lv_anim_t a;
    lv_anim_init(&a);
    lv_anim_set_var(&a, circle);
    lv_anim_set_values(&a, 256, 268);          // 1.00 → ~1.05 transform_scale
    lv_anim_set_time(&a, 1200);
    lv_anim_set_playback_time(&a, 1200);
    lv_anim_set_repeat_count(&a, LV_ANIM_REPEAT_INFINITE);
    lv_anim_set_path_cb(&a, lv_anim_path_ease_in_out);
    lv_anim_set_exec_cb(&a, breathe_anim_cb);
    lv_anim_start(&a);

    // Title
    lv_obj_t *cue = lv_label_create(scr);
    lv_label_set_text(cue, "TIME FOR");
    lv_obj_set_style_text_color(cue, COLOR_INK_DIM, 0);
    lv_obj_set_style_text_letter_space(cue, 2, 0);
    lv_obj_set_style_text_font(cue, &font_nunito_sans_16, 0);
    lv_obj_align(cue, LV_ALIGN_TOP_MID, 0, 304);

    lv_obj_t *task = lv_label_create(scr);
    lv_label_set_text(task, "Brush Teeth");
    lv_obj_set_style_text_color(task, COLOR_INK, 0);
    lv_obj_set_style_text_font(task, &font_nunito_36, 0);
    lv_obj_align(task, LV_ALIGN_TOP_MID, 0, 328);

    // START button
    lv_obj_t *btn = lv_btn_create(scr);
    lv_obj_set_size(btn, 270, 86);
    lv_obj_align(btn, LV_ALIGN_BOTTOM_MID, 0, -28);
    lv_obj_set_style_radius(btn, 22, 0);
    lv_obj_set_style_bg_color(btn, COLOR_BRAND, 0);
    lv_obj_set_style_shadow_width(btn, 0, 0);

    lv_obj_t *label = lv_label_create(btn);
    lv_label_set_text(label, "START");
    lv_obj_set_style_text_color(label, lv_color_white(), 0);
    lv_obj_set_style_text_font(label, &font_nunito_28, 0);
    lv_obj_set_style_text_letter_space(label, 2, 0);
    lv_obj_center(label);

    haptics_buzz_short();
    return scr;
}
