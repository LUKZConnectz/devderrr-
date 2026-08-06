/* ==========================================================================
   Supabase connection config
   >>> ค่านี้คือ URL + anon public key ของโปรเจกต์ Supabase <<<
   anon key ใช้ฝั่ง client ได้ปกติ (ถูกออกแบบมาให้ public) แต่การเข้าถึงข้อมูล
   จริง ๆ ควบคุมด้วย Row Level Security (RLS) ที่ตั้งค่าไว้ในฝั่ง Supabase
   ========================================================================== */
const SUPABASE_URL = 'https://nhdmrthyfeuccrqzyjte.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZG1ydGh5ZmV1Y2NycXp5anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Mzc5NTYsImV4cCI6MjEwMTUxMzk1Nn0.6b7VGQKnG3SIEcZAUVMvylIoTpKMLd7vi_jYCNXTS44';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
