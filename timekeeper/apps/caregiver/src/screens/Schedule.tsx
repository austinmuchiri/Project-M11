import * as React from 'react';
import { useState } from 'react';
import {
  APP, AppIcon, Btn, Card, IconBadge, SectionTitle, Toggle,
  type IconName,
} from '@timekeeper/ui';
import type { Task, TaskIcon } from '@timekeeper/schema';
import {
  useStore, resolveTodayTasks, toggleRoutineActive,
  addTaskToRoutine, updateTaskInRoutine, createRoutine,
  deleteRoutine, deleteTaskFromRoutine, 
} from '../store';

const TASK_ICONS: TaskIcon[] = [
  'sun', 'moon', 'brush', 'shirt', 'plate', 'bag',
  'book', 'pencil', 'shower', 'school', 'play', 'star', 'dot',
];

const ROUTINE_PRESET_ICONS: Record<string, { icon: IconName; color: string }> = {
  morning:  { icon: 'sun',    color: APP.accent },
  school:   { icon: 'school', color: APP.info },
  evening:  { icon: 'moon',   color: APP.chart4 },
  homework: { icon: 'pencil', color: APP.info },
};

const PRESET_TEMPLATES: { name: string; startTime: string; icon: IconName; color: string }[] = [
  { name: 'Morning Routine', startTime: '07:00', icon: 'sun',    color: APP.accent },
  { name: 'Homework Time',   startTime: '16:00', icon: 'pencil', color: APP.info },
  { name: 'Evening Routine', startTime: '18:30', icon: 'moon',   color: APP.chart4 },
];

function getRoutineVisual(routineId: string, routineName: string): { icon: IconName; color: string } {
  const byId = ROUTINE_PRESET_ICONS[routineId];
  if (byId) return byId;
  const lower = routineName.toLowerCase();
  if (lower.includes('morning')) return { icon: 'sun', color: APP.accent };
  if (lower.includes('evening') || lower.includes('night')) return { icon: 'moon', color: APP.chart4 };
  if (lower.includes('school') || lower.includes('homework')) return { icon: 'pencil', color: APP.info };
  return { icon: 'dot', color: APP.brand };
}



