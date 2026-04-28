import * as React from 'react';
import { useState } from 'react';
import {
  APP, AppIcon, Btn, Card, IconBadge, SectionTitle, Toggle,
  type IconName,
} from '@timekeeper/ui';
import type { Task, TaskIcon } from '@timekeeper/schema';
import {
  useStore, resolveTodayTasks, toggleRoutineActive,
  addTaskToRoutine, updateTaskInRoutine,
} from '../store.js';

const TASK_ICONS: TaskIcon[] = [
  'sun', 'moon', 'brush', 'shirt', 'plate', 'bag',
  'book', 'pencil', 'shower', 'school', 'play', 'star', 'dot',
];

const PRESETS: { id: string; icon: IconName; color: string }[] = [
  { id: 'morning', icon: 'sun',    color: APP.accent },
  { id: 'school',  icon: 'school', color: APP.info },
  { id: 'evening', icon: 'moon',   color: APP.chart4 },
];

interface TaskDraft {
  label: string;
  icon: TaskIcon;
  scheduledTime: string;
  expectedMinutes: number;
  rewardStars: number;
}

const DEFAULT_DRAFT: TaskDraft = {
  label: '', icon: 'dot', scheduledTime: '08:00', expectedMinutes: 5, rewardStars: 1,
};

export function ScheduleScreen({ selectedId, onSelect }: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const routines = useStore(s => s.routines);
  const tasks    = useStore(resolveTodayTasks);

  const selected = routines.find(r => r.id === selectedId) ?? routines[0];
  const selectedTasks = tasks.filter(t => t.routineId === selected?.id);

  // modal state: null = closed, undefined = add new, string = edit existing task ID
  const [editingTaskId, setEditingTaskId] = useState<string | null | undefined>(null);
  const [draft, setDraft] = useState<TaskDraft>(DEFAULT_DRAFT);
  const [syncToast, setSyncToast] = useState(false);

  const openAdd = () => {
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
        label: draft.label.trim(),
        icon: draft.icon,
        scheduledTime: draft.scheduledTime,
        expectedMinutes: draft.expectedMinutes,
        rewardStars: draft.rewardStars,
      };
      await addTaskToRoutine(selected.id, newTask);
    } else if (editingTaskId) {
      await updateTaskInRoutine(selected.id, editingTaskId, {
        label: draft.label.trim(),
        icon: draft.icon,
        scheduledTime: draft.scheduledTime,
        expectedMinutes: draft.expectedMinutes,
        rewardStars: draft.rewardStars,
      });
    }
    closeModal();
  };

  const onSync = () => {
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2500);
  };

  const modalOpen = editingTaskId !== null;

  return (
    <>
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SectionTitle action="+ New">Preset routines</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {routines.map(r => {
            const preset = PRESETS.find(p => p.id === r.id) ?? { icon: 'dot' as IconName, color: APP.brand };
            const on = r.id === selectedId;
            return (
              <Card key={r.id} padding={12} onClick={() => onSelect(r.id)} style={{
                border: `1.5px solid ${on ? preset.color : APP.border}`,
                background: on ? preset.color + '12' : APP.surface,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IconBadge name={preset.icon} color={preset.color} size={32} iconSize={16}/>
                  <Toggle on={r.active} onChange={() => { void toggleRoutineActive(r.id); }}/>
                </div>
                <div style={{ marginTop: 10, fontFamily: APP.fontDisp, fontSize: 16, fontWeight: 800, color: APP.ink }}>
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

        <SectionTitle action={
          <span onClick={openAdd} style={{ cursor: 'pointer' }}>+ Add task</span>
        }>
          Tasks · {selected?.name}
        </SectionTitle>
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
                    width: 12, height: 12, borderRadius: '50%',
                    background: dotColor,
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
              No tasks yet — tap "+ Add task" to create one
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

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" icon={<AppIcon name="plus" size={14}/>} full onClick={openAdd}>Add task</Btn>
          <Btn variant="primary"   icon={<AppIcon name="refresh" size={14} color="#fff"/>} full onClick={onSync}>Sync to watch</Btn>
        </div>
      </div>

      {/* Task modal — bottom sheet */}
      {modalOpen && (
        <TaskModal
          draft={draft}
          onChange={setDraft}
          onSave={() => { void saveTask(); }}
          onCancel={closeModal}
          isEdit={typeof editingTaskId === 'string'}
        />
      )}
    </>
  );
}

function TaskModal({ draft, onChange, onSave, onCancel, isEdit }: {
  draft: TaskDraft;
  onChange: (d: TaskDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  isEdit: boolean;
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
          <button onClick={onCancel} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 16, border: 'none',
            background: APP.bgSoft, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AppIcon name="x" size={14} color={APP.ink2}/>
          </button>
        </div>

        {/* label */}
        <FieldLabel>Task name</FieldLabel>
        <input
          autoFocus
          value={draft.label}
          onChange={e => set({ label: e.target.value })}
          placeholder="e.g. Brush Teeth"
          maxLength={40}
          style={{
            width: '100%', height: 44, borderRadius: 10, padding: '0 12px',
            border: `1.5px solid ${APP.borderStrong}`, fontFamily: APP.font,
            fontSize: 14, fontWeight: 600, color: APP.ink, background: APP.surface,
            boxSizing: 'border-box', outline: 'none',
          }}
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

        {/* time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div>
            <FieldLabel>Scheduled time</FieldLabel>
            <input
              type="time"
              value={draft.scheduledTime}
              onChange={e => set({ scheduledTime: e.target.value })}
              style={{
                width: '100%', height: 44, borderRadius: 10, padding: '0 12px',
                border: `1.5px solid ${APP.borderStrong}`, fontFamily: APP.fontMono,
                fontSize: 14, fontWeight: 700, color: APP.ink, background: APP.surface,
                boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>
          <div>
            <FieldLabel>Duration (min)</FieldLabel>
            <input
              type="number"
              min={1} max={180}
              value={draft.expectedMinutes}
              onChange={e => set({ expectedMinutes: Math.max(1, Math.min(180, Number(e.target.value))) })}
              style={{
                width: '100%', height: 44, borderRadius: 10, padding: '0 12px',
                border: `1.5px solid ${APP.borderStrong}`, fontFamily: APP.fontMono,
                fontSize: 14, fontWeight: 700, color: APP.ink, background: APP.surface,
                boxSizing: 'border-box', outline: 'none',
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

const stepperBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${APP.borderStrong}`,
  background: APP.surfaceAlt, cursor: 'pointer', fontFamily: APP.font,
  fontSize: 20, fontWeight: 700, color: APP.ink,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

