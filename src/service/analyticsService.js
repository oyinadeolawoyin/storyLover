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

  // ---------- Story Clarity Checker ----------
  // None of these send what the writer typed. Only question numbers, counts and choices.

  /** Someone clicked "Try the Story Clarity Checker" (mood: 'try' or 'again'), and from which page. */
  static checkerCtaClick({ from, mood }) {
    AnalyticsService.track('checker_cta_click', { from, mood });
  }

  /** Someone pressed Start (or "Continue where I left off") on the first screen. */
  static checkerStart({ resumed, answered }) {
    AnalyticsService.track('checker_start', { resumed: resumed ? 'yes' : 'no', answered });
  }

  /**
   * A question was shown. Count these per question to see where people drop off.
   * `step` is written like "05-need" so the list sorts in question order in Umami.
   */
  static checkerQuestion({ number, key }) {
    AnalyticsService.track('checker_question', { question: number, step: `${String(number).padStart(2, '0')}-${key}` });
  }

  /** Someone moved on from a question without answering it. */
  static checkerSkip({ number, key }) {
    AnalyticsService.track('checker_skip', { question: number, step: `${String(number).padStart(2, '0')}-${key}` });
  }

  /** Someone reached "your story so far" straight from the last question. */
  static checkerFinish({ answered, blanks, ending }) {
    AnalyticsService.track('checker_finish', { answered, blanks, ending });
  }

  /** Someone left the page while still on a question. This is the "stopped at question N" event. */
  static checkerExit({ number, key }) {
    AnalyticsService.track('checker_exit', { question: number, step: `${String(number).padStart(2, '0')}-${key}` });
  }

  /** The PDF was downloaded. */
  static checkerPdf() {
    AnalyticsService.track('checker_pdf');
  }

  /** Someone subscribed using the checker's own email form (source: 'cta' or 'result'). */
  static checkerSubscribe({ source }) {
    AnalyticsService.track('checker_subscribe', { source });
  }

  /** Someone sent a star rating. */
  static checkerRating({ rating }) {
    AnalyticsService.track('checker_rating', { rating });
  }
}