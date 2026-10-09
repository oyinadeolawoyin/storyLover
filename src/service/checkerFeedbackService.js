import { supabase } from '../lib/supabase';

export class CheckerFeedbackService {
  /**
   * Save a rating. Anyone can do this, no subscription needed.
   * Like subscribers, there is no .select() on purpose: visitors may insert but not read.
   */
  static async submit({ rating, comment, email, answers }) {
    const { error } = await supabase.from('checker_feedback').insert({
      rating,
      comment: comment?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      shared_answers: answers ?? null,
    });
    if (error) throw error;
  }
}