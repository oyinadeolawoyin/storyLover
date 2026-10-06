import { useState } from 'react';
import { AnalyticsService } from '../service/analyticsService';

// Share buttons for a post. Each click is counted in Umami as a "share"
// event with the post slug and the platform name.
// The Tailwind classes are basic: change them to match your design.
export default function ShareButtons({ slug, title }) {
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/posts/${slug}`;
  const text = encodeURIComponent(title);
  const link = encodeURIComponent(url);

  const buttonClass =
    'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium hover:opacity-80';

  async function handleCopy() {
    AnalyticsService.share({ slug, platform: 'copy-link' });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Share:</span>

      <button type="button" onClick={handleCopy} className={buttonClass}>
        {copied ? 'Link copied!' : 'Copy link'}
      </button>

      <a
        href={`https://wa.me/?text=${text}%20${link}`}
        target="_blank"
        rel="noreferrer"
        className={buttonClass}
        onClick={() => AnalyticsService.share({ slug, platform: 'whatsapp' })}
      >
        WhatsApp
      </a>

      <a
        href={`https://twitter.com/intent/tweet?text=${text}&url=${link}`}
        target="_blank"
        rel="noreferrer"
        className={buttonClass}
        onClick={() => AnalyticsService.share({ slug, platform: 'x' })}
      >
        X
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${link}`}
        target="_blank"
        rel="noreferrer"
        className={buttonClass}
        onClick={() => AnalyticsService.share({ slug, platform: 'facebook' })}
      >
        Facebook
      </a>
    </div>
  );
}