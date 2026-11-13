'use client';

import { useCallback, useEffect, useState } from 'react';
import { FRIENDS } from '../lib/data';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Connection } from '../lib/types';

// "Who Knows Whom?" — ONLY voluntarily added connections are shown.
// Nothing is inferred from Instagram follows or any other data.
export default function FriendshipMap() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.from('connections').select('*').order('created_at');
    if (data) setConnections(data as Connection[]);
  }, []);

  useEffect(() => {
    void load();
    const supabase = getSupabase();
    if (!supabase) return;
    const ch = supabase
      .channel('connections-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const addConnection = async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setNote('Connection add karne ke liye login karo.');
      return;
    }
    if (selected.length !== 2) {
      setNote('Do doston ko tap karo, phir Add Connection dabao.');
      return;
    }
    const [a, b] = [...selected].sort();
    if (connections.some((c) => c.user_a === a && c.user_b === b)) {
      setNote('Ye connection pehle se hai.');
      return;
    }
    const { error } = await supabase.from('connections').insert({
      user_a: a,
      user_b: b,
      created_by: user.id,
    });
    if (error) setNote(`Save nahi hua: ${error.message}`);
    else {
      setNote('Connection add ho gayi! ❤️');
      setSelected([]);
      void load();
    }
  };

  const removeConnection = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    await supabase.from('connections').delete().eq('id', id);
    void load();
  };

  const nameOf = (id: string) => FRIENDS.find((f) => f.id === id)?.name ?? id;
  const connectedTo = (id: string) =>
    connections
      .filter((c) => c.user_a === id || c.user_b === id)
      .map((c) => (c.user_a === id ? c.user_b : c.user_a));

  return (
    <div className="card p-5">
      <h2 className="font-display text-3xl tracking-wide text-gold">Who Knows Whom? 🗺️</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Paanchon dost ek gang hain — <b className="text-white">The Last Bench Legends</b>.
        Connection sirf wahi dikhta hai jo tum khud add karo. Koi auto-connection nahi banta.
      </p>
      {!isSupabaseConfigured && (
        <p className="mt-2 text-xs text-amber-300">
          Connections save karne ke liye Supabase chahiye (env vars set karo).
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {FRIENDS.map((f) => {
          const isSel = selected.includes(f.id);
          const links = connectedTo(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggleSelect(f.id)}
              className={`w-28 rounded-2xl border p-3 text-center transition ${
                isSel ? 'border-gold bg-gold/15 shadow-gold' : 'border-white/15 bg-white/5 hover:border-white/40'
              }`}
            >
              <span className="text-3xl">🧑</span>
              <span className="mt-1 block font-semibold text-white">{f.name}</span>
              <span className="block text-xs text-zinc-400">{f.nickname}</span>
              <span className="mt-1 block text-[11px] text-gold-light">
                {links.length > 0 ? `↔ ${links.map(nameOf).join(', ')}` : '—'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => void addConnection()} className="btn-gold" disabled={!isSupabaseConfigured}>
          + Add Connection (2 dost chuno)
        </button>
        <button
          onClick={() => setSelected([])}
          className="btn-ghost"
        >
          Clear selection
        </button>
        {note && <span className="text-sm text-zinc-300">{note}</span>}
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {connections.length === 0 && (
          <li className="text-zinc-400">Abhi koi connection add nahi hua — do doston ko tap karke pehla connection banao.</li>
        )}
        {connections.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-zinc-200">
            <span>
              ❤️ {nameOf(c.user_a)} ↔ {nameOf(c.user_b)}
            </span>
            {user && (
              <button
                onClick={() => void removeConnection(c.id)}
                className="text-xs text-red-300 hover:text-red-200"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
