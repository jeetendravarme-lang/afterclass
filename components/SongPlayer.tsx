'use client';

import { useState } from 'react';
import { SONGS } from '../lib/data';

// Browsers block audible autoplay, so songs start only after a tap.
export default function SongPlayer() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState(0);

  const playSong = (index: number) => {
    setPlayingIndex(index);
    setActiveId(SONGS[index].id);
  };

  const active = activeId ? SONGS.find((s) => s.id === activeId) : null;

  return (
    <section className="card p-5">
      <h2 className="font-display text-3xl tracking-wide text-gold">🎵 Dosti Playlist</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Tap a song to play. Songs loop one after another.
      </p>
      <div className="mt-4 space-y-2">
        {SONGS.map((song, i) => (
          <button
            key={song.id}
            onClick={() => playSong(i)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
              active?.id === song.id
                ? 'border-gold bg-gold/10'
                : 'border-white/10 bg-white/5 hover:border-white/25'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-lg font-bold text-black">
              {active?.id === song.id ? '⏸' : '▶'}
            </span>
            <span>
              <span className="block font-semibold text-white">{song.title}</span>
              <span className="block text-xs text-zinc-400">{song.artist}</span>
            </span>
          </button>
        ))}
      </div>
      {active && (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl border border-gold/40">
          <iframe
            key={active.id}
            src={`${active.embed}?autoplay=1&rel=0`}
            title={active.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-500">
        Playing: {SONGS[playingIndex].title} • Next up:{' '}
        {SONGS[(playingIndex + 1) % SONGS.length].title}
      </p>
    </section>
  );
}
