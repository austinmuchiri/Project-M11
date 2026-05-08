#pragma once
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

void nvs_store_init(void);
int  nvs_store_buffer_event(const char *json_line);
int  nvs_store_drain_events(void (*emit)(const char *line));

#ifdef __cplusplus
}
#endif
