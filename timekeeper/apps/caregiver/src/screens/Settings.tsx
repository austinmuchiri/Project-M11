import { useState } from 'react';
import {
  APP, AppIcon, Btn, Card, IconBadge, SectionTitle, StatusDot, Toggle,
  type IconName,
} from '@timekeeper/ui';
import { useStore, saveSettings, pairDevice } from '../store';
import type { DeviceKind } from '@timekeeper/schema';

const KIND_META: Record<DeviceKind, { icon: IconName; color: string }> = {
  watch:  { icon: 'watch',  color: APP.brand },
  laptop: { icon: 'laptop', color: APP.info },
  phone:  { icon: 'bell',   color: APP.accent },
};

export function SettingsScreen({ onRewards }: { onRewards: () => void }) {
  const devices    = useStore(s => s.devices);
  const heartbeat  = useStore(s => s.heartbeat);
  const settings   = useStore(s => s.settings);

  const [blockedApps, setBlockedApps] = useState<string[]>(['Roblox']);
  const [showPair, setShowPair]       = useState(false);
  const [pairKind, setPairKind]       = useState<DeviceKind>('watch');
  const [pairLabel, setPairLabel]     = useState('');
  const [pairBusy, setPairBusy]       = useState(false);
  const [toast, setToast]             = useState<string | null>(null);
  const [pairCode, setPairCode] = useState('');

  const laptopOnline = heartbeat ? (Date.now() - heartbeat.ts) < 60_000 : false;

  const showMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handlePair = async () => {
    setPairBusy(true);
    try {
      if (pairKind === 'watch') {
        // Logic for ESP32 Watch pairing
        if (pairCode.length !== 4) {
          alert("Please enter the 4-digit code shown on your watch.");
          return;
        }
        await pairDevice(pairKind, pairLabel, pairCode);
      } else if (pairKind === 'laptop') {
        // NEW: Logic for Electron Laptop pairing
        // In a real scenario, you might prompt the user to enter the
        // Device ID shown on the Electron screen (image_10eff7.png)
        const generatedId = `laptop_${Math.random().toString(36).substr(2, 5)}`;
        await pairDevice(pairKind, pairLabel, generatedId);
        showMsg("Laptop linked! Ensure the Monitor app is running.");
      }
      
      setShowPair(false);
      setPairCode('');
      setPairLabel('');
    } catch (err) {
      showMsg("Pairing failed. Please try again.");
    } finally {
      setPairBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 10,
    border: `1.5px solid ${APP.border}`, background: APP.bgSoft,
    fontFamily: APP.font, fontSize: 14, color: APP.ink, outline: 'none',
  };

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Devices</SectionTitle>
      <Card padding={0}>
        {devices.map((d, i) => {
          const meta = KIND_META[d.kind];
          const ago = Math.floor((Date.now() - d.lastSeen) / 1000);
          const isLaptopOnline = d.kind === 'laptop' && laptopOnline;
          const status = d.kind === 'watch'
            ? `${d.battery ?? '—'}% · paired`
            : d.kind === 'laptop'
              ? (isLaptopOnline ? 'Online' : `Last seen ${Math.floor(ago / 60)}m ago`)
              : 'Mirroring alerts';
          const dotColor = d.kind === 'laptop'
            ? (isLaptopOnline ? APP.brand : APP.inkDim)
            : APP.brand;
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
                <StatusDot color={dotColor} size={6}/>
                <div style={{ fontSize: 11, color: APP.ink2, fontWeight: 700 }}>{status}</div>
              </div>
            </div>
          );
        })}
        <div style={{ padding: 12 }}>
          <Btn variant="secondary" size="sm" full icon={<AppIcon name="plus" size={12}/>}
            onClick={() => setShowPair(p => !p)}>
            Pair new device
          </Btn>
        </div>
      </Card>

      {/* Pair device modal */}
      {showPair && (
        <Card padding={16} style={{ border: `1.5px solid ${APP.brand}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink, marginBottom: 12 }}>
            Pair a new device
          </div>          
          {/* Kind selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['watch', 'laptop'] as DeviceKind[]).map(k => (
              <button key={k} onClick={() => setPairKind(k)} style={{
                flex: 1, padding: '10px 4px', borderRadius: 10,
                border: `1.5px solid ${pairKind === k ? APP.brand : APP.border}`,
                background: pairKind === k ? APP.brandSoft : APP.surfaceAlt,
                cursor: 'pointer', fontFamily: APP.font,
                fontSize: 12, fontWeight: 800,
                color: pairKind === k ? APP.brand : APP.inkDim,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <IconBadge name={KIND_META[k].icon} color={KIND_META[k].color} size={28} iconSize={14}/>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>

          
          {/* ... Device Selector ... */}

          {pairKind === 'watch' && (
            <div style={{ marginBottom: 15 }}>
              <label style={{ fontSize: 11, fontWeight: 'bold', color: '#666' }}>WATCH PAIRING CODE</label>
              <input 
                type="text"
                maxLength={4}
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                style={{ 
                    width: '100%', padding: '12px', borderRadius: '8px', 
                    textAlign: 'center', fontSize: '20px', letterSpacing: '4px' 
                }}
              />
            </div>
          )}

          <input
            value={pairLabel}
            onChange={e => setPairLabel(e.target.value)}
            placeholder={`Label (e.g. ${pairKind === 'watch' ? "Munene's Watch" : pairKind === 'laptop' ? "Munene's MacBook" : "Nanny phone"})`}
            style={{ ...inputStyle, marginBottom: 10 }}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" full onClick={handlePair} disabled={pairBusy}>
              {pairBusy ? 'Verifying…' : 'Pair device'}
            </Btn>
            <Btn variant="secondary" onClick={() => setShowPair(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

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

      <SectionTitle>Notification rules</SectionTitle>
      <Card padding={0}>
        <div style={{ padding: 14, borderBottom: `1px solid ${APP.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>Miss threshold</div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Ping me after N misses in a row</div>
            </div>
            <div style={{ fontFamily: APP.fontMono, fontSize: 16, fontWeight: 800, color: APP.ink, minWidth: 24, textAlign: 'right' }}>
              {settings.missThreshold}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => saveSettings({ missThreshold: Math.max(1, settings.missThreshold - 1) })}
              style={{
                width: 28, height: 28, borderRadius: 8, border: `1px solid ${APP.border}`,
                background: APP.surface, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <AppIcon name="minus" size={14}/>
            </button>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: APP.bgSoft, overflow: 'hidden' }}>
              <div style={{ width: (settings.missThreshold / 6) * 100 + '%', height: '100%', background: APP.brand, borderRadius: 2 }}/>
            </div>
            <button
              onClick={() => saveSettings({ missThreshold: Math.min(6, settings.missThreshold + 1) })}
              style={{
                width: 28, height: 28, borderRadius: 8, border: `1px solid ${APP.border}`,
                background: APP.surface, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <AppIcon name="plus" size={14}/>
            </button>
          </div>
        </div>

        {([
          {
            k: 'qh' as const,
            label: 'Quiet hours',
            detail: `${settings.quietStart} → ${settings.quietEnd}`,
            val: settings.quietHours,
            onChange: (v: boolean) => saveSettings({ quietHours: v }),
          },
          {
            k: 'np' as const,
            label: 'Mirror alerts to nanny',
            detail: 'Sara · primary co-caregiver',
            val: settings.escalateNanny,
            onChange: (v: boolean) => saveSettings({ escalateNanny: v }),
          },
          {
            k: 'h' as const,
            label: 'Haptic-only on watch',
            detail: 'Suppress sound, keep vibration',
            val: settings.hapticOnly,
            onChange: (v: boolean) => saveSettings({ hapticOnly: v }),
          },
        ]).map((row, i, arr) => (
          <div key={row.k} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${APP.border}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{row.label}</div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>{row.detail}</div>
            </div>
            <div onClick={e => e.stopPropagation()}>
              <Toggle on={row.val} onChange={row.onChange}/>
            </div>
          </div>
        ))}
      </Card>

      <SectionTitle>Focus &amp; blocking</SectionTitle>
      <Card padding={0}>
        {([
          {
            k: 'lt' as const,
            label: 'Lock during active task',
            detail: 'Laptop locks when a task starts on watch',
            val: settings.lockOnTask,
            onChange: (v: boolean) => saveSettings({ lockOnTask: v }),
          },
          {
            k: 'bg' as const,
            label: 'Block games during routine windows',
            detail: 'Hides game apps while a routine is active',
            val: settings.blockGames,
            onChange: (v: boolean) => saveSettings({ blockGames: v }),
          },
        ]).map((row, i, arr) => (
          <div key={row.k} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${APP.border}`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{row.label}</div>
              <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>{row.detail}</div>
            </div>
            <div onClick={e => e.stopPropagation()}>
              <Toggle on={row.val} onChange={row.onChange}/>
            </div>
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
                  }}>
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
            <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 1 }}>Catalog · redeem with stars</div>
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
