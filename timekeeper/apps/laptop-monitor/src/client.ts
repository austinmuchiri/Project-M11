import { createTimekeeperClient, type TimekeeperClient } from '@timekeeper/supabase-client';
import type { LaptopHeartbeat, Nudge, BlockCommand } from '@timekeeper/schema';

let client: TimekeeperClient | null = null;

// Heartbeats buffered while the device is offline. On the next successful
// push the queue is drained oldest-first so the caregiver's timeline has no
// permanent gaps — just a delayed flush rather than lost data.
const offlineQueue: LaptopHeartbeat[] = [];
const MAX_QUEUE = 50;

// ─── connection state ────────────────────────────────────────────────────────
// Optimistic: assume connected until the first heartbeat failure.
let connected = true;
export function isConnected(): boolean { return connected; }
export function getQueueDepth(): number { return offlineQueue.length; }

export function initClient() {
  client = createTimekeeperClient();
  console.log(`[client] mode: ${client.isMock ? 'MOCK' : 'SUPABASE'}`);
}

async function flushQueue(): Promise<void> {
  if (!client || offlineQueue.length === 0) return;
  const batch = offlineQueue.splice(0);
  for (const h of batch) {
    try {
      await client.pushHeartbeat(h);
      connected = true;
    } catch {
      offlineQueue.unshift(h);
      break;
    }
  }
  if (offlineQueue.length === 0) {
    console.log('[client] offline queue flushed');
  }
}

export async function pushHeartbeat(h: LaptopHeartbeat): Promise<void> {
  if (!client) return;
  if (offlineQueue.length > 0) {
    await flushQueue();
  }
  try {
    await client.pushHeartbeat(h);
    connected = true;
  } catch (err) {
    connected = false;
    offlineQueue.push(h);
    if (offlineQueue.length > MAX_QUEUE) offlineQueue.shift();
    console.warn(`[client] offline – heartbeat queued (${offlineQueue.length} pending)`);
  }
}

export async function registerDevice(deviceId: string, hardwareId: string): Promise<void> {
  if (!client) return;
  try {
    await client.registerDevice(deviceId, hardwareId);
    console.log('[client] device registered:', deviceId, 'hw:', hardwareId);
  } catch (err) {
    console.warn('[client] device registration failed:', err);
  }
}

export function subscribeNudges(kidId: string, cb: (n: Nudge) => void): () => void {
  if (!client) return () => {};
  return client.subscribeNudges(kidId, cb);
}

export function subscribeBlockCommands(kidId: string, cb: (cmd: BlockCommand) => void): () => void {
  if (!client) return () => {};
  return client.subscribeBlockCommands(kidId, cb);
}

export async function sendBlockCommand(cmd: BlockCommand): Promise<void> {
  if (!client) return;
  await client.sendBlockCommand(cmd);
}
