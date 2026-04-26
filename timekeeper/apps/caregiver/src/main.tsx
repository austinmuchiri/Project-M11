import React from 'react';
import ReactDOM from 'react-dom/client';
import { setBrowserEnv } from '@timekeeper/supabase-client';
import { App } from './App.js';

// Stash Vite-injected env vars in a global shim so the supabase-client
// can read them without referencing `import.meta` directly (the package
// is also consumed by the laptop-monitor's CommonJS build).
setBrowserEnv(import.meta.env as unknown as Record<string, string | undefined>);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
);
