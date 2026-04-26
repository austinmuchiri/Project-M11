// 06 · Reward — animated star + counter
#include "ui_theme.h"

static void pop_anim(void *obj, int32_t v) { lv_obj_set_style_transform_scale((lv_obj_t *)obj, v, 0); }

lv_obj_t *ui_reward_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);
    ui_statusbar_create(scr);

    lv_obj_t *halo = lv_obj_create(scr);
    lv_obj_remove_style_all(halo);
    lv_obj_set_size(halo, 200, 200);
    lv_obj_set_style_radius(halo, LV_RADIUS_CIRCLE, 0);
    lv_obj_set_style_bg_color(halo, COLOR_STAR_SOFT, 0);
    lv_obj_set_style_bg_opa(halo, LV_OPA_COVER, 0);
    lv_obj_set_style_border_color(halo, COLOR_STAR, 0);
    lv_obj_set_style_border_width(halo, 4, 0);
    lv_obj_align(halo, LV_ALIGN_TOP_MID, 0, 100);

    // Star icon (using built-in symbol; replace with custom font glyph in production)
    lv_obj_t *star = lv_label_create(halo);
    lv_label_set_text(star, LV_SYMBOL_OK);
    lv_obj_set_style_text_color(star, COLOR_STAR, 0);
    lv_obj_set_style_text_font(star, &font_nunito_96, 0);
    lv_obj_center(star);

    lv_anim_t a;
    lv_anim_init(&a);
    lv_anim_set_var(&a, halo);
    lv_anim_set_values(&a, 230, 270);
    lv_anim_set_time(&a, 320);
    lv_anim_set_playback_time(&a, 220);
    lv_anim_set_path_cb(&a, lv_anim_path_overshoot);
    lv_anim_set_exec_cb(&a, pop_anim);
    lv_anim_start(&a);

    lv_obj_t *praise = lv_label_create(scr);
    lv_label_set_text(praise, "Nice work!");
    lv_obj_set_style_text_font(praise, &font_nunito_36, 0);
    lv_obj_set_style_text_color(praise, COLOR_INK, 0);
    lv_obj_align(praise, LV_ALIGN_TOP_MID, 0, 320);

    lv_obj_t *meta = lv_label_create(scr);
    lv_label_set_text(meta, "+1 star earned");
    lv_obj_set_style_text_color(meta, COLOR_INK_2, 0);
    lv_obj_set_style_text_font(meta, &font_nunito_sans_18, 0);
    lv_obj_align(meta, LV_ALIGN_TOP_MID, 0, 360);

    // Counter chip
    lv_obj_t *chip = lv_obj_create(scr);
    lv_obj_remove_style_all(chip);
    lv_obj_set_size(chip, LV_SIZE_CONTENT, 50);
    lv_obj_set_style_radius(chip, 999, 0);
    lv_obj_set_style_bg_color(chip, COLOR_BRAND, 0);
    lv_obj_set_style_bg_opa(chip, LV_OPA_COVER, 0);
    lv_obj_set_style_pad_hor(chip, 24, 0);
    lv_obj_align(chip, LV_ALIGN_BOTTOM_MID, 0, -26);

    lv_obj_t *chip_lbl = lv_label_create(chip);
    lv_label_set_text(chip_lbl, "* 184");
    lv_obj_set_style_text_color(chip_lbl, lv_color_white(), 0);
    lv_obj_set_style_text_font(chip_lbl, &font_jetbrains_mono_14, 0);
    lv_obj_center(chip_lbl);

    return scr;
}
