import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pdfjs-dist'],
  // Trazar desde el root del monorepo para encontrar pdfjs hoisted
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  outputFileTracingIncludes: {
    '/api/extract-pdf-text': [
      'node_modules/pdfjs-dist/legacy/build/**/*.mjs',
      'apps/web/node_modules/pdfjs-dist/legacy/build/**/*.mjs',
    ],
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