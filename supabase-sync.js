/* ==========================================================================
   Supabase sync layer
   แนวคิด: โค้ดเดิมของเว็บอ่าน/เขียนข้อมูลผ่าน localStorage (readList/writeList)
   ไฟล์นี้ทำหน้าที่ "ซิงก์" ข้อมูลใน localStorage กับตารางบน Supabase เบื้องหลัง
   โดยไม่ต้องแก้โครงสร้างโค้ดเดิมทั้งหมด:
   - ตอนโหลดหน้า: ดึงข้อมูลล่าสุดจาก Supabase มาใส่ localStorage ก่อน render
   - ตอนเขียนข้อมูล (writeList): ส่งข้อมูลขึ้น Supabase ต่อเบื้องหลัง
   - Realtime: ถ้ามีการเปลี่ยนแปลงจากเครื่อง/แอดมินอื่น จะดึงข้อมูลใหม่มาใส่
     localStorage แล้วยิง synthetic 'storage' event เพื่อให้หน้าจอ re-render
     ทันที (ใช้กลไก window.addEventListener('storage', ...) ที่มีอยู่แล้วในโค้ดเดิม)
   ========================================================================== */
(function () {
  const TABLE_MAP = {
    freal_boxser_users: 'app_users',
    freal_boxser_topups: 'app_topups',
    freal_boxser_orders: 'app_orders',
    freal_boxser_products: 'app_products',
    freal_boxser_donations: 'app_donations',
  };

  function client() {
    return window.supabaseClient;
  }

  function debugAlert(message) {
    // แจ้ง error ของ Supabase แบบเห็นได้บนหน้าจอ (ชั่วคราว เพื่อ debug บนมือถือ/iPad ที่เปิด console ไม่สะดวก)
    if (window.showAlert) {
      window.showAlert({ title: 'Supabase error', message, type: 'error' });
    } else {
      console.error('[supabase debug]', message);
    }
  }

  async function pullTable(key) {
    const table = TABLE_MAP[key];
    if (!table || !client()) return;
    try {
      const { data, error } = await client()
        .from(table)
        .select('data')
        .order('updated_at', { ascending: false });
      if (error) {
        console.error('[supabase] pull error', table, error.message);
        debugAlert(`pull ${table}: ${error.message}`);
        return;
      }
      const list = (data || []).map((row) => row.data);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
      console.error('[supabase] pull exception', table, err);
      debugAlert(`pull ${table} exception: ${err.message || err}`);
    }
  }

  async function pullAll() {
    await Promise.all(Object.keys(TABLE_MAP).map((key) => pullTable(key)));
  }

  async function pushTable(key, list) {
    const table = TABLE_MAP[key];
    if (!table || !client()) return;
    try {
      const items = Array.isArray(list) ? list : [];
      const ids = items.map((item) => String(item?.id ?? ''));

      if (items.length) {
        const rows = items
          .filter((item) => item && item.id != null)
          .map((item) => ({ id: String(item.id), data: item, updated_at: new Date().toISOString() }));
        if (rows.length) {
          const { error } = await client().from(table).upsert(rows, { onConflict: 'id' });
          if (error) { console.error('[supabase] push upsert error', table, error.message); debugAlert(`push ${table}: ${error.message}`); }
        }
      }

      // ลบแถวที่ไม่มีอยู่ในลิสต์ปัจจุบันแล้ว (เช่น แอดมินลบรายการ)
      const { data: existing, error: selErr } = await client().from(table).select('id');
      if (!selErr && existing) {
        const toDelete = existing.map((row) => row.id).filter((id) => !ids.includes(id));
        if (toDelete.length) {
          const { error: delErr } = await client().from(table).delete().in('id', toDelete);
          if (delErr) { console.error('[supabase] push delete error', table, delErr.message); debugAlert(`delete ${table}: ${delErr.message}`); }
        }
      } else if (selErr) {
        debugAlert(`select-ids ${table}: ${selErr.message}`);
      }
    } catch (err) {
      console.error('[supabase] push exception', table, err);
      debugAlert(`push ${table} exception: ${err.message || err}`);
    }
  }

  function notifyLocalListeners(key) {
    try {
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: localStorage.getItem(key) }));
    } catch (err) {
      // เบราว์เซอร์บางตัวไม่รองรับ StorageEvent constructor แบบเต็ม ใช้ fallback
      const evt = document.createEvent('Event');
      evt.initEvent('storage', false, false);
      evt.key = key;
      evt.newValue = localStorage.getItem(key);
      window.dispatchEvent(evt);
    }
  }

  let subscribed = false;
  function subscribeRealtime() {
    if (subscribed || !client()) return;
    subscribed = true;

    const channel = client().channel('app-sync-channel');
    Object.entries(TABLE_MAP).forEach(([storageKey, table]) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
        await pullTable(storageKey);
        notifyLocalListeners(storageKey);
      });
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('[supabase] realtime connected');
      if (status === 'CHANNEL_ERROR') console.error('[supabase] realtime channel error');
    });
  }

  window.__syncPullAll = pullAll;
  window.__syncPush = (key, list) => { pushTable(key, list); };
  window.__syncSubscribeRealtime = subscribeRealtime;
})();
