import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo usar standalone si no estamos construyendo en Vercel
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
