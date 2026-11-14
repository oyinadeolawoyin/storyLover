import { supabase } from '../lib/supabase';

// Only these columns are ever asked for. The email is never on a comment.
const COLUMNS = 'id, reply_to_id, author_name, body, is_author, created_at, edited_at';

// Keep only the public fields
function toPublic(data) {
  return {
    id: data.id,
    reply_to_id: data.reply_to_id,
    author_name: data.author_name,
    body: data.body,
    is_author: data.is_author,
    created_at: data.created_at,
    edited_at: data.edited_at,
  };
}

export class CommentService {
  /** All comments on a post, oldest first (chat order). Replies point at their original with reply_to_id. */
  static async list(postId) {
    const { data, error } = await supabase
      .from('comments')
      .select(COLUMNS)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) throw error;
    return data;
  }

  /**
   * Post a comment. Goes through the post_comment() database function.
   * Email is optional and is NOT used to subscribe anyone. Name falls back to "Anonymous".
   * editToken is a random secret made in the browser; the database keeps only its hash,
   * and it is what lets an anonymous commenter edit their comment later.
   * Errors you can get: post_not_found, reply_target_missing, rate_limited.
   */
  static async create({ postId, email = '', name = 'Anonymous', body, replyToId = null, editToken = null }) {
    const { data, error } = await supabase.rpc('post_comment', {
      p_post_id: postId,
      p_email: email || null,
      p_name: name || 'Anonymous',
      p_body: body,
      p_reply_to: replyToId,
      p_edit_token: editToken,
    });

    if (error) throw error;

    return toPublic(data);
  }

  /**
   * Edit your own comment. The database accepts either the edit token from when the comment
   * was posted, or (for older comments) the email that wrote it.
   * Errors you can get: not_allowed.
   */
  static async update({ id, email = '', editToken = '', body }) {
    const { data, error } = await supabase.rpc('edit_comment', {
      p_comment_id: id,
      p_email: email || null,
      p_edit_token: editToken || null,
      p_body: body,
    });

    if (error) throw error;
    return toPublic(data);
  }

  // ---------- Admin only (the database blocks everyone else) ----------

  /** True only when the logged-in user is the admin. Used just to show or hide the Delete button;
   *  the database is what actually enforces who can delete. */
  static async isAdmin() {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) return false;
    return data === true;
  }

  /** Delete a comment. Replies to it stay, and show "original comment was deleted". */
  static async delete(id) {
    // .select() returns the deleted rows, so we can tell when the database silently blocked it
    const { data, error } = await supabase.from('comments').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('not_deleted');
  }
}