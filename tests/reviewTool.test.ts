import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('maintainer review tool isolation', () => {
  it('is available from a clean checkout', () => {
    for (const file of ['review.html', 'review.js', 'review.css']) {
      expect(existsSync(join(process.cwd(), 'tools/catalog-review', file))).toBe(true);
    }
  });

  it('is not a runtime dependency', () => {
    const runtime = readFileSync(join(process.cwd(), 'src/youtube/catalogProvider.ts'), 'utf8');
    expect(runtime).not.toContain('catalog-review');
  });
});
