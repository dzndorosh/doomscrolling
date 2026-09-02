export const DEFAULT_REMOTE_CATALOG_URL = 'https://dzndorosh.github.io/doomscrolling/catalog/youtube-catalog.json';
export function remoteCatalogUrl(override?: string): string { return override || DEFAULT_REMOTE_CATALOG_URL; }
