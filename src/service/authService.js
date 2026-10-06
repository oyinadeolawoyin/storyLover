import { supabase } from '../lib/supabase';

export class AuthService {
  /** Log in with email and password. Throws an error if it fails. */
  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }

  /** Log out. */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /** Get the current session (null if nobody is logged in). */
  static async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Run a function whenever someone logs in or out.
   * Returns a subscription: call subscription.unsubscribe() to stop listening.
   */
  static onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return data.subscription;
  }
}