/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        './pdf.worker.mjs': false,
      };
    }
    config.externals = [...(config.externals || []), 'canvas'];
    return config;
  },
};

export default nextConfig;

