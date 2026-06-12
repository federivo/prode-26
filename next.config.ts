import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Las fotos de avatar (hasta 3 MB) viajan por un server action.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
