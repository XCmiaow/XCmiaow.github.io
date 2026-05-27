/** Extract the current page key from a URL pathname. */
export function getPageKey(pathname: string): string {
  const withoutEn = pathname.replace(/^\/en(?:\/|$)/, '/').replace(/\/+$/, '');
  const key = withoutEn.replace(/^\/+/, '');
  return key === '' || key === 'index' ? '' : key.replace(/\/$/, '');
}

/** Build language-switch URLs with anchor preservation. */
export function getLangUrls(pathname: string): { zh: string; en: string } {
  const key = getPageKey(pathname);
  return {
    zh: key ? `/${key}` : '/',
    en: key ? `/en/${key}` : '/en/',
  };
}

/** Get base path for a language. */
export function getBasePath(lang: 'zh' | 'en'): string {
  return lang === 'zh' ? '' : '/en';
}
