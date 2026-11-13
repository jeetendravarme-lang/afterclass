import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '../../../lib/supabase-server';

// POST /api/signup  { email, password, displayName, inviteCode }
// The ONLY way to create an account: the invite code is checked here,
// server-side, against the INVITE_CODE env var. It never appears in
// frontend code. The user is created with the service-role key, so open
// signup can (and should) stay OFF in the Supabase dashboard.

function codesMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      inviteCode?: string;
    };
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    const displayName =
      (body.displayName ?? '').trim().slice(0, 64) || email.split('@')[0];
    const inviteCode = (body.inviteCode ?? '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email aur password chahiye.' },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password kam se kam 6 characters ka ho.' },
        { status: 400 },
      );
    }

    const expected = process.env.INVITE_CODE;
    if (!expected) {
      return NextResponse.json(
        {
          error:
            'Invite signup abhi setup nahi hua hai — admin se INVITE_CODE set karne ko kaho.',
        },
        { status: 503 },
      );
    }
    if (!inviteCode || !codesMatch(inviteCode, expected)) {
      return NextResponse.json(
        { error: 'Galat invite code. Sahi code ke liye admin se poochho.' },
        { status: 403 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase server keys setup nahi hain.' },
        { status: 503 },
      );
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, userId: data.user?.id ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Signup failed' },
      { status: 500 },
    );
  }
}
