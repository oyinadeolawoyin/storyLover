import { supabase } from '../lib/supabase';
import { slugify } from '../utils/slugify';

export class RecommendationCategoryService {
  static async list() {
    const { data, error } = await supabase
      .from('recommendation_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async create(name) {
    const { data, error } = await supabase
      .from('recommendation_categories')
      .insert({ name, slug: slugify(name) })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, name) {
    const { data, error } = await supabase
      .from('recommendation_categories')
      .update({ name, slug: slugify(name) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('recommendation_categories').delete().eq('id', id);
    if (error) throw error;
  }
}