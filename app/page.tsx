import Image from 'next/image';
import Link from 'next/link';
import { DEDICATION, FRIENDS, GALLERY, POSTER_SRC, VIDEOS, WHEN_WE_WERE_TOGETHER } from '../lib/data';
import FriendCard from '../components/FriendCard';
import SongPlayer from '../components/SongPlayer';
import Gallery from '../components/Gallery';
import VideoPlayer from '../components/VideoPlayer';

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          <Image
            src="/photos/1000172069_18_a5hz.jpg"
            alt="All 5 friends — room group selfie"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-light">
              BCA • Bundelkhand University, Jhansi
            </p>
            <h1 className="font-display text-5xl leading-none tracking-wide text-white sm:text-7xl">
              THE GOLDEN DAYS
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-200 sm:text-base">
              We Came as Strangers, We Became Legends.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/chat" className="btn-gold">
                💬 Group Chat
              </Link>
              <Link href="/call" className="btn-ghost">
                📞 Video Call
              </Link>
              <Link href="/gallery" className="btn-ghost">
                📸 Memories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dedication */}
      <section className="card p-6 text-center sm:p-8">
        <p className="font-display text-4xl tracking-wide text-gold">{DEDICATION.title}</p>
        <p className="mt-2 text-xl text-white">{DEDICATION.subtitle}</p>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-300">{DEDICATION.hindi}</p>
        <p className="mt-3 font-semibold text-gold-light">{DEDICATION.footer}</p>
      </section>

      {/* Meet the gang */}
      <section>
        <h2 className="mb-4 font-display text-4xl tracking-wide text-gold">Meet The Gang 🤝</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {FRIENDS.map((f) => (
            <FriendCard key={f.id} friend={f} />
          ))}
        </div>
      </section>

      {/* Chhichhore poster */}
      <section className="card overflow-hidden">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={POSTER_SRC}
            alt="The Last Bench Legends — Chhichhore style poster"
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>
        <p className="p-4 text-center text-sm text-zinc-400">
          Official Movie Poster — Chhichhore style, humaari gang ke saath 🎬
        </p>
      </section>

      {/* When we were together */}
      <section className="card p-6 text-center sm:p-8">
        <p className="font-display text-4xl tracking-wide text-gold">{WHEN_WE_WERE_TOGETHER.title}</p>
        <p className="mt-1 text-lg text-white">{WHEN_WE_WERE_TOGETHER.subtitle}</p>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-300">{WHEN_WE_WERE_TOGETHER.text}</p>
        <p className="mt-3 font-semibold text-gold-light">{WHEN_WE_WERE_TOGETHER.footer}</p>
      </section>

      {/* Gallery preview */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-4xl tracking-wide text-gold">Gallery 📸</h2>
          <Link href="/gallery" className="btn-ghost">
            View all →
          </Link>
        </div>
        <Gallery photos={GALLERY.slice(0, 8)} />
      </section>

      {/* Videos preview */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-4xl tracking-wide text-gold">Videos 🎬</h2>
          <Link href="/videos" className="btn-ghost">
            Watch all →
          </Link>
        </div>
        <VideoPlayer videos={VIDEOS.slice(0, 3)} />
      </section>

      {/* Songs */}
      <SongPlayer />

      {/* AFTERCLASS Universe teaser */}
      <section className="card p-6">
        <h2 className="font-display text-4xl tracking-wide text-gold">AFTERCLASS Universe 🌌</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'MY WORLD', desc: 'Profiles, albums, achievements', href: '/universe#my-world' },
            { title: 'OUR WORLD', desc: 'Group photos, memories, friendship tree', href: '/universe#our-world' },
            { title: 'PLAYGROUND', desc: 'Games, quizzes, voting, challenges', href: '/universe#playground' },
            { title: 'TIME CAPSULE', desc: 'Old memories, future messages, throwbacks', href: '/universe#time-capsule' },
          ].map((a) => (
            <Link key={a.title} href={a.href} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-gold hover:bg-white/10">
              <p className="font-display text-2xl tracking-wide text-white">{a.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
