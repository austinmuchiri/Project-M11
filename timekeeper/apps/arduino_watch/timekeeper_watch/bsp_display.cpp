// Board-support layer for Waveshare ESP32-S3-Touch-AMOLED-2.06.
//
// ── Required libraries (install via Arduino Library Manager) ─────────────────
//   • Arduino_GFX_Library  ≥ 1.4.7
//   • lvgl                 8.3.x   (lv_conf.h in this sketch folder)
//
// ── Pin map — verify against Waveshare schematic ─────────────────────────────
//   QSPI display (RM67162):
//     CS   = 10   SCK  = 12   D0 = 11   D1 = 13   D2 = 14   D3 = 15 (QSPI)
//     RST  =  8   DC   =  9   (RM67162 is command/data via QSPI byte, not a DC line)
//   Capacitive touch (CST816S):
//     SDA  =  6   SCL  =  7   INT = 5   RST = 4

#include "bsp_display.h"
#include <Arduino_GFX_Library.h>
#include <Wire.h>
#include <lvgl.h>

// ── Display pin definitions ───────────────────────────────────────────────────
#define BSP_LCD_CS    10
#define BSP_LCD_SCK   12
#define BSP_LCD_D0    11
#define BSP_LCD_D1    13
#define BSP_LCD_D2    14
#define BSP_LCD_D3    15
#define BSP_LCD_RST    8
#define BSP_LCD_DC     9

// ── Touch pin definitions ─────────────────────────────────────────────────────
#define BSP_TOUCH_SDA  6
#define BSP_TOUCH_SCL  7
#define BSP_TOUCH_INT  5
#define BSP_TOUCH_RST  4
#define BSP_TOUCH_ADDR 0x15  // CST816S I2C address

// ── Display dimensions (match WATCH_W / WATCH_H in ui_theme.h) ───────────────
#define BSP_LCD_W 410
#define BSP_LCD_H 502

// ── Draw buffer — one horizontal stripe (~50 lines) ──────────────────────────
#define BSP_BUF_LINES 50
static lv_color_t s_draw_buf[BSP_LCD_W * BSP_BUF_LINES];

static lv_disp_draw_buf_t s_lv_buf;
static lv_disp_drv_t      s_disp_drv;
static lv_indev_drv_t     s_indev_drv;

// ── GFX objects ───────────────────────────────────────────────────────────────
static Arduino_DataBus *s_bus = nullptr;
static Arduino_GFX     *s_gfx = nullptr;

// ─────────────────────────────────────────────────────────────────────────────
// LVGL flush callback — called by LVGL to push a rendered tile to the display.
// ─────────────────────────────────────────────────────────────────────────────
static void disp_flush_cb(lv_disp_drv_t *drv, const lv_area_t *area, lv_color_t *color_p)
{
    if (!s_gfx) { lv_disp_flush_ready(drv); return; }

    uint32_t w = area->x2 - area->x1 + 1;
    uint32_t h = area->y2 - area->y1 + 1;

    s_gfx->draw16bitRGBBitmap(
        area->x1, area->y1,
        (uint16_t *)color_p,
        w, h);

    lv_disp_flush_ready(drv);
}

// ─────────────────────────────────────────────────────────────────────────────
// CST816S touch read — called by LVGL input device driver.
// ─────────────────────────────────────────────────────────────────────────────
static void touch_read_cb(lv_indev_drv_t *drv, lv_indev_data_t *data)
{
    (void)drv;
    // CST816S: register 0x02 returns finger_count + 4 bytes per touch point.
    Wire.beginTransmission(BSP_TOUCH_ADDR);
    Wire.write(0x02);
    Wire.endTransmission(false);
    Wire.requestFrom((uint8_t)BSP_TOUCH_ADDR, (uint8_t)6);

    if (Wire.available() < 6) {
        data->state = LV_INDEV_STATE_REL;
        return;
    }

    uint8_t buf[6];
    for (int i = 0; i < 6; i++) buf[i] = Wire.read();

    uint8_t fingers = buf[0] & 0x0F;
    if (fingers == 0) {
        data->state = LV_INDEV_STATE_REL;
        return;
    }

    data->state   = LV_INDEV_STATE_PR;
    data->point.x = (int16_t)(((buf[1] & 0x0F) << 8) | buf[2]);
    data->point.y = (int16_t)(((buf[3] & 0x0F) << 8) | buf[4]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
void bsp_display_init(void)
{
    // 1. Create QSPI bus and RM67162 GFX instance.
    s_bus = new Arduino_QSPI(
        BSP_LCD_CS, BSP_LCD_SCK,
        BSP_LCD_D0, BSP_LCD_D1, BSP_LCD_D2, BSP_LCD_D3);

    s_gfx = new Arduino_RM67162(s_bus, BSP_LCD_RST, 0 /*rotation*/);

    if (!s_gfx->begin()) {
        Serial.println("[bsp] display begin() failed — check SPI pins");
        // Continue anyway so LVGL still initialises.
    }

    s_gfx->fillScreen(BLACK);
    Serial.printf("[bsp] display %dx%d ready\n", BSP_LCD_W, BSP_LCD_H);

    // 2. Initialise LVGL.
    lv_init();

    // 3. Register LVGL display driver.
    lv_disp_draw_buf_init(&s_lv_buf, s_draw_buf, NULL, BSP_LCD_W * BSP_BUF_LINES);

    lv_disp_drv_init(&s_disp_drv);
    s_disp_drv.hor_res  = BSP_LCD_W;
    s_disp_drv.ver_res  = BSP_LCD_H;
    s_disp_drv.flush_cb = disp_flush_cb;
    s_disp_drv.draw_buf = &s_lv_buf;
    lv_disp_drv_register(&s_disp_drv);
}

void bsp_touch_attach(void)
{
    // Reset the CST816S.
    pinMode(BSP_TOUCH_RST, OUTPUT);
    digitalWrite(BSP_TOUCH_RST, LOW);
    delay(10);
    digitalWrite(BSP_TOUCH_RST, HIGH);
    delay(50);

    Wire.begin(BSP_TOUCH_SDA, BSP_TOUCH_SCL);
    Wire.setClock(400000);

    // Configure INT pin (active low, driven by the touch IC on touch events).
    pinMode(BSP_TOUCH_INT, INPUT_PULLUP);

    // Register LVGL input device driver.
    lv_indev_drv_init(&s_indev_drv);
    s_indev_drv.type    = LV_INDEV_TYPE_POINTER;
    s_indev_drv.read_cb = touch_read_cb;
    lv_indev_drv_register(&s_indev_drv);

    Serial.println("[bsp] touch attached");
}
