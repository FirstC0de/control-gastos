import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/extract-pdf-text': ['./node_modules/pdfjs-dist/legacy/build/**/*.mjs'],
  },
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