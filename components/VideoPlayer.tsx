'use client';

import { useState } from 'react';
import type { SiteVideo } from '../lib/types';

export default function VideoPlayer({ videos }: { videos: SiteVideo[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openIndex = videos.findIndex((v) => v.id === openId);
  const open = openIndex >= 0 ? videos[openIndex] : null;

  const step = (d: number) => {
    if (openIndex < 0) return;
    const next = (openIndex + d + videos.length) % videos.length;
    setOpenId(videos[next].id);
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => setOpenId(v.id)}
            className="card group overflow-hidden text-left"
            aria-label={`Play video: ${v.title}`}
          >
            <div className="relative aspect-video w-full bg-black">
              <video
                src={v.src}
                preload="metadata"
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-black/60 text-2xl text-gold shadow-gold transition group-hover:scale-110">
                  ▶
                </span>
              </span>
              <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                ▶ VIDEO
              </span>
              <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                {v.durationLabel}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white">{v.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{v.caption}</p>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setOpenId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
        >
          <div
            className="w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-gradient-to-r from-violet-glow to-gold px-4 py-1 text-xs font-bold tracking-widest text-white">
                ▶ NOW SHOWING
              </span>
              <button
                onClick={() => setOpenId(null)}
                className="rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                aria-label="Close video"
              >
                ✕
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-gold/60 shadow-gold">
              <video
                key={open.id}
                src={open.src}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full bg-black"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{open.title}</h3>
                <p className="text-sm text-zinc-400">{open.caption}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => step(-1)} className="btn-ghost" aria-label="Previous video">
                  ‹ Prev
                </button>
                <button onClick={() => step(1)} className="btn-ghost" aria-label="Next video">
                  Next ›
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {openIndex + 1} / {videos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
