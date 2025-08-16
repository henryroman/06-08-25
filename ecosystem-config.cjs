      module.exports = {
  apps: [
    {
      name: "astro-app",
      script: "./dist/server/entry.mjs",
      cwd: "/var/www/06-08-25",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0"
      },
      error_file: "/var/log/pm2/astro-app-error.log",
      out_file: "/var/log/pm2/astro-app-out.log",
      log_file: "/var/log/pm2/astro-app-combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      env_file: ".env",
      kill_timeout: 5000,
      listen_timeout: 3000,
      restart_delay: 1000
    }
  ]
};
