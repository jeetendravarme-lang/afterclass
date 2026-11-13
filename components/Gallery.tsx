'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { GalleryPhoto } from '../lib/types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [album, setAlbum] = useState<string>('All');
  const [index, setIndex] = useState<number | null>(null);
  const [extra, setExtra] = useState<GalleryPhoto[]>([]);
  const [uploadNote, setUploadNote] = useState('');

  const albums = useMemo(
    () => ['All', ...Array.from(new Set(photos.map((p) => p.album)))],
    [photos],
  );
  const all = useMemo(() => [...photos, ...extra], [photos, extra]);
  const shown = album === 'All' ? all : all.filter((p) => p.album === album);

  const close = () => setIndex(null);
  const step = (d: number) => {
    if (index === null) return;
    setIndex((index + d + shown.length) % shown.length);
  };

  const onUpload = async (file: File) => {
    const supabase = getSupabase();
    if (!supabase) {
      setUploadNote('Upload needs Supabase — add the env vars first (see README).');
      return;
    }
    setUploadNote('Uploading…');
    const path = `gallery/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('gallery').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      setUploadNote(`Upload failed: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from('gallery').getPublicUrl(path);
    setExtra((prev) => [
      ...prev,
      { src: data.publicUrl, alt: file.name, album: 'Uploads' },
    ]);
    setUploadNote('Uploaded! Your photo is now in the gallery.');
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {albums.map((a) => (
          <button
            key={a}
            onClick={() => {
              setAlbum(a);
              setIndex(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              album === a ? 'bg-gold font-semibold text-black' : 'bg-white/10 text-zinc-200 hover:bg-white/20'
            }`}
          >
            {a}
          </button>
        ))}
        <label className="ml-auto cursor-pointer rounded-full border border-gold/60 px-4 py-1.5 text-sm text-gold-light transition hover:bg-gold/10">
          + Add photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {uploadNote && <p className="mb-3 text-sm text-zinc-300">{uploadNote}</p>}
      {!isSupabaseConfigured && (
        <p className="mb-3 text-xs text-zinc-500">
          Uploads save to Supabase Storage once the env vars are set. The photos
          below are the bundled originals.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((p, i) => (
          <button
            key={`${p.src}-${i}`}
            onClick={() => setIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-panel"
            aria-label={`Open photo: ${p.alt}`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
              {p.album}
            </span>
          </button>
        ))}
      </div>
      {index !== null && shown[index] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={shown[index].alt}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-xl text-white hover:bg-white/20"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <div
            className="relative max-h-[85vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gold/50 shadow-gold">
              <Image
                src={shown[index].src}
                alt={shown[index].alt}
                fill
                sizes="90vw"
                className="object-contain bg-black"
              />
            </div>
            <p className="mt-3 text-center text-sm text-zinc-300">
              {shown[index].alt} • {index + 1} / {shown.length}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-xl text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
