import {
  APP, AppIcon, BarChart, Btn, Card, IconBadge, Pill, SectionTitle,
  Sparkline, type IconName,
} from '@timekeeper/ui';
import { MOCK_WEEK_COMPLIANCE, MOCK_TIME_OF_DAY, MOCK_TREND_12_WEEK } from '@timekeeper/supabase-client';

export function InsightsScreen() {
  const weekAvg = Math.round(MOCK_WEEK_COMPLIANCE.reduce((s, d) => s + d.pct, 0) / MOCK_WEEK_COMPLIANCE.length);
  const last = MOCK_TREND_12_WEEK[MOCK_TREND_12_WEEK.length - 1] ?? 0;

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Range pill bar */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: APP.bgSoft, borderRadius: 12 }}>
        {['Today', 'Week', 'Month', '90d'].map((r, i) => (
          <button key={r} style={{
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
          <Pill bg={APP.brandSoft} color={APP.brandInk}
            icon={<AppIcon name="arrowUp" size={11} color={APP.brandInk}/>}>
            +4 vs last
          </Pill>
        </div>
        <div style={{ marginTop: 14 }}>
          <BarChart data={MOCK_WEEK_COMPLIANCE} w={296} h={92} color={APP.brand}/>
        </div>
      </Card>

      {/* Time of day */}
      <Card padding={16}>
        <SectionTitle style={{ padding: 0, marginBottom: 12 }}>Time-of-day · 30d avg</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { label: 'Morning', pct: MOCK_TIME_OF_DAY.morning, color: APP.accent, icon: 'sun' as IconName },
            { label: 'School',  pct: MOCK_TIME_OF_DAY.school,  color: APP.info,    icon: 'school' as IconName },
            { label: 'Evening', pct: MOCK_TIME_OF_DAY.evening, color: APP.chart4,  icon: 'moon' as IconName },
          ]).map(row => (
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
        <Sparkline data={MOCK_TREND_12_WEEK} w={296} h={68} color={APP.brand}/>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: APP.fontMono, fontSize: 10, color: APP.inkDim,
        }}>
          <span>78%</span><span>peak 92%</span><span>now {last}%</span>
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
          <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>Current: 12d</div>
        </Card>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="star" size={14} color={APP.star}/>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Stars · total</div>
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink, marginTop: 4, letterSpacing: -0.5 }}>
            184
          </div>
          <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>+23 this week</div>
        </Card>
      </div>

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
