import { useState } from 'react';
import {
  APP, AppIcon, BarChart, Btn, Card, IconBadge, Pill, SectionTitle,
  Sparkline, type IconName,
} from '@timekeeper/ui';
import {
  useStore, computeWeekCompliance, computeTimeOfDay, computeTrendWeeks,
  computeStreak, computeTotalStars, computeWeeklyStars,
} from '../store';

type Range = 'Today' | 'Week' | 'Month' | '90d';

export function InsightsScreen() {
  const [range, setRange] = useState<Range>('Week');
  const [toast, setToast] = useState<string | null>(null);

  const weekData   = useStore(computeWeekCompliance);
  const timeOfDay  = useStore(computeTimeOfDay);
  const trend      = useStore(computeTrendWeeks);
  const streak     = useStore(computeStreak);
  const totalStars = useStore(computeTotalStars);
  const weekStars  = useStore(computeWeeklyStars);

  const weekAvg = weekData.length
    ? Math.round(weekData.reduce((s, d) => s + d.pct, 0) / weekData.length)
    : 0;
  const lastTrend = trend[trend.length - 1] ?? 0;
  const firstTrend = trend[0] ?? 0;

  const handleExport = async () => {
    const lines = [
      `Timekeeper Weekly Report`,
      `Range: ${range}`,
      ``,
      `Completion this week: ${weekAvg}%`,
      ``,
      `Daily breakdown:`,
      ...weekData.map(d => `  ${d.d}: ${d.pct}%`),
      ``,
      `Time of day:`,
      `  Morning: ${timeOfDay.morning}%`,
      `  School:  ${timeOfDay.school}%`,
      `  Evening: ${timeOfDay.evening}%`,
      ``,
      `Current streak: ${streak} days`,
      `Stars this week: ${weekStars}`,
      `Stars total:     ${totalStars}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setToast('Report copied to clipboard');
    } catch {
      setToast('Could not copy — try again');
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Range pill bar */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: APP.bgSoft, borderRadius: 12 }}>
        {(['Today', 'Week', 'Month', '90d'] as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: r === range ? APP.surface : 'transparent',
            color: r === range ? APP.ink : APP.inkDim,
            fontFamily: APP.font, fontSize: 12, fontWeight: 700,
            boxShadow: r === range ? APP.shadowSm : 'none',
            cursor: 'pointer',
          }}>{r}</button>
        ))}
      </div>

      {/* Hero metric */}
      <Card padding={16}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Completion · {range.toLowerCase()}
            </div>
            <div style={{ fontFamily: APP.fontDisp, fontSize: 44, fontWeight: 800, color: APP.ink, lineHeight: 1, marginTop: 4, letterSpacing: -1 }}>
              {weekAvg}<span style={{ fontSize: 22, color: APP.inkDim }}>%</span>
            </div>
          </div>
          <Pill bg={APP.brandSoft} color={APP.brandInk}
            icon={<AppIcon name="arrowUp" size={11} color={APP.brandInk}/>}>
            +{weekStars} ★ wk
          </Pill>
        </div>
        <div style={{ marginTop: 14 }}>
          <BarChart data={weekData} w={296} h={92} color={APP.brand}/>
        </div>
      </Card>

      {/* Time of day */}
      <Card padding={16}>
        <SectionTitle style={{ padding: 0, marginBottom: 12 }}>Time-of-day · avg</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { label: 'Morning', pct: timeOfDay.morning, color: APP.accent, icon: 'sun' as IconName },
            { label: 'School',  pct: timeOfDay.school,  color: APP.info,    icon: 'school' as IconName },
            { label: 'Evening', pct: timeOfDay.evening, color: APP.chart4,  icon: 'moon' as IconName },
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
          <div style={{ fontSize: 11, color: APP.inkDim, fontFamily: APP.fontMono }}>
            {firstTrend}% → {lastTrend}%
          </div>
        </div>
        <Sparkline data={trend} w={296} h={68} color={APP.brand}/>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: APP.fontMono, fontSize: 10, color: APP.inkDim,
        }}>
          <span>{firstTrend}%</span>
          <span>peak {Math.max(...trend)}%</span>
          <span>now {lastTrend}%</span>
        </div>
      </Card>

      {/* Streak + stars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="flame" size={14} color={APP.accent}/>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Streak</div>
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink, marginTop: 4, letterSpacing: -0.5 }}>
            {streak} <span style={{ fontSize: 12, color: APP.inkDim, fontWeight: 700 }}>days</span>
          </div>
          <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>current run</div>
        </Card>
        <Card padding={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon name="star" size={14} color={APP.star}/>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Stars · total</div>
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 26, color: APP.ink, marginTop: 4, letterSpacing: -0.5 }}>
            {totalStars}
          </div>
          <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>+{weekStars} this week</div>
        </Card>
      </div>

      {toast && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, background: APP.brandSoft,
          color: APP.brand, fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AppIcon name="send" size={14} color={APP.brand}/>
          {toast}
        </div>
      )}

      <Card padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconBadge name="share" color={APP.info} size={36} iconSize={18}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Weekly report · text</div>
          <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Copy summary to clipboard</div>
        </div>
        <Btn variant="outline" size="sm" icon={<AppIcon name="download" size={12}/>}
          onClick={handleExport}>Export</Btn>
      </Card>
    </div>
  );
}
