import { supabase } from '../lib/supabase';

export class QuizFeedbackService {
  /**
   * Save one rating (1 to 5), an email, and an optional name and review for a quiz tool.
   * Visitors can only insert, so there is no .select() here on purpose.
   */
  static async submit({ toolId, result, rating, review, name, email }) {
    const { error } = await supabase.from('quiz_feedback').insert({
      tool_id: toolId,
      result_id: result ?? null,
      rating,
      review: review?.trim() || null,
      name: name?.trim() || null,
      email: email?.trim().toLowerCase() || null,
    });

    if (error) throw error;
  }
}