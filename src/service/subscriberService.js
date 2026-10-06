import { supabase } from '../lib/supabase';

export class SubscriberService {
  /**
   * Add an email to the list. Anyone can do this.
   * Note: there is no .select() here on purpose. Visitors are allowed to
   * insert but not to read the list, so we must not ask for the row back.
   */
  static async subscribe(email) {
    const clean = email.trim().toLowerCase();
    const { error } = await supabase.from('subscribers').insert({ email: clean });
    if (error) throw error;
  }

  // ---------- Admin only (the database blocks everyone else) ----------

  /** All subscribers, newest first. */
  static async list() {
    const { data, error } = await supabase
      .from('subscribers')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /** Remove a subscriber. */
  static async delete(id) {
    const { error } = await supabase.from('subscribers').delete().eq('id', id);
    if (error) throw error;
  }
}