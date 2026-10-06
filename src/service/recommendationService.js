import { supabase } from '../lib/supabase';

export class RecommendationService {
  /** All recommendations with their category, A to Z. Public. */
  static async list() {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*, category:recommendation_categories(id, name, slug)')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  // ---------- Admin only (the database blocks everyone else) ----------

  static async create(item) {
    const { data, error } = await supabase
      .from('recommendations')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, changes) {
    const { data, error } = await supabase
      .from('recommendations')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('recommendations').delete().eq('id', id);
    if (error) throw error;
  }
}