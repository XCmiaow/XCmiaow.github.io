/**
 * Cloudflare Worker for Decap CMS OAuth
 * Deploy this to Cloudflare Workers to handle GitHub OAuth login.
 *
 * 1. Create a GitHub OAuth App:
 *    https://github.com/settings/applications/new
 *    - Application name: Decap CMS (or any name)
 *    - Homepage URL: https://XCmiaow.github.io
 *    - Authorization callback URL: https://your-worker.your-subdomain.workers.dev/callback
 *
 * 2. Deploy this worker:
 *    npm install -g wrangler
 *    wrangler deploy scripts/oauth-worker.js
 *
 * 3. Set secrets:
 *    wrangler secret put GITHUB_CLIENT_ID
 *    wrangler secret put GITHUB_CLIENT_SECRET
 *
 * 4. Update config.yml:
 *    backend:
 *      name: github
 *      repo: XCmiaow/XCmiaow.github.io
 *      base_url: https://your-worker.your-subdomain.workers.dev
 *      auth_endpoint: oauth/authorize
 */

const CLIENT_ID = GITHUB_CLIENT_ID;
const CLIENT_SECRET = GITHUB_CLIENT_SECRET;

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // OAuth callback
  if (path === '/callback') {
    const code = url.searchParams.get('code');
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
    });
    const tokenData = await tokenRes.json();
    const html = `<html><body><script>
      window.opener.postMessage('authorization:github:${tokenData.access_token}:${tokenData.scope || ''}', '*');
      window.close();
    </script></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }

  // Authorize
  if (path === '/oauth/authorize') {
    const redirectUri = `${url.origin}/callback`;
    return Response.redirect(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo&state=${url.searchParams.get('state') || ''}`, 302);
  }

  return new Response('Not found', { status: 404 });
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
