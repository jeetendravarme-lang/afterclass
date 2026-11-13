'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FRIENDS, GALLERY } from '../../lib/data';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import FriendCard from '../../components/FriendCard';
import FriendshipMap from '../../components/FriendshipMap';
import MemoryMap from '../../components/MemoryMap';

// ---------------------------------------------------------------------------
// Memory Match — real playable game using the real gallery photos.
// ---------------------------------------------------------------------------
function MemoryMatch() {
  const cards = useMemo(() => {
    const picked = GALLERY.slice(0, 6);
    const deck = [...picked, ...picked]
      .map((p, i) => ({ key: `${p.src}-${i}`, src: p.src, alt: p.alt }))
      .sort(() => Math.random() - 0.5);
    return deck;
  }, []);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const flip = (i: number) => {
    if (won || flipped.length >= 2 || flipped.includes(i) || matched.includes(cards[i].src)) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (cards[a].src === cards[b].src) {
        setMatched((prev) => [...prev, cards[a].src]);
        setFlipped([]);
        if (matched.length + 1 === 6) setWon(true);
      } else {
        window.setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div>
      <p className="text-sm text-zinc-400">
        Same photo wale do cards dhoondho! Moves: <b className="text-white">{moves}</b>
        {won && <span className="ml-2 font-bold text-gold">🎉 Jeet gaye — {moves} moves mein!</span>}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((c, i) => {
          const faceUp = flipped.includes(i) || matched.includes(c.src);
          return (
            <button
              key={c.key}
              onClick={() => flip(i)}
              className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                faceUp ? 'border-gold' : 'border-white/15 bg-panel2 hover:border-white/40'
              }`}
              aria-label={faceUp ? c.alt : 'Hidden card'}
            >
              {faceUp ? (
                <Image src={c.src} alt={c.alt} fill sizes="25vw" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-3xl text-gold">?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Supabase-backed lists (achievements / quizzes / polls / challenges / capsule)
// All start EMPTY — users create the content. Nothing is invented.
// ---------------------------------------------------------------------------
type AchRow = { id: string; title: string; detail: string | null };
type QuizRow = { id: string; title: string };
type QuizQ = { id: string; quiz_id: string; question: string; options: string[]; answer: number };
type PollRow = { id: string; question: string };
type PollOpt = { id: string; poll_id: string; label: string; votes: number };
type ChallengeRow = { id: string; title: string; detail: string | null; done_by: string[] };
type CapsuleRow = { id: string; author: string; body: string | null; locked: boolean; unlock_date: string };

function useSupa() {
  return getSupabase();
}

export default function UniversePage() {
  const { user } = useAuth();
  const supabase = useSupa();

  const [achievements, setAchievements] = useState<AchRow[]>([]);
  const [achTitle, setAchTitle] = useState('');
  const [achDetail, setAchDetail] = useState('');

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQ[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizQ, setQuizQ] = useState('');
  const [quizOpts, setQuizOpts] = useState(['', '', '', '']);
  const [quizAnswer, setQuizAnswer] = useState(0);
  const [playingQuiz, setPlayingQuiz] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizDone, setQuizDone] = useState(false);

  const [polls, setPolls] = useState<PollRow[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOpt[]>([]);
  const [pollQ, setPollQ] = useState('');
  const [pollOptText, setPollOptText] = useState('');
  const [voted, setVoted] = useState<Record<string, string>>({});

  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [chTitle, setChTitle] = useState('');
  const [chDetail, setChDetail] = useState('');

  const [capsules, setCapsules] = useState<CapsuleRow[]>([]);
  const [capBody, setCapBody] = useState('');
  const [capDate, setCapDate] = useState('');

  const [note, setNote] = useState('');

  const loadAll = useCallback(async () => {
    if (!supabase) return;
    const [a, q, qq, p, po, c, cap] = await Promise.all([
      supabase.from('achievements').select('id, title, detail').order('created_at', { ascending: false }),
      supabase.from('quizzes').select('id, title').order('created_at', { ascending: false }),
      supabase.from('quiz_questions').select('id, quiz_id, question, options, answer'),
      supabase.from('polls').select('id, question').order('created_at', { ascending: false }),
      supabase.from('poll_options').select('id, poll_id, label, votes'),
      supabase.from('challenges').select('id, title, detail, done_by').order('created_at', { ascending: false }),
      supabase.from('capsule_messages_public').select('id, author, body, locked, unlock_date').order('unlock_date'),
    ]);
    if (a.data) setAchievements(a.data as AchRow[]);
    if (q.data) setQuizzes(q.data as QuizRow[]);
    if (qq.data) setQuizQuestions(qq.data as QuizQ[]);
    if (p.data) setPolls(p.data as PollRow[]);
    if (po.data) setPollOptions(po.data as PollOpt[]);
    if (c.data) setChallenges(c.data as ChallengeRow[]);
    if (cap.data) setCapsules(cap.data as CapsuleRow[]);
    if (user) {
      const { data: votes } = await supabase.from('poll_votes').select('poll_id, option_id').eq('user_id', user.id);
      if (votes) {
        const m: Record<string, string> = {};
        (votes as { poll_id: string; option_id: string }[]).forEach((v) => {
          m[v.poll_id] = v.option_id;
        });
        setVoted(m);
      }
    }
  }, [supabase, user]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const needLogin = () => {
    if (!user) {
      setNote('Ye karne ke liye login karo.');
      return true;
    }
    return false;
  };

  const addAchievement = async () => {
    if (!supabase || needLogin() || !achTitle.trim()) return;
    const { error } = await supabase.from('achievements').insert({ user_id: user!.id, title: achTitle.trim(), detail: achDetail.trim() || null });
    if (error) setNote(error.message);
    else {
      setAchTitle('');
      setAchDetail('');
      void loadAll();
    }
  };

  const createQuiz = async () => {
    if (!supabase || needLogin() || !quizTitle.trim() || !quizQ.trim()) return;
    const opts = quizOpts.map((o) => o.trim());
    if (opts.some((o) => !o)) {
      setNote('Quiz ke chaaron options bharo.');
      return;
    }
    const { data, error } = await supabase.from('quizzes').insert({ title: quizTitle.trim(), created_by: user!.id }).select('id').single();
    if (error || !data) {
      setNote(error?.message ?? 'Quiz nahi bana.');
      return;
    }
    const { error: qErr } = await supabase.from('quiz_questions').insert({
      quiz_id: (data as { id: string }).id,
      question: quizQ.trim(),
      options: opts,
      answer: quizAnswer,
    });
    if (qErr) setNote(qErr.message);
    else {
      setQuizTitle('');
      setQuizQ('');
      setQuizOpts(['', '', '', '']);
      setQuizAnswer(0);
      setNote('Quiz ban gaya! Ab khel sakte ho.');
      void loadAll();
    }
  };

  const createPoll = async () => {
    if (!supabase || needLogin() || !pollQ.trim()) return;
    const { data, error } = await supabase.from('polls').insert({ question: pollQ.trim(), created_by: user!.id }).select('id').single();
    if (error || !data) {
      setNote(error?.message ?? 'Poll nahi bana.');
      return;
    }
    const pollId = (data as { id: string }).id;
    const labels = pollOptText.split(',').map((s) => s.trim()).filter(Boolean);
    if (labels.length < 2) {
      setNote('Kam se kam 2 options comma se likho (jaise: Chai, Coffee).');
      return;
    }
    const { error: oErr } = await supabase.from('poll_options').insert(labels.map((label) => ({ poll_id: pollId, label })));
    if (oErr) setNote(oErr.message);
    else {
      setPollQ('');
      setPollOptText('');
      void loadAll();
    }
  };

  const vote = async (pollId: string, optionId: string) => {
    if (!supabase || needLogin()) return;
    if (voted[pollId]) {
      setNote('Tum is poll mein pehle hi vote kar chuke ho.');
      return;
    }
    const { error } = await supabase.from('poll_votes').insert({ poll_id: pollId, option_id: optionId, user_id: user!.id });
    if (error) {
      setNote(error.message);
      return;
    }
    await supabase.rpc('increment_poll_vote', { opt_id: optionId });
    setVoted((prev) => ({ ...prev, [pollId]: optionId }));
    void loadAll();
  };

  const addChallenge = async () => {
    if (!supabase || needLogin() || !chTitle.trim()) return;
    const { error } = await supabase.from('challenges').insert({ title: chTitle.trim(), detail: chDetail.trim() || null, created_by: user!.id, done_by: [] });
    if (error) setNote(error.message);
    else {
      setChTitle('');
      setChDetail('');
      void loadAll();
    }
  };

  const toggleChallenge = async (ch: ChallengeRow) => {
    if (!supabase || needLogin()) return;
    const doneBy = ch.done_by.includes(user!.id)
      ? ch.done_by.filter((id) => id !== user!.id)
      : [...ch.done_by, user!.id];
    await supabase.from('challenges').update({ done_by: doneBy }).eq('id', ch.id);
    void loadAll();
  };

  const addCapsule = async () => {
    if (!supabase || needLogin() || !capBody.trim() || !capDate) return;
    const { error } = await supabase.from('capsule_messages').insert({
      author: user!.email?.split('@')[0] ?? 'Friend',
      body: capBody.trim(),
      unlock_date: capDate,
    });
    if (error) setNote(error.message);
    else {
      setCapBody('');
      setCapDate('');
      setNote('Future message seal ho gaya — unlock date par hi khulega. 🔒');
      void loadAll();
    }
  };

  const playingQs = playingQuiz ? quizQuestions.filter((q) => q.quiz_id === playingQuiz) : [];
  const score =
    playingQuiz && quizDone
      ? playingQs.filter((q) => quizAnswers[q.id] === q.answer).length
      : 0;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-gold">AFTERCLASS Universe 🌌</h1>
        <p className="mt-1 text-zinc-300">
          Hamari duniya — 4 areas. Sab kuchh tum log khud banate ho; kuchh bhi pehle se
          invent nahi kiya gaya.
        </p>
        {note && <p className="mt-2 text-sm text-amber-300">{note}</p>}
        {!isSupabaseConfigured && (
          <p className="mt-2 text-sm text-amber-300">
            Interactive features (achievements, quizzes, polls, challenges, time capsule)
            ke liye Supabase chahiye. Memory Match game bina Supabase ke bhi chalta hai.
          </p>
        )}
      </header>

      {/* MY WORLD */}
      <section id="my-world" className="space-y-4">
        <h2 className="font-display text-4xl text-gold">MY WORLD 🌍</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {FRIENDS.map((f) => (
            <FriendCard key={f.id} friend={f} />
          ))}
        </div>
        <div className="card p-5">
          <h3 className="font-display text-2xl text-gold">🏆 Achievements</h3>
          {achievements.length === 0 && (
            <p className="mt-1 text-sm text-zinc-400">
              Abhi koi achievement nahi hai — apni jeet yahan add karo.
            </p>
          )}
          <ul className="mt-2 space-y-2">
            {achievements.map((a) => (
              <li key={a.id} className="rounded-xl bg-white/5 px-4 py-2 text-sm">
                <b className="text-white">{a.title}</b>
                {a.detail && <span className="text-zinc-300"> — {a.detail}</span>}
              </li>
            ))}
          </ul>
          {user && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input value={achTitle} onChange={(e) => setAchTitle(e.target.value)} placeholder="Achievement title" className="input" />
              <input value={achDetail} onChange={(e) => setAchDetail(e.target.value)} placeholder="Detail (optional)" className="input flex-1" />
              <button onClick={() => void addAchievement()} className="btn-gold">
                + Add
              </button>
            </div>
          )}
        </div>
        <Link href="/gallery" className="btn-ghost inline-block">
          📸 My Albums →
        </Link>
      </section>

      {/* OUR WORLD */}
      <section id="our-world" className="space-y-4">
        <h2 className="font-display text-4xl text-gold">OUR WORLD 👥</h2>
        <p className="text-zinc-300">
          Group photos, memories aur friendship tree — sab doston ki shared duniya.
        </p>
        <FriendshipMap />
        <MemoryMap />
        <Link href="/chat" className="btn-gold inline-block">
          💬 Group Chat →
        </Link>
      </section>

      {/* PLAYGROUND */}
      <section id="playground" className="space-y-4">
        <h2 className="font-display text-4xl text-gold">PLAYGROUND 🎮</h2>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-gold">🃏 Memory Match</h3>
          <MemoryMatch />
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-gold">🧠 Gang Quiz</h3>
          {quizzes.length === 0 && (
            <p className="mt-1 text-sm text-zinc-400">
              Abhi koi quiz nahi hai — pehla quiz tum banao.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {quizzes.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setPlayingQuiz(q.id);
                  setQuizAnswers({});
                  setQuizDone(false);
                }}
                className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                {q.title}
              </button>
            ))}
          </div>
          {playingQuiz && (
            <div className="mt-4 rounded-xl bg-black/30 p-4">
              <h4 className="font-semibold text-white">
                {quizzes.find((q) => q.id === playingQuiz)?.title}
              </h4>
              {playingQs.map((q) => (
                <div key={q.id} className="mt-3">
                  <p className="text-sm text-zinc-200">{q.question}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((opt, i) => {
                      const picked = quizAnswers[q.id] === i;
                      const showResult = quizDone;
                      const correct = q.answer === i;
                      return (
                        <button
                          key={i}
                          disabled={quizDone}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: i }))}
                          className={`rounded-full px-3 py-1.5 text-sm ${
                            showResult && correct
                              ? 'bg-green-600 text-white'
                              : showResult && picked
                                ? 'bg-red-600 text-white'
                                : picked
                                  ? 'bg-gold text-black'
                                  : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!quizDone ? (
                <button
                  onClick={() => setQuizDone(true)}
                  className="btn-gold mt-4"
                  disabled={playingQs.length === 0 || playingQs.some((q) => quizAnswers[q.id] === undefined)}
                >
                  Check score
                </button>
              ) : (
                <p className="mt-3 font-bold text-gold-light">
                  Score: {score} / {playingQs.length} 🎉
                </p>
              )}
            </div>
          )}
          {user && (
            <div className="mt-4 space-y-2 rounded-xl bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Naya quiz banao</p>
              <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz title" className="input w-full" />
              <input value={quizQ} onChange={(e) => setQuizQ(e.target.value)} placeholder="Question" className="input w-full" />
              <div className="grid gap-2 sm:grid-cols-2">
                {quizOpts.map((o, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="quiz-answer"
                      checked={quizAnswer === i}
                      onChange={() => setQuizAnswer(i)}
                      className="accent-yellow-500"
                    />
                    <input
                      value={o}
                      onChange={(e) =>
                        setQuizOpts((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      placeholder={`Option ${i + 1}${i === quizAnswer ? ' (correct ✓)' : ''}`}
                      className="input flex-1"
                    />
                  </label>
                ))}
              </div>
              <button onClick={() => void createQuiz()} className="btn-gold">
                + Create quiz
              </button>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-gold">🗳 Voting Polls</h3>
          {polls.length === 0 && (
            <p className="mt-1 text-sm text-zinc-400">Abhi koi poll nahi hai — pehla poll tum banao.</p>
          )}
          <ul className="mt-2 space-y-3">
            {polls.map((p) => {
              const opts = pollOptions.filter((o) => o.poll_id === p.id);
              const total = opts.reduce((s, o) => s + o.votes, 0);
              return (
                <li key={p.id} className="rounded-xl bg-white/5 p-4">
                  <p className="font-semibold text-white">{p.question}</p>
                  <div className="mt-2 space-y-2">
                    {opts.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => void vote(p.id, o.id)}
                        disabled={Boolean(voted[p.id])}
                        className="block w-full rounded-lg bg-white/10 px-3 py-2 text-left text-sm hover:bg-white/20 disabled:cursor-default"
                      >
                        <span className="flex justify-between">
                          <span>
                            {o.label}
                            {voted[p.id] === o.id ? ' ✓ (tumhara vote)' : ''}
                          </span>
                          <span className="text-gold-light">
                            {o.votes} vote{total > 0 ? ` • ${Math.round((o.votes / total) * 100)}%` : ''}
                          </span>
                        </span>
                        <span
                          className="mt-1 block h-1.5 rounded bg-gold"
                          style={{ width: `${total > 0 ? (o.votes / total) * 100 : 0}%` }}
                        />
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {user && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input value={pollQ} onChange={(e) => setPollQ(e.target.value)} placeholder="Poll question" className="input flex-1" />
              <input
                value={pollOptText}
                onChange={(e) => setPollOptText(e.target.value)}
                placeholder="Options, comma se (Chai, Coffee)"
                className="input flex-1"
              />
              <button onClick={() => void createPoll()} className="btn-gold">
                + Create poll
              </button>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-2xl text-gold">🏅 Challenges</h3>
          {challenges.length === 0 && (
            <p className="mt-1 text-sm text-zinc-400">Abhi koi challenge nahi hai — pehla challenge tum banao.</p>
          )}
          <ul className="mt-2 space-y-2">
            {challenges.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={user ? c.done_by.includes(user.id) : false}
                  onChange={() => void toggleChallenge(c)}
                  className="h-4 w-4 accent-yellow-500"
                  aria-label={`Mark done: ${c.title}`}
                />
                <span>
                  <b className="text-white">{c.title}</b>
                  {c.detail && <span className="text-zinc-300"> — {c.detail}</span>}
                  <span className="ml-2 text-xs text-zinc-400">({c.done_by.length} done)</span>
                </span>
              </li>
            ))}
          </ul>
          {user && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder="Challenge title" className="input" />
              <input value={chDetail} onChange={(e) => setChDetail(e.target.value)} placeholder="Detail (optional)" className="input flex-1" />
              <button onClick={() => void addChallenge()} className="btn-gold">
                + Add challenge
              </button>
            </div>
          )}
        </div>
      </section>

      {/* TIME CAPSULE */}
      <section id="time-capsule" className="space-y-4">
        <h2 className="font-display text-4xl text-gold">TIME CAPSULE ⏳</h2>
        <div className="card p-5">
          <h3 className="font-display text-2xl text-gold">📸 Throwbacks</h3>
          <p className="text-sm text-zinc-400">Sabse purani yaadein — gallery ki pehli photos.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {GALLERY.slice(0, 6).map((p) => (
              <div key={p.src} className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={p.src} alt={p.alt} fill sizes="33vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-display text-2xl text-gold">🔒 Future Messages</h3>
          <p className="text-sm text-zinc-400">
            Future ke liye message likho — unlock date tak ye sealed rahega, koi nahi padh
            payega (server bhi text nahi deta).
          </p>
          <ul className="mt-3 space-y-2">
            {capsules.length === 0 && (
              <li className="text-sm text-zinc-400">Abhi koi future message nahi hai.</li>
            )}
            {capsules.map((c) => (
              <li key={c.id} className="rounded-xl bg-white/5 px-4 py-3 text-sm">
                <b className="text-white">{c.author}</b>
                <span className="text-zinc-400"> • unlocks {c.unlock_date}</span>
                {c.locked ? (
                  <p className="mt-1 text-zinc-400">🔒 Sealed — {c.unlock_date} ko khulega.</p>
                ) : (
                  <p className="mt-1 text-zinc-100">{c.body}</p>
                )}
              </li>
            ))}
          </ul>
          {user && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={capBody}
                onChange={(e) => setCapBody(e.target.value)}
                placeholder="Future ke liye message…"
                className="input flex-1"
              />
              <input
                type="date"
                value={capDate}
                onChange={(e) => setCapDate(e.target.value)}
                className="input"
                aria-label="Unlock date"
              />
              <button onClick={() => void addCapsule()} className="btn-gold">
                🔒 Seal it
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
