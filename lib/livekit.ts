// LiveKit configuration — server-side only.
// The API key/secret NEVER leave the server: tokens are minted in
// app/api/livekit-token/route.ts. The browser only ever sees the short-lived
// JWT for the room it is joining.

export const isLiveKitConfigured = Boolean(
  process.env.LIVEKIT_URL &&
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET,
);

export const MAIN_ROOM = 'last-bench-legends';

export function roomNameForGroup(groupId: string): string {
  return `group-${groupId}`.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 64);
}

export function roomNameForDm(userA: string, userB: string): string {
  const pair = [userA, userB].sort().join('-');
  return `dm-${pair}`.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 64);
}
