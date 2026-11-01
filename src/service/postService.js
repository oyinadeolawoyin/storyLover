import { supabase } from '../lib/supabase';

const PAGE_SIZE = 10;

/**
 * "Live" = published, archived posts excluded, and the publish date has arrived.
 * A published post with a FUTURE date is scheduled, so visitors do not see it yet.
 * Every public query goes through this, because you are the admin and the database
 * would otherwise show you drafts, archived and scheduled posts on the live site too.
 */
function live(query) {
  return query.eq('status', 'published').lte('published_at', new Date().toISOString());
}

export class PostService {
  /**
   * List live posts. Pinned posts come first when sorting by newest.
   * Options: { page = 1, pageSize = 10, categorySlug, excludeCategorySlugs = [], search, sort = 'newest' | 'oldest' }
   * Returns { posts, total, page, pageSize, totalPages }
   */
  static async list({
    page = 1,
    pageSize = PAGE_SIZE,
    categorySlug,
    excludeCategorySlugs = [],
    search,
    sort = 'newest',
  } = {}) {
    // Look up the ids of the categories to hide (posts with no category are kept)
    let excludeIds = [];
    if (excludeCategorySlugs.length > 0) {
      const { data: cats, error: catError } = await supabase
        .from('categories')
        .select('id')
        .in('slug', excludeCategorySlugs);
      if (catError) throw catError;
      excludeIds = cats.map((c) => c.id);
    }

    // !inner makes the filter apply to the posts themselves,
    // otherwise posts without a match would still be returned.
    const categorySelect = categorySlug ? 'category:categories!inner(*)' : 'category:categories(*)';

    let query = live(
      supabase
        .from('posts')
        .select(`id, title, slug, excerpt, cover_image, read_minutes, published_at, pinned, ${categorySelect}`, {
          count: 'exact',
        })
    );

    // Pinned posts first, then by date
    if (sort !== 'oldest') query = query.order('pinned', { ascending: false });
    query = query.order('published_at', { ascending: sort === 'oldest' });

    if (categorySlug) query = query.eq('category.slug', categorySlug);

    if (excludeIds.length > 0) {
      query = query.or(`category_id.is.null,category_id.not.in.(${excludeIds.join(',')})`);
    }

    // Search the title and excerpt. We strip characters that have a special
    // meaning in the filter syntax so a stray comma or bracket cannot break it.
    const term = (search ?? '').replace(/[%,()*\\]/g, ' ').trim();
    if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return {
      posts: data,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  /** How many live posts each category has. Returns { [category_id]: number } */
  static async countsByCategory() {
    const { data, error } = await live(supabase.from('posts').select('category_id'));

    if (error) throw error;

    const counts = {};
    for (const row of data) {
      if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
    }
    return counts;
  }

  /** Get one live post by slug, with its category. */
  static async getBySlug(slug) {
    const { data, error } = await live(
      supabase.from('posts').select('*, category:categories(*)').eq('slug', slug)
    ).single();

    if (error) throw error;
    return data;
  }

  /** Other live posts from the same category (and only that category). */
  static async related({ categoryId, excludeId, limit = 3 }) {
    if (!categoryId) return [];

    const { data, error } = await live(
      supabase
        .from('posts')
        .select('id, title, slug, cover_image, read_minutes, published_at, category:categories(*)')
        .eq('category_id', categoryId)
        .neq('id', excludeId)
    )
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * A mix of other live posts from different categories.
   * One post per category first, other categories before the current one, then fills up.
   */
  static async mixed({ excludeIds = [], categoryId, limit = 3 }) {
    let query = live(
      supabase
        .from('posts')
        .select('id, title, slug, excerpt, cover_image, read_minutes, published_at, category_id, category:categories(*)')
    )
      .order('published_at', { ascending: false })
      .limit(30);

    if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.join(',')})`);

    const { data, error } = await query;
    if (error) throw error;

    const seen = new Set();
    const firstOfEach = [];
    const rest = [];
    for (const post of data) {
      const key = post.category_id ?? 'none';
      if (seen.has(key)) {
        rest.push(post);
      } else {
        seen.add(key);
        firstOfEach.push(post);
      }
    }

    const otherCategories = firstOfEach.filter((p) => p.category_id !== categoryId);
    const sameCategory = firstOfEach.filter((p) => p.category_id === categoryId);

    return [...otherCategories, ...sameCategory, ...rest].slice(0, limit);
  }

  /** The next older live post in the same category, or null. */
  static async next({ categoryId, publishedAt, excludeId }) {
    let query = live(
      supabase
        .from('posts')
        .select('id, title, slug, cover_image, read_minutes, published_at, category:categories(*)')
        .neq('id', excludeId)
        .lt('published_at', publishedAt)
    )
      .order('published_at', { ascending: false })
      .limit(1);

    if (categoryId) query = query.eq('category_id', categoryId);

    const { data, error } = await query;
    if (error) throw error;
    return data[0] ?? null;
  }

  // ============================================================
  // ADMIN METHODS
  // These only work when you are logged in as the admin user.
  // The database policies block them for everyone else.
  // ============================================================

  /** List ALL posts (drafts, scheduled and archived included), newest first. For the admin list. */
  static async listAll() {
    const { data, error } = await supabase
      .from('posts')
      .select(
        'id, title, slug, status, pinned, published_at, created_at, category_id, category:categories(id, name)'
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /** Get one post by id (any status). Used by the edit form. */
  static async getById(id) {
    const { data, error } = await supabase
      .from('posts')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new post. Pass an object like { title, slug, content, category_id, ... }
   * To schedule: status 'published' with a future published_at (ISO string).
   */
  static async create(post) {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /** Update an existing post. Pass only the fields you want to change. */
  static async update(id, changes) {
    const { data, error } = await supabase
      .from('posts')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Change the status: 'draft', 'published' or 'archived'.
   * `extra` can carry more fields, e.g. { published_at: new Date().toISOString() } to publish now.
   */
  static async setStatus(id, status, extra = {}) {
    return PostService.update(id, { status, ...extra });
  }

  /** Pin or unpin a post (pinned posts show first). */
  static async setPinned(id, pinned) {
    return PostService.update(id, { pinned });
  }

  /** Delete a post for good. */
  static async delete(id) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  }
}