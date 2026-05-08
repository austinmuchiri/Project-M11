// LVGL v8 configuration for TimeKeeper watch.
// Place this file in the same folder as the .ino sketch.
// Required libraries (install via Arduino Library Manager):
//   - lvgl (8.3.x)
//   - Arduino_GFX_Library
//   - NimBLE-Arduino

#if 1  // Set to 1 to enable lv_conf.h

#ifndef LV_CONF_H
#define LV_CONF_H

#include <stdint.h>

// ── Colour depth ────────────────────────────────────────────────────────────
// RM67162 AMOLED uses RGB565 (16-bit).
#define LV_COLOR_DEPTH 16
#define LV_COLOR_16_SWAP 0  // set 1 if display bytes are swapped

// ── Memory ──────────────────────────────────────────────────────────────────
#define LV_MEM_CUSTOM 0
#define LV_MEM_SIZE (96U * 1024U)   // 96 KB LVGL heap

// ── HAL ─────────────────────────────────────────────────────────────────────
#define LV_TICK_CUSTOM 1
#define LV_TICK_CUSTOM_INCLUDE <Arduino.h>
#define LV_TICK_CUSTOM_SYS_TIME_EXPR (millis())

// ── Logging ─────────────────────────────────────────────────────────────────
#define LV_USE_LOG 1
#define LV_LOG_LEVEL LV_LOG_LEVEL_WARN
#define LV_LOG_PRINTF 1

// ── Features ────────────────────────────────────────────────────────────────
#define LV_USE_ANIMIMG   0
#define LV_USE_ARC       1
#define LV_USE_BAR       1
#define LV_USE_BTN       1
#define LV_USE_BTNMATRIX 0
#define LV_USE_CALENDAR  0
#define LV_USE_CANVAS    0
#define LV_USE_CHART     0
#define LV_USE_CHECKBOX  0
#define LV_USE_COLORWHEEL 0
#define LV_USE_DROPDOWN  0
#define LV_USE_IMG       1
#define LV_USE_LABEL     1
#define LV_USE_LINE      0
#define LV_USE_LIST      1
#define LV_USE_MENU      0
#define LV_USE_METER     0
#define LV_USE_MSGBOX    0
#define LV_USE_OBJX_TEMPLATE 0
#define LV_USE_ROLLER    0
#define LV_USE_SLIDER    0
#define LV_USE_SPAN      0
#define LV_USE_SPINBOX   0
#define LV_USE_SPINNER   0
#define LV_USE_SWITCH    0
#define LV_USE_TABLE     0
#define LV_USE_TABVIEW   0
#define LV_USE_TEXTAREA  0
#define LV_USE_TILEVIEW  0
#define LV_USE_WIN       0

// ── Layout ──────────────────────────────────────────────────────────────────
#define LV_USE_FLEX    1   // Flexbox layout — required by all screens
#define LV_USE_GRID    1

// ── Animations ──────────────────────────────────────────────────────────────
#define LV_USE_ANIMATION 1

// ── Drawing ─────────────────────────────────────────────────────────────────
#define LV_DRAW_COMPLEX 1
#define LV_SHADOW_CACHE_SIZE 0
#define LV_CIRCLE_CACHE_COUNT 4

// ── Screen fade/load animations ─────────────────────────────────────────────
#define LV_SCR_LOAD_ANIM_FADE_IN 1

// ── Fonts — built-in Montserrat substitutes for custom Nunito ───────────────
// Once you generate Nunito fonts with the LVGL Font Converter, add the
// generated .c files to this sketch folder and declare them in ui_theme.h.
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_16 1
#define LV_FONT_MONTSERRAT_18 1
#define LV_FONT_MONTSERRAT_22 1
#define LV_FONT_MONTSERRAT_24 1
#define LV_FONT_MONTSERRAT_28 1
#define LV_FONT_MONTSERRAT_36 1
#define LV_FONT_MONTSERRAT_48 1

#define LV_FONT_DEFAULT &lv_font_montserrat_16

// ── Symbols ──────────────────────────────────────────────────────────────────
#define LV_USE_FONT_SUBPX 0
#define LV_FONT_SUBPX_BGR 0

// ── Image decoders ───────────────────────────────────────────────────────────
#define LV_USE_BMP   0
#define LV_USE_PNG   0
#define LV_USE_JPG   0
#define LV_USE_GIF   0

// ── GPU / DMA2D ──────────────────────────────────────────────────────────────
#define LV_USE_GPU_SDL  0
#define LV_USE_GPU_SWM  0

// ── OS / threading ───────────────────────────────────────────────────────────
#define LV_USE_OS LV_OS_NONE   // Cooperative — driven by lv_timer_handler() in loop()

// ── Assert ───────────────────────────────────────────────────────────────────
#define LV_USE_ASSERT_NULL          1
#define LV_USE_ASSERT_MALLOC        1
#define LV_USE_ASSERT_STYLE         0
#define LV_USE_ASSERT_MEM_INTEGRITY 0
#define LV_USE_ASSERT_OBJ           0

#endif // LV_CONF_H
#endif // Set to 1
