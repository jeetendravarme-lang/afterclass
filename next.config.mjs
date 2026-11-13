/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Local photos/videos live in public/. YouTube thumbnails are loaded
    // through iframes, not next/image, so no remote patterns are needed.
    formats: ['image/avif', 'image/webp'],
  },
  // LiveKit / Supabase credentials must ONLY come from env vars (see .env.local.example).
  // Never put API keys or secrets in this file or in any frontend code.
};

export default nextConfig;
