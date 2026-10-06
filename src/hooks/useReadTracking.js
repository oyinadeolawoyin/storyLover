import { useEffect, useRef } from 'react';
import { AnalyticsService } from '@/service/analyticsService';

/**
 * Counts a post as "read" when the reader has reached the end of it
 * AND has spent a minimum time on the page (about 30% of the reading
 * time, but never less than 10 seconds or more than 90 seconds).
 * It fires once per post view.
 *
 * Usage inside the Post page:
 *   const endRef = useReadTracking({ enabled: Boolean(post), slug: post?.slug,
 *                                    category: post?.category?.name, readMinutes: post?.read_minutes });
 *   ...
 *   <div ref={endRef} />   // put this right after the post content
 */
export function useReadTracking({ enabled, slug, category, readMinutes }) {
  const endRef = useRef(null);

  useEffect(() => {
    if (!enabled || !slug) return;
    const el = endRef.current;
    if (!el) return;

    const minMs = Math.min(Math.max((readMinutes || 1) * 60 * 1000 * 0.3, 10000), 90000);
    const start = Date.now();
    let reachedEnd = false;
    let done = false;
    let timer = null;

    function maybeFire() {
      if (done || !reachedEnd) return;
      const wait = minMs - (Date.now() - start);
      if (wait <= 0) {
        done = true;
        AnalyticsService.readComplete({ slug, category });
      } else {
        clearTimeout(timer);
        timer = setTimeout(maybeFire, wait);
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        reachedEnd = true;
        observer.disconnect();
        maybeFire();
      }
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [enabled, slug, category, readMinutes]);

  return endRef;
}