import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {

    domains: ['images.pexels.com'], // Replace with your image domain

  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

export default nextConfig;
