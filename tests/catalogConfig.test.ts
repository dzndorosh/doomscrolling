import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_REMOTE_CATALOG_URL, remoteCatalogUrl } from '../src/youtube/catalogConfig.js';
import { loadCatalog, validateCatalog } from '../src/youtube/catalog.js';

describe('production catalog bootstrap', () => {
  it('uses the Pages URL by default and accepts an override', () => {
    expect(DEFAULT_REMOTE_CATALOG_URL).toBe('https://dzndorosh.github.io/doomscrolling/catalog/youtube-catalog.json');
    expect(remoteCatalogUrl()).toBe(DEFAULT_REMOTE_CATALOG_URL);
    expect(remoteCatalogUrl('https://example.com/catalog.json')).toBe('https://example.com/catalog.json');
  });

  it('uses the bundled catalog when remote/cache are unavailable', () => {
    const fallback = validateCatalog(JSON.parse(readFileSync(join(process.cwd(), 'config/youtube-catalog.fixture.json'), 'utf8')));
    expect(fallback).not.toBeNull();
    const loaded = loadCatalog({ fallback: fallback!, cacheFile: join(process.cwd(), 'tests/.missing-youtube-cache.json'), remoteUrl: DEFAULT_REMOTE_CATALOG_URL });
    expect(loaded.videos).toHaveLength(66);
  });

  it('bundled fixture contains 66 unique validated videos', () => {
    const catalog = validateCatalog(JSON.parse(readFileSync(join(process.cwd(), 'config/youtube-catalog.fixture.json'), 'utf8')));
    expect(catalog?.videos).toHaveLength(66);
    expect(new Set(catalog?.videos.map((video) => video.videoId)).size).toBe(66);
  });
});
