'use client';

import { useEffect, useState } from 'react';
import CallRoom from '../../components/CallRoom';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { MAIN_ROOM } from '../../lib/livekit';
import type { CallHistoryRow } from '../../lib/types';

type LiveRoom = { room: string; names: string[] };

export default function CallPage() {
  const { user } = useAuth();
  const [roomInput, setRoomInput] = useState(MAIN_ROOM);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [history, setHistory] = useState<CallHistoryRow[]>([]);
  const [historyNote, setHistoryNote] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('call_history')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) setHistoryNote(`Call history load nahi hui: ${error.message}`);
      else if (data) setHistory(data as CallHistoryRow[]);
    };
    void loadHistory();

    // Live rooms via presence on the same channel CallRoom tracks.
    const ch = supabase.channel('calls-live', { config: { presence: { key: 'lobby' } } });
    const refresh = () => {
      const state = ch.presenceState() as Record<string, { room: string; name: string }[]>;
      const byRoom = new Map<string, string[]>();
      Object.values(state)
        .flat()
        .forEach((p) => {
          if (!p.room) return;
          const names = byRoom.get(p.room) ?? [];
          if (p.name && !names.includes(p.name)) names.push(p.name);
          byRoom.set(p.room, names);
        });
      setLiveRooms(Array.from(byRoom.entries()).map(([room, names]) => ({ room, names })));
    };
    ch.on('presence', { event: 'sync' }, refresh).subscribe();
    const t = window.setInterval(() => void loadHistory(), 15000);
    return () => {
      void supabase.removeChannel(ch);
      window.clearInterval(t);
    };
  }, []);

  if (!user) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="font-display text-4xl text-gold">Video Call 📞</h1>
        <p className="mt-2 text-zinc-300">
          Call karne ke liye pehle login karo — sirf college members hi rooms join kar
          sakte hain.
        </p>
        <a href="/auth" className="btn-gold mt-4 inline-block">
          Login / Sign up
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-gold">Video Call 📞</h1>
        <p className="mt-1 text-zinc-300">
          1:1 aur group video calls — camera, mic, screen share, in-call chat aur call
          history ke saath. LiveKit se chalta hai.
        </p>
      </header>

      {activeRoom ? (
        <CallRoom roomName={activeRoom} onLeave={() => setActiveRoom(null)} />
      ) : (
        <>
          <div className="card p-5">
            <h2 className="font-display text-3xl text-gold">Join a room</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                placeholder="room-name"
                className="input w-64"
              />
              <button onClick={() => roomInput && setActiveRoom(roomInput)} className="btn-gold">
                🎥 Join call
              </button>
              <button onClick={() => setActiveRoom(MAIN_ROOM)} className="btn-ghost">
                Join main room ({MAIN_ROOM})
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Room ka naam doston ko bhejo — wohi naam daal kar woh bhi join kar lenge.
              Room names mein sirf letters, numbers, - aur _ allowed hain.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-3xl text-gold">🔴 Live now</h2>
            {liveRooms.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">
                Abhi koi call live nahi hai — pehli call tum shuru karo!
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {liveRooms.map((r) => (
                  <li key={r.room} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                    <span className="font-semibold text-white">📞 {r.room}</span>
                    <span className="text-sm text-zinc-300">{r.names.join(', ')}</span>
                    <button onClick={() => setActiveRoom(r.room)} className="btn-gold ml-auto px-4 py-1.5 text-sm">
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-display text-3xl text-gold">📋 Call history</h2>
            {historyNote && <p className="mt-2 text-sm text-amber-300">{historyNote}</p>}
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-400">Abhi koi call history nahi hai.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="flex flex-wrap gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm">
                    <span className="font-semibold text-white">{h.room}</span>
                    <span className="text-zinc-300">by {h.caller}</span>
                    <span className="text-zinc-400">
                      {new Date(h.started_at).toLocaleString('en-IN')}
                    </span>
                    {h.duration_seconds != null && (
                      <span className="text-zinc-400">• {Math.floor(h.duration_seconds / 60)}m {h.duration_seconds % 60}s</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
