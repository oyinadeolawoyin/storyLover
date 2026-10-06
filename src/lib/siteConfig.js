// Slugs of the categories that live in the nav menu only.
// They are hidden from Home, the All articles list, the filter pills and the category counts.
// Their own pages (/category/reviews and /category/off-the-page) still show them.
export const REVIEWS_SLUG = 'reviews'
export const OFF_THE_PAGE_SLUG = 'off-the-page'
export const NAV_ONLY_SLUGS = [REVIEWS_SLUG, OFF_THE_PAGE_SLUG]

// The name of the column in your `recommendations` table that holds the link.
// If you named it something else in Supabase (for example `links`), change it here.
export const RECOMMENDATION_LINK_COLUMN = 'link'