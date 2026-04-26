import { app } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MOCK_KID_ID } from '@timekeeper/supabase-client';

export interface Pairing {
  kidId: string;
  kidName: string;
  deviceId: string;
  pairedAt: number;
  // Real Supabase: token issued by the caregiver app at pair time.
  token?: string;
}

const FILE = (() => {
  const dir = app.getPath('userData');
  return path.join(dir, 'pairing.json');
})();

export function loadPairing(): Pairing | null {
  try {
    if (!fs.existsSync(FILE)) {
      // For demo: auto-pair to mock kid so the watcher actually pushes.
      if (process.env.TIMEKEEPER_DEMO !== 'false') {
        const auto: Pairing = {
          kidId: MOCK_KID_ID, kidName: 'Munene',
          deviceId: 'dev_laptop_munene', pairedAt: Date.now(),
        };
        fs.writeFileSync(FILE, JSON.stringify(auto, null, 2));
        return auto;
      }
      return null;
    }
    return JSON.parse(fs.readFileSync(FILE, 'utf8')) as Pairing;
  } catch {
    return null;
  }
}

export function savePairing(p: Pairing) {
  fs.writeFileSync(FILE, JSON.stringify(p, null, 2));
}

export function clearPairing() {
  if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
}
