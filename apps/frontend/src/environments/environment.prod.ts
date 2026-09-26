/**
 * Production SPA config.
 * Same-origin `/api` is expected when Nginx (or similar) reverse-proxies
 * to the Express API — see docker/nginx/default.conf and docs/DEPLOYMENT.md.
 *
 * For split hosting, set apiUrl to the absolute API base, e.g.
 *   apiUrl: 'https://api.example.com/api'
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
