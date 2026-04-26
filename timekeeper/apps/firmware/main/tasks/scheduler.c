// Routine playback engine. Owns the in-RAM list of routines, walks the
// clock once per second, fires the Reminder screen at scheduledTime,
// transitions to Active on START, Confirm/Reward on hold-DONE, Missed
// after expectedMinutes elapses without completion.

#include "scheduler.h"
#include "ui_theme.h"
#include "esp_log.h"
#include <string.h>
#include <stdio.h>
#include <stdbool.h>

extern void sync_record_event(const char *json_line);

static const char *TAG = "sched";

static sched_routine_t s_routines[SCHED_MAX_ROUTINES];
static int s_routine_count = 0;
static int s_active_routine = -1;
static int s_active_task = -1;
static int s_active_started_min = -1;
static enum { S_IDLE, S_REMINDED, S_ACTIVE, S_PAUSED, S_DONE } s_state = S_IDLE;

void scheduler_init(void)
{
    // Seed a default Morning routine so the watch has something to show
    // before the phone has synced. Replaced on first BLE connect.
    sched_routine_t *r = &s_routines[0];
    snprintf(r->id, sizeof(r->id), "morning");
    snprintf(r->name, sizeof(r->name), "Morning");
    r->task_count = 5;
    r->days_of_week_mask = 0xFF;
    r->start_min_of_day = 7 * 60;
    r->active = true;

    static const struct { const char *id; const char *label; const char *icon; int min; int stars; int hh; int mm; } seed[] = {
        { "t1", "Wake Up",     "sun",   2,  1, 7,  0 },
        { "t2", "Brush Teeth", "brush", 3,  1, 7, 10 },
        { "t3", "Get Dressed", "shirt", 5,  1, 7, 20 },
        { "t4", "Breakfast",   "plate", 10, 1, 7, 30 },
        { "t5", "Pack Bag",    "bag",   5,  1, 7, 40 },
    };
    for (int i = 0; i < 5; ++i) {
        sched_task_t *t = &r->tasks[i];
        snprintf(t->id, sizeof(t->id), "%s", seed[i].id);
        snprintf(t->label, sizeof(t->label), "%s", seed[i].label);
        snprintf(t->icon, sizeof(t->icon), "%s", seed[i].icon);
        t->expected_minutes = seed[i].min;
        t->reward_stars = seed[i].stars;
        t->scheduled_min_of_day = seed[i].hh * 60 + seed[i].mm;
    }

    s_routine_count = 1;
}

void scheduler_apply_routines_json(const char *json, size_t len)
{
    (void)json; (void)len;
    // Real impl: parse with cJSON or jsmn into s_routines[]. Out of
    // scope for the skeleton — the seed above suffices for live demo.
    ESP_LOGI(TAG, "TODO: parse %u-byte routine payload", (unsigned)len);
}

void scheduler_tick(int now_min_of_day, int weekday_0_sun)
{
    if (s_state != S_IDLE) return;

    for (int ri = 0; ri < s_routine_count; ++ri) {
        sched_routine_t *r = &s_routines[ri];
        if (!r->active) continue;
        if (!(r->days_of_week_mask & (1U << weekday_0_sun))) continue;

        for (int ti = 0; ti < r->task_count; ++ti) {
            sched_task_t *t = &r->tasks[ti];
            if (t->scheduled_min_of_day == now_min_of_day) {
                s_active_routine = ri;
                s_active_task = ti;
                s_state = S_REMINDED;
                ui_show_screen(SCR_REMINDER);
                ESP_LOGI(TAG, "remind: %s/%s", r->id, t->id);
                return;
            }
        }
    }
}

const sched_task_t *scheduler_current_task(void)
{
    if (s_active_routine < 0 || s_active_task < 0) return NULL;
    return &s_routines[s_active_routine].tasks[s_active_task];
}

static void emit_event(const char *status)
{
    const sched_task_t *t = scheduler_current_task();
    if (!t) return;
    const sched_routine_t *r = &s_routines[s_active_routine];
    char buf[192];
    snprintf(buf, sizeof(buf),
        "{\"routineId\":\"%s\",\"taskId\":\"%s\",\"status\":\"%s\","
        "\"source\":\"watch\",\"ts\":%lld}",
        r->id, t->id, status, (long long)esp_log_timestamp());
    sync_record_event(buf);
}

void scheduler_start_current(void)
{
    if (s_state != S_REMINDED) return;
    s_state = S_ACTIVE;
    s_active_started_min = (int)(esp_log_timestamp() / 60000);
    emit_event("started");
    ui_show_screen(SCR_ACTIVE);
}

void scheduler_pause_current(void)
{
    if (s_state != S_ACTIVE) return;
    s_state = S_PAUSED;
    emit_event("paused");
}

void scheduler_complete_current(void)
{
    if (s_state != S_ACTIVE && s_state != S_PAUSED) return;
    s_state = S_DONE;
    emit_event("done");
    s_active_routine = s_active_task = -1;
    s_state = S_IDLE;
}

void scheduler_skip_current(void)
{
    emit_event("skipped");
    s_active_routine = s_active_task = -1;
    s_state = S_IDLE;
}

void scheduler_retry_current(void)
{
    if (s_active_routine < 0) return;
    s_state = S_REMINDED;
    emit_event("retry");
}
