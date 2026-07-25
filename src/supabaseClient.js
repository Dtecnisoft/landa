import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jztoibexainhqsalihvb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6dG9pYmV4YWluaHFzYWxpaHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDk2MTIsImV4cCI6MjA4ODkyNTYxMn0.J3zS3SSdK_ONFALjeYF4poOhqZTi4kMBa6G2HsHfEfc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

