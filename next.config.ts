import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/abonnement", destination: "/rejoindre-le-groupe", permanent: true }];
  },
};

export default nextConfig;
