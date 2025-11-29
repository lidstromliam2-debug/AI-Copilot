import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static2.finnhub.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.cnbcfm.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.investinglive.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cryptocurrencynews.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
