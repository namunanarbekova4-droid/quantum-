/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "quantum-fallback-secret-key-32chars",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "https://quantum-s5sr.vercel.app",
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/quantum",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig;
