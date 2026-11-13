import { NextResponse } from 'next/server';
import { getAuthedUser, getSupabaseAdmin } from '../../../../lib/supabase-server';

// POST /api/admin/remove-user  { userId }  (Authorization: Bearer <token>)
// Admin-only: permanently deletes a user account. Deleting the auth user
// also deletes their profile row (FK on delete cascade) and revokes their
// session. The admin cannot remove themselves.

export async function POST(req: Request) {
  try {
    const caller = await getAuthedUser(req);
    if (!caller) {
      return NextResponse.json({ error: 'Login required.' }, { status: 401 });
    }
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Server keys not configured.' },
        { status: 503 },
      );
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', caller.id)
      .maybeSingle();
    const isAdmin =
      (profile as { is_admin?: boolean } | null)?.is_admin === true;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Sirf admin users remove kar sakta hai.' },
        { status: 403 },
      );
    }

    const body = (await req.json()) as { userId?: string };
    const targetId = (body.userId ?? '').trim();
    if (!targetId) {
      return NextResponse.json({ error: 'userId required.' }, { status: 400 });
    }
    if (targetId === caller.id) {
      return NextResponse.json(
        { error: 'Khud ko remove nahi kar sakte.' },
        { status: 400 },
      );
    }

    const { error } = await admin.auth.admin.deleteUser(targetId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Remove failed' },
      { status: 500 },
    );
  }
}
