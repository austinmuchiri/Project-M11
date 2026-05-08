// 07 · Missed — gentle retry with Skip / Try Again buttons

#include "ui_theme.h"
#include "scheduler.h"

static void on_skip(lv_event_t *e)
{
    (void)e;
    scheduler_skip_current();
    ui_show_screen(SCR_HOME);
}

static void on_retry(lv_event_t *e)
{
    (void)e;
    scheduler_retry_current();
    ui_show_screen(SCR_REMINDER);
}

lv_obj_t *ui_missed_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);
    ui_statusbar_create(scr);

    lv_obj_t *circle = lv_obj_create(scr);
    lv_obj_remove_style_all(circle);
    lv_obj_set_size(circle, 200, 200);
    lv_obj_set_style_radius(circle, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_bg_color(circle, COLOR_WARN_SOFT, 0);
    lv_obj_set_style_bg_opa(circle, LV_OPA_COVER, 0);
    lv_obj_set_style_border_color(circle, COLOR_WARN, 0);
    lv_obj_set_style_border_width(circle, 4, 0);
    lv_obj_align(circle, LV_ALIGN_TOP_MID, 0, 90);

    lv_obj_t *bell = lv_label_create(circle);
    lv_label_set_text(bell, LV_SYMBOL_BELL);
    lv_obj_set_style_text_color(bell, COLOR_WARN, 0);
    lv_obj_set_style_text_font(bell, &font_nunito_64, 0);
    lv_obj_center(bell);

    lv_obj_t *title = lv_label_create(scr);
    lv_label_set_text(title, "Let's try again");
    lv_obj_set_style_text_color(title, COLOR_INK, 0);
    lv_obj_set_style_text_font(title, &font_nunito_28, 0);
    lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 308);

    lv_obj_t *body = lv_label_create(scr);
    lv_label_set_text(body, "Brush Teeth \xc2\xb7 still on the list");
    lv_obj_set_style_text_color(body, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(body, &font_nunito_sans_18, 0);
    lv_obj_align(body, LV_ALIGN_TOP_MID, 0, 348);

    lv_obj_t *skip = lv_btn_create(scr);
    lv_obj_set_size(skip, 168, 76);
    lv_obj_align(skip, LV_ALIGN_BOTTOM_LEFT, 24, -16);
    lv_obj_set_style_bg_color(skip, COLOR_SURFACE, 0);
    lv_obj_set_style_border_color(skip, COLOR_INK_FAINT, 0);
    lv_obj_set_style_border_width(skip, 2, 0);
    lv_obj_set_style_radius(skip, 18, 0);
    lv_obj_set_style_shadow_width(skip, 0, 0);
    lv_obj_t *skip_lbl = lv_label_create(skip);
    lv_label_set_text(skip_lbl, "SKIP");
    lv_obj_set_style_text_color(skip_lbl, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(skip_lbl, &font_nunito_sans_18, 0);
    lv_obj_center(skip_lbl);
    lv_obj_add_event_cb(skip, on_skip, LV_EVENT_CLICKED, NULL);

    lv_obj_t *retry = lv_btn_create(scr);
    lv_obj_set_size(retry, 168, 76);
    lv_obj_align(retry, LV_ALIGN_BOTTOM_RIGHT, -24, -16);
    lv_obj_set_style_bg_color(retry, COLOR_BRAND, 0);
    lv_obj_set_style_radius(retry, 18, 0);
    lv_obj_set_style_shadow_width(retry, 0, 0);
    lv_obj_t *retry_lbl = lv_label_create(retry);
    lv_label_set_text(retry_lbl, "TRY AGAIN");
    lv_obj_set_style_text_color(retry_lbl, lv_color_white(), 0);
    lv_obj_set_style_text_font(retry_lbl, &font_nunito_sans_18, 0);
    lv_obj_set_style_text_letter_space(retry_lbl, 1, 0);
    lv_obj_center(retry_lbl);
    lv_obj_add_event_cb(retry, on_retry, LV_EVENT_CLICKED, NULL);

    return scr;
}
