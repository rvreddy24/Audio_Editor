/**
 * Cloudflare Worker for SoundCraft Studio
 * 1. Serves the high-performance React SPA static assets from Cloudflare's global edge network.
 * 2. Proxies /api/* requests to the Render backend (Docker + FFmpeg container).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route /api/* calls to backend (Render container running FFmpeg & QPDF)
    if (url.pathname.startsWith('/api/')) {
      const backendBase = (env.BACKEND_URL || 'https://soundcraft-audio-editor.onrender.com').replace(/\/$/, '');
      const backendUrl = new URL(url.pathname + url.search, backendBase);

      const headers = new Headers(request.headers);
      headers.set('host', backendUrl.host);

      return fetch(backendUrl.toString(), {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow',
      });
    }

    // Serve static frontend assets for all other routes
    return env.ASSETS.fetch(request);
  },
};
