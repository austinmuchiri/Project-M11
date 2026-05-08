#pragma once

// Board-support for Waveshare ESP32-S3-Touch-AMOLED-2.06
// Display : RM67162 AMOLED 410×502, QSPI
// Touch   : CST816S capacitive, I2C
//
// Verify pin assignments against the Waveshare schematic before flashing:
//   https://www.waveshare.com/wiki/ESP32-S3-Touch-AMOLED-2.06

void bsp_display_init(void);   // init display + LVGL display driver
void bsp_touch_attach(void);   // attach touch as LVGL input device
