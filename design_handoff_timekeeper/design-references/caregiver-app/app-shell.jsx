// Main app shell: routing, screen header, frame composition.
// Renders both iOS + Android side-by-side with shared state for reviewing
// the same screen on both platforms simultaneously.

const SCREEN_META = {
  home:      { title: 'Today',         subtitle: 'Munene · 8 yrs', tab: 'home' },
  schedule:  { title: 'Schedule',      subtitle: 'Today · Sun, Apr 25', tab: 'schedule' },
  analytics: { title: 'Insights',      subtitle: 'Compliance & trends', tab: 'analytics' },
  notes:     { title: 'Alerts',        subtitle: '2 new · gentle escalation', tab: 'notes' },
  settings:  { title: 'Settings',      subtitle: 'Devices & rules', tab: 'settings' },
  nudge:     { title: 'Send a nudge',  subtitle: 'Lands on watch + laptop', tab: 'home', back: 'home' },
  rewards:   { title: 'Rewards',       subtitle: 'Stars & redeemables', tab: 'settings', back: 'settings' },
};

const SCREENS = {
  home: HomeScreen, schedule: ScheduleScreen, analytics: AnalyticsScreen,
  notes: NotificationsScreen, settings: SettingsScreen, nudge: NudgeScreen,
  rewards: RewardsScreen,
};

function useAppState() {
  const [screen, setScreen] = React.useState('home');
  const [selectedRoutine, setSelectedRoutine] = React.useState('morning');

  const dispatch = (a) => {
    if (a.type === 'go') setScreen(a.screen);
    if (a.type === 'selectRoutine') setSelectedRoutine(a.id);
  };

  return { state: { screen, selectedRoutine }, dispatch };
}

function PhoneApp({ platform = 'ios', screen, dispatch, selectedRoutine }) {
  const meta = SCREEN_META[screen];
  const Screen = SCREENS[screen];
  const unread = SAM.notes.filter(n => !n.read).length;

  const trailing = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <KidAvatar size={32} ring/>
    </div>
  );

  return (
    <div style={{
      width: '100%', height: '100%',
      background: APP.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: APP.font,
      color: APP.ink,
    }}>
      <AppHeader
        title={meta.title}
        subtitle={meta.subtitle}
        trailing={trailing}
        onBack={meta.back ? () => dispatch({ type: 'go', screen: meta.back }) : null}
      />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <Screen state={{ screen, selectedRoutine }} dispatch={dispatch}/>
      </div>

      <BottomTabs
        active={meta.tab}
        onChange={(id) => dispatch({ type: 'go', screen: id })}
        platform={platform}
        unread={unread}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Side-by-side stage with iOS + Android frames
// ─────────────────────────────────────────────────────────
function Stage() {
  const { state, dispatch } = useAppState();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1A1F1D',
      backgroundImage: `radial-gradient(circle at 20% 0%, #25302C 0%, #1A1F1D 60%)`,
      padding: '40px 24px 80px',
      fontFamily: APP.font,
      color: APP.ink,
    }}>
      {/* Top meta bar */}
      <div style={{
        maxWidth: 1100, margin: '0 auto 28px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        color: '#F4EFE6',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.6, color: 'rgba(244,239,230,0.6)' }}>
            M11 · Caregiver app
          </div>
          <div style={{ fontFamily: APP.fontDisp, fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: -0.6 }}>
            TimeKeeper
          </div>
          <div style={{ fontSize: 13, color: 'rgba(244,239,230,0.65)', marginTop: 2 }}>
            Calm + clinical · routes Munene's watch & laptop · single kid · clickable
          </div>
        </div>

        {/* Screen switcher */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, padding: 6,
          background: 'rgba(244,239,230,0.06)', borderRadius: 14,
          border: '1px solid rgba(244,239,230,0.08)',
          maxWidth: 540, justifyContent: 'flex-end',
        }}>
          {Object.entries(SCREEN_META).map(([id, m]) => {
            const on = id === state.screen;
            return (
              <button key={id} onClick={() => dispatch({ type: 'go', screen: id })} style={{
                padding: '8px 12px', borderRadius: 9, border: 'none',
                background: on ? '#A8C7B8' : 'transparent',
                color: on ? '#1F2E27' : 'rgba(244,239,230,0.78)',
                fontFamily: APP.font, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', textTransform: 'capitalize',
              }}>{m.title.toLowerCase()}</button>
            );
          })}
        </div>
      </div>

      {/* Frames row */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
        alignItems: 'start', justifyItems: 'center',
      }}>
        <div data-screen-label={`iOS · ${SCREEN_META[state.screen].title}`}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase',
            color: 'rgba(244,239,230,0.5)', marginBottom: 14, textAlign: 'center',
          }}>iPhone · iOS 26</div>
          <IOSDevice width={392} height={820} title="">
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <PhoneApp platform="ios" screen={state.screen} dispatch={dispatch} selectedRoutine={state.selectedRoutine}/>
            </div>
          </IOSDevice>
        </div>

        <div data-screen-label={`Android · ${SCREEN_META[state.screen].title}`}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase',
            color: 'rgba(244,239,230,0.5)', marginBottom: 14, textAlign: 'center',
          }}>Pixel · Material 3</div>
          <AndroidDevice width={392} height={820} title="">
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <PhoneApp platform="android" screen={state.screen} dispatch={dispatch} selectedRoutine={state.selectedRoutine}/>
            </div>
          </AndroidDevice>
        </div>
      </div>

      {/* Footnote */}
      <div style={{
        maxWidth: 1100, margin: '40px auto 0', display: 'flex',
        flexWrap: 'wrap', gap: 18, padding: '18px 22px',
        background: 'rgba(244,239,230,0.04)', borderRadius: 16,
        border: '1px solid rgba(244,239,230,0.06)',
        color: 'rgba(244,239,230,0.65)', fontSize: 12, lineHeight: 1.5,
      }}>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ color: '#A8C7B8', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>System</div>
          Warm off-white surfaces · sage primary · soft charcoal ink · Nunito + JetBrains Mono. Borrowed from V2 "Calm" watch spec, neutralised by ~10% for grown-up data density.
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ color: '#A8C7B8', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Flow</div>
          Today (live hero) → Schedule (preset routines) → Insights (compliance + export) → Alerts (3-miss escalation) → Settings (devices + rules) · Nudge & Rewards as sub-flows.
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ color: '#A8C7B8', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Open questions</div>
          Should "Nudge" support voice memo? Multi-kid switcher when sibling joins? Which laptop signals matter most beyond focus app?
        </div>
      </div>

      <style>{`
        @keyframes app-pulse {
          0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          70%  { box-shadow: 0 0 0 6px rgba(168,199,184,0); opacity: 0.7; }
          100% { box-shadow: 0 0 0 0 rgba(168,199,184,0);   opacity: 1; }
        }
        button:active { transform: scale(0.98); }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Stage/>);
