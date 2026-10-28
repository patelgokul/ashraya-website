// 

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", ".prisma/client"],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "plus.unsplash.com",   pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com",  pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co",       pathname: "/**" },
    ],
  },
};
module.exports = nextConfig;