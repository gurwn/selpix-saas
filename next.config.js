/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 개발 모드에서 터보팩 사용 (더 빠른 컴파일)
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // 이미지 최적화
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'cdn1.domeggook.com' },
      { protocol: 'https', hostname: 'cdn.domeggook.com' },
      { protocol: 'https', hostname: 'img.maidome.com' },
      { protocol: 'https', hostname: 'ai.esmplus.com' },
      { protocol: 'https', hostname: '*.esmplus.com' },
      { protocol: 'https', hostname: '*.smilecast.co.kr' },
      { protocol: 'https', hostname: 'bandimall1.smilecast.co.kr' },
      { protocol: 'https', hostname: 'mozon.cafe24.com' },
      { protocol: 'https', hostname: '*.cafe24.com' }
    ]
  },
  // 모듈 ID 최적화
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.moduleIds = 'deterministic'
    }
    return config
  },
}

module.exports = nextConfig
