// Haptic patterns for the linear vibration motor.
// Three short pulses for reminders, one long for success,
// escalating triple for retry. Quiet-hours logic lives in the scheduler.

#include "haptics.h"
#include <Arduino.h>

#define GPIO_HAPTIC 15   // verify against your board wiring

static void buzz_for_ms(int ms)
{
    digitalWrite(GPIO_HAPTIC, HIGH);
    delay(ms);
    digitalWrite(GPIO_HAPTIC, LOW);
}

void haptics_init(void)
{
    pinMode(GPIO_HAPTIC, OUTPUT);
    digitalWrite(GPIO_HAPTIC, LOW);
    Serial.printf("[haptic] ready on GPIO%d\n", GPIO_HAPTIC);
}

void haptics_buzz_short(void)
{
    buzz_for_ms(80);
    delay(80);
    buzz_for_ms(80);
}

void haptics_buzz_success(void)
{
    buzz_for_ms(220);
}

void haptics_buzz_retry(void)
{
    for (int i = 0; i < 3; i++) {
        buzz_for_ms(60);
        delay(60);
    }
}
