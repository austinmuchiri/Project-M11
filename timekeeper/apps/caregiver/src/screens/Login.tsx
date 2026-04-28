import { useState } from 'react';
import { APP, AppIcon, Btn } from '@timekeeper/ui';
import { client } from '../store.js';

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === 'in') await client.signIn(email, password);
      else await client.signUp(email, password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '24px 28px',
      background: APP.bg,
    }}>
      <div style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: APP.brand, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <AppIcon name="home" size={32} color="#fff"/>
        </div>

        <div style={{
          fontFamily: APP.fontDisp, fontWeight: 800, fontSize: 28,
          color: APP.ink, textAlign: 'center', letterSpacing: -0.5,
        }}>
          Routine Tracker
        </div>
        <div style={{
          fontSize: 13, color: APP.inkDim, textAlign: 'center', marginTop: 6,
        }}>
          {mode === 'in' ? 'Sign in to your caregiver account' : 'Create a new caregiver account'}
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Email
          </label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${APP.borderStrong}`,
              background: APP.surface, fontSize: 14, fontFamily: APP.font,
              color: APP.ink, outline: 'none',
            }}/>

          <label style={{ fontSize: 11, color: APP.inkDim, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 }}>
            Password
          </label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            style={{
              padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${APP.borderStrong}`,
              background: APP.surface, fontSize: 14, fontFamily: APP.font,
              color: APP.ink, outline: 'none',
            }}/>

          {error && (
            <div style={{
              marginTop: 8, padding: '10px 12px', borderRadius: 10,
              background: APP.dangerSoft, color: APP.danger,
              fontSize: 12, fontWeight: 600,
            }}>{error}</div>
          )}

          <Btn variant="primary" size="lg" full
            style={{ marginTop: 16 }}
            onClick={() => {}}>
            {busy ? '…' : (mode === 'in' ? 'Sign in' : 'Create account')}
          </Btn>
          <button type="submit" style={{ display: 'none' }}/>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: APP.inkDim }}>
          {mode === 'in' ? "First time? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(null); }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: APP.brand, fontFamily: APP.font, fontSize: 13,
              fontWeight: 800, padding: 0,
            }}>
            {mode === 'in' ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
