import { app } from 'electron';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MOCK_KID_ID } from '@timekeeper/supabase-client';

export interface DeviceIdentity {
  deviceId: string;
  hardwareId: string; // first non-loopback MAC address (no colons, lowercase)
}

export interface Pairing {
  kidId: string;
  kidName: string;
  deviceId: string;
  pairedAt: number;
  token?: string;
  hardwareId?: string; // merged from device.json at runtime, not stored here
}

const DATA_DIR = app.getPath('userData');
const FILE        = path.join(DATA_DIR, 'pairing.json');
const DEVICE_FILE = path.join(DATA_DIR, 'device.json');

function readHardwareMac(): string {
  const ifaces = os.networkInterfaces();
  for (const addrs of Object.values(ifaces)) {
    for (const addr of addrs ?? []) {
      if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
        return addr.mac.replace(/:/g, '').toLowerCase();
      }
    }
  }
  return randomUUID().replace(/-/g, '').slice(0, 12); // last-resort fallback
}

export function getOrCreateDeviceIdentity(): DeviceIdentity {
  try {
    if (fs.existsSync(DEVICE_FILE)) {
      const data = JSON.parse(fs.readFileSync(DEVICE_FILE, 'utf8')) as Partial<DeviceIdentity>;
      if (data.deviceId && data.hardwareId) return data as DeviceIdentity;
    }
    const identity: DeviceIdentity = {
      deviceId: `dev_laptop_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      hardwareId: readHardwareMac(),
    };
    fs.writeFileSync(DEVICE_FILE, JSON.stringify(identity, null, 2));
    return identity;
  } catch {
    return { deviceId: `dev_laptop_${Date.now()}`, hardwareId: 'unknown' };
  }
}

export function loadPairing(): Pairing | null {
  try {
    if (!fs.existsSync(FILE)) {
      // CHANGE: Use strict equality for 'true'
      if (process.env.TIMEKEEPER_DEMO === 'true') { 
        const identity = getOrCreateDeviceIdentity();
        const auto: Pairing = {
          kidId: MOCK_KID_ID, 
          kidName: 'Munene',
          deviceId: identity.deviceId, 
          hardwareId: identity.hardwareId,
          pairedAt: Date.now(),
        };
        fs.writeFileSync(FILE, JSON.stringify(auto, null, 2));
        return auto;
      }
      return null; // Return null so pollForPairing can actually start
    }
    
    const pairing = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Pairing;
    const identity = getOrCreateDeviceIdentity();
    return { ...pairing, deviceId: identity.deviceId, hardwareId: identity.hardwareId };
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
