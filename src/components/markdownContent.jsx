import { Children } from 'react';
import ReactMarkdown from 'react-markdown';

// Turns a video link into something we can show.
function getEmbed(href = '') {
  // Add https:// if it was pasted without it
  let raw = href.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  // Uploaded video file
  if (/\.(mp4|webm)$/i.test(url.pathname)) return { type: 'file', src: raw };

  // YouTube: watch?v=ID, /shorts/ID, /live/ID, /embed/ID
  if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
    let id = url.searchParams.get('v');
    if (!id && ['shorts', 'live', 'embed', 'v'].includes(parts[0])) id = parts[1];
    if (id) return { type: 'embed', src: `https://www.youtube.com/embed/${id}` };
  }

  // YouTube short links: youtu.be/ID
  if (host === 'youtu.be' && parts[0]) {
    return { type: 'embed', src: `https://www.youtube.com/embed/${parts[0]}` };
  }

  // Vimeo: vimeo.com/123456
  if (host === 'vimeo.com' && /^\d+$/.test(parts[0] ?? '')) {
    return { type: 'embed', src: `https://player.vimeo.com/video/${parts[0]}` };
  }

  return null;
}

const components = {
  // An image: ![description](link)
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ''} loading="lazy" style={{ maxWidth: '100%', height: 'auto' }} />
  ),

  // A link. If the link text is exactly "video", show a player instead.
  a: ({ href, children }) => {
    const text = Children.toArray(children).join('').trim().toLowerCase();

    if (text === 'video') {
      const embed = getEmbed(href);

      if (embed?.type === 'file') {
        return (
          <video
            controls
            preload="metadata"
            src={embed.src}
            style={{ display: 'block', maxWidth: '100%' }}
          />
        );
      }

      if (embed?.type === 'embed') {
        return (
          <iframe
            src={embed.src}
            title="Embedded video"
            loading="lazy"
            allowFullScreen
            style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', border: 0 }}
          />
        );
      }
    }

    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
};

// Markdown needs a space after the # signs for a heading ("### Title").
// This adds the space if it was forgotten, so "###Title" still becomes a heading.
// Only ## to ###### are fixed, so a line that starts with a single #hashtag stays as it is.
function fixHeadings(text = '') {
  return text.replace(/^(#{2,6})(?=[^\s#])/gm, '$1 ');
}

export default function MarkdownContent({ content, className }) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{fixHeadings(content || '')}</ReactMarkdown>
    </div>
  );
}