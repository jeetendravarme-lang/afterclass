'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, TABLES } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { ChatMessage, Reaction } from '../lib/types';

const EMOJIS = ['❤️', '😂', '🔥', '👍', '🎉', '😮'];

type PresenceUser = { user_id: string; name: string; online_at: string };

export default function ChatBox({ room = 'main', title = 'Our Group Chat' }: { room?: string; title?: string }) {
  const { user, profile, configured } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [notice, setNotice] = useState('');
  const [unread, setUnread] = useState(0);
  const [readBy, setReadBy] = useState<Record<string, number>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'Guest';

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from(TABLES.messages)
      .select('*')
      .eq('room', room)
      .eq('deleted', false)
      .order('created_at', { ascending: true })
      .limit(200);
    if (data) setMessages(data as ChatMessage[]);
    const { data: reacts } = await supabase
      .from(TABLES.reactions)
      .select('*')
      .order('created_at', { ascending: true });
    if (reacts) setReactions(reacts as Reaction[]);
  }, [room]);

  // Mark this room as read (drives read receipts) and reset the unread badge.
  const markRead = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    await supabase.from('read_state').upsert(
      { room, user_id: user.id, read_at: new Date().toISOString() },
      { onConflict: 'room,user_id' },
    );
    setUnread(0);
  }, [room, user]);

  useEffect(() => {
    if (!configured || !user) return;
    void load();
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel(`chat-${room}`, {
      config: { presence: { key: user.id }, broadcast: { self: true } },
    });
    channelRef.current = channel;

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.room !== room) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_id !== user.id) {
          setUnread((u) => u + 1);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' }, (payload) => {
        const r = payload.new as Reaction;
        setReactions((prev) => (prev.some((x) => x.id === r.id) ? prev : [...prev, r]));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reactions' }, (payload) => {
        const r = payload.old as Reaction;
        setReactions((prev) => prev.filter((x) => x.id !== r.id));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, PresenceUser[]>;
        const users = Object.values(state).flat();
        setOnline(users);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const name = (payload as { name?: string }).name;
        if (!name || name === myName) return;
        setTyping((prev) => (prev.includes(name) ? prev : [...prev, name]));
        window.setTimeout(() => {
          setTyping((prev) => prev.filter((n) => n !== name));
        }, 3000);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({ user_id: user.id, name: myName, online_at: new Date().toISOString() });
        }
      });

    // Read receipts: who has read each message (approximated by read_at time).
    const readChannel = supabase
      .channel(`read-${room}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'read_state' }, () => {
        void refreshReadCounts();
      })
      .subscribe();

    const refreshReadCounts = async () => {
      const { data } = await supabase.from('read_state').select('user_id, read_at').eq('room', room);
      if (!data) return;
      const counts: Record<string, number> = {};
      for (const m of messages) {
        counts[m.id] = data.filter((r: { user_id: string; read_at: string }) => r.user_id !== m.sender_id && new Date(r.read_at) >= new Date(m.created_at)).length;
      }
      setReadBy(counts);
    };
    void refreshReadCounts();
    void markRead();

    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(readChannel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, user, room, load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const broadcastTyping = () => {
    const channel = channelRef.current;
    if (!channel) return;
    void channel.send({ type: 'broadcast', event: 'typing', payload: { name: myName } });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const send = async () => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    const body = input.trim();
    if (!body) return;
    setInput('');
    setReplyTo(null);
    const { error } = await supabase.from(TABLES.messages).insert({
      room,
      sender_id: user.id,
      sender_name: myName,
      body,
      reply_to: replyTo?.id ?? null,
    });
    if (error) setNotice(`Send failed: ${error.message}`);
    else void markRead();
  };

  const sendPhoto = async (file: File) => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    setNotice('Uploading photo…');
    const path = `chat/${room}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file, { upsert: false });
    if (error) {
      setNotice(`Upload failed: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
    const { error: insertError } = await supabase.from(TABLES.messages).insert({
      room,
      sender_id: user.id,
      sender_name: myName,
      body: '📷 Photo',
      media_url: data.publicUrl,
      media_type: file.type.startsWith('video') ? 'video' : 'image',
    });
    setNotice(insertError ? `Send failed: ${insertError.message}` : '');
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    const existing = reactions.find(
      (r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji,
    );
    if (existing) {
      await supabase.from(TABLES.reactions).delete().eq('id', existing.id);
    } else {
      await supabase.from(TABLES.reactions).insert({ message_id: messageId, user_id: user.id, emoji });
    }
  };

  const saveEdit = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase
      .from(TABLES.messages)
      .update({ body: editText.trim(), edited_at: new Date().toISOString() })
      .eq('id', id);
    setEditingId(null);
  };

  const deleteMessage = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from(TABLES.messages).update({ deleted: true }).eq('id', id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const togglePin = async (m: ChatMessage & { pinned?: boolean }) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from(TABLES.messages).update({ pinned: !m.pinned }).eq('id', m.id);
    void load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = messages;
    if (q) list = list.filter((m) => m.body.toLowerCase().includes(q) || m.sender_name.toLowerCase().includes(q));
    if (showPinned) list = list.filter((m) => (m as ChatMessage & { pinned?: boolean }).pinned);
    return list;
  }, [messages, search, showPinned]);

  const mediaMessages = useMemo(() => messages.filter((m) => m.media_url), [messages]);
  const pinnedCount = useMemo(
    () => messages.filter((m) => (m as ChatMessage & { pinned?: boolean }).pinned).length,
    [messages],
  );

  if (!isSupabaseConfigured) {
    return (
      <div className="card p-6 text-center">
        <h2 className="font-display text-3xl text-gold">{title}</h2>
        <p className="mt-2 text-zinc-300">
          Group chat needs Supabase. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and run the SQL in{' '}
          <code>supabase/schema.sql</code> — see README.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card p-6 text-center">
        <h2 className="font-display text-3xl text-gold">{title}</h2>
        <p className="mt-2 text-zinc-300">
          Chat karne ke liye pehle login karo — sirf college friends (signed-in members)
          hi group mein baat kar sakte hain.
        </p>
        <a href="/auth" className="btn-gold mt-4 inline-block">
          Login / Sign up
        </a>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-2xl tracking-wide text-gold">{title}</h2>
        {unread > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            {unread} new
          </span>
        )}
        <span className="text-xs text-zinc-400">
          🟢 {online.length} online: {online.map((o) => o.name).join(', ') || '—'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="input w-40"
          />
          <button onClick={() => setShowPinned((v) => !v)} className="btn-ghost">
            📌 Pinned ({pinnedCount})
          </button>
          <button onClick={() => setShowMedia((v) => !v)} className="btn-ghost">
            🖼 Media ({mediaMessages.length})
          </button>
        </div>
      </div>

      {showMedia && (
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 p-3">
          {mediaMessages.length === 0 && <p className="text-sm text-zinc-400">No media shared yet.</p>}
          {mediaMessages.map((m) => (
            <a key={m.id} href={m.media_url ?? ''} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.media_url ?? ''} alt={m.body} className="h-20 w-20 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}

      <div ref={listRef} className="h-[52vh] space-y-3 overflow-y-auto p-4" onClick={() => void markRead()}>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-zinc-400">
            {search ? 'No messages match your search.' : 'No messages yet — say hi! 👋'}
          </p>
        )}
        {filtered.map((m) => {
          const mine = m.sender_id === user.id;
          const canModerate = mine || profile?.is_admin;
          const msgReactions = reactions.filter((r) => r.message_id === m.id);
          const grouped = EMOJIS.map((e) => ({
            emoji: e,
            count: msgReactions.filter((r) => r.emoji === e).length,
            mine: msgReactions.some((r) => r.emoji === e && r.user_id === user.id),
          })).filter((g) => g.count > 0);
          const replied = m.reply_to ? messages.find((x) => x.id === m.reply_to) : null;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'bg-violet-glow/80 text-white' : 'bg-white/10 text-zinc-100'}`}>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-gold-light">{m.sender_name}</span>
                  <span className="text-[10px] text-zinc-300/70">
                    {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {(m as ChatMessage & { pinned?: boolean }).pinned && <span title="Pinned">📌</span>}
                </div>
                {replied && (
                  <div className="mt-1 rounded-lg bg-black/30 px-2 py-1 text-xs text-zinc-300">
                    ↩ {replied.sender_name}: {replied.body.slice(0, 80)}
                  </div>
                )}
                {m.media_url &&
                  (m.media_type === 'video' ? (
                    <video src={m.media_url} controls className="mt-2 max-h-64 rounded-lg" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.media_url} alt={m.body} className="mt-2 max-h-64 rounded-lg" />
                  ))}
                {editingId === m.id ? (
                  <div className="mt-1 flex gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="input flex-1"
                      autoFocus
                    />
                    <button onClick={() => void saveEdit(m.id)} className="btn-gold px-3 py-1 text-sm">
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="mt-0.5 whitespace-pre-wrap break-words">{m.body}</p>
                )}
                {grouped.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {grouped.map((g) => (
                      <button
                        key={g.emoji}
                        onClick={() => void toggleReaction(m.id, g.emoji)}
                        className={`rounded-full px-2 py-0.5 text-xs ${g.mine ? 'bg-gold text-black' : 'bg-black/30'}`}
                      >
                        {g.emoji} {g.count}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300/80">
                  <button onClick={() => setReplyTo(m)} className="hover:text-white">Reply</button>
                  <span className="relative">
                    <button
                      onClick={() => {
                        const menu = document.getElementById(`react-${m.id}`);
                        menu?.classList.toggle('hidden');
                      }}
                      className="hover:text-white"
                    >
                      React 😀
                    </button>
                    <span id={`react-${m.id}`} className="absolute bottom-5 left-0 hidden rounded-full bg-panel2 p-1 shadow-lg">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            void toggleReaction(m.id, e);
                            document.getElementById(`react-${m.id}`)?.classList.add('hidden');
                          }}
                          className="px-1 text-base hover:scale-125"
                        >
                          {e}
                        </button>
                      ))}
                    </span>
                  </span>
                  {mine && (
                    <button
                      onClick={() => {
                        setEditingId(m.id);
                        setEditText(m.body);
                      }}
                      className="hover:text-white"
                    >
                      Edit
                    </button>
                  )}
                  {canModerate && (
                    <button onClick={() => void deleteMessage(m.id)} className="hover:text-red-300">
                      Delete
                    </button>
                  )}
                  <button onClick={() => void togglePin(m)} className="hover:text-white">
                    {(m as ChatMessage & { pinned?: boolean }).pinned ? 'Unpin' : 'Pin'}
                  </button>
                  {mine && (readBy[m.id] ?? 0) > 0 && (
                    <span title="Read receipts" className="text-sky-300">
                      ✓✓ seen by {readBy[m.id]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {typing.length > 0 && (
          <p className="text-xs italic text-zinc-400">{typing.join(', ')} typing…</p>
        )}
      </div>

      {replyTo && (
        <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-4 py-2 text-sm">
          <span className="text-zinc-300">
            Replying to <b>{replyTo.sender_name}</b>: {replyTo.body.slice(0, 60)}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-white/10 p-3">
        <label className="cursor-pointer rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20" title="Share a photo">
          📷
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void sendPhoto(f);
              e.target.value = '';
            }}
          />
        </label>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            broadcastTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          placeholder="Type a message…"
          className="input flex-1"
        />
        <button onClick={() => void send()} className="btn-gold">
          Send
        </button>
      </div>
      {notice && <p className="border-t border-white/10 px-4 py-2 text-xs text-zinc-400">{notice}</p>}
    </div>
  );
}
