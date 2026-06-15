import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only code (cron jobs, API routes).
// NEVER import this file from client components.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
