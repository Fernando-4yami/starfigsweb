// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/starfigs-29d31.firebasestorage.app/o/*', // Solo un asterisco
      },
    ],
  },
};

module.exports = nextConfig;
