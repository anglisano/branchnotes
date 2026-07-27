import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

export interface MarkdownRenderOptions {
  resolveImageSrc?: (src: string) => string | undefined;
}

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

markdown.renderer.rules.image = (tokens, index, renderOptions, env, self) => {
  const src = tokens[index].attrGet('src');
  const imageOptions = env as MarkdownRenderOptions;
  const resolvedSrc = src && imageOptions.resolveImageSrc?.(src);
  if (src && imageOptions.resolveImageSrc && !resolvedSrc) {
    return '';
  } else if (resolvedSrc) {
    tokens[index].attrSet('src', resolvedSrc);
  }
  if (!tokens[index].attrGet('alt')) {
    tokens[index].attrSet('alt', tokens[index].children?.[0]?.content ?? '');
  }
  return self.renderToken(tokens, index, renderOptions);
};

export function renderMarkdown(content: string, options: MarkdownRenderOptions = {}): string {
  const rendered = markdown.render(content, options);
  return sanitizeHtml(rendered, {
    allowedTags: [
      'a', 'b', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      code: ['class'],
      img: ['src', 'alt', 'title']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data', 'vscode-resource']
  });
}
