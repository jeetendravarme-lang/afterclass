'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type LocalTrack,
  type RemoteTrack,
} from 'livekit-client';
import { getSupabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type TrackItem = {
  id: string;
  participantIdentity: string;
  participantName: string;
  isLocal: boolean;
  kind: 'video' | 'audio';
  source: Track.Source;
  track: LocalTrack | RemoteTrack;
};

type ChatLine = { sender: string; text: string; at: number };

function VideoTile({
  track,
  label,
  muted,
}: {
  track: LocalTrack | RemoteTrack | undefined;
  label: string;
  muted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !track) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  if (!track) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-panel text-5xl">
        👤
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {label} (camera off)
        </span>
      </div>
    );
  }
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-gold/40 bg-black shadow-gold">
      <video ref={ref} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {label}
      </span>
    </div>
  );
}

function AudioSink({ track }: { track: LocalTrack | RemoteTrack }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  return <audio ref={ref} autoPlay playsInline />;
}

function fmtTime(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function CallRoom({
  roomName,
  onLeave,
}: {
  roomName: string;
  onLeave: () => void;
}) {
  const { user, profile } = useAuth();
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'Guest';
  const identity = user?.id ?? `guest-${Math.random().toString(36).slice(2, 8)}`;

  const [status, setStatus] = useState<'idle' | 'joining' | 'connected' | 'error'>('idle');
  const [error, setError] = useState('');
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [participantNames, setParticipantNames] = useState<string[]>([displayName]);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [chatInput, setChatInput] = useState('');

  const roomRef = useRef<Room | null>(null);
  const historyIdRef = useRef<string | null>(null);
  const joinedAtRef = useRef<number>(0);
  const presenceChannelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabase>>['channel']> | null>(null);

  const syncTracks = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const items: TrackItem[] = [];
    const names = new Set<string>([displayName]);
    const pushPub = (
      participantIdentity: string,
      participantName: string,
      isLocal: boolean,
      pub: { track?: LocalTrack | RemoteTrack; source: Track.Source; kind: Track.Kind; trackSid: string },
    ) => {
      if (!pub.track) return;
      items.push({
        id: pub.trackSid,
        participantIdentity,
        participantName,
        isLocal,
        kind: pub.kind === Track.Kind.Video ? 'video' : 'audio',
        source: pub.source,
        track: pub.track,
      });
    };
    room.localParticipant.trackPublications.forEach((pub) => {
      pushPub(room.localParticipant.identity, displayName, true, {
        track: pub.track,
        source: pub.source,
        kind: pub.kind,
        trackSid: pub.trackSid,
      });
    });
    room.remoteParticipants.forEach((p) => {
      names.add(p.name || p.identity);
      p.trackPublications.forEach((pub) => {
        pushPub(p.identity, p.name || p.identity, false, {
          track: pub.track,
          source: pub.source,
          kind: pub.kind,
          trackSid: pub.trackSid,
        });
      });
    });
    setTracks(items);
    setParticipantNames(Array.from(names));
  }, [displayName]);

  const leave = useCallback(async () => {
    const room = roomRef.current;
    const supabase = getSupabase();
    if (supabase && historyIdRef.current) {
      const duration = Math.floor((Date.now() - joinedAtRef.current) / 1000);
      await supabase
        .from('call_history')
        .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
        .eq('id', historyIdRef.current);
    }
    if (presenceChannelRef.current && supabase) {
      await supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    if (room) {
      room.disconnect();
      roomRef.current = null;
    }
    setTracks([]);
    setStatus('idle');
    onLeave();
  }, [onLeave]);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== 'connected') return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [status]);

  const join = async (withMedia = true) => {
    setStatus('joining');
    setError('');
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setStatus('error');
        setError('Supabase is not configured.');
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token ?? '';
      const res = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ room: roomName, identity, name: displayName }),
      });
      const data: { configured?: boolean; token?: string; url?: string; error?: string } =
        await res.json();
      if (!data.configured || !data.token || !data.url) {
        setSetupNeeded(true);
        setStatus('idle');
        return;
      }

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room
        .on(RoomEvent.ParticipantConnected, () => syncTracks())
        .on(RoomEvent.ParticipantDisconnected, () => syncTracks())
        .on(RoomEvent.TrackSubscribed, () => syncTracks())
        .on(RoomEvent.TrackUnsubscribed, () => syncTracks())
        .on(RoomEvent.LocalTrackPublished, () => syncTracks())
        .on(RoomEvent.LocalTrackUnpublished, () => syncTracks())
        .on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const line = JSON.parse(new TextDecoder().decode(payload)) as ChatLine;
            if (line && typeof line.text === 'string') setChatLines((prev) => [...prev, line]);
          } catch {
            // Ignore malformed in-call chat data.
          }
        })
        .on(RoomEvent.ConnectionStateChanged, (state) => {
          if (state === 'disconnected') {
            setStatus('idle');
            setTracks([]);
          }
        });

      await room.connect(data.url, data.token);
      joinedAtRef.current = Date.now();

      if (withMedia) {
        try {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch (e) {
          // Camera/mic permission denied — stay in the call without media.
          setCameraOn(false);
          setMicOn(false);
          setError(
            'Camera/mic permission nahi mili — tum call mein bina camera ke jud gaye ho. ' +
              'Browser ke address bar se camera/mic permission allow karke dobara join karo. ' +
              (e instanceof Error ? `(${e.message})` : ''),
          );
        }
      } else {
        setCameraOn(false);
        setMicOn(false);
      }
      syncTracks();
      setStatus('connected');

      // Announce the call in the group chat + presence, so friends see it.
      if (supabase) {
        await supabase.from('messages').insert({
          room: 'main',
          sender_id: user?.id ?? null,
          sender_name: displayName,
          body: `📞 ${displayName} started a video call — join from the Video Call page (room: ${roomName})`,
        });
        const { data: row } = await supabase
          .from('call_history')
          .insert({
            room: roomName,
            caller: displayName,
            participants: [displayName],
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (row) historyIdRef.current = (row as { id: string }).id;
        const ch = supabase.channel('calls-live', { config: { presence: { key: identity } } });
        presenceChannelRef.current = ch;
        ch.subscribe((st) => {
          if (st === 'SUBSCRIBED') {
            void ch.track({ room: roomName, user: identity, name: displayName });
          }
        });
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Could not join the call.');
    }
  };

  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !cameraOn;
    try {
      await room.localParticipant.setCameraEnabled(next);
      setCameraOn(next);
      syncTracks();
    } catch {
      setError('Camera on nahi ho paya — browser permission check karo.');
    }
  };

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !micOn;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
      syncTracks();
    } catch {
      setError('Mic on nahi ho paya — browser permission check karo.');
    }
  };

  const toggleShare = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !sharing;
    try {
      await room.localParticipant.setScreenShareEnabled(next);
      setSharing(next);
      syncTracks();
    } catch {
      setError('Screen share start nahi hua — browser permission check karo.');
    }
  };

  const sendChat = () => {
    const room = roomRef.current;
    const text = chatInput.trim();
    if (!room || !text) return;
    const line: ChatLine = { sender: displayName, text, at: Date.now() };
    try {
      room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(line)), {
        reliable: true,
        topic: 'chat',
      });
    } catch {
      // In-call chat is best-effort.
    }
    setChatLines((prev) => [...prev, line]);
    setChatInput('');
  };

  const videoTracks = tracks.filter((t) => t.kind === 'video');
  const audioTracks = tracks.filter((t) => t.kind === 'audio' && !t.isLocal);

  if (setupNeeded) {
    return (
      <div className="card p-6 text-center">
        <h2 className="font-display text-3xl text-gold">Video Calling — Setup Needed</h2>
        <p className="mx-auto mt-3 max-w-xl text-zinc-300">
          Calling ke liye LiveKit chahiye. Free LiveKit Cloud account banao
          (cloud.livekit.io), uski keys <code>.env.local</code> mein daalo (
          <code>LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code>,{' '}
          <code>LIVEKIT_API_SECRET</code>) aur app dobara deploy karo. Poori steps
          README mein hain. Tab tak group chat use karo — woh Supabase se chalta hai.
        </p>
      </div>
    );
  }

  if (status !== 'connected') {
    return (
      <div className="card p-6 text-center">
        <h2 className="font-display text-3xl text-gold">📞 {roomName}</h2>
        <p className="mt-2 text-zinc-300">
          {status === 'joining'
            ? 'Joining the call… camera/mic permission allow karo jab browser poochhe.'
            : 'Video + voice call — 1:1 ya group, sab isi room mein.'}
        </p>
        {status === 'error' && error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => void join(true)}
            disabled={status === 'joining'}
            className="btn-gold disabled:opacity-50"
          >
            {status === 'joining' ? 'Joining…' : '🎥 Join with camera & mic'}
          </button>
          <button
            onClick={() => void join(false)}
            disabled={status === 'joining'}
            className="btn-ghost disabled:opacity-50"
          >
            Join without camera/mic
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Join karte hi group chat mein sabko call ka notification jayega.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-2xl text-gold">📞 {roomName}</h2>
        <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-300">
          ⏱ {fmtTime(seconds)}
        </span>
        <span className="text-sm text-zinc-300">
          👥 {participantNames.length}: {participantNames.join(', ')}
        </span>
        {error && <span className="w-full text-xs text-amber-300">{error}</span>}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {videoTracks.length === 0 && (
          <VideoTile track={undefined} label={displayName} muted />
        )}
        {videoTracks.map((t) => (
          <VideoTile
            key={t.id}
            track={t.track}
            label={`${t.participantName}${t.source === Track.Source.ScreenShare ? ' (screen)' : ''}`}
            muted={t.isLocal}
          />
        ))}
        {audioTracks.map((t) => (
          <AudioSink key={t.id} track={t.track} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 px-4 py-3">
        <button onClick={() => void toggleCamera()} className={cameraOn ? 'btn-gold' : 'btn-ghost'}>
          {cameraOn ? '📷 Camera Off' : '📷 Camera On'}
        </button>
        <button onClick={() => void toggleMic()} className={micOn ? 'btn-gold' : 'btn-ghost'}>
          {micOn ? '🎙 Mute' : '🎙 Unmute'}
        </button>
        <button onClick={() => void toggleShare()} className={sharing ? 'btn-gold' : 'btn-ghost'}>
          {sharing ? '🖥 Stop Sharing' : '🖥 Share Screen'}
        </button>
        <button
          onClick={() => void leave()}
          className="rounded-full bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-500"
        >
          📵 End Call
        </button>
      </div>

      <div className="border-t border-white/10 p-4">
        <h3 className="mb-2 font-semibold text-white">In-call chat</h3>
        <div className="mb-3 max-h-40 space-y-1 overflow-y-auto rounded-xl bg-black/30 p-3">
          {chatLines.length === 0 && <p className="text-sm text-zinc-400">No messages yet.</p>}
          {chatLines.map((l, i) => (
            <p key={`${l.at}-${i}`} className="text-sm">
              <b className="text-gold-light">{l.sender}:</b>{' '}
              <span className="text-zinc-200">{l.text}</span>
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendChat();
            }}
            placeholder="Message everyone in the call…"
            className="input flex-1"
          />
          <button onClick={sendChat} className="btn-gold">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
