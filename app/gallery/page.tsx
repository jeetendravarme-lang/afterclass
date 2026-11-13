import { GALLERY } from '../../lib/data';
import Gallery from '../../components/Gallery';

export default function GalleryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-gold">Gallery 📸</h1>
        <p className="mt-1 text-zinc-300">
          {GALLERY.length} bundled photos — portraits, group photos and auditorium memories.
          Tap any photo to view it big. Logged-in friends can add more.
        </p>
      </header>
      <Gallery photos={GALLERY} />
    </div>
  );
}
