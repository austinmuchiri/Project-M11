// All app screens. Each takes ({ state, dispatch }) and renders content
// inside the device frame's content area.

// ─────────────────────────────────────────────────────────
// HOME / TODAY — Live status hero
// ─────────────────────────────────────────────────────────
function HomeScreen({ state, dispatch }) {
  const { live, today, streak, starsThisWeek } = SAM;
  const elapsedPct = Math.min(100, (live.elapsed / live.expected) * 100);
  const routinePct = (live.completed / live.routineTotal) * 100;
  const currentRoutine = today.find(r => r.tasks.some(t => t.status === 'active')) || today[0];

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* HERO — Live status, watch + laptop */}
      <div style={{
        background: '#1F2E27',
        borderRadius: APP.rXl,
        padding: 18,
        color: '#F4EFE6',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: APP.shadow,
      }}>
        {/* watermark */}
        <div style={{
          position: 'absolute', right: -40, top: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,199,184,0.18), transparent 60%)',
        }}/>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot color="#A8C7B8" pulse/>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: '#A8C7B8' }}>
              Live · on task
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(244,239,230,0.6)', fontFamily: APP.fontMono }}>
            {live.watch.lastSync}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
          <MiniWatchFace
            taskLabel={live.task}
            taskIcon={TASK_ICON[live.task] || 'dot'}
            taskColor="#A8C7B8"
            time="7:23"
            battery={live.watch.battery}
            w={108} h={128}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'rgba(244,239,230,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {live.routine}
            </div>
            <div style={{
              fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 24, lineHeight: 1.05,
              marginTop: 4, letterSpacing: -0.4,
            }}>{live.task}</div>
            <div style={{ fontSize: 12, color: 'rgba(244,239,230,0.7)', marginTop: 3 }}>
              {Math.floor(live.elapsed/60)}:{String(live.elapsed%60).padStart(2,'0')} of {Math.floor(live.expected/60)}:00
            </div>

            {/* elapsed bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${elapsedPct}%`, height: '100%', background: '#A8C7B8', transition: 'width 0.4s' }}/>
            </div>

            {/* routine dot ladder */}
            <div style={{ display: 'flex', gap: 4, marginTop: 12, alignItems: 'center' }}>
              {currentRoutine.tasks.map((t, i) => (
                <div key={t.id} style={{
                  flex: 1, height: 5, borderRadius: 2,
                  background: t.status === 'done' ? '#A8C7B8'
                            : t.status === 'active' ? 'rgba(168,199,184,0.55)'
                            : 'rgba(255,255,255,0.08)',
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(244,239,230,0.55)', marginTop: 6, fontFamily: APP.fontMono }}>
              {live.completed}/{live.routineTotal} TASKS · NEXT {live.nextTask.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Device strip */}
        <div style={{
          marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="watch" size={16} color="#A8C7B8"/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'rgba(244,239,230,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Watch</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{live.watch.battery}% · paired</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="laptop" size={16} color="#A8C7B8"/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'rgba(244,239,230,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Laptop</div>
              <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{live.laptop.focusApp}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => dispatch({ type: 'go', screen: 'nudge' })} style={{
            flex: 1, height: 38, borderRadius: 10, border: 'none',
            background: '#A8C7B8', color: '#1F2E27', fontFamily: APP.font,
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <AppIcon name="send" size={14} color="#1F2E27"/>
            Nudge
          </button>
          <button onClick={() => dispatch({ type: 'go', screen: 'schedule' })} style={{
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
          <RingGauge pct={routinePct} size={56} stroke={5}>
            <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{Math.round(routinePct)}%</div>
          </RingGauge>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>Today</div>
            <div style={{ fontFamily: APP.fontDisp, fontSize: 18, fontWeight: 800, color: APP.ink, marginTop: 2 }}>
              2 of 14 tasks complete
            </div>
            <div style={{ fontSize: 12, color: APP.ink2, marginTop: 2 }}>3 routines · 2 ahead of plan</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {today.map(r => {
            const done = r.tasks.filter(t => t.status === 'done').length;
            const total = r.tasks.length;
            const active = r.tasks.some(t => t.status === 'active');
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10,
                background: active ? APP.brandSoft : APP.surfaceAlt,
                border: `1px solid ${active ? APP.brand + '55' : APP.border}`,
              }}>
                <div style={{ width: 36, fontSize: 11, fontFamily: APP.fontMono, color: APP.ink2, fontWeight: 700 }}>
                  {r.start}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: APP.ink }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>{done}/{total} tasks</div>
                </div>
                {active && <Pill bg={APP.brand} color="#fff" icon={<StatusDot color="#fff" size={6}/>}>Now</Pill>}
                {!active && done === total && total > 0 && <Pill bg={APP.bgSoft} color={APP.ink2}>Done</Pill>}
                {!active && done < total && <AppIcon name="chevron" size={14} color={APP.inkDim}/>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBadge name="flame" color={APP.accent} size={28} iconSize={14}/>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Streak</div>
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink, marginTop: 6, letterSpacing: -0.5 }}>
            {streak} <span style={{ fontSize: 12, color: APP.inkDim, fontWeight: 700 }}>days</span>
          </div>
        </Card>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconBadge name="star" color={APP.star} size={28} iconSize={14}/>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Stars · wk</div>
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink, marginTop: 6, letterSpacing: -0.5 }}>
            {starsThisWeek}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SCHEDULE — preset routines + edit
// ─────────────────────────────────────────────────────────
const PRESET_ROUTINES = [
  { id: 'morning', name: 'Morning',  icon: 'sun',    color: APP.accent,  count: 5, time: '07:00 → 07:45', active: true },
  { id: 'school',  name: 'School',   icon: 'school', color: APP.info,    count: 4, time: '08:30 → 15:00', active: true },
  { id: 'evening', name: 'Evening',  icon: 'moon',   color: APP.chart4,  count: 5, time: '18:30 → 20:30', active: true },
  { id: 'weekend', name: 'Weekend',  icon: 'sun',    color: APP.chart5,  count: 6, time: 'Sat/Sun · 09:00', active: false },
];

function ScheduleScreen({ state, dispatch }) {
  const { selectedRoutine } = state;
  const routine = SAM.today.find(r => r.id === selectedRoutine) || SAM.today[0];

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      <SectionTitle action="+ New">Preset routines</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PRESET_ROUTINES.map(p => {
          const on = p.id === selectedRoutine;
          return (
            <Card key={p.id} padding={12} onClick={() => dispatch({ type: 'selectRoutine', id: p.id })}
              style={{
                border: `1.5px solid ${on ? p.color : APP.border}`,
                background: on ? p.color + '12' : APP.surface,
                cursor: 'pointer',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconBadge name={p.icon} color={p.color} size={32} iconSize={16}/>
                <Toggle on={p.active} onChange={() => {}}/>
              </div>
              <div style={{ marginTop: 10, fontFamily: APP.fontDisp, fontSize: 16, fontWeight: 800, color: APP.ink }}>
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 2, fontFamily: APP.fontMono }}>
                {p.time}
              </div>
              <div style={{ fontSize: 11, color: APP.ink2, marginTop: 6 }}>
                {p.count} tasks
              </div>
            </Card>
          );
        })}
      </div>

      <SectionTitle action="Edit">Tasks · {routine.name}</SectionTitle>
      <Card padding={0}>
        {routine.tasks.map((t, i) => {
          const isLast = i === routine.tasks.length - 1;
          const iconName = TASK_ICON[t.label] || 'dot';
          const dotColor = t.status === 'done' ? APP.brand
                         : t.status === 'active' ? APP.accent
                         : APP.inkFaint;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              borderBottom: isLast ? 'none' : `1px solid ${APP.border}`,
            }}>
              {/* timeline rail */}
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
                {t.time}
              </div>
              <IconBadge name={iconName} color={t.status === 'done' ? APP.brand : t.status === 'active' ? APP.accent : APP.ink2} size={32} iconSize={16}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: APP.ink, textDecoration: t.status === 'done' ? 'line-through' : 'none', textDecorationColor: APP.inkDim }}>
                  {t.label}
                </div>
                {t.status === 'done' && <div style={{ fontSize: 10, color: APP.inkDim, marginTop: 1, fontFamily: APP.fontMono }}>finished {t.finished}</div>}
                {t.status === 'active' && <div style={{ fontSize: 10, color: APP.accent, marginTop: 1, fontWeight: 700 }}>In progress</div>}
              </div>
              <AppIcon name="chevron" size={14} color={APP.inkFaint}/>
            </div>
          );
        })}
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="secondary" icon={<AppIcon name="plus" size={14}/>} full>Add task</Btn>
        <Btn variant="primary" icon={<AppIcon name="refresh" size={14} color="#fff"/>} full>Sync to watch</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// INSIGHTS — Compliance analytics
// ─────────────────────────────────────────────────────────
function AnalyticsScreen({ state, dispatch }) {
  const { week, timeOfDay, streak, starsTotal } = SAM;
  const weekAvg = Math.round(week.reduce((s, d) => s + d.pct, 0) / week.length);
  const todayPct = week[week.length - 1].pct;
  const trendData = [78, 84, 80, 88, 85, 92, 87, 90, 84, 88, 91, 87];

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Range pill bar */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: APP.bgSoft, borderRadius: 12 }}>
        {['Today', 'Week', 'Month', '90d'].map((r, i) => (
          <button key={r} onClick={() => {}} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: i === 1 ? APP.surface : 'transparent',
            color: i === 1 ? APP.ink : APP.inkDim,
            fontFamily: APP.font, fontSize: 12, fontWeight: 700,
            boxShadow: i === 1 ? APP.shadowSm : 'none',
            cursor: 'pointer',
          }}>{r}</button>
        ))}
      </div>

      {/* Hero metric */}
      <Card padding={16}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Completion · this week
            </div>
            <div style={{ fontFamily: APP.fontDisp, fontSize: 44, fontWeight: 800, color: APP.ink, lineHeight: 1, marginTop: 4, letterSpacing: -1 }}>
              {weekAvg}<span style={{ fontSize: 22, color: APP.inkDim }}>%</span>
            </div>
          </div>
          <Pill bg={APP.brandSoft} color={APP.brandInk} icon={<AppIcon name="arrowUp" size={11} color={APP.brandInk}/>}>
            +4 vs last
          </Pill>
        </div>
        <div style={{ marginTop: 14 }}>
          <BarChart data={week} w={296} h={92} color={APP.brand}/>
        </div>
      </Card>

      {/* Time of day */}
      <Card padding={16}>
        <SectionTitle style={{ padding: 0, marginBottom: 12 }}>Time-of-day · 30d avg</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Morning', pct: timeOfDay.morning, color: APP.accent, icon: 'sun' },
            { label: 'School',  pct: timeOfDay.school,  color: APP.info,    icon: 'school' },
            { label: 'Evening', pct: timeOfDay.evening, color: APP.chart4,  icon: 'moon' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconBadge name={row.icon} color={row.color} size={28} iconSize={14}/>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: APP.ink }}>{row.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: APP.ink, fontFamily: APP.fontMono }}>{row.pct}%</div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: APP.bgSoft, overflow: 'hidden' }}>
                  <div style={{ width: row.pct + '%', height: '100%', background: row.color, borderRadius: 3 }}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trend sparkline */}
      <Card padding={16}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <SectionTitle style={{ padding: 0 }}>12-week trend</SectionTitle>
          <div style={{ fontSize: 11, color: APP.inkDim, fontFamily: APP.fontMono }}>Feb 3 → Apr 25</div>
        </div>
        <Sparkline data={trendData} w={296} h={68} color={APP.brand}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: APP.fontMono, fontSize: 10, color: APP.inkDim }}>
          <span>78%</span><span>peak 92%</span><span>now {trendData[trendData.length-1]}%</span>
        </div>
      </Card>

      {/* Streak + stars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="flame" size={14} color={APP.accent}/>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Best streak</div>
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink, marginTop: 4, letterSpacing: -0.5 }}>
            18 <span style={{ fontSize: 12, color: APP.inkDim, fontWeight: 700 }}>days</span>
          </div>
          <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>Current: {streak}d</div>
        </Card>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="star" size={14} color={APP.star}/>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Stars · total</div>
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink, marginTop: 4, letterSpacing: -0.5 }}>
            {starsTotal}
          </div>
          <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>+23 this week</div>
        </Card>
      </div>

      {/* Export */}
      <Card padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconBadge name="share" color={APP.info} size={36} iconSize={18}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Weekly report · PDF</div>
          <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Apr 19 → Apr 25 · ready to share</div>
        </div>
        <Btn variant="outline" size="sm" icon={<AppIcon name="download" size={12}/>}>Export</Btn>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// NOTIFICATIONS — Inbox
