/**
 * Cloudflare Worker for Decap CMS OAuth.
 *
 * Required secrets:
 * - GITHUB_CLIENT_ID
 * - GITHUB_CLIENT_SECRET
 *
 * Optional variables:
 * - CMS_ORIGIN: allowed postMessage origin. Defaults to the public GitHub Pages origin.
 * - GITHUB_OAUTH_SCOPE: GitHub scope. Defaults to public_repo for the public Pages repo.
 */

const DEFAULT_CMS_ORIGIN = 'https://XCmiaow.github.io';
const DEFAULT_SCOPE = 'public_repo';
const STATE_COOKIE = 'decap_oauth_state';
const STATE_MAX_AGE_SECONDS = 600;
const MAX_STATE_LENGTH = 256;

function envValue(name, fallback = '') {
  return typeof globalThis[name] === 'string' && globalThis[name] ? globalThis[name] : fallback;
}

function baseHeaders(extra = {}) {
  return {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Robots-Tag': 'noindex',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    ...extra,
  };
}

function htmlHeaders({ nonce = '', extra = {} } = {}) {
  const scriptSrc = nonce ? `script-src 'nonce-${nonce}'` : "script-src 'none'";
  return baseHeaders({
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; ${scriptSrc}; base-uri 'none'; frame-ancestors 'none'`,
    ...extra,
  });
}

function textHeaders(extra = {}) {
  return baseHeaders({
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    ...extra,
  });
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

function trustedCmsOrigin() {
  const configured = envValue('CMS_ORIGIN', DEFAULT_CMS_ORIGIN);
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:') return DEFAULT_CMS_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_CMS_ORIGIN;
  }
}

function readCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function stateCookie(value, maxAge = STATE_MAX_AGE_SECONDS) {
  return `${STATE_COOKIE}=${encodeURIComponent(value)}; Path=/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function errorResponse(message, status = 400) {
  return new Response(message, {
    status,
    headers: textHeaders({ 'Set-Cookie': stateCookie('', 0) }),
  });
}

async function tokenResponse(code, redirectUri) {
  const clientId = envValue('GITHUB_CLIENT_ID');
  const clientSecret = envValue('GITHUB_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    return { ok: false, status: 500, data: { error_description: 'OAuth worker is not configured.' } };
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && !data.error, status: response.status, data };
}

async function handleCallback(request, url) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = readCookie(request, STATE_COOKIE);
  const redirectUri = `${url.origin}/callback`;
  const cmsOrigin = trustedCmsOrigin();

  if (!code || !state || !cookieState || safeDecode(cookieState) !== state) {
    return errorResponse('OAuth state verification failed.', 403);
  }

  const token = await tokenResponse(code, redirectUri);
  if (!token.ok || !token.data.access_token) {
    return errorResponse('GitHub OAuth token exchange failed.', token.status === 401 ? 401 : 502);
  }

  const message = `authorization:github:${token.data.access_token}:${token.data.scope || ''}`;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const html = `<!doctype html>
<html>
  <body>
    <script nonce="${nonce}">
      const message = ${JSON.stringify(message)};
      const origin = ${JSON.stringify(cmsOrigin)};
      if (window.opener) window.opener.postMessage(message, origin);
      window.close();
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: htmlHeaders({ nonce, extra: { 'Set-Cookie': stateCookie('', 0) } }),
  });
}

function handleAuthorize(url) {
  const clientId = envValue('GITHUB_CLIENT_ID');
  if (!clientId) return errorResponse('OAuth worker is not configured.', 500);

  const requestedState = url.searchParams.get('state');
  const state = requestedState && requestedState.length <= MAX_STATE_LENGTH ? requestedState : crypto.randomUUID();
  const redirectUri = `${url.origin}/callback`;
  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', clientId);
  githubUrl.searchParams.set('redirect_uri', redirectUri);
  githubUrl.searchParams.set('scope', envValue('GITHUB_OAUTH_SCOPE', DEFAULT_SCOPE));
  githubUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store',
      Location: githubUrl.toString(),
      'Set-Cookie': stateCookie(state),
    },
  });
}

async function handleRequest(request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: textHeaders({ Allow: 'GET' }),
    });
  }

  const url = new URL(request.url);

  if (url.pathname === '/callback') return handleCallback(request, url);
  if (url.pathname === '/oauth/authorize') return handleAuthorize(url);

  return new Response('Not found', {
    status: 404,
    headers: textHeaders(),
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
