module.exports = {
  apps: [{
    name: 'iching-fortune',
    script: 'node',
    args: '.next/standalone/server.js',
    cwd: '/home/denvy/workspace/iching-fortune',
    interpreter: 'none',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: '3000'
    }
  })
};