function formatDay(): string {
  return new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

interface TaskDraft {
  label: string;
  icon: TaskIcon;
  scheduledTime: string;
  expectedMinutes: number;
  rewardStars: number;
}

interface RoutineDraft {
  name: string;
  startTime: string;
}

const DEFAULT_DRAFT: TaskDraft = {
  label: '', icon: 'dot', scheduledTime: '08:00', expectedMinutes: 5, rewardStars: 1,
};

const DEFAULT_ROUTINE_DRAFT: RoutineDraft = { name: '', startTime: '07:00' };

export function ScheduleScreen({ selectedId, onSelect }: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const routines = useStore(s => s.routines);
  const tasks    = useStore(resolveTodayTasks);
  const devices    = useStore(s => s.devices);


  const watch = devices.find(d => d.kind === 'watch');
  const selected = routines.find(r => r.id === selectedId) ?? routines[0];
  const selectedTasks = tasks.filter(t => t.routineId === selected?.id);

  // Task modal: null = closed, undefined = add new, string = edit existing
  const [editingTaskId, setEditingTaskId]     = useState<string | null | undefined>(null);
  const [draft, setDraft]                     = useState<TaskDraft>(DEFAULT_DRAFT);
  const [syncToast, setSyncToast]             = useState(false);
  const [noRoutineWarning, setNoRoutineWarning] = useState(false);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Routine modal
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [routineDraft, setRoutineDraft]             = useState<RoutineDraft>(DEFAULT_ROUTINE_DRAFT);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    if (routines.length === 0) {
      setNoRoutineWarning(true);
      setTimeout(() => setNoRoutineWarning(false), 3000);
      return;
    }
    setNoRoutineWarning(false);
    setDraft(DEFAULT_DRAFT);
    setEditingTaskId(undefined);
  };

  const openEdit = (taskId: string) => {
    const task = selected?.tasks.find(t => t.id === taskId);
    if (!task) return;
    setDraft({
      label: task.label,
      icon: task.icon,
      scheduledTime: task.scheduledTime,
      expectedMinutes: task.expectedMinutes,
      rewardStars: task.rewardStars,
    });
    setEditingTaskId(taskId);
  };

  const closeModal = () => setEditingTaskId(null);

  const saveTask = async () => {
    if (!selected || !draft.label.trim()) return;
    if (editingTaskId === undefined) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        kidId: selected.kidId,
        label: draft.label.trim(),
        icon: draft.icon,
        scheduledTime: draft.scheduledTime,
        expectedMinutes: draft.expectedMinutes,
        rewardStars: draft.rewardStars,
      };
      await addTaskToRoutine(selected.id, newTask);
      showToast("Task added!");
    } else if (editingTaskId) {
      await updateTaskInRoutine(selected.id, editingTaskId, {
        label: draft.label.trim(),
        icon: draft.icon,
        scheduledTime: draft.scheduledTime,
        expectedMinutes: draft.expectedMinutes,
        rewardStars: draft.rewardStars,
      });
    }
    showToast("Task updated!");
    closeModal();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selected) return;
    await deleteTaskFromRoutine(selected.id, taskId);
    showToast("Task deleted");
    closeModal();
  };

  
  const onSync = () => {
    if (!watch) {
      showToast("No watch connected. Please check Bluetooth.", "error");
      return;
    }
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2500);
    showToast("Routine synced to watch!");
  };
  const openCreateRoutine = (preset?: { name: string; startTime: string }) => {
    setRoutineDraft(preset ?? DEFAULT_ROUTINE_DRAFT);
    setIsRoutineModalOpen(true);
  };

  const handleCreateRoutine = async () => {
    if (!routineDraft.name.trim()) return;
    const routineId = `routine-${Date.now()}`;
    await createRoutine({
      id: routineId,
      name: routineDraft.name.trim(),
      startTime: routineDraft.startTime,
    });
    showToast("Routine created!");
    setIsRoutineModalOpen(false);
    onSelect(routineId);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    await deleteRoutine(routineId);
    setDeletingRoutineId(null);
    if (selectedId === routineId) {
      const remaining = routines.filter(r => r.id !== routineId);
      if (remaining.length > 0) onSelect(remaining[0]!.id);
    }
    showToast("Routine deleted");
  };

  const modalOpen = editingTaskId !== null;

  return (
    <>
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Date header */}
        <div style={{ fontSize: 12, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, paddingTop: 4 }}>
          {formatDay()}
        </div>

        {/* Section header + New button */}
        <SectionTitle action={
          <button
            onClick={() => openCreateRoutine()}
            style={{
              height: 34, paddingInline: 14, borderRadius: 9,
              border: `1.5px solid ${APP.brand}`, background: APP.brandSoft,
              color: APP.brand, fontFamily: APP.font, fontWeight: 800,
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <AppIcon name="plus" size={12} color={APP.brand}/>
            Add Routine
          </button>
        }>
          Routines
        </SectionTitle>

        {/* Preset quick-add strip */}
        {routines.length === 0 && (
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: APP.brandSoft, border: `1px dashed ${APP.brand}55`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: APP.brand, marginBottom: 10 }}>
              No routines yet — start with a preset:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_TEMPLATES.map(p => (
                <button key={p.name} onClick={() => openCreateRoutine(p)} style={{
                  height: 32, paddingInline: 12, borderRadius: 8,
                  border: `1.5px solid ${p.color}`, background: p.color + '18',
                  color: p.color, fontFamily: APP.font, fontWeight: 700,
                  fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <IconBadge name={p.icon} color={p.color} size={20} iconSize={10}/>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Routine cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {routines.map(r => {
            const visual = getRoutineVisual(r.id, r.name);
            const on = r.id === selectedId;
            return (
              <Card key={r.id} padding={12} onClick={() => onSelect(r.id)} style={{
                border: `1.5px solid ${on ? visual.color : APP.border}`,
                background: on ? visual.color + '12' : APP.surface,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IconBadge name={visual.icon} color={visual.color} size={32} iconSize={16}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div onClick={e => e.stopPropagation()}>
                    <Toggle on={r.active} onChange={() => { void toggleRoutineActive(r.id); }}/>
                  </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingRoutineId(r.id); }}
                      aria-label="Delete routine"
                      style={{
                        width: 26, height: 26, borderRadius: 7, border: 'none',
                        background: APP.surfaceAlt, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <AppIcon name="x" size={11} color={APP.inkDim}/>
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontFamily: APP.fontDisp, fontSize: 15, fontWeight: 800, color: APP.ink }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 2, fontFamily: APP.fontMono }}>
                  {r.startTime}
                </div>
                <div style={{ fontSize: 11, color: APP.ink2, marginTop: 6 }}>
                  {r.tasks.length} tasks
                </div>
              </Card>
            );
          })}
        </div>

        {/* Delete routine confirmation */}
        {deletingRoutineId && (() => {
          const r = routines.find(r => r.id === deletingRoutineId);
          return r ? (
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: APP.accentSoft, border: `1px solid ${APP.accent}55`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flex: 1, fontSize: 13, color: APP.ink, fontWeight: 600 }}>
                Delete <strong>{r.name}</strong> and all its tasks?
              </div>
              <button onClick={() => setDeletingRoutineId(null)} style={ghostBtn}>Cancel</button>
              <button onClick={() => { void handleDeleteRoutine(deletingRoutineId); }} style={{
                ...ghostBtn, color: APP.accent, border: `1.5px solid ${APP.accent}`,
              }}>Delete</button>
            </div>
          ) : null;
        })()}

        {/* Tasks section */}
        <SectionTitle action={
          <button
            onClick={openAdd}
            style={{
              height: 34, paddingInline: 14, borderRadius: 9,
              border: `1.5px solid ${APP.border}`, background: APP.surfaceAlt,
              color: APP.ink, fontFamily: APP.font, fontWeight: 800,
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <AppIcon name="plus" size={12} color={APP.ink2}/>
            Add task
          </button>
        }>
          Tasks · {selected?.name ?? 'select a routine'}
        </SectionTitle>

        {/* No-routine warning */}
        {noRoutineWarning && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: APP.accentSoft, border: `1px solid ${APP.accent}55`,
            color: APP.accent, fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AppIcon name="x" size={13} color={APP.accent}/>
            Create a routine first before adding tasks.
          </div>
        )}

        <Card padding={0}>
          {selectedTasks.map((t, i, arr) => {
            const isLast = i === arr.length - 1;
            const dotColor = t.status === 'done' ? APP.brand
              : t.status === 'active' ? APP.accent
              : APP.inkFaint;
            return (
              <div key={t.taskId} onClick={() => openEdit(t.taskId)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', cursor: 'pointer',
                borderBottom: isLast ? 'none' : `1px solid ${APP.border}`,
              }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
                  {i !== 0 && <div style={{ position: 'absolute', top: -12, height: 16, width: 1.5, background: APP.borderStrong }}/>}
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%', background: dotColor,
                    border: t.status === 'pending' ? `1.5px solid ${APP.borderStrong}` : 'none',
                    boxShadow: t.status === 'active' ? `0 0 0 4px ${APP.accentSoft}` : 'none',
                  }}/>
                  {!isLast && <div style={{ position: 'absolute', top: 16, height: 30, width: 1.5, background: APP.borderStrong }}/>}
                </div>
                <div style={{ width: 48, fontSize: 11, fontFamily: APP.fontMono, color: APP.ink2, fontWeight: 700 }}>
                  {t.scheduledTime}
                </div>
                <IconBadge name={t.icon as IconName}
                  color={t.status === 'done' ? APP.brand : t.status === 'active' ? APP.accent : APP.ink2}
                  size={32} iconSize={16}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: APP.ink,
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    textDecorationColor: APP.inkDim,
                  }}>{t.label}</div>
                  {t.status === 'done' && t.finishedAt && (
                    <div style={{ fontSize: 10, color: APP.inkDim, marginTop: 1, fontFamily: APP.fontMono }}>
                      finished {new Date(t.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {t.status === 'active' && (
                    <div style={{ fontSize: 10, color: APP.accent, marginTop: 1, fontWeight: 700 }}>In progress</div>
                  )}
                </div>
                <AppIcon name="chevron" size={14} color={APP.inkFaint}/>
              </div>
            );
          })}
          {selectedTasks.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: APP.inkDim, fontSize: 13 }}>
              {routines.length === 0
                ? 'Create a routine above, then add tasks here.'
                : 'No tasks yet — tap "Add task" to create one.'}
            </div>
          )}
        </Card>

        {syncToast && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, background: APP.brandSoft,
            color: APP.brand, fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AppIcon name="refresh" size={14} color={APP.brand}/>
            Routine synced to watch
          </div>
        )}

        {/* Global Toast Message */}
        {toast && (
          <div style={{
            position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)',
            padding: '12px 20px', borderRadius: 10, zIndex: 1000,
            background: toast.type === 'success' ? APP.brand : APP.accent,
            color: '#fff', fontWeight: 700, fontSize: 13, boxShadow: APP.shadowLg,
            display: 'flex', alignItems: 'center', gap: 10, minWidth: 200
          }}>
            <AppIcon name={toast.type === 'success' ? 'star' : 'x'} size={16} color="#fff"/>
            {toast.msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" icon={<AppIcon name="plus" size={14}/>} full onClick={openAdd}>
            Add task
          </Btn>
          <Btn variant="primary" icon={<AppIcon name="refresh" size={14} color="#fff"/>} full onClick={onSync}>
            Sync to watch
          </Btn>
        </div>
      </div>

      {/* Routine modal */}
      {isRoutineModalOpen && (
        <RoutineModal
          draft={routineDraft}
          onChange={setRoutineDraft}
          onCancel={() => setIsRoutineModalOpen(false)}
          onSave={handleCreateRoutine}
        />
      )}

      {/* Task modal */}
      {modalOpen && (
        <TaskModal
          draft={draft}
          onChange={setDraft}
          onSave={() => { void saveTask(); }}
          onCancel={closeModal}
          isEdit={typeof editingTaskId === 'string'}
          onDelete={typeof editingTaskId === 'string' ? () => { void handleDeleteTask(editingTaskId as string); } : undefined}
        />
      )}
    </>
  );
}



