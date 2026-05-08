#pragma once
#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

#define SCHED_MAX_TASKS_PER_ROUTINE 12
#define SCHED_MAX_ROUTINES          6

typedef struct {
    char id[16];
    char label[40];
    char icon[12];
    int  expected_minutes;
    int  reward_stars;
    int  scheduled_min_of_day;   // e.g. 7:30 → 450
} sched_task_t;

typedef struct {
    char          id[16];
    char          name[40];
    sched_task_t  tasks[SCHED_MAX_TASKS_PER_ROUTINE];
    int           task_count;
    uint8_t       days_of_week_mask;  // bit 0 = Sun
    int           start_min_of_day;
    bool          active;
} sched_routine_t;

void scheduler_init(void);
void scheduler_tick(int now_min_of_day, int weekday_0_sun);
void scheduler_apply_routines_json(const char *json, size_t len);

void scheduler_start_current(void);
void scheduler_pause_current(void);
void scheduler_complete_current(void);
void scheduler_skip_current(void);
void scheduler_retry_current(void);
const sched_task_t *scheduler_current_task(void);

#ifdef __cplusplus
}
#endif
