import { useState } from 'react';
import { APP, AppIcon, Btn, Card, IconBadge, SectionTitle, type IconName } from '@timekeeper/ui';
import { useStore, awardStars, computeTotalStars, computeWeeklyStars } from '../store';

interface RewardItem { id: string; label: string; cost: number; icon: IconName; color: string }

const INITIAL_REWARDS: RewardItem[] = [
  { id: 'r1', label: 'Extra 15 min screen time', cost: 10, icon: 'play',  color: APP.info },
  { id: 'r2', label: 'Pick dinner',              cost: 25, icon: 'plate', color: APP.accent },
  { id: 'r3', label: 'Movie night',              cost: 50, icon: 'star',  color: APP.star },
  { id: 'r4', label: 'New book',                 cost: 75, icon: 'book',  color: APP.chart4 },
];

export function RewardsScreen() {
  const kid        = useStore(s => s.kid);
  const total      = useStore(computeTotalStars);
  const week       = useStore(computeWeeklyStars);

  const [rewards, setRewards]       = useState<RewardItem[]>(INITIAL_REWARDS);
  const [toast, setToast]           = useState<string | null>(null);
  const [showAward, setShowAward]   = useState(false);
  const [awardAmt, setAwardAmt]     = useState('5');
  const [showNew, setShowNew]       = useState(false);
  const [newLabel, setNewLabel]     = useState('');
  const [newCost, setNewCost]       = useState('20');

  const showMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAward = () => {
    const n = parseInt(awardAmt, 10);
    if (!n || n <= 0) return;
    awardStars(n);
    setShowAward(false);
    setAwardAmt('5');
    showMsg(`Awarded ${n} ★ to ${kid.name}`);
  };

  const handleRedeem = (r: RewardItem) => {
    if (total < r.cost) return;
    awardStars(-r.cost);
    showMsg(`"${r.label}" redeemed!`);
  };

  const handleAddReward = () => {
    if (!newLabel.trim()) return;
    const cost = parseInt(newCost, 10);
    if (!cost || cost <= 0) return;
    setRewards(prev => [...prev, {
      id: `r_${Date.now()}`, label: newLabel.trim(), cost, icon: 'star', color: APP.brand,
    }]);
    setNewLabel('');
    setNewCost('20');
    setShowNew(false);
    showMsg('Reward added to catalog');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 10,
    border: `1.5px solid ${APP.border}`, background: APP.bgSoft,
    fontFamily: APP.font, fontSize: 14, color: APP.ink, outline: 'none',
  };

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
          icon={<AppIcon name="plus" size={14} color="#fff"/>}
          onClick={() => setShowAward(true)}>
          Award stars manually
        </Btn>
      </Card>

      {/* Award modal */}
      {showAward && (
        <Card padding={16} style={{ border: `1.5px solid ${APP.brand}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink, marginBottom: 10 }}>
            Award stars to {kid.name}
          </div>
          <input
            type="number" min={1} max={999} value={awardAmt}
            onChange={e => setAwardAmt(e.target.value)}
            style={inputStyle}
            placeholder="Number of stars"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Btn variant="primary" full onClick={handleAward}>Award ★</Btn>
            <Btn variant="secondary" onClick={() => setShowAward(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {toast && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, background: APP.brandSoft,
          color: APP.brand, fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AppIcon name="star" size={14} color={APP.brand}/>
          {toast}
        </div>
      )}

      <SectionTitle action={
        <button onClick={() => setShowNew(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 800, color: APP.brand,
          padding: '2px 6px',
        }}>+ New</button>
      }>Reward catalog</SectionTitle>

      {/* New reward form */}
      {showNew && (
        <Card padding={16} style={{ border: `1.5px solid ${APP.brand}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink, marginBottom: 10 }}>
            New reward
          </div>
          <input
            value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder="Reward name"
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <input
            type="number" min={1} value={newCost} onChange={e => setNewCost(e.target.value)}
            placeholder="Cost in stars"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Btn variant="primary" full onClick={handleAddReward}>Add reward</Btn>
            <Btn variant="secondary" onClick={() => setShowNew(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rewards.map(r => {
          const can = total >= r.cost;
          return (
            <Card key={r.id} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconBadge name={r.icon} color={r.color} size={40} iconSize={20}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: APP.ink }}>{r.label}</div>
                <div style={{ fontSize: 11, color: APP.inkDim, marginTop: 2, fontFamily: APP.fontMono }}>
                  cost · {r.cost} ★
                </div>
              </div>
              <Btn size="sm" variant={can ? 'primary' : 'outline'}
                onClick={() => can && handleRedeem(r)}>
                {can ? 'Redeem' : 'Locked'}
              </Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
