/** @type {import('next').NextConfig} */
const nextConfig = {
  // מונע מ-Next לנסות לבנות חבילות שמשתמשות ב-Node.js APIs בצד השרת
  experimental: {
    serverComponentsExternalPackages: ['kosher-zmanim', '@hebcal/core'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // מונע מ-webpack לנסות לבנות חבילות Node.js בצד הלקוח
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
