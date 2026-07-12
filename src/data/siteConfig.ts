export const SITE_URL = 'https://XCmiaow.github.io';

export const absoluteUrl = (pathname: string) => new URL(pathname, SITE_URL).toString();
