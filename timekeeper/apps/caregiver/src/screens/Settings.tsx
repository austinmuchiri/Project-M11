import { useState } from 'react';
import {
  APP, AppIcon, Btn, Card, IconBadge, SectionTitle, StatusDot, Toggle,
  type IconName,
} from '@timekeeper/ui';
import { useStore } from '../store';
import type { DeviceKind } from '@timekeeper/schema';

const KIND_META: Record<DeviceKind, { icon: IconName; color: string }> = {
  watch:  { icon: 'watch',  color: APP.brand },
  laptop: { icon: 'laptop', color: APP.info },
  phone:  { icon: 'bell',   color: APP.accent },
};

export function SettingsScreen({ onRewards }: { onRewards: () => void }) {
  const devices = useStore(s => s.devices);
  const [missThreshold, setMissThreshold] = useState(3);
  const [quietHours, setQuietHours] = useState(true);
  const [escalateNanny, setEscalateNanny] = useState(true);
  const [hapticOnly, setHapticOnly] = useState(false);
  const [lockOnTask, setLockOnTask] = useState(false);
  const [blockGames, setBlockGames] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>(['Roblox']);

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Devices</SectionTitle>
      <Card padding={0}>
        {devices.map((d, i) => {
          const meta = KIND_META[d.kind];
          const ago = Math.floor((Date.now() - d.lastSeen) / 1000);
          const status = d.kind === 'watch'
            ? `${d.battery ?? '—'}% · paired`
            : d.kind === 'laptop'
              ? (ago < 30 ? 'Online' : `Last seen ${Math.floor(ago/60)}m ago`)
              : 'Mirroring alerts';
          return (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i === devices.length - 1 ? 'none' : `1px solid ${APP.border}`,
            }}>
              <IconBadge name={meta.icon} color={meta.color} size={36} iconSize={18}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{d.label}</div>
                <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1, fontFamily: APP.fontMono }}>
                  {d.fwVersion ? `v${d.fwVersion} · ` : ''}{d.id}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusDot color={APP.brand} size={6}/>
                <div style={{ fontSize: 11, color: APP.ink2, fontWeight: 700 }}>{status}</div>
              </div>
            </div>
          );
        })}
        <div style={{ padding: 12 }}>
          <Btn variant="secondary" size="sm" full icon={<AppIcon name="plus" size={12}/>}>
            Pair new device
          </Btn>
        </div>
      </Card>

      <SectionTitle>Notification rules</SectionTitle>
      <Card padding={0}>
        <div style={{ padding: 14, borderBottom: `1px solid ${APP.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Miss threshold</div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Ping me after N misses in a row</div>
            </div>
            <div style={{ fontFamily: APP.fontMono, fontSize: 16, fontWeight: 800, color: APP.ink, minWidth: 24, textAlign: 'right' }}>
              {missThreshold}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setMissThreshold(Math.max(1, missThreshold - 1))} style={{
              width: 28, height: 28, borderRadius: 8, border: `1px solid ${APP.border}`,
              background: APP.surface, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><AppIcon name="minus" size={14}/></button>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: APP.bgSoft, overflow: 'hidden' }}>
              <div style={{ width: (missThreshold/6)*100 + '%', height: '100%', background: APP.brand, borderRadius: 2 }}/>
            </div>
            <button onClick={() => setMissThreshold(Math.min(6, missThreshold + 1))} style={{
              width: 28, height: 28, borderRadius: 8, border: `1px solid ${APP.border}`,
              background: APP.surface, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><AppIcon name="plus" size={14}/></button>
          </div>
        </div>

        {([
          { k: 'qh', label: 'Quiet hours', detail: '21:00 → 07:00', val: quietHours, set: setQuietHours },
          { k: 'np', label: 'Mirror alerts to nanny', detail: 'Sara · primary co-caregiver', val: escalateNanny, set: setEscalateNanny },
          { k: 'h',  label: 'Haptic-only on watch', detail: 'Suppress sound, keep vibration', val: hapticOnly, set: setHapticOnly },
        ] as const).map((row, i, arr) => (
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

      <SectionTitle>Focus &amp; blocking</SectionTitle>
      <Card padding={0}>
        {([
          { k: 'lt', label: 'Lock during active task',           detail: 'Laptop locks when a task starts on watch', val: lockOnTask,  set: setLockOnTask  },
          { k: 'bg', label: 'Block games during routine windows', detail: 'Hides game apps while a routine is active',  val: blockGames,  set: setBlockGames  },
        ] as const).map((row, i, arr) => (
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

      {blockedApps.length > 0 && (
        <Card padding={14}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: APP.inkDim, marginBottom: 10 }}>
            Currently blocked
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {blockedApps.map(app => (
              <div key={app} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: APP.accentSoft, borderRadius: 8,
                padding: '5px 10px',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: APP.accent }}>{app}</span>
                <button
                  aria-label={`Remove ${app} block`}
                  onClick={() => setBlockedApps(prev => prev.filter(a => a !== app))}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, lineHeight: 1,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <AppIcon name="minus" size={12} color={APP.accent}/>
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SectionTitle>More</SectionTitle>
      <Card padding={0}>
        <div onClick={onRewards} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer',
          borderBottom: `1px solid ${APP.border}`,
        }}>
          <IconBadge name="gift" color={APP.star} size={32} iconSize={16}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Rewards</div>
            <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Catalog · 184 ★ available</div>
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

      <div style={{
        padding: '4px 4px 0', fontSize: 10, color: APP.inkDim,
        textAlign: 'center', fontFamily: APP.fontMono,
      }}>
        Routine Tracker · v0.1.0 · ESP32-S3
      </div>
    </div>
  );
}
