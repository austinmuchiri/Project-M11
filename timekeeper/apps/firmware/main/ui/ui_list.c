// 02 · Today list — scrollable lv_list with up to 3 visible task rows
#include "ui_theme.h"

typedef struct {
    const char *time;
    const char *label;
    enum { ROW_DONE, ROW_ACTIVE, ROW_PENDING } status;
} list_row_t;

static const list_row_t s_rows[] = {
    { "7:10", "Brush Teeth", ROW_DONE },
    { "7:20", "Get Dressed", ROW_ACTIVE },
    { "7:30", "Breakfast",   ROW_PENDING },
    { "7:40", "Pack Bag",    ROW_PENDING },
};

static void add_row(lv_obj_t *parent, const list_row_t *r)
{
    lv_obj_t *row = lv_obj_create(parent);
    lv_obj_remove_style_all(row);
    lv_obj_set_size(row, WATCH_W - 36, 102);
    lv_obj_set_style_radius(row, 20, 0);
    lv_obj_set_style_pad_hor(row, 18, 0);
    lv_obj_set_flex_flow(row, LV_FLEX_FLOW_ROW);
    lv_obj_set_flex_align(row, LV_FLEX_ALIGN_START,
                          LV_FLEX_ALIGN_CENTER, LV_FLEX_ALIGN_CENTER);
    lv_obj_set_style_pad_column(row, 16, 0);

    lv_color_t accent;
    switch (r->status) {
        case ROW_DONE:    accent = COLOR_BRAND;     break;
        case ROW_ACTIVE:  accent = COLOR_ACCENT;    break;
        default:          accent = COLOR_INK_DIM;   break;
    }

    lv_obj_set_style_bg_color(row, r->status == ROW_ACTIVE ? COLOR_BRAND_SOFT : COLOR_SURFACE, 0);
    lv_obj_set_style_bg_opa(row, LV_OPA_COVER, 0);
    lv_obj_set_style_border_width(row, r->status == ROW_ACTIVE ? 2 : 1, 0);
    lv_obj_set_style_border_color(row, r->status == ROW_ACTIVE ? COLOR_BRAND : COLOR_INK_FAINT, 0);
    lv_obj_set_style_border_opa(row, r->status == ROW_ACTIVE ? LV_OPA_COVER : LV_OPA_30, 0);

    lv_obj_t *time_lbl = lv_label_create(row);
    lv_label_set_text(time_lbl, r->time);
    lv_obj_set_style_text_font(time_lbl, &font_jetbrains_mono_14, 0);
    lv_obj_set_style_text_color(time_lbl, COLOR_INK_2, 0);

    lv_obj_t *icon_box = lv_obj_create(row);
    lv_obj_remove_style_all(icon_box);
    lv_obj_set_size(icon_box, 60, 60);
    lv_obj_set_style_radius(icon_box, 16, 0);
    lv_obj_set_style_bg_color(icon_box, accent, 0);
    lv_obj_set_style_bg_opa(icon_box, LV_OPA_30, 0);

    lv_obj_t *label_lbl = lv_label_create(row);
    lv_label_set_text(label_lbl, r->label);
    lv_obj_set_style_text_font(label_lbl, &font_nunito_22, 0);
    lv_obj_set_style_text_color(label_lbl, COLOR_INK, 0);
    lv_obj_set_flex_grow(label_lbl, 1);
}

lv_obj_t *ui_list_create(void)
{
    lv_obj_t *scr = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(scr, COLOR_BG, 0);
    ui_statusbar_create(scr);

    lv_obj_t *header = lv_label_create(scr);
    lv_label_set_text(header, "Today");
    lv_obj_set_style_text_font(header, &font_nunito_28, 0);
    lv_obj_set_style_text_color(header, COLOR_INK, 0);
    lv_obj_align(header, LV_ALIGN_TOP_LEFT, 24, 60);

    lv_obj_t *count = lv_label_create(scr);
    lv_label_set_text(count, "2 of 5 done");
    lv_obj_set_style_text_color(count, COLOR_INK_DIM, 0);
    lv_obj_set_style_text_font(count, &font_nunito_sans_16, 0);
    lv_obj_align(count, LV_ALIGN_TOP_LEFT, 24, 100);

    lv_obj_t *list = lv_obj_create(scr);
    lv_obj_remove_style_all(list);
    lv_obj_set_size(list, WATCH_W, WATCH_H - 140);
    lv_obj_align(list, LV_ALIGN_BOTTOM_MID, 0, 0);
    lv_obj_set_flex_flow(list, LV_FLEX_FLOW_COLUMN);
    lv_obj_set_style_pad_row(list, 14, 0);
    lv_obj_set_style_pad_hor(list, 18, 0);
    lv_obj_set_style_pad_top(list, 12, 0);

    for (size_t i = 0; i < sizeof(s_rows) / sizeof(s_rows[0]); ++i) {
        add_row(list, &s_rows[i]);
    }

    return scr;
}
