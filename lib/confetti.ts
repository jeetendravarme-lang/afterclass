// Confetti helper — canvas-confetti is loaded lazily so pages render
// server-side without it.
export async function fireConfetti(): Promise<void> {
  try {
    const mod = await import('canvas-confetti');
    const confetti = mod.default;
    const end = Date.now() + 1800;
    const colors = ['#d4af37', '#7b2ff7', '#f5d76e', '#ffffff', '#a855f7'];
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 }, colors });
  } catch {
    // Confetti is decorative — never break the page if it fails to load.
  }
}
