import FriendshipMap from '../../components/FriendshipMap';
import MemoryMap from '../../components/MemoryMap';
import RequireAuth from '../../components/RequireAuth';

export default function MapPage() {
  return (
    <RequireAuth>
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-gold">Who Knows Whom? 🗺️</h1>
        <p className="mt-1 text-zinc-300">
          Friendship map aur memory map — kaun kisse connected hai, aur hum kahan-kahan gaye.
        </p>
      </header>
      <FriendshipMap />
      <MemoryMap />
    </div>
    </RequireAuth>
  );
}
