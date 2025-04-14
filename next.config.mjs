/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
        pathname: "/**",
      },
    ],
    domains:[
      "cdn.simpleicons.org",
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
