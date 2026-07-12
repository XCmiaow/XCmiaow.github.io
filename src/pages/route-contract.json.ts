import { siteRoutes } from '../lib/siteRoutes';

const appShell = [
  ...siteRoutes
    .filter((route) => route.kind === 'static' && route.pwa)
    .flatMap((route) => [route.zh.path, route.en.path]),
  '/styles/site.css',
  '/manifest.json',
  '/route-contract.json',
]
  .filter((route, index, routes) => routes.indexOf(route) === index)
  .sort();

export function GET() {
  return new Response(JSON.stringify({ version: 1, appShell }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
