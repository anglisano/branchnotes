import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

export function renderMarkdown(content: string): string {
  const rendered = markdown.render(content);
  return sanitizeHtml(rendered, {
    allowedTags: [
      'a', 'b', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'hr', 'i', 'li', 'ol', 'p', 'pre', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      code: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
}
