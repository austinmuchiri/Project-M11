#pragma once

#ifdef __cplusplus
extern "C" {
#endif

void haptics_init(void);
void haptics_buzz_short(void);    // double tap — reminder
void haptics_buzz_success(void);  // single long — task complete
void haptics_buzz_retry(void);    // triple short — retry prompt

#ifdef __cplusplus
}
#endif
