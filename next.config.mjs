/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Supabase storage and common avatar/placeholder hosts.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
