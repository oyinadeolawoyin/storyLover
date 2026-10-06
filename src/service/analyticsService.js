// A small wrapper around Umami. If the Umami script is blocked
// (ad blocker) or not loaded yet, these calls quietly do nothing,
// so the site never breaks because of analytics.
export class AnalyticsService {
    /** Send a custom event, e.g. track('share', { platform: 'whatsapp' }) */
    static track(name, data = {}) {
      try {
        if (typeof window !== 'undefined' && window.umami) {
          window.umami.track(name, data);
        }
      } catch (err) {
        console.warn('Analytics error:', err);
      }
    }
  
    /** A reader reached the end of a post and stayed long enough. */
    static readComplete({ slug, category }) {
      AnalyticsService.track('read_complete', { slug, category: category ?? 'none' });
    }
  
    /** A reader clicked a share button. */
    static share({ slug, platform }) {
      AnalyticsService.track('share', { slug, platform });
    }
  }