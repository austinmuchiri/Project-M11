import {
  APP, AppIcon, Card, IconBadge, MiniWatchFace, Pill, RingGauge,
  StatusDot, TASK_ICON, type IconName,
} from '@timekeeper/ui';
import { useStore, resolveTodayTasks, activeTask } from '../store.js';

export function HomeScreen({ onNudge, onSchedule }: {
  onNudge: () => void;
  onSchedule: () => void;
}) {
  const heartbeat = useStore(s => s.heartbeat);
  const devices   = useStore(s => s.devices);
  const tasks     = useStore(resolveTodayTasks);
  const active    = useStore(activeTask);
  const routines  = useStore(s => s.routines);

  const watch = devices.find(d => d.kind === 'watch');
  const elapsed = active?.startedAt ? Math.floor((Date.now() - active.startedAt) / 1000) : 132;
  const expected = (active?.expectedMinutes ?? 3) * 60;
  const elapsedPct = Math.min(100, (elapsed / expected) * 100);

  const todayDone = tasks.filter(t => t.status === 'done').length;
  const todayTotal = tasks.length;
  const dayPct = todayTotal ? (todayDone / todayTotal) * 100 : 0;

  const currentRoutine = routines.find(r => r.id === active?.routineId) ?? routines[0];
  const currentRoutineTasks = tasks.filter(t => t.routineId === currentRoutine?.id);
  const completedInRoutine = currentRoutineTasks.filter(t => t.status === 'done').length;

  const nextTask = tasks.find(t => t.status === 'pending');

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Live status hero */}
      <div style={{
        background: '#1F2E27', borderRadius: APP.rXl, padding: 18,
        color: '#F4EFE6', position: 'relative', overflow: 'hidden',
        boxShadow: APP.shadow,
      }}>
        <div style={{
          position: 'absolute', right: -40, top: -40, width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,199,184,0.18), transparent 60%)',
        }}/>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot color="#A8C7B8" pulse/>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
              textTransform: 'uppercase', color: '#A8C7B8',
            }}>
              {active ? 'Live · on task' : 'Idle'}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(244,239,230,0.6)', fontFamily: APP.fontMono }}>
            {watch ? formatAgo(watch.lastSeen) : '—'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
          <MiniWatchFace
            taskLabel={active?.label ?? 'Idle'}
            taskIcon={(active ? (TASK_ICON[active.label] ?? 'dot') : 'dot') as IconName}
            taskColor="#A8C7B8"
            time={new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            battery={watch?.battery ?? 0}
            w={108} h={128}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, color: 'rgba(244,239,230,0.6)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 1.2,
            }}>
              {currentRoutine?.name ?? 'No routine'}
            </div>
            <div style={{
              fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 24,
              lineHeight: 1.05, marginTop: 4, letterSpacing: -0.4,
            }}>{active?.label ?? 'All caught up'}</div>
            <div style={{ fontSize: 12, color: 'rgba(244,239,230,0.7)', marginTop: 3 }}>
              {active
                ? `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')} of ${Math.floor(expected/60)}:00`
                : 'Waiting for next task'}
            </div>

            <div style={{
              height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              marginTop: 10, overflow: 'hidden',
            }}>
              <div style={{
                width: `${elapsedPct}%`, height: '100%', background: '#A8C7B8',
                transition: 'width 0.4s',
              }}/>
            </div>

            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              {currentRoutineTasks.map((t) => (
                <div key={t.taskId} style={{
                  flex: 1, height: 5, borderRadius: 2,
                  background: t.status === 'done' ? '#A8C7B8'
                    : t.status === 'active' ? 'rgba(168,199,184,0.55)'
                    : 'rgba(255,255,255,0.08)',
                }}/>
              ))}
            </div>
            <div style={{
              fontSize: 10, color: 'rgba(244,239,230,0.55)',
              marginTop: 6, fontFamily: APP.fontMono,
            }}>
              {completedInRoutine}/{currentRoutineTasks.length} TASKS
              {nextTask ? ` · NEXT ${nextTask.label.toUpperCase()}` : ''}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="watch" size={16} color="#A8C7B8"/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'rgba(244,239,230,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Watch</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {watch ? `${watch.battery ?? '—'}% · paired` : 'Not paired'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="laptop" size={16} color="#A8C7B8"/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'rgba(244,239,230,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Laptop</div>
              <div style={{
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {heartbeat?.focus?.app ?? 'idle'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onNudge} style={{
            flex: 1, height: 38, borderRadius: 10, border: 'none',
            background: '#A8C7B8', color: '#1F2E27', fontFamily: APP.font,
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <AppIcon name="send" size={14} color="#1F2E27"/>
            Nudge
          </button>
          <button onClick={onSchedule} style={{
            flex: 1, height: 38, borderRadius: 10,
            background: 'transparent', color: '#F4EFE6',
            border: '1px solid rgba(244,239,230,0.25)',
            fontFamily: APP.font, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            View schedule
          </button>
        </div>
      </div>

      {/* Today summary */}
      <Card padding={14}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <RingGauge pct={dayPct} size={56} stroke={5}>
            <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{Math.round(dayPct)}%</div>
          </RingGauge>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>Today</div>
            <div style={{ fontFamily: APP.fontDisp, fontSize: 18, fontWeight: 800, color: APP.ink, marginTop: 2 }}>
              {todayDone} of {todayTotal} tasks complete
            </div>
            <div style={{ fontSize: 12, color: APP.ink2, marginTop: 2 }}>
              {routines.filter(r => r.active).length} routines
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {routines.map(r => {
            const rTasks = tasks.filter(t => t.routineId === r.id);
            const done = rTasks.filter(t => t.status === 'done').length;
            const total = rTasks.length;
            const isActive = rTasks.some(t => t.status === 'active');
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10,
                background: isActive ? APP.brandSoft : APP.surfaceAlt,
                border: `1px solid ${isActive ? APP.brand + '55' : APP.border}`,
              }}>
                <div style={{ width: 36, fontSize: 11, fontFamily: APP.fontMono, color: APP.ink2, fontWeight: 700 }}>
                  {r.startTime}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: APP.ink }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>{done}/{total} tasks</div>
                </div>
                {isActive && <Pill bg={APP.brand} color="#fff" icon={<StatusDot color="#fff" size={6}/>}>Now</Pill>}
                {!isActive && done === total && total > 0 && <Pill bg={APP.bgSoft} color={APP.ink2}>Done</Pill>}
                {!isActive && done < total && <AppIcon name="chevron" size={14} color={APP.inkDim}/>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard icon="flame" iconColor={APP.accent} label="Streak" value={12} suffix="days"/>
        <StatCard icon="star" iconColor={APP.star}    label="Stars · wk" value={23}/>
      </div>
    </div>
  );
}

function StatCard({ icon, iconColor, label, value, suffix }: {
  icon: IconName; iconColor: string; label: string; value: number; suffix?: string;
}) {
  return (
    <Card padding={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBadge name={icon} color={iconColor} size={28} iconSize={14}/>
        <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </div>
      </div>
      <div style={{
        fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink,
        marginTop: 6, letterSpacing: -0.5,
      }}>
        {value}{suffix && <span style={{ fontSize: 12, color: APP.inkDim, fontWeight: 700 }}> {suffix}</span>}
      </div>
    </Card>
  );
}

function formatAgo(ts: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
  return `${Math.floor(sec/3600)}h ago`;
}
