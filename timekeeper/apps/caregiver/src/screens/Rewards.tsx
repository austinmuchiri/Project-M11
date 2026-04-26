import { APP, AppIcon, Btn, Card, IconBadge, SectionTitle, type IconName } from '@timekeeper/ui';
import { useStore } from '../store.js';

const REWARDS: { id: string; label: string; cost: number; icon: IconName; color: string }[] = [
  { id: 'r1', label: 'Extra 15 min screen time', cost: 10, icon: 'play',  color: APP.info },
  { id: 'r2', label: 'Pick dinner',              cost: 25, icon: 'plate', color: APP.accent },
  { id: 'r3', label: 'Movie night',              cost: 50, icon: 'star',  color: APP.star },
  { id: 'r4', label: 'New book',                 cost: 75, icon: 'book',  color: APP.chart4 },
];

export function RewardsScreen() {
  const kid = useStore(s => s.kid);
  const total = 184;
  const week = 23;

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card padding={16}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {kid.name}'s stars
            </div>
            <div style={{
              fontFamily: APP.fontDisp, fontSize: 36, fontWeight: 800, color: APP.ink,
              lineHeight: 1, marginTop: 4, letterSpacing: -0.6,
            }}>
              {total}
            </div>
            <div style={{ fontSize: 11, color: APP.ink2, marginTop: 4 }}>+{week} this week</div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: APP.starSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AppIcon name="star" size={32} color={APP.star} strokeWidth={1.4}/>
          </div>
        </div>
        <Btn variant="primary" full style={{ marginTop: 14 }}
          icon={<AppIcon name="plus" size={14} color="#fff"/>}>
          Award stars manually
        </Btn>
      </Card>

      <SectionTitle action="+ New">Reward catalog</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {REWARDS.map(r => {
          const can = total >= r.cost;
          return (
            <Card key={r.id} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconBadge name={r.icon} color={r.color} size={40} iconSize={20}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{r.label}</div>
                <div style={{
                  fontSize: 11, color: APP.inkDim, marginTop: 2, fontFamily: APP.fontMono,
                }}>cost · {r.cost} ★</div>
              </div>
              <Btn size="sm" variant={can ? 'primary' : 'outline'}>{can ? 'Redeem' : 'Locked'}</Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
