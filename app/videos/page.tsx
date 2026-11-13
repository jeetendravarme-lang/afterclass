import { VIDEOS } from '../../lib/data';
import VideoPlayer from '../../components/VideoPlayer';
import RequireAuth from '../../components/RequireAuth';

export default function VideosPage() {
  return (
    <RequireAuth>
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-gold">Videos 🎬</h1>
        <p className="mt-1 text-zinc-300">
          {VIDEOS.length} videos — gang dance, birthday, classroom and auditorium moments.
          Tap a video to open the cinematic player.
        </p>
      </header>
      <VideoPlayer videos={VIDEOS} />
    </div>
    </RequireAuth>
  );
}