function RoutineModal({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: RoutineDraft;
  onChange: (d: RoutineDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (patch: Partial<RoutineDraft>) => onChange({ ...draft, ...patch });
  const valid = draft.name.trim().length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(31,46,39,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: APP.surface,
        borderRadius: APP.rXl, padding: '24px 20px', boxShadow: APP.shadowLg,
      }}>
        <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 20, color: APP.ink, marginBottom: 20 }}>
          Create Routine
        </div>

        {/* Preset strip */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {PRESET_TEMPLATES.map(p => (
            <button key={p.name} onClick={() => set({ name: p.name, startTime: p.startTime })} style={{
              height: 28, paddingInline: 10, borderRadius: 7,
              border: `1.5px solid ${draft.name === p.name ? p.color : APP.border}`,
              background: draft.name === p.name ? p.color + '18' : APP.surfaceAlt,
              color: draft.name === p.name ? p.color : APP.ink2,
              fontFamily: APP.font, fontWeight: 700, fontSize: 11, cursor: 'pointer',
            }}>
              {p.name}
            </button>
          ))}
        </div>

        <FieldLabel>Routine name</FieldLabel>
        <input
          autoFocus
          value={draft.name}
          onChange={e => set({ name: e.target.value })}
          placeholder="e.g. Morning Routine"
          style={inputStyle}
        />

        <FieldLabel style={{ marginTop: 14 }}>Start time</FieldLabel>
        <input
          type="time"
          value={draft.startTime}
          onChange={e => set({ startTime: e.target.value })}
          style={{ ...inputStyle, fontFamily: APP.fontMono }}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Btn variant="secondary" full onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" full onClick={onSave} style={{ opacity: valid ? 1 : 0.45 }}>
            Create Routine
          </Btn>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ draft, onChange, onSave, onCancel, isEdit, onDelete }: {
  draft: TaskDraft;
  onChange: (d: TaskDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  isEdit: boolean;
  onDelete?: () => void;
}) {
  const set = (patch: Partial<TaskDraft>) => onChange({ ...draft, ...patch });
  const valid = draft.label.trim().length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(31,46,39,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', background: APP.surface,
        borderRadius: `${APP.rXl}px ${APP.rXl}px 0 0`,
        padding: '20px 18px 32px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: APP.shadowLg,
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 20, color: APP.ink }}>
            {isEdit ? 'Edit task' : 'New task'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEdit && onDelete && (
              <button onClick={onDelete} aria-label="Delete task" style={{
                height: 32, paddingInline: 12, borderRadius: 8,
                border: `1.5px solid ${APP.accent}`, background: APP.accentSoft,
                cursor: 'pointer', fontFamily: APP.font,
                fontSize: 12, fontWeight: 700, color: APP.accent,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <AppIcon name="x" size={11} color={APP.accent}/>
                Delete
              </button>
            )}
            <button onClick={onCancel} aria-label="Close" style={{
              width: 32, height: 32, borderRadius: 16, border: 'none',
              background: APP.bgSoft, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AppIcon name="x" size={14} color={APP.ink2}/>
            </button>
          </div>
        </div>

        {/* label */}
        <FieldLabel>Task name</FieldLabel>
        <input
          autoFocus
          value={draft.label}
          onChange={e => set({ label: e.target.value })}
          placeholder="e.g. Brush Teeth"
          maxLength={40}
          style={inputStyle}
        />

        {/* icon picker */}
        <FieldLabel style={{ marginTop: 16 }}>Icon</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {TASK_ICONS.map(icon => (
            <button key={icon} onClick={() => set({ icon })} aria-label={icon} style={{
              padding: 6, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: draft.icon === icon ? APP.brandSoft : APP.surfaceAlt,
              outline: draft.icon === icon ? `2px solid ${APP.brand}` : 'none',
            }}>
              <IconBadge name={icon} color={draft.icon === icon ? APP.brand : APP.ink2} size={32} iconSize={16}/>
            </button>
          ))}
        </div>

        {/* time + duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div>
            <FieldLabel>Scheduled time</FieldLabel>
            <input
              type="time"
              value={draft.scheduledTime}
              onChange={e => set({ scheduledTime: e.target.value })}
              style={{ ...inputStyle, fontFamily: APP.fontMono }}
            />
          </div>
          <div>
            <FieldLabel>Duration (min)</FieldLabel>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft.expectedMinutes === 0 ? '' : draft.expectedMinutes} 
              placeholder="0"
              onChange={e => {
                const val = e.target.value;
                // Allow empty string so the user can backspace everything
                if (val === '') {
                  set({ expectedMinutes: '' as any });
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  set({ expectedMinutes: Math.min(180, num) });
                }
              }}
              onBlur={() => {
                // If the value is falsy (empty string or 0), reset to 5
                if (!draft.expectedMinutes || Number(draft.expectedMinutes) < 1) {
                  set({ expectedMinutes: 5 });
                }
              }}
              style={{ 
                ...inputStyle, 
                textAlign: 'center', 
                fontFamily: APP.fontMono,
                flex: 1 
              }}
            />
          </div>
        </div>

        {/* reward stars */}
        <FieldLabel style={{ marginTop: 16 }}>Reward stars</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => set({ rewardStars: Math.max(0, draft.rewardStars - 1) })} style={stepperBtn}>−</button>
          <div style={{
            flex: 1, textAlign: 'center', fontFamily: APP.fontMono,
            fontWeight: 800, fontSize: 18, color: APP.star,
          }}>★ {draft.rewardStars}</div>
          <button onClick={() => set({ rewardStars: Math.min(10, draft.rewardStars + 1) })} style={stepperBtn}>+</button>
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Btn variant="secondary" full onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" full onClick={onSave} style={{ opacity: valid ? 1 : 0.45 }}>
            {isEdit ? 'Save changes' : 'Add task'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
      color: APP.inkDim, marginBottom: 6, ...style,
    }}>{children}</div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, borderRadius: 10, padding: '0 12px',
  border: `1.5px solid ${APP.borderStrong}`, fontFamily: APP.font,
  fontSize: 14, fontWeight: 600, color: APP.ink, background: APP.surface,
  boxSizing: 'border-box', outline: 'none',
};

const stepperBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${APP.borderStrong}`,
  background: APP.surfaceAlt, cursor: 'pointer', fontFamily: APP.font,
  fontSize: 20, fontWeight: 700, color: APP.ink,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const ghostBtn: React.CSSProperties = {
  height: 30, paddingInline: 12, borderRadius: 8,
  border: `1.5px solid ${APP.border}`, background: 'transparent',
  color: APP.ink2, fontFamily: APP.font, fontWeight: 700,
  fontSize: 12, cursor: 'pointer',
};
