import { supabase } from '../lib/supabase';

export class NewsletterService {
  /** All emails, newest first. */
  static async list() {
    const { data, error } = await supabase
      .from('newsletters')
      .select('id, subject, status, sent_at, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase.from('newsletters').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  /** Create (no id) or update (id) a draft. Returns the saved row. */
  static async save({ id, subject, preview_text, body }) {
    const row = { subject, preview_text: preview_text || null, body };
    const query = id
      ? supabase.from('newsletters').update(row).eq('id', id)
      : supabase.from('newsletters').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('newsletters').delete().eq('id', id);
    if (error) throw error;
  }

  /** mode 'test' sends only to you. mode 'send' goes to the whole list. */
  static async send(id, mode = 'send') {
    const { data, error } = await supabase.functions.invoke('send-newsletter', { body: { id, mode } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  }
}