import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingIncludes: {
    '/api/extract-pdf-text': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'],
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