import Image from 'next/image';
import type { Friend } from '../lib/types';
import InstagramIcon from './InstagramIcon';

export default function FriendCard({ friend }: { friend: Friend }) {
  return (
    <article className="card group overflow-hidden">
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={friend.photo}
          alt={`${friend.name} — ${friend.nickname}`}
          fill
          sizes="(max-width: 640px) 50vw, 20vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tracking-wide text-gold-light backdrop-blur">
          {friend.nickname}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-2xl tracking-wide text-white">{friend.name}</h3>
        <p className="mt-1 text-sm text-zinc-400">{friend.caption}</p>
        <a
          href={friend.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white transition hover:border-gold hover:text-gold-light"
        >
          <InstagramIcon size={18} />
          {friend.instagram}
        </a>
      </div>
    </article>
  );
}
