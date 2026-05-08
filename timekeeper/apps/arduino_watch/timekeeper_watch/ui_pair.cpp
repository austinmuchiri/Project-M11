// 08 · BLE pairing — 4-digit code + spinning arc

#include "ui_theme.h"
#include "ble_gatt.h"

static void spin_anim_cb(void *obj, int32_t v)
{
    lv_obj_set_style_transform_rotation((lv_obj_t *)obj, v, 0);
}

lv_obj_t *ui_pair_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);
    ui_statusbar_create(scr);

    lv_obj_t *halo = lv_obj_create(scr);
    lv_obj_remove_style_all(halo);
    lv_obj_set_size(halo, 200, 200);
    lv_obj_set_style_radius(halo, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_border_color(halo, COLOR_BRAND_SOFT, 0);
    lv_obj_set_style_border_width(halo, 4, 0);
    lv_obj_align(halo, LV_ALIGN_TOP_MID, 0, 80);

    lv_obj_t *spin = lv_arc_create(scr);
    lv_obj_set_size(spin, 200, 200);
    lv_arc_set_rotation(spin, 270);
    lv_arc_set_bg_angles(spin, 0, 360);
    lv_arc_set_value(spin, 25);
    lv_obj_align_to(spin, halo, LV_ALIGN_CENTER, 0, 0);
    lv_obj_remove_style(spin, NULL, LV_PART_KNOB);
    lv_obj_set_style_arc_opa(spin, LV_OPA_TRANSP, LV_PART_MAIN);
    lv_obj_set_style_arc_color(spin, COLOR_BRAND, LV_PART_INDICATOR);
    lv_obj_set_style_arc_width(spin, 4, LV_PART_INDICATOR);

    lv_anim_t a;
    lv_anim_init(&a);
    lv_anim_set_var(&a, spin);
    lv_anim_set_values(&a, 0, 3600);
    lv_anim_set_time(&a, 2000);
    lv_anim_set_repeat_count(&a, LV_ANIM_REPEAT_INFINITE);
    lv_anim_set_path_cb(&a, lv_anim_path_linear);
    lv_anim_set_exec_cb(&a, spin_anim_cb);
    lv_anim_start(&a);

    lv_obj_t *ble_icon = lv_label_create(halo);
    lv_label_set_text(ble_icon, LV_SYMBOL_BLUETOOTH);
    lv_obj_set_style_text_color(ble_icon, COLOR_BRAND, 0);
    lv_obj_set_style_text_font(ble_icon, &font_nunito_96, 0);
    lv_obj_center(ble_icon);

    lv_obj_t *title = lv_label_create(scr);
    lv_label_set_text(title, "Pair with phone");
    lv_obj_set_style_text_color(title, COLOR_INK, 0);
    lv_obj_set_style_text_font(title, &font_nunito_28, 0);
    lv_obj_align(title, LV_ALIGN_TOP_MID, 0, 300);

    lv_obj_t *body = lv_label_create(scr);
    lv_label_set_text(body, "Open TimeKeeper -> Devices -> Pair");
    lv_obj_set_style_text_color(body, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(body, &font_nunito_sans_18, 0);
    lv_obj_align(body, LV_ALIGN_TOP_MID, 0, 340);

    // Pairing code box
    lv_obj_t *code_box = lv_obj_create(scr);
    lv_obj_remove_style_all(code_box);
    lv_obj_set_size(code_box, 230, 58);
    lv_obj_set_style_radius(code_box, 14, 0);
    lv_obj_set_style_bg_color(code_box, COLOR_SURFACE, 0);
    lv_obj_set_style_bg_opa(code_box, LV_OPA_COVER, 0);
    lv_obj_set_style_border_color(code_box, COLOR_BRAND, 0);
    lv_obj_set_style_border_width(code_box, 2, 0);
    lv_obj_align(code_box, LV_ALIGN_TOP_MID, 0, 388);

    lv_obj_t *code_lbl = lv_label_create(code_box);
    lv_label_set_text(code_lbl, ble_pair_code());
    lv_obj_set_style_text_color(code_lbl, COLOR_INK, 0);
    lv_obj_set_style_text_font(code_lbl, &font_nunito_36, 0);
    lv_obj_set_style_text_letter_space(code_lbl, 8, 0);
    lv_obj_center(code_lbl);

    lv_obj_t *tip = lv_label_create(scr);
    lv_label_set_text(tip, "BTN1 = cancel  BTN2 = re-broadcast");
    lv_obj_set_style_text_color(tip, COLOR_INK_DIM, 0);
    lv_obj_set_style_text_font(tip, &font_jetbrains_mono_14, 0);
    lv_obj_align(tip, LV_ALIGN_BOTTOM_MID, 0, -16);

    return scr;
}
