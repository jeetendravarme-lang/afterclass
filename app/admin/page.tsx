'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import RequireAuth from '../../components/RequireAuth';

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string;
  nickname: string | null;
  instagram: string | null;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
};

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, nickname, instagram, is_admin, is_blocked, created_at')
      .order('created_at', { ascending: true });
    if (error) setNote(`Load nahi hua: ${error.message}`);
    else if (data) setUsers(data as ProfileRow[]);
  }, []);

  useEffect(() => {
    if (profile?.is_admin) void load();
  }, [profile?.is_admin, load]);

  const setBlocked = async (u: ProfileRow, blocked: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(u.id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: blocked })
      .eq('id', u.id);
    setBusy(null);
    if (error) setNote(`Block update nahi hua: ${error.message}`);
    else {
      setNote(
        blocked
          ? `${u.display_name} block ho gaya — woh ab login nahi kar payega.`
          : `${u.display_name} unblock ho gaya.`,
      );
      void load();
    }
  };

  const removeUser = async (u: ProfileRow) => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (
      !window.confirm(
        `${u.display_name} (${u.email ?? 'no email'}) ko PERMANENTLY remove karna hai? Unka account, messages ka sender record aur session sab delete ho jayega.`,
      )
    ) {
      return;
    }
    setBusy(u.id);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token ?? '';
    const res = await fetch('/api/admin/remove-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ userId: u.id }),
    });
    const out = (await res.json()) as { ok?: boolean; error?: string };
    setBusy(null);
    if (!out.ok) setNote(`Remove nahi hua: ${out.error ?? 'unknown error'}`);
    else {
      setNote(`${u.display_name} remove ho gaya.`);
      void load();
    }
  };

  return (
    <RequireAuth title="Admin Panel 👑">
      {!profile?.is_admin ? (
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="font-display text-4xl text-gold">Admin Panel 👑</h1>
          <p className="mt-2 text-zinc-300">
            Ye page sirf Admin ke liye hai. Pehla account Admin banta hai.
          </p>
          <a href="/chat" className="btn-gold mt-4 inline-block">
            Group Chat →
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <header>
            <h1 className="font-display text-5xl tracking-wide text-gold">Admin Panel 👑</h1>
            <p className="mt-1 text-zinc-300">
              Members ko block/unblock ya remove karo. Kisi bhi message ko delete
              karne ke liye Group Chat mein us message par Delete dabao (Admin kisi
              ka bhi message delete kar sakta hai).
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Naye doston ko invite code Jeetendra se lena hoga — code sirf env var
              mein hai, yahan nahi dikhaya jata.
            </p>
            {note && <p className="mt-2 text-sm text-amber-300">{note}</p>}
          </header>

          <div className="card p-5">
            <h2 className="font-display text-3xl text-gold">
              Members ({users.length})
            </h2>
            {users.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">Abhi koi member nahi hai.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {users.map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <li
                      key={u.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-4 py-3"
                    >
                      <span>
                        <b className="text-white">{u.display_name}</b>
                        {u.nickname ? (
                          <span className="text-zinc-400"> ({u.nickname})</span>
                        ) : null}
                        <span className="block text-xs text-zinc-400">{u.email ?? ''}</span>
                      </span>
                      <span className="flex flex-wrap gap-1 text-xs">
                        {u.is_admin && (
                          <span className="rounded-full bg-gold px-2 py-0.5 font-bold text-black">
                            ADMIN
                          </span>
                        )}
                        {u.is_blocked && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 font-bold text-white">
                            BLOCKED
                          </span>
                        )}
                      </span>
                      <span className="ml-auto flex gap-2">
                        {!isSelf && (
                          <>
                            <button
                              onClick={() => void setBlocked(u, !u.is_blocked)}
                              disabled={busy === u.id}
                              className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-50"
                            >
                              {u.is_blocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => void removeUser(u)}
                              disabled={busy === u.id}
                              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </>
                        )}
                        {isSelf && <span className="text-xs text-zinc-400">tum (admin)</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