// ─────────────────────────────────────────────────────────
function NotificationsScreen({ state, dispatch }) {
  const noteMeta = {
    'miss-streak': { color: APP.warn,   bg: APP.warnSoft,   icon: 'bell' },
    'reward':      { color: APP.star,   bg: APP.starSoft,   icon: 'star' },
    'device':      { color: APP.info,   bg: APP.infoSoft,   icon: 'battery' },
    'compliance':  { color: APP.brand,  bg: APP.brandSoft,  icon: 'analytics' },
  };

  const grouped = [
    { label: 'Today', items: SAM.notes.filter(n => !n.time.includes('Yesterday') && !n.time.includes('Mon')) },
    { label: 'Earlier', items: SAM.notes.filter(n => n.time.includes('Yesterday') || n.time.includes('Mon')) },
  ];

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Escalation summary card */}
      <Card padding={14} style={{ background: APP.warnSoft, border: `1px solid ${APP.warn}55` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: APP.warn, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <AppIcon name="bell" size={18} color="#fff"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Gentle escalation: 3-miss rule</div>
            <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>You're pinged after 3 misses in a row · adjust in Settings</div>
          </div>
        </div>
      </Card>

      {grouped.map(g => g.items.length > 0 && (
        <div key={g.label}>
          <SectionTitle>{g.label}</SectionTitle>
          <Card padding={0}>
            {g.items.map((n, i) => {
              const m = noteMeta[n.kind];
              const isLast = i === g.items.length - 1;
              return (
                <div key={n.id} style={{
                  display: 'flex', gap: 12, padding: '14px',
                  borderBottom: isLast ? 'none' : `1px solid ${APP.border}`,
                  background: n.read ? 'transparent' : APP.surface,
                  position: 'relative',
                }}>
                  {!n.read && <div style={{
                    position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                    width: 4, height: 28, borderRadius: 2, background: m.color,
                  }}/>}
                  <IconBadge name={m.icon} color={m.color} bg={m.bg} size={36} iconSize={16}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink, lineHeight: 1.25 }}>{n.title}</div>
                      <div style={{ fontSize: 10, color: APP.inkDim, fontFamily: APP.fontMono, flexShrink: 0 }}>{n.time}</div>
                    </div>
                    <div style={{ fontSize: 12, color: APP.ink2, marginTop: 4, lineHeight: 1.35 }}>{n.body}</div>
                    {n.kind === 'miss-streak' && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <Btn size="sm" variant="primary" icon={<AppIcon name="send" size={11} color="#fff"/>}>Nudge Munene</Btn>
                        <Btn size="sm" variant="secondary">Reschedule</Btn>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// NUDGE composer — modal-ish full screen
// ─────────────────────────────────────────────────────────
const QUICK_NUDGES = [
  { id: 'q1', icon: 'check',  label: 'Great job!',          tone: 'praise' },
  { id: 'q2', icon: 'play',   label: "Let's get started",   tone: 'start' },
  { id: 'q3', icon: 'flame',  label: 'Almost there!',       tone: 'praise' },
  { id: 'q4', icon: 'pause',  label: 'Take a 5-min break',  tone: 'break' },
];

function NudgeScreen({ state, dispatch }) {
  const [selected, setSelected] = React.useState('q1');
  const [sent, setSent] = React.useState(false);

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card padding={16} style={{ background: '#1F2E27', color: '#F4EFE6', border: 'none' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <MiniWatchFace
            taskLabel={SAM.live.task}
            taskIcon={TASK_ICON[SAM.live.task]}
            taskColor="#A8C7B8"
            time="7:23"
            battery={SAM.live.watch.battery}
            w={88} h={104}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(244,239,230,0.6)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>Sending to</div>
            <div style={{ fontFamily: APP.fontDisp, fontSize: 18, fontWeight: 800, marginTop: 2 }}>Munene's watch</div>
            <div style={{ fontSize: 12, color: 'rgba(244,239,230,0.7)', marginTop: 4 }}>Currently on {SAM.live.task}</div>
            <div style={{ fontSize: 11, color: 'rgba(244,239,230,0.5)', marginTop: 8, fontFamily: APP.fontMono }}>
              Latency · ~120ms
            </div>
          </div>
        </div>
      </Card>

      <SectionTitle>Quick nudges</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {QUICK_NUDGES.map(q => {
          const on = q.id === selected;
          return (
            <Card key={q.id} padding={14} onClick={() => setSelected(q.id)} style={{
              border: `1.5px solid ${on ? APP.brand : APP.border}`,
              background: on ? APP.brandSoft : APP.surface,
            }}>
              <IconBadge name={q.icon} color={on ? APP.brand : APP.ink2} size={32} iconSize={16}/>
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 800, color: APP.ink }}>{q.label}</div>
              <div style={{ fontSize: 10, color: APP.inkDim, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1, fontFamily: APP.fontMono }}>{q.tone}</div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>Custom message</SectionTitle>
      <Card padding={0}>
        <textarea placeholder="Short message — appears as a toast on watch and laptop." style={{
          width: '100%', padding: 14, border: 'none', resize: 'none',
          background: 'transparent', color: APP.ink, fontFamily: APP.font,
          fontSize: 13, fontWeight: 600, minHeight: 70, outline: 'none',
        }}/>
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="secondary" full onClick={() => dispatch({ type: 'go', screen: 'home' })}>Cancel</Btn>
        <Btn variant="primary" full icon={<AppIcon name="send" size={14} color="#fff"/>} onClick={() => { setSent(true); setTimeout(() => dispatch({ type: 'go', screen: 'home' }), 900); }}>
          {sent ? 'Sent ✓' : 'Send nudge'}
        </Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REWARDS — assign stars / treats
// ─────────────────────────────────────────────────────────
const REWARDS = [
  { id: 'r1', label: 'Extra 15 min screen time', cost: 10, icon: 'play',  color: APP.info },
  { id: 'r2', label: 'Pick dinner',              cost: 25, icon: 'plate', color: APP.accent },
  { id: 'r3', label: 'Movie night',              cost: 50, icon: 'star',  color: APP.star },
  { id: 'r4', label: 'New book',                 cost: 75, icon: 'book',  color: APP.chart4 },
];

function RewardsScreen({ state, dispatch }) {
  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>Munene's stars</div>
            <div style={{ fontFamily: APP.fontDisp, fontSize: 36, fontWeight: 800, color: APP.ink, lineHeight: 1, marginTop: 4, letterSpacing: -0.6 }}>
              {SAM.starsTotal}
            </div>
            <div style={{ fontSize: 11, color: APP.ink2, marginTop: 4 }}>+{SAM.starsThisWeek} this week</div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: APP.starSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AppIcon name="star" size={32} color={APP.star} strokeWidth={1.4}/>
          </div>
        </div>
        <Btn variant="primary" full style={{ marginTop: 14 }} icon={<AppIcon name="plus" size={14} color="#fff"/>}>
          Award stars manually
        </Btn>
      </Card>

      <SectionTitle action="+ New">Reward catalog</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REWARDS.map(r => {
          const can = SAM.starsTotal >= r.cost;
          return (
            <Card key={r.id} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconBadge name={r.icon} color={r.color} size={40} iconSize={20}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{r.label}</div>
                <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 2, fontFamily: APP.fontMono }}>cost · {r.cost} ★</div>
              </div>
              <Btn size="sm" variant={can ? 'primary' : 'outline'}>{can ? 'Redeem' : 'Locked'}</Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────
function SettingsScreen({ state, dispatch }) {
  const [missThreshold, setMissThreshold] = React.useState(3);
  const [quietHours, setQuietHours] = React.useState(true);
  const [escalateNanny, setEscalateNanny] = React.useState(true);
  const [hapticOnly, setHapticOnly] = React.useState(false);

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Devices — light card */}
      <SectionTitle>Devices</SectionTitle>
      <Card padding={0}>
        {[
          { name: "Munene's Watch",  detail: 'ESP32 dev · v0.4.1',         meta: '64% · paired',      icon: 'watch',  color: APP.brand,   ok: true },
          { name: "Munene's Laptop", detail: 'Chromebook · munene.local',  meta: 'Online',            icon: 'laptop', color: APP.info,    ok: true },
          { name: 'Nanny phone',  detail: 'Sara · co-caregiver',        meta: 'Mirroring alerts',  icon: 'bell',   color: APP.accent,  ok: true },
        ].map((d, i, arr) => (
          <div key={d.name} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${APP.border}`,
          }}>
            <IconBadge name={d.icon} color={d.color} size={36} iconSize={18}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{d.name}</div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1, fontFamily: APP.fontMono }}>{d.detail}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusDot color={APP.brand} size={6}/>
              <div style={{ fontSize: 11, color: APP.ink2, fontWeight: 700 }}>{d.meta}</div>
            </div>
          </div>
        ))}
        <div style={{ padding: 12 }}>
          <Btn variant="secondary" size="sm" full icon={<AppIcon name="plus" size={12}/>}>Pair new device</Btn>
        </div>
      </Card>

      {/* Escalation rules */}
      <SectionTitle>Notification rules</SectionTitle>
      <Card padding={0}>
        <div style={{ padding: 14, borderBottom: `1px solid ${APP.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Miss threshold</div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Ping me after N misses in a row</div>
            </div>
            <div style={{ fontFamily: APP.fontMono, fontSize: 16, fontWeight: 800, color: APP.ink, minWidth: 24, textAlign: 'right' }}>{missThreshold}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setMissThreshold(Math.max(1, missThreshold - 1))} style={{
              width: 28, height: 28, borderRadius: 8, border: `1px solid ${APP.border}`,
              background: APP.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><AppIcon name="minus" size={14}/></button>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: APP.bgSoft, overflow: 'hidden' }}>
              <div style={{ width: (missThreshold/6)*100 + '%', height: '100%', background: APP.brand, borderRadius: 2 }}/>
            </div>
            <button onClick={() => setMissThreshold(Math.min(6, missThreshold + 1))} style={{
              width: 28, height: 28, borderRadius: 8, border: `1px solid ${APP.border}`,
              background: APP.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><AppIcon name="plus" size={14}/></button>
          </div>
        </div>

        {[
          { k: 'qh', label: 'Quiet hours', detail: '21:00 → 07:00', val: quietHours, set: setQuietHours },
          { k: 'np', label: 'Mirror alerts to nanny', detail: 'Sara · primary co-caregiver', val: escalateNanny, set: setEscalateNanny },
          { k: 'h',  label: 'Haptic-only on watch',   detail: 'Suppress sound, keep vibration', val: hapticOnly, set: setHapticOnly },
        ].map((row, i, arr) => (
          <div key={row.k} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${APP.border}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{row.label}</div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>{row.detail}</div>
            </div>
            <Toggle on={row.val} onChange={row.set}/>
          </div>
        ))}
      </Card>

      {/* Rewards entry */}
      <SectionTitle>More</SectionTitle>
      <Card padding={0}>
        <div onClick={() => dispatch({ type: 'go', screen: 'rewards' })} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer',
          borderBottom: `1px solid ${APP.border}`,
        }}>
          <IconBadge name="gift" color={APP.star} size={32} iconSize={16}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Rewards</div>
            <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Catalog · {SAM.starsTotal} ★ available</div>
          </div>
          <AppIcon name="chevron" size={14} color={APP.inkFaint}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <IconBadge name="share" color={APP.info} size={32} iconSize={16}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Export reports</div>
            <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Weekly PDF · share with therapist</div>
          </div>
          <AppIcon name="chevron" size={14} color={APP.inkFaint}/>
        </div>
      </Card>

      <div style={{ padding: '4px 4px 0', fontSize: 10, color: APP.inkDim, textAlign: 'center', fontFamily: APP.fontMono }}>
        M11 · v0.4.1 · ESP32-S3
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, ScheduleScreen, AnalyticsScreen, NotificationsScreen,
  NudgeScreen, RewardsScreen, SettingsScreen, PRESET_ROUTINES,
});
