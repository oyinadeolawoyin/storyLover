import { supabase } from '../lib/supabase';
import { slugify } from '../utils/slugify';

// Post categories (Reviews, Story Development, ...)
export class CategoryService {
  /** All post categories, A to Z. */
  static async list() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  /** Add a new category (admin only). */
  static async create(name) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug: slugify(name) })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /** Rename a category (admin only). */
  static async update(id, name) {
    const { data, error } = await supabase
      .from('categories')
      .update({ name, slug: slugify(name) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /** Delete a category (admin only). Posts in it just become "no category". */
  static async delete(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
}