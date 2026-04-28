import {
  APP, AppIcon, Btn, Card, IconBadge, SectionTitle, Toggle,
  type IconName,
} from '@timekeeper/ui';
import { useStore, resolveTodayTasks, toggleRoutineActive } from '../store.js';

const PRESETS: { id: string; icon: IconName; color: string }[] = [
  { id: 'morning', icon: 'sun',    color: APP.accent },
  { id: 'school',  icon: 'school', color: APP.info },
  { id: 'evening', icon: 'moon',   color: APP.chart4 },
];

export function ScheduleScreen({ selectedId, onSelect }: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const routines = useStore(s => s.routines);
  const tasks    = useStore(resolveTodayTasks);

  const selected = routines.find(r => r.id === selectedId) ?? routines[0];
  const selectedTasks = tasks.filter(t => t.routineId === selected?.id);

  return (
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
                <Toggle on={r.active} onChange={() => toggleRoutineActive(r.id)}/>
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

      <SectionTitle action="Edit">Tasks · {selected?.name}</SectionTitle>
      <Card padding={0}>
        {selectedTasks.map((t, i, arr) => {
          const isLast = i === arr.length - 1;
          const dotColor = t.status === 'done' ? APP.brand
            : t.status === 'active' ? APP.accent
            : APP.inkFaint;
          return (
            <div key={t.taskId} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
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
      </Card>
      
      {/* This part is incomplete, no action is attached to the buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="secondary" icon={<AppIcon name="plus" size={14}/>} full>Add task</Btn>
        <Btn variant="primary"   icon={<AppIcon name="refresh" size={14} color="#fff"/>} full>Sync to watch</Btn>
      </div>
    </div>
  );
}
