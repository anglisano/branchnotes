import assert from 'node:assert/strict';
import { renderMarkdown } from '../../src/webview/markdownRenderer';

describe('markdown renderer', () => {
  it('renders external and resolved local images', () => {
    const html = renderMarkdown(
      '![externa](https://example.com/image.png)\n\n![local](media/image.png)',
      { resolveImageSrc: (src) => src === 'media/image.png' ? 'https://local-resource/image.png' : src }
    );

    assert.match(html, /<img src="https:\/\/example\.com\/image\.png" alt="externa" \/>/);
    assert.match(html, /<img src="https:\/\/local-resource\/image\.png" alt="local" \/>/);
  });

  it('removes local images that cannot be resolved', () => {
    const html = renderMarkdown('![fuera](../outside.png)', { resolveImageSrc: () => undefined });

    assert.doesNotMatch(html, /<img/);
  });

  it('sanitizes image attributes and raw HTML', () => {
    const html = renderMarkdown('<img src="https://example.com/image.png" onerror="alert(1)"><script>alert(1)</script>');

    assert.doesNotMatch(html, /<(?:img|script)|<[^>]*\bonerror=/);
    assert.match(html, /&lt;img/);
  });
});