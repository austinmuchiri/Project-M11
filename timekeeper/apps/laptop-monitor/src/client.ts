import { createTimekeeperClient, type TimekeeperClient } from '@timekeeper/supabase-client';
import type { LaptopHeartbeat, Nudge } from '@timekeeper/schema';

let client: TimekeeperClient | null = null;

export function initClient() {
  client = createTimekeeperClient();
  console.log(`[client] mode: ${client.isMock ? 'MOCK' : 'SUPABASE'}`);
}

export async function pushHeartbeat(h: LaptopHeartbeat): Promise<void> {
  if (!client) return;
  await client.pushHeartbeat(h);
}

export function subscribeNudges(kidId: string, cb: (n: Nudge) => void): () => void {
  if (!client) return () => {};
  return client.subscribeNudges(kidId, cb);
}
