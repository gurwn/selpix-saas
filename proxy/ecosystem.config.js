module.exports = {
  apps: [
    {
      name: 'coupang-proxy',
      script: 'server.js',
      cwd: '/home/dev/openclaw/config/workspace/tmp/selpix-saas/proxy',
      restart_delay: 3000,
      max_restarts: 50,
      autorestart: true,
    },
    {
      name: 'proxy-tunnel',
      script: 'tunnel.sh',
      interpreter: '/bin/bash',
      cwd: '/home/dev/openclaw/config/workspace/tmp/selpix-saas/proxy',
      restart_delay: 5000,
      max_restarts: 100,
      autorestart: true,
    },
  ],
};
