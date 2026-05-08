import { useState } from 'react';
import {
  APP, AppIcon, Btn, Card, IconBadge, MiniWatchFace, SectionTitle,
  TASK_ICON, type IconName,
} from '@timekeeper/ui';
import type { NudgeTone } from '@timekeeper/schema';
import { sendNudge, useStore, activeTask } from '../store';

const QUICK: { id: string; icon: IconName; label: string; tone: NudgeTone }[] = [
  { id: 'q1', icon: 'check', label: 'Great job!',         tone: 'praise' },
  { id: 'q2', icon: 'play',  label: "Let's get started",  tone: 'start' },
  { id: 'q3', icon: 'flame', label: 'Almost there!',      tone: 'praise' },
  { id: 'q4', icon: 'pause', label: 'Take a 5-min break', tone: 'break' },
];

export function NudgeScreen({ onDone }: { onDone: () => void }) {
  const [selected, setSelected] = useState('q1');
  const [custom, setCustom] = useState('');
  const [sent, setSent] = useState(false);
  const kid = useStore(s => s.kid);
  const active = useStore(activeTask);

  const handleSend = async () => {
    const q = QUICK.find(x => x.id === selected);
    const message = custom.trim() || q?.label || 'Nudge';
    const tone: NudgeTone = custom.trim() ? 'custom' : (q?.tone ?? 'reminder');
    await sendNudge({ kid_id: kid.id, message, tone, sentAt: Date.now(), acknowledged: false });
    setSent(true);
    setTimeout(onDone, 900);
  };

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card padding={16} style={{ background: '#1F2E27', color: '#F4EFE6', border: 'none' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <MiniWatchFace
            taskLabel={active?.label ?? 'Idle'}
            taskIcon={(active ? (TASK_ICON[active.label] ?? 'dot') : 'dot') as IconName}
            taskColor="#A8C7B8"
            time={new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            battery={64} w={88} h={104}
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, color: 'rgba(244,239,230,0.6)',
              textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700,
            }}>Sending to</div>
            <div style={{ fontFamily: APP.fontDisp, fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              {kid.name}'s watch
            </div>
            <div style={{ fontSize: 12, color: 'rgba(244,239,230,0.7)', marginTop: 4 }}>
              {active ? `Currently on ${active.label}` : 'Idle'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(244,239,230,0.5)', marginTop: 8, fontFamily: APP.fontMono }}>
              Latency · ~120ms
            </div>
          </div>
        </div>
      </Card>

      <SectionTitle>Quick nudges</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {QUICK.map(q => {
          const on = q.id === selected;
          return (
            <Card key={q.id} padding={14} onClick={() => { setSelected(q.id); setCustom(''); }} style={{
              border: `1.5px solid ${on ? APP.brand : APP.border}`,
              background: on ? APP.brandSoft : APP.surface,
            }}>
              <IconBadge name={q.icon} color={on ? APP.brand : APP.ink2} size={32} iconSize={16}/>
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 800, color: APP.ink }}>{q.label}</div>
              <div style={{
                fontSize: 10, color: APP.inkDim, marginTop: 2,
                textTransform: 'uppercase', letterSpacing: 1, fontFamily: APP.fontMono,
              }}>{q.tone}</div>
            </Card>
          );
        })}
      </div>

      <SectionTitle>Custom message</SectionTitle>
      <Card padding={0}>
        <textarea
          value={custom} onChange={(e) => setCustom(e.target.value)}
          placeholder="Short message — appears as a toast on watch and laptop."
          style={{
            width: '100%', padding: 14, border: 'none', resize: 'none',
            background: 'transparent', color: APP.ink, fontFamily: APP.font,
            fontSize: 13, fontWeight: 600, minHeight: 70, outline: 'none',
          }}
        />
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="secondary" full onClick={onDone}>Cancel</Btn>
        <Btn variant="primary" full onClick={handleSend}
          icon={<AppIcon name="send" size={14} color="#fff"/>}>
          {sent ? 'Sent ✓' : 'Send nudge'}
        </Btn>
      </div>
    </div>
  );
}
