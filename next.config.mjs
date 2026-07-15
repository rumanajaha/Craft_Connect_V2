/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uezmqsfelgxboacxqdnh.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
