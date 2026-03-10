/**
 * Supabase Client Configuration
 */

// שימי לב לשינוי בייבוא - אנחנו עוברים ל-auth-helpers
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// יצירת הלקוח בצורה שמתאימה ל-Next.js ותומכת בעוגיות
export const supabase = createClientComponentClient<Database>();

/**
 * פונקציית עזר לבדיקת חיבור
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('users_profile').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}

/**
 * קבלת המשתמש המחובר
 */
export async function getCurrentUser() {
  // בשימוש ב-auth-helpers עדיף להשתמש ב-getSession או getUser
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session.user;
}

/**
 * התנתקות
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}