'use client';

import { useCallback, useEffect, useState } from 'react';
import ChatBox from '../../components/ChatBox';
import RequireAuth from '../../components/RequireAuth';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { MAIN_ROOM } from '../../lib/livekit';

type RoomRow = { id: string; name: string; type: string; members: string[] };

export default function ChatPage() {
  const { user, profile } = useAuth();
  const [roomId, setRoomId] = useState('main');
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([]);
  const [newRoom, setNewRoom] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    const { data } = await supabase.from('rooms').select('*').order('created_at');
    if (data) setRooms(data as RoomRow[]);
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, display_name')
      .neq('id', user.id);
    if (profs) setProfiles(profs as { id: string; display_name: string }[]);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const createGroup = async () => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    const name = newRoom.trim();
    if (!name) return;
    const { error } = await supabase.from('rooms').insert({
      name,
      type: 'group',
      members: [user.id],
      created_by: user.id,
    });
    if (error) setNote(`Room nahi bana: ${error.message}`);
    else {
      setNewRoom('');
      setNote(`"${name}" group ban gaya!`);
      void load();
    }
  };

  const openDm = async (otherId: string, otherName: string) => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    const members = [user.id, otherId].sort();
    const { data: existing } = await supabase
      .from('rooms')
      .select('*')
      .eq('type', 'dm')
      .contains('members', members)
      .maybeSingle();
    if (existing) {
      setRoomId((existing as RoomRow).id);
      return;
    }
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: `DM: ${otherName}`, type: 'dm', members, created_by: user.id })
      .select('*')
      .single();
    if (error) setNote(`DM nahi khula: ${error.message}`);
    else {
      setRoomId((data as RoomRow).id);
      void load();
    }
  };

  const roomTitle =
    roomId === 'main'
      ? 'Our Group Chat — Last Bench Legends'
      : rooms.find((r) => r.id === roomId)?.name ?? 'Chat';

  return (
    <RequireAuth>
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-gold">Group Chat 💬</h1>
        <p className="mt-1 text-zinc-300">
          Real-time messaging — refresh kiye bina messages aate hain. Sirf logged-in
          college members baat kar sakte hain.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setRoomId('main')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            roomId === 'main' ? 'bg-gold text-black' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          🏫 {MAIN_ROOM} (main group)
        </button>
        {rooms.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoomId(r.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              roomId === r.id ? 'bg-gold font-semibold text-black' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {r.type === 'dm' ? '👤' : '👥'} {r.name}
          </button>
        ))}
      </div>

      {user && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="Naya group ka naam…"
            className="input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void createGroup();
            }}
          />
          <button onClick={() => void createGroup()} className="btn-gold">
            + Create group
          </button>
          {profiles.length > 0 && (
            <span className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              1:1 DM:
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => void openDm(p.id, p.display_name)}
                  className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20"
                >
                  {p.display_name}
                </button>
              ))}
            </span>
          )}
          {note && <span className="w-full text-sm text-zinc-300">{note}</span>}
        </div>
      )}

      <ChatBox key={roomId} room={roomId} title={roomTitle} />
      <p className="text-xs text-zinc-500">
        Messages Supabase mein save hote hain (history kabhi delete nahi hoti, sirf
        sender ya Admin delete kar sakta hai). Typing indicator, read receipts,
        reactions, reply, edit, pin aur photo sharing — sab live hain.
      </p>
    </div>
    </RequireAuth>
  );
}
