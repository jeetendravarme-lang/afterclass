import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

// POST /api/livekit-token  { room, identity, name }
// Mints a short-lived LiveKit access token SERVER-SIDE ONLY.
// The API key/secret never leave the server and never appear in frontend code.
// If LiveKit is not configured, returns { configured: false } and the UI
// shows a clean "setup needed" state instead of breaking.

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { room?: string; identity?: string; name?: string };
    const room = (body.room ?? '').trim().slice(0, 64);
    const identity = (body.identity ?? '').trim().slice(0, 64);
    const name = (body.name ?? identity).trim().slice(0, 64);

    if (!room || !identity) {
      return NextResponse.json({ error: 'room and identity are required' }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(room) || !/^[a-zA-Z0-9-_]+$/.test(identity)) {
      return NextResponse.json(
        { error: 'room and identity may only contain letters, numbers, - and _' },
        { status: 400 },
      );
    }

    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!url || !apiKey || !apiSecret) {
      return NextResponse.json({ configured: false });
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: '2h',
    });
    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const jwt = await token.toJwt();

    return NextResponse.json({ configured: true, token: jwt, url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Token generation failed' },
      { status: 500 },
    );
  }
}
