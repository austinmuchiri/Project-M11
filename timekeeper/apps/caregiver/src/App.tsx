import { useState } from 'react';
import { APP, AppHeader, BottomTabs, GLOBAL_CSS, KidAvatar } from '@timekeeper/ui';
import { useBootstrap, useStore, unreadAlertCount, getClient, set} from './store';
import { HomeScreen } from './screens/Home.js';
import { ScheduleScreen } from './screens/Schedule.js';
import { InsightsScreen } from './screens/Insights.js';
import { AlertsScreen } from './screens/Alerts.js';
import { SettingsScreen } from './screens/Settings.js';
import { NudgeScreen } from './screens/Nudge.js';
import { RewardsScreen } from './screens/Rewards.js';
import { LoginScreen } from './screens/Login.js';

type ScreenId = 'home' | 'schedule' | 'analytics' | 'notes' | 'settings' | 'nudge' | 'rewards';

const META: Record<ScreenId, { title: string; subtitle: string; tab: string; back?: ScreenId }> = {
  home:      { title: 'Today',        subtitle: '',           tab: 'home' },
  schedule:  { title: 'Tasks & Routines',     subtitle: '',      tab: 'schedule' },
  analytics: { title: 'Analytics',     subtitle: 'Compliance & trends',      tab: 'analytics' },
  notes:     { title: 'Alerts',       subtitle: 'Gentle escalation',        tab: 'notes' },
  settings:  { title: 'Settings',     subtitle: 'Devices & rules',          tab: 'settings' },
  nudge:     { title: 'Send a nudge', subtitle: 'Lands on watch + laptop',  tab: 'home',     back: 'home' },
  rewards:   { title: 'Reward Centre',      subtitle: 'Stars & redeemables',      tab: 'settings', back: 'settings' },
};

export function App() {
  useBootstrap();
  const [screen, setScreen] = useState<ScreenId>('home');
  const [selectedRoutine, setSelectedRoutine] = useState('morning');

  const ready   = useStore(s => s.ready);
  const isMock  = useStore(s => s.isMock);
  const session = useStore(s => s.session);
  const kid     = useStore(s => s.kid);
  const unread  = useStore(unreadAlertCount);
  const bootError = useStore(s => s.bootstrapError);

  const meta = META[screen];

if (ready && !session) {
  return (
    <div style={{
      width: '100%', height: '100vh', display: 'flex', flexDirection: 'column',
      background: APP.bg, color: APP.ink, fontFamily: APP.font,
    }}>
      <style>{GLOBAL_CSS}</style>
      <LoginScreen onSignedIn={ async () => {
        const session = await getClient().getSession();
        set({ session }); // This will now work
        // window.location.reload(); // Optional, but helps clear the cache
        // 
      }}/>
    </div>
  );
}

  return (
    <div style={{
      width: '100%', height: '100vh', display: 'flex', flexDirection: 'column',
      background: APP.bg, color: APP.ink, fontFamily: APP.font,
    }}>
      <style>{GLOBAL_CSS}</style>

      {isMock && (
        <div style={{
          padding: '6px 14px', background: APP.warnSoft, color: APP.warn,
          fontSize: 11, fontWeight: 800, textAlign: 'center',
          textTransform: 'uppercase', letterSpacing: 1.4,
          fontFamily: APP.fontMono,
        }}>
          Demo mode · in-memory data · no Supabase
        </div>
      )}

      {bootError && (
        <div style={{
          padding: '10px 14px', background: APP.dangerSoft, color: APP.danger,
          fontSize: 12, fontWeight: 700,
        }}>{bootError}</div>
      )}

      <AppHeader
        title={meta.title}
        subtitle={meta.subtitle}
        onBack={meta.back ? () => setScreen(meta.back as ScreenId) : undefined}
        
      />

      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}>
        {!ready ? (
          <div style={{ padding: 40, textAlign: 'center', color: APP.inkDim, fontSize: 13 }}>
            Loading…
          </div>
        ) : (
          <>
            {screen === 'home'      && <HomeScreen      onNudge={() => setScreen('nudge')}      onSchedule={() => setScreen('schedule')}/>}
            {screen === 'schedule'  && <ScheduleScreen  selectedId={selectedRoutine}            onSelect={setSelectedRoutine}/>}
            {screen === 'analytics' && <InsightsScreen/>}
            {screen === 'notes'     && <AlertsScreen    onNudge={() => setScreen('nudge')}/>}
            {screen === 'settings'  && <SettingsScreen  onRewards={() => setScreen('rewards')}/>}
            {screen === 'nudge'     && <NudgeScreen     onDone={() => setScreen('home')}/>}
            {screen === 'rewards'   && <RewardsScreen/>}
          </>
        )}
      </div>

      <BottomTabs
        active={meta.tab}
        unread={unread}
        onChange={(id) => setScreen(id as ScreenId)}
      />
    </div>
  );
}
