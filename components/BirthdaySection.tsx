'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FRIENDS } from '../lib/data';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { fireConfetti } from '../lib/confetti';
import type { Birthday, Wish } from '../lib/types';

// Birthdays: NO dates are pre-filled anywhere. Users add day+month on the
// site; until then the countdown/celebration stays inactive for that friend.
export default function BirthdaySection() {
  const { user } = useAuth();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [friendName, setFriendName] = useState(FRIENDS[0].name);
  const [wishText, setWishText] = useState('');
  const [wishFor, setWishFor] = useState(FRIENDS[0].name);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: b } = await supabase.from('birthdays').select('*');
    if (b) setBirthdays(b as Birthday[]);
    const { data: w } = await supabase
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (w) setWishes(w as Wish[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const today = new Date();
  const todayKey = `${today.getMonth() + 1}-${today.getDate()}`;

  const upcoming = useMemo(() => {
    return birthdays
      .map((b) => {
        const next = new Date(today.getFullYear(), b.month - 1, b.day);
        if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          next.setFullYear(next.getFullYear() + 1);
        }
        const diff = Math.ceil((next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
        return { ...b, diff, isToday: `${b.month}-${b.day}` === todayKey };
      })
      .sort((a, b) => a.diff - b.diff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthdays]);

  useEffect(() => {
    if (upcoming.some((u) => u.isToday)) {
      void fireConfetti();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming.length]);

  const saveBirthday = async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setNote('Birthday add karne ke liye login karo.');
      return;
    }
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (!m || m < 1 || m > 12 || !d || d < 1 || d > 31) {
      setNote('Sahi month (1–12) aur day (1–31) bharo.');
      return;
    }
    const { error } = await supabase
      .from('birthdays')
      .upsert({ friend_name: friendName, month: m, day: d, updated_by: user.id }, { onConflict: 'friend_name' });
    if (error) setNote(`Save nahi hua: ${error.message}`);
    else {
      setNote(`${friendName} ka birthday save ho gaya! 🎂`);
      void load();
    }
  };

  const sendWish = async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      setNote('Wish likhne ke liye login karo.');
      return;
    }
    const text = wishText.trim();
    if (!text) return;
    const { error } = await supabase.from('wishes').insert({
      friend_name: wishFor,
      author: user.email?.split('@')[0] ?? 'Friend',
      message: text,
    });
    if (error) setNote(`Wish save nahi hui: ${error.message}`);
    else {
      setWishText('');
      void fireConfetti();
      void load();
    }
  };

  const dateOf = (name: string) => birthdays.find((b) => b.friend_name === name);

  return (
    <div className="space-y-6">
      {upcoming.some((u) => u.isToday) && (
        <div className="rounded-2xl border border-gold bg-gradient-to-r from-violet-deep to-panel p-6 text-center shadow-gold">
          <p className="font-display text-4xl tracking-wide text-gold">🎉 HAPPY BIRTHDAY! 🎂</p>
          <p className="mt-2 text-lg text-white">
            Aaj {upcoming.filter((u) => u.isToday).map((u) => u.friend_name).join(' aur ')} ka
            birthday hai!
          </p>
          <p className="text-sm text-zinc-300">Neeche apni wish likho ❤️</p>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-display text-3xl tracking-wide text-gold">🎂 Birthdays</h2>
        <div className="mt-4 space-y-3">
          {FRIENDS.map((f) => {
            const b = dateOf(f.name);
            const up = upcoming.find((u) => u.friend_name === f.name);
            return (
              <div key={f.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                <span className="font-semibold text-white">{f.name}</span>
                <span className="text-sm text-zinc-400">({f.nickname})</span>
                {b ? (
                  <span className="text-sm text-gold-light">
                    {up?.isToday ? '🎉 Aaj hi hai!' : up ? `⏳ ${up.diff} din baaki` : `${b.day}/${b.month}`}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-500">Birthday date abhi add nahi hui</span>
                )}
                <span className="ml-auto text-sm text-zinc-300">
                  💌 {wishes.filter((w) => w.friend_name === f.name).length} wishes
                </span>
              </div>
            );
          })}
        </div>
        {isSupabaseConfigured && user && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select value={friendName} onChange={(e) => setFriendName(e.target.value)} className="input w-36">
              {FRIENDS.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
            <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="Day" inputMode="numeric" className="input w-20" />
            <input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="Month" inputMode="numeric" className="input w-24" />
            <button onClick={() => void saveBirthday()} className="btn-gold">
              Save birthday
            </button>
            {note && <span className="w-full text-sm text-zinc-300">{note}</span>}
          </div>
        )}
        {!isSupabaseConfigured && (
          <p className="mt-3 text-xs text-amber-300">Birthdays aur wishes save karne ke liye Supabase chahiye.</p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display text-3xl tracking-wide text-gold">💌 Birthday Wishes</h2>
        {isSupabaseConfigured && user && (
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={wishFor} onChange={(e) => setWishFor(e.target.value)} className="input w-36">
              {FRIENDS.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="Apni wish likho…"
              className="input flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void sendWish();
              }}
            />
            <button onClick={() => void sendWish()} className="btn-gold">
              Send wish
            </button>
          </div>
        )}
        <ul className="mt-4 space-y-2">
          {wishes.length === 0 && <li className="text-sm text-zinc-400">Abhi koi wish nahi hai — pehli wish tum likho!</li>}
          {wishes.map((w) => (
            <li key={w.id} className="rounded-xl bg-white/5 px-4 py-2 text-sm">
              <b className="text-gold-light">{w.author}</b>{' '}
              <span className="text-zinc-400">→ {w.friend_name}:</span>{' '}
              <span className="text-zinc-100">{w.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
