import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase Admin Client ────────────────────────────────────────────────────
// Uses the SERVICE ROLE KEY — gives admin-level access to bypass RLS.
// NEVER expose this on the frontend. Backend use only.

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
