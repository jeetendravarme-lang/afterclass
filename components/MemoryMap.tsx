'use client';

import { useCallback, useEffect, useState } from 'react';
import { SEED_PLACE } from '../lib/data';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { MemoryPlace } from '../lib/types';

// OpenStreetMap embed — no API key needed. Only the college pin is seeded;
// every other place is added by users on the site. Nothing is invented.
export default function MemoryMap() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<MemoryPlace[]>([
    { id: 'seed-bu', name: SEED_PLACE.name, lat: SEED_PLACE.lat, lng: SEED_PLACE.lng, photo_url: null },
  ]);
  const [selected, setSelected] = useState<MemoryPlace>({
    id: 'seed-bu',
    name: SEED_PLACE.name,
    lat: SEED_PLACE.lat,
    lng: SEED_PLACE.lng,
    photo_url: null,
  });
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.from('places').select('*').order('created_at');
    if (data && data.length > 0) {
      setPlaces([
        { id: 'seed-bu', name: SEED_PLACE.name, lat: SEED_PLACE.lat, lng: SEED_PLACE.lng, photo_url: null },
        ...(data as MemoryPlace[]),
      ]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addPlace = async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setNote('Jagah add karne ke liye login karo.');
      return;
    }
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!name.trim() || Number.isNaN(la) || Number.isNaN(ln)) {
      setNote('Naam, latitude aur longitude sahi se bharo.');
      return;
    }
    const { error } = await supabase.from('places').insert({
      name: name.trim(),
      lat: la,
      lng: ln,
      added_by: user.id,
    });
    if (error) setNote(`Save nahi hua: ${error.message}`);
    else {
      setNote('Jagah add ho gayi! 📍');
      setName('');
      setLat('');
      setLng('');
      void load();
    }
  };

  const bbox = `${selected.lng - 0.06},${selected.lat - 0.04},${selected.lng + 0.06},${selected.lat + 0.04}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${selected.lat},${selected.lng}`;

  return (
    <div className="card p-5">
      <h2 className="font-display text-3xl tracking-wide text-gold">Memory Map 🌍</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Jahan-jahan doston ke saath gaye, wahan pin lagao. Shuruaat mein sirf college
        ka pin hai — baaki sab tum khud add karo.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/15">
        <iframe
          title={`Map — ${selected.name}`}
          src={embedSrc}
          className="h-72 w-full border-0"
          loading="lazy"
        />
      </div>
      <p className="mt-2 text-sm text-zinc-300">
        📍 Selected: <b className="text-white">{selected.name}</b>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {places.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              selected.id === p.id ? 'bg-gold font-semibold text-black' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            📍 {p.name}
          </button>
        ))}
      </div>
      {isSupabaseConfigured && user && (
        <div className="mt-4 flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jagah ka naam" className="input w-44" />
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude (25.45…)" className="input w-36" />
          <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude (78.61…)" className="input w-36" />
          <button onClick={() => void addPlace()} className="btn-gold">
            + Add place
          </button>
          {note && <span className="w-full text-sm text-zinc-300">{note}</span>}
        </div>
      )}
      {!isSupabaseConfigured && (
        <p className="mt-3 text-xs text-amber-300">Nayi jagah add karne ke liye Supabase chahiye.</p>
      )}
    </div>
  );
}
