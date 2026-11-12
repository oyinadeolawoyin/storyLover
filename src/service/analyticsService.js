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

  /** A reader reached a step of a quiz tool (used to see where people stop). */
  static quizStep({ tool, step, n }) {
    AnalyticsService.track('quiz_step', { tool, step, n });
  }

  /** A reader finished a quiz and saw their result. */
  static quizComplete({ tool, result }) {
    AnalyticsService.track('quiz_complete', { tool, result });
  }

  /** A reader clicked the share button on a quiz result. */
  static quizShare({ tool, result, method }) {
    AnalyticsService.track('quiz_share', { tool, result, method });
  }

  /** A reader sent a star rating for a quiz. */
  static quizFeedback({ tool, rating }) {
    AnalyticsService.track('quiz_feedback', { tool, rating });
  }

  /** A reader subscribed from the box at the end of a quiz. */
  static quizSubscribe({ tool }) {
    AnalyticsService.track('quiz_subscribe', { tool });
  }
}