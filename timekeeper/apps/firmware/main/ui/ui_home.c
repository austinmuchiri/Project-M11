// 01 · Home / clock face
// Layout: status bar (44) · time label (96px) · progress arc (210) · next-task panel
#include "ui_theme.h"
#include <stdio.h>

lv_obj_t *ui_home_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);

    ui_statusbar_create(scr);

    // Time
    lv_obj_t *time_lbl = lv_label_create(scr);
    lv_label_set_text(time_lbl, "7:23");
    lv_obj_set_style_text_font(time_lbl, &font_nunito_96, 0);
    lv_obj_set_style_text_color(time_lbl, COLOR_INK, 0);
    lv_obj_align(time_lbl, LV_ALIGN_TOP_MID, 0, 60);

    // Date strip
    lv_obj_t *date_lbl = lv_label_create(scr);
    lv_label_set_text(date_lbl, "SUN · APR 25");
    lv_obj_set_style_text_color(date_lbl, COLOR_INK_DIM, 0);
    lv_obj_set_style_text_font(date_lbl, &font_nunito_sans_16, 0);
    lv_obj_set_style_text_letter_space(date_lbl, 2, 0);
    lv_obj_align(date_lbl, LV_ALIGN_TOP_MID, 0, 168);

    // Routine progress arc
    lv_obj_t *arc = lv_arc_create(scr);
    lv_obj_set_size(arc, 210, 210);
    lv_arc_set_rotation(arc, 270);
    lv_arc_set_bg_angles(arc, 0, 360);
    lv_arc_set_value(arc, 40);  // 2/5 done
    lv_obj_align(arc, LV_ALIGN_TOP_MID, 0, 200);
    lv_obj_remove_style(arc, NULL, LV_PART_KNOB);
    lv_obj_set_style_arc_color(arc, COLOR_BRAND_SOFT, LV_PART_MAIN);
    lv_obj_set_style_arc_color(arc, COLOR_BRAND, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(arc, 10, LV_PART_MAIN);
    lv_obj_set_style_arc_width(arc, 10, LV_PART_INDICATOR);
    lv_obj_set_style_arc_rounded(arc, true, LV_PART_INDICATOR);

    lv_obj_t *count_lbl = lv_label_create(scr);
    lv_label_set_text(count_lbl, "2/5");
    lv_obj_set_style_text_font(count_lbl, &font_nunito_52, 0);
    lv_obj_set_style_text_color(count_lbl, COLOR_INK, 0);
    lv_obj_align_to(count_lbl, arc, LV_ALIGN_CENTER, 0, -8);

    lv_obj_t *routine_lbl = lv_label_create(scr);
    lv_label_set_text(routine_lbl, "MORNING");
    lv_obj_set_style_text_color(routine_lbl, COLOR_INK_DIM, 0);
    lv_obj_set_style_text_letter_space(routine_lbl, 2, 0);
    lv_obj_set_style_text_font(routine_lbl, &font_nunito_sans_16, 0);
    lv_obj_align_to(routine_lbl, count_lbl, LV_ALIGN_OUT_BOTTOM_MID, 0, 6);

    // Next-task card
    lv_obj_t *card = lv_obj_create(scr);
    lv_obj_remove_style_all(card);
    lv_obj_set_size(card, WATCH_W - 48, 78);
    lv_obj_align(card, LV_ALIGN_BOTTOM_MID, 0, -24);
    lv_obj_set_style_bg_color(card, COLOR_SURFACE, 0);
    lv_obj_set_style_bg_opa(card, LV_OPA_COVER, 0);
    lv_obj_set_style_radius(card, 18, 0);
    lv_obj_set_style_pad_hor(card, 16, 0);
    lv_obj_set_flex_flow(card, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(card, LV_FLEX_ALIGN_START,
                          LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    lv_obj_set_style_pad_column(card, 14, 0);

    // Icon badge (sage soft)
    lv_obj_t *badge = lv_obj_create(card);
    lv_obj_remove_style_all(badge);
    lv_obj_set_size(badge, 50, 50);
    lv_obj_set_style_radius(badge, 14, 0);
    lv_obj_set_style_bg_color(badge, COLOR_BRAND_SOFT, 0);
    lv_obj_set_style_bg_opa(badge, LV_OPA_COVER, 0);

    lv_obj_t *next_meta = lv_label_create(card);
    lv_label_set_text(next_meta, "NEXT · 7:30\nGet Dressed");
    lv_obj_set_style_text_color(next_meta, COLOR_INK, 0);
    lv_obj_set_style_text_font(next_meta, &font_nunito_sans_18, 0);

    return scr;
}
