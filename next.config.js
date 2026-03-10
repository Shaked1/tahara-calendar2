/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['he'],
    defaultLocale: 'he',
  },

};

module.exports = withPWA(nextConfig);
