/* ==========================================================================
   Supabase connection config
   >>> ค่านี้คือ URL + anon public key ของโปรเจกต์ Supabase <<<
   anon key ใช้ฝั่ง client ได้ปกติ (ถูกออกแบบมาให้ public) แต่การเข้าถึงข้อมูล
   จริง ๆ ควบคุมด้วย Row Level Security (RLS) ที่ตั้งค่าไว้ในฝั่ง Supabase
   ========================================================================== */
const SUPABASE_URL = 'https://qhkdnqvkqfukebetuqlo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoa2RucXZrcWZ1a2ViZXR1cWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzExMjYsImV4cCI6MjEwMDkwNzEyNn0.ksOUyHUZlBU6HLASkTMl83f3UWUykb7JjEPTPc32T54';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
