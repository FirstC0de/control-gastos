import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        canvas: false,
      },
      extensionAlias: {
        '.mjs': ['.mjs', '.js'],
      },
    };
    return config;
  },
};

export default nextConfig;