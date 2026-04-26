import {
  APP, AppIcon, Btn, Card, IconBadge, SectionTitle, type IconName,
} from '@timekeeper/ui';
import type { AlertKind, Alert } from '@timekeeper/schema';
import { useStore } from '../store.js';

const META: Record<AlertKind, { color: string; bg: string; icon: IconName }> = {
  'miss-streak': { color: APP.warn,  bg: APP.warnSoft,  icon: 'bell' },
  'reward':      { color: APP.star,  bg: APP.starSoft,  icon: 'star' },
  'device':      { color: APP.info,  bg: APP.infoSoft,  icon: 'battery' },
  'compliance':  { color: APP.brand, bg: APP.brandSoft, icon: 'analytics' },
};

export function AlertsScreen({ onNudge }: { onNudge: () => void }) {
  const alerts = useStore(s => s.alerts);

  const today = alerts.filter(a => Date.now() - a.ts < 24 * 60 * 60_000);
  const earlier = alerts.filter(a => Date.now() - a.ts >= 24 * 60 * 60_000);

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <div style={{ fontSize: 11, color: APP.ink2, marginTop: 2 }}>
              You're pinged after 3 misses in a row · adjust in Settings
            </div>
          </div>
        </div>
      </Card>

      {today.length > 0 && (
        <>
          <SectionTitle>Today</SectionTitle>
          <Card padding={0}><AlertList items={today} onNudge={onNudge}/></Card>
        </>
      )}
      {earlier.length > 0 && (
        <>
          <SectionTitle>Earlier</SectionTitle>
          <Card padding={0}><AlertList items={earlier} onNudge={onNudge}/></Card>
        </>
      )}
    </div>
  );
}

function AlertList({ items, onNudge }: { items: Alert[]; onNudge: () => void }) {
  return (
    <>
      {items.map((n, i, arr) => {
        const m = META[n.kind];
        const isLast = i === arr.length - 1;
        return (
          <div key={n.id} style={{
            display: 'flex', gap: 12, padding: 14,
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
                <div style={{ fontSize: 10, color: APP.inkDim, fontFamily: APP.fontMono, flexShrink: 0 }}>
                  {formatTime(n.ts)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: APP.ink2, marginTop: 4, lineHeight: 1.35 }}>{n.body}</div>
              {n.kind === 'miss-streak' && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <Btn size="sm" variant="primary" onClick={onNudge}
                    icon={<AppIcon name="send" size={11} color="#fff"/>}>Nudge Munene</Btn>
                  <Btn size="sm" variant="secondary">Reschedule</Btn>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function formatTime(ts: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec/60)}m`;
  if (sec < 24 * 3600) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return new Date(ts).toLocaleDateString([], { weekday: 'short' });
}
