/* ==========================================================================
   ข้อมูลช่องทางการชำระเงิน (บัญชีธนาคาร / พร้อมเพย์)
   >>> แก้ไขค่าด้านล่างนี้เป็นข้อมูลจริงของร้านได้เลย ตอนนี้เป็นข้อมูลสุ่มชั่วคราว <<<
   ========================================================================== */
const PAYMENT_CONFIG = {
  bankName: 'ธนาคารกสิกรไทย (KBank)',
  accountName: 'ร้าน Freal Boxser',
  accountNumber: '123-4-56789-0',
  promptpayId: '0891234567', // เบอร์โทรศัพท์พร้อมเพย์ (ตัวอย่าง) — ใส่เบอร์หรือเลขบัตร ปชช. จริงได้
  promptpayLabel: 'พร้อมเพย์ (เบอร์โทรศัพท์)',
};

const AUTH_KEY = 'freal_boxser_user';
const ALERT_TIMEOUT = 4200;
const CART_KEY = 'freal_boxser_cart';
const ORDERS_KEY = 'freal_boxser_orders';
const TOPUPS_KEY = 'freal_boxser_topups';
const PRODUCTS_KEY = 'freal_boxser_products';
const DONATE_KEY = 'freal_boxser_donations';
const THEME_KEY = 'freal_boxser_theme';
const USERS_KEY = 'freal_boxser_users';
const PRODUCT = { id: 'night-vision', name: 'Night Vision Goggles', description: 'อุปกรณ์มองกลางคืน เหมาะสำหรับภารกิจลับหรือดูแลเวลากลางคืน', price: 3500, stock: 4, lowStock: 3, featured: true };

function getUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function setUser(user) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('setUser failed:', err);
    showAlert({ title: 'บันทึกข้อมูลผู้ใช้ไม่สำเร็จ', message: 'พื้นที่จัดเก็บข้อมูลในเบราว์เซอร์เต็ม', type: 'error' });
  }
}

function refreshIcons(root = document) {
  if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' }, root });
}

function ensureAlertRegion() {
  let region = document.querySelector('[data-alert-region]');
  if (!region) {
    region = document.createElement('div');
    region.className = 'alert-region';
    region.dataset.alertRegion = '';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(region);
  }
  return region;
}

/* ---- PromptPay QR payload generator (EMVCo / มาตรฐานพร้อมเพย์) ---- */
function ppPad(str, len) { str = String(str); while (str.length < len) str = '0' + str; return str; }
function ppField(id, value) { return `${id}${ppPad(value.length, 2)}${value}`; }
function crc16ccitt(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return ppPad(crc.toString(16).toUpperCase(), 4);
}
function generatePromptPayPayload(target, amount) {
  const digits = String(target).replace(/[^0-9]/g, '');
  let field29;
  if (digits.length >= 13) {
    // เลขบัตรประชาชน 13 หลัก
    field29 = ppField('00', 'A000000677010111') + ppField('02', ppPad(digits, 13));
  } else {
    // เบอร์โทรศัพท์ -> แปลงเป็นรูปแบบ 66xxxxxxxxx (13 หลัก)
    const local = digits.replace(/^0/, '');
    field29 = ppField('00', 'A000000677010111') + ppField('01', ppPad('66' + local, 13));
  }
  const parts = [
    ppField('00', '01'),
    ppField('01', amount ? '12' : '11'),
    ppField('29', field29),
    ppField('53', '764'),
  ];
  if (amount) parts.push(ppField('54', Number(amount).toFixed(2)));
  parts.push(ppField('58', 'TH'));
  const partial = parts.join('') + '6304';
  return partial + crc16ccitt(partial);
}

function copyToClipboard(text, label = 'คัดลอกแล้ว') {
  const done = () => showAlert({ title: label, message: text, type: 'success' });
  const fail = () => showAlert({ title: 'คัดลอกไม่สำเร็จ', message: 'กรุณาคัดลอกด้วยตนเอง', type: 'error' });
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fail);
  } else {
    try {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
      done();
    } catch { fail(); }
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}


function readList(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}

function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (window.__syncPush) window.__syncPush(key, value); // ส่งข้อมูลขึ้น Supabase เบื้องหลัง (ไม่บล็อก UI)
    return true;
  } catch (err) {
    console.error('localStorage write failed:', key, err);
    showAlert({ title: 'บันทึกข้อมูลไม่สำเร็จ', message: 'พื้นที่จัดเก็บข้อมูลในเบราว์เซอร์เต็ม กรุณาลบรายการเก่าที่มีรูปภาพออกบ้าง แล้วลองใหม่อีกครั้ง', type: 'error' });
    return false;
  }
}

/* บีบอัด/ย่อขนาดรูปก่อนแปลงเป็น base64 เพื่อไม่ให้พื้นที่ localStorage เต็มเร็วเกินไป */
function compressImageFile(file, maxDim = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image decode failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function getProducts() {
  const products = readList(PRODUCTS_KEY);
  return products.length ? products : Array.from({ length: 10 }, (_, index) => ({ ...PRODUCT, id: `${PRODUCT.id}-${index + 1}`, featured: index === 0 }));
}

function saveProducts(products) { writeList(PRODUCTS_KEY, products); }

function getUsers() { return readList(USERS_KEY); }
function saveUsers(users) { writeList(USERS_KEY, users); }
function findUser(username) { return getUsers().find((item) => String(item.username).toLowerCase() === String(username).toLowerCase()); }

function getTopups() { return readList(TOPUPS_KEY); }
function saveTopups(topups) { writeList(TOPUPS_KEY, topups); }

function isAdmin(user = getUser()) { return user?.role === 'admin' || String(user?.username || '').toLowerCase() === 'admin'; }

function formatMoney(value) {
  return `฿ ${Number(value || 0).toFixed(2)}`;
}

function makeId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function addCartItem(product, quantity) {
  const cart = readList(CART_KEY);
  const current = cart.find((item) => item.id === product.id);
  if (current) current.quantity += quantity;
  else cart.push({ ...product, quantity });
  writeList(CART_KEY, cart);
}

function decrementStock(items) {
  const products = getProducts();
  items.forEach((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (product) product.stock = Math.max(Number(product.stock || 0) - Number(item.quantity || 0), 0);
  });
  saveProducts(products);
}

function createOrder(items) {
  const orders = readList(ORDERS_KEY);
  const order = {
    id: makeId(),
    transactionId: makeId(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    items: items.map((item) => ({ ...item })),
  };
  orders.unshift(order);
  writeList(ORDERS_KEY, orders);
  return order;
}

function formatThaiDate(value) {
  const date = value ? new Date(value) : new Date();
  const buddhistYear = date.getFullYear() + 543;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${buddhistYear} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function showAlert({ title, message = '', type = 'success' }) {
  const region = ensureAlertRegion();
  const icons = { success: 'circle-check', error: 'circle-alert', info: 'info', warning: 'triangle-alert' };
  const alert = document.createElement('div');
  alert.className = `app-alert app-alert-${type}`;
  alert.setAttribute('role', type === 'error' ? 'alert' : 'status');
  alert.innerHTML = `
    <span class="alert-icon"><i data-lucide="${icons[type] || icons.info}"></i></span>
    <span class="alert-copy">
      <strong>${escapeHTML(title)}</strong>
      ${message ? `<small>${escapeHTML(message)}</small>` : ''}
    </span>
    <button class="alert-close" type="button" aria-label="ปิดแจ้งเตือน"><i data-lucide="x"></i></button>
  `;

  const close = () => {
    alert.classList.add('is-leaving');
    window.setTimeout(() => alert.remove(), 180);
  };

  alert.querySelector('.alert-close').addEventListener('click', close);
  region.appendChild(alert);
  refreshIcons(alert);
  window.setTimeout(close, ALERT_TIMEOUT);
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  document.querySelectorAll('[data-username]').forEach((el) => { el.textContent = user.displayName || user.username; });
  document.querySelectorAll('.admin-only').forEach((el) => { el.hidden = !isAdmin(user); });
  document.querySelectorAll('[data-wallet-balance-header]').forEach((el) => { el.textContent = formatMoney(user.balance || 0); });
  return user;
}


function applyTheme(theme = localStorage.getItem(THEME_KEY) || 'light') {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => button.setAttribute('aria-pressed', theme === 'dark'));
}

function syncBalanceFromStorage() {
  const current = getUser();
  if (!current) return;
  const fresh = findUser(current.username);
  if (!fresh) return;
  if (Number(fresh.balance || 0) !== Number(current.balance || 0)) {
    setUser({ ...current, ...fresh });
  }
  document.querySelectorAll('[data-wallet-balance-header]').forEach((el) => { el.textContent = formatMoney(fresh.balance || 0); });
  document.querySelectorAll('[data-wallet-balance-topup]').forEach((el) => { el.textContent = formatMoney(fresh.balance || 0); });
}

function initLiveSync() {
  window.addEventListener('storage', (event) => {
    if (event.key === USERS_KEY) syncBalanceFromStorage();
    if (event.key === TOPUPS_KEY) {
      const historyEl = document.querySelector('[data-topup-history]');
      const current = getUser();
      if (historyEl && current) renderTopupHistory(historyEl, current.username);
    }
  });
}

function initChrome() {
  applyTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => {
    const theme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }));
  const page = document.body.dataset.page;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach((link) => link.classList.add('is-active'));
  const count = readList(CART_KEY).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });
}

function initMobileNav() {
  const toggles = Array.from(document.querySelectorAll('[data-menu-toggle]'));
  if (!toggles.length) return;

  const closeToggle = (btn, toolbar) => {
    toolbar.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i data-lucide="menu"></i>';
    refreshIcons(btn);
  };

  toggles.forEach((btn) => {
    const toolbar = btn.parentElement?.querySelector('.toolbar');
    if (!toolbar) return;
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = toolbar.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}"></i>`;
      refreshIcons(btn);
    });
    toolbar.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('click', () => closeToggle(btn, toolbar));
    });
  });

  document.addEventListener('click', (event) => {
    toggles.forEach((btn) => {
      const toolbar = btn.parentElement?.querySelector('.toolbar');
      if (!toolbar || !toolbar.classList.contains('is-open')) return;
      if (toolbar.contains(event.target) || btn.contains(event.target)) return;
      closeToggle(btn, toolbar);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    toggles.forEach((btn) => {
      const toolbar = btn.parentElement?.querySelector('.toolbar');
      if (toolbar?.classList.contains('is-open')) closeToggle(btn, toolbar);
    });
  });
}

function initLogin() {
  const form = document.querySelector('[data-login-form]');
  const error = document.querySelector('[data-login-error]');
  if (!form) return;

  if (getUser()) {
    window.location.href = 'index.html';
    return;
  }

  const showLoginError = (message) => {
    error.textContent = message;
    error.hidden = false;
    showAlert({ title: 'เข้าสู่ระบบไม่สำเร็จ', message, type: 'error' });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '').trim();

    if (!username || !password) {
      showLoginError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    const users = getUsers();
    const existing = findUser(username);

    if (!existing) {
      showLoginError('ไม่พบชื่อผู้ใช้นี้ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ');
      return;
    }

    if (existing.password !== password) {
      showLoginError('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    existing.lastLogin = new Date().toISOString();
    saveUsers(users);
    setUser({ ...existing });

    showAlert({ title: 'เข้าสู่ระบบสำเร็จ', message: `ยินดีต้อนรับ ${existing.displayName || username}`, type: 'success' });
    window.setTimeout(() => { window.location.href = 'index.html'; }, 450);
  });
}

function initRegister() {
  const form = document.querySelector('[data-register-form]');
  const error = document.querySelector('[data-register-error]');
  if (!form) return;

  if (getUser()) {
    window.location.href = 'index.html';
    return;
  }

  const showRegisterError = (message) => {
    error.textContent = message;
    error.hidden = false;
    showAlert({ title: 'สมัครสมาชิกไม่สำเร็จ', message, type: 'error' });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const displayName = String(formData.get('displayName') || '').trim();
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '').trim();
    const passwordConfirm = String(formData.get('passwordConfirm') || '').trim();

    if (!username || !password || !passwordConfirm) {
      showRegisterError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (password.length < 6) {
      showRegisterError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== passwordConfirm) {
      showRegisterError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (findUser(username)) {
      showRegisterError('มีชื่อผู้ใช้นี้อยู่แล้ว กรุณาเลือกชื่ออื่น');
      return;
    }

    const users = getUsers();
    const newUser = {
      id: makeId(),
      username,
      password,
      role: username.toLowerCase() === 'admin' ? 'admin' : 'user',
      displayName: displayName || username,
      balance: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    setUser({ ...newUser });

    showAlert({ title: 'สมัครสมาชิกสำเร็จ', message: `ยินดีต้อนรับ ${newUser.displayName}`, type: 'success' });
    window.setTimeout(() => { window.location.href = 'index.html'; }, 450);
  });
}

function isSameDay(dateValue, reference = new Date()) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === reference.toDateString();
}

function orderAmount(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function computeStoreStats() {
  const users = getUsers();
  const orders = readList(ORDERS_KEY);
  const today = new Date();
  const totalUsers = users.length;
  const usersToday = users.filter((user) => isSameDay(user.lastLogin, today) || isSameDay(user.createdAt, today)).length;
  const totalPurchase = orders.reduce((sum, order) => sum + orderAmount(order), 0);
  const salesToday = orders.filter((order) => isSameDay(order.createdAt, today)).reduce((sum, order) => sum + orderAmount(order), 0);
  return { totalUsers, usersToday, totalPurchase, salesToday };
}

function formatCompactNumber(value) {
  try { return new Intl.NumberFormat('th-TH', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0); }
  catch { return String(Math.round(Number(value) || 0)); }
}

function renderStoreStats() {
  const grid = document.querySelector('[data-stats-grid]');
  if (!grid) return;
  const stats = computeStoreStats();

  const setStat = (key, rawValue, isMoney) => {
    const card = grid.querySelector(`[data-stat="${key}"]`);
    if (!card) return;
    const valueEl = card.querySelector('[data-stat-value]');
    const flairEl = card.querySelector('[data-stat-flair]');
    if (valueEl) valueEl.textContent = isMoney ? formatMoney(rawValue) : Number(rawValue).toLocaleString('th-TH');
    if (flairEl) flairEl.textContent = isMoney ? `฿${formatCompactNumber(rawValue)}` : formatCompactNumber(rawValue);
  };

  setStat('total-users', stats.totalUsers, false);
  setStat('users-today', stats.usersToday, false);
  setStat('total-purchase', stats.totalPurchase, true);
  setStat('sales-today', stats.salesToday, true);
}

let storeStatsTimer = null;
function initStoreStatsLive() {
  const grid = document.querySelector('[data-stats-grid]');
  if (!grid) return;

  renderStoreStats();
  if (storeStatsTimer) window.clearInterval(storeStatsTimer);
  storeStatsTimer = window.setInterval(renderStoreStats, 3000);

  window.addEventListener('storage', (event) => {
    if (!event.key || [USERS_KEY, ORDERS_KEY].includes(event.key)) renderStoreStats();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderStoreStats(); });
}

function initStore() {
  if (!requireAuth()) return;
  initStoreStatsLive();
  renderStoreProducts();
  const modal = document.querySelector('[data-product-modal]');
  if (!modal) return;

  const title = modal.querySelector('#modal-product-title');
  const description = modal.querySelector('[data-modal-description]');
  const priceEl = modal.querySelector('[data-modal-price]');
  const imageEl = modal.querySelector('.modal-image');
  const quantity = modal.querySelector('[data-quantity]');
  const remaining = modal.querySelector('[data-remaining]');
  const closeButtons = modal.querySelectorAll('[data-close-modal]');
  const grid = document.querySelector('.product-grid');
  const cartButton = modal.querySelector('[data-add-cart]');
  const orderButton = modal.querySelector('[data-order-now]');
  let currentProduct = null;

  const cartQuantityFor = (productId) => readList(CART_KEY).filter((item) => item.id === productId).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const openModal = (productId) => {
    const product = getProducts().find((item) => item.id === productId);
    if (!product) return;
    currentProduct = product;
    const stock = Number(product.stock || 0);
    const availableNow = Math.max(stock - cartQuantityFor(product.id), 0);

    title.textContent = product.name;
    description.textContent = product.description;
    priceEl.textContent = formatMoney(product.price);
    remaining.textContent = availableNow;
    if (product.image) {
      imageEl.style.backgroundImage = `url('${product.image.replace(/'/g, "%27")}')`;
      imageEl.style.backgroundSize = 'contain';
      imageEl.style.backgroundRepeat = 'no-repeat';
      imageEl.style.backgroundPosition = 'center';
      imageEl.style.backgroundColor = '#0c0d10';
      imageEl.classList.add('has-photo');
    } else {
      imageEl.style.backgroundImage = '';
      imageEl.style.backgroundSize = '';
      imageEl.style.backgroundRepeat = '';
      imageEl.style.backgroundPosition = '';
      imageEl.style.backgroundColor = '';
      imageEl.classList.remove('has-photo');
    }
    quantity.max = String(Math.max(availableNow, 1));
    quantity.value = availableNow > 0 ? '1' : '0';
    quantity.disabled = availableNow <= 0;
    cartButton.disabled = availableNow <= 0;
    orderButton.disabled = availableNow <= 0;

    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    document.body.classList.add('modal-open');
    quantity.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    currentProduct = null;
  };

  const getQuantity = () => Math.min(Math.max(Number(quantity.value) || 1, 1), Number(quantity.max) || 1);

  grid?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-product-id]');
    if (!card) return;
    openModal(card.dataset.productId);
  });
  grid?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('[data-product-id]');
    if (!card) return;
    event.preventDefault();
    openModal(card.dataset.productId);
  });

  quantity.addEventListener('input', () => { quantity.value = getQuantity(); });
  cartButton?.addEventListener('click', () => {
    if (!currentProduct) return;
    const stock = Number(currentProduct.stock || 0);
    const alreadyInCart = cartQuantityFor(currentProduct.id);
    const qty = getQuantity();
    if (alreadyInCart + qty > stock) {
      showAlert({ title: 'สินค้าไม่พอ', message: `เหลือในสต็อกอีก ${Math.max(stock - alreadyInCart, 0)} ชิ้น`, type: 'error' });
      return;
    }
    addCartItem(currentProduct, qty);
    showAlert({ title: 'เพิ่มลงตะกร้าแล้ว', message: `${currentProduct.name} จำนวน ${qty} ชิ้น`, type: 'success' });
    closeModal();
  });
  orderButton?.addEventListener('click', () => {
    if (!currentProduct) return;
    const stock = Number(currentProduct.stock || 0);
    const alreadyInCart = cartQuantityFor(currentProduct.id);
    const availableNow = Math.max(stock - alreadyInCart, 0);
    const qty = getQuantity();
    if (qty > availableNow) {
      showAlert({ title: 'สินค้าไม่พอ', message: `เหลือในสต็อกอีก ${availableNow} ชิ้น`, type: 'error' });
      return;
    }
    createOrder([{ ...currentProduct, quantity: qty }]);
    decrementStock([{ id: currentProduct.id, quantity: qty }]);
    renderStoreProducts();
    showAlert({ title: 'สั่งซื้อสำเร็จ', message: 'กำลังพาไปตรวจสอบคำสั่งซื้อ', type: 'success' });
    closeModal();
    window.setTimeout(() => { window.location.href = 'orders.html'; }, 500);
  });

  closeButtons.forEach((button) => button.addEventListener('click', closeModal));
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });
}


function renderStoreProducts() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  grid.innerHTML = getProducts().map((product, index) => `<article class="product-card ${product.featured || index === 0 ? 'featured' : ''}" data-product-id="${escapeHTML(product.id)}" tabindex="0" role="button"><span class="badge ${product.featured || index === 0 ? 'red' : 'dark'}">${product.featured || index === 0 ? 'สินค้าแนะนำ' : 'สินค้ายอดนิยม'}</span><div class="product-image"${product.image ? ` style="background-image:url('${escapeHTML(product.image)}');background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#0c0d10;filter:none;"` : ''}></div><div class="product-body"><h2>${escapeHTML(product.name)}</h2><p>${escapeHTML(product.description)}</p><strong class="price">${formatMoney(product.price)}</strong>${Number(product.stock || 0) <= 0 ? '<em class="stock-out">สินค้าหมด</em>' : ''}</div></article>`).join('');
}

function initHeroSlider() {
  const slider = document.querySelector('[data-hero-slider]');
  if (!slider) return;
  const slides = Array.from(slider.querySelectorAll('[data-slide]'));
  const prev = slider.querySelector('[data-slide-prev]');
  const next = slider.querySelector('[data-slide-next]');
  if (slides.length < 2) return;
  let active = 0;
  let timer;
  const show = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === active));
  };
  const start = () => { timer = window.setInterval(() => show(active + 1), 3600); };
  const restart = () => { window.clearInterval(timer); start(); };
  prev?.addEventListener('click', () => { show(active - 1); restart(); });
  next?.addEventListener('click', () => { show(active + 1); restart(); });
  slider.addEventListener('mouseenter', () => window.clearInterval(timer));
  slider.addEventListener('mouseleave', start);
  start();
}

function renderAdminProductCard(product) {
  const stock = Number(product.stock || 0);
  const threshold = Number(product.lowStock ?? 3);
  let statusClass = 'stock-ok', statusLabel = 'พร้อมขาย', statusIcon = 'circle-check';
  if (stock <= 0) { statusClass = 'stock-out'; statusLabel = 'สินค้าหมด'; statusIcon = 'circle-x'; }
  else if (stock <= threshold) { statusClass = 'stock-low'; statusLabel = 'สต็อกต่ำ'; statusIcon = 'triangle-alert'; }
  const thumbStyle = product.image ? ` style="background-image:url('${escapeHTML(product.image)}')"` : '';
  return `
    <article class="admin-product-card" data-product-id="${escapeHTML(product.id)}">
      <div class="admin-product-thumb"${thumbStyle}>${product.image ? '' : '<i data-lucide="image-off"></i>'}</div>
      <div class="admin-product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${formatMoney(product.price)}</p>
        <span class="stock-pill ${statusClass}"><i data-lucide="${statusIcon}"></i>${statusLabel} · ${stock} ชิ้น</span>
      </div>
      <div class="admin-product-stock-actions">
        <button type="button" data-stock-minus aria-label="ลดสต็อก"><i data-lucide="minus"></i></button>
        <button type="button" data-stock-plus aria-label="เพิ่มสต็อก"><i data-lucide="plus"></i></button>
      </div>
      <div class="admin-product-actions">
        <button class="pill ghost-pill" type="button" data-edit-product><i data-lucide="pencil"></i><span>แก้ไข</span></button>
        <button class="pill" type="button" data-delete-product><i data-lucide="trash-2"></i><span>ลบ</span></button>
      </div>
    </article>`;
}

function initAdmin() {
  if (document.body.dataset.page !== 'admin') return;
  const user = requireAuth();
  if (!user) return;
  if (!isAdmin(user)) { showAlert({ title: 'ไม่มีสิทธิ์เข้าระบบหลังบ้าน', message: 'หน้านี้สำหรับผู้ดูแลเท่านั้น', type: 'error' }); window.setTimeout(() => { window.location.href = 'index.html'; }, 700); return; }
  const list = document.querySelector('[data-admin-order-list]');
  const ordersMetric = document.querySelector('[data-admin-orders]');
  const salesMetric = document.querySelector('[data-admin-sales]');
  const refresh = document.querySelector('[data-admin-refresh]');
  const productForm = document.querySelector('[data-admin-product-form]');
  const productsMetric = document.querySelector('[data-admin-products]');
  const productsList = document.querySelector('[data-admin-products-list]');
  const searchInput = document.querySelector('[data-admin-product-search]');
  const sortToggle = document.querySelector('[data-sort-toggle]');
  const lowStockSummary = document.querySelector('[data-low-stock-summary]');
  const statusText = { pending: 'รอชำระเงิน', cancelled: 'ยกเลิกแล้ว', paid: 'ชำระเงินแล้ว' };
  const topupList = document.querySelector('[data-admin-topup-list]');
  const topupRefresh = document.querySelector('[data-admin-topup-refresh]');
  const topupPendingMetric = document.querySelector('[data-admin-topup-pending]');
  if (!productForm) return;

  const idInput = productForm.querySelector('input[name="product-id"]');
  const nameInput = productForm.querySelector('[name="product-name"]');
  const priceInput = productForm.querySelector('[name="product-price"]');
  const stockInput = productForm.querySelector('[name="product-stock"]');
  const lowStockInput = productForm.querySelector('[name="product-low-stock"]');
  const descriptionInput = productForm.querySelector('[name="product-description"]');
  const imageInput = productForm.querySelector('[data-image-input]');
  const imageFile = productForm.querySelector('[data-image-file]');
  const imagePreview = productForm.querySelector('[data-image-preview]');
  const submitLabel = productForm.querySelector('[data-submit-label]');
  const cancelEdit = productForm.querySelector('[data-cancel-edit]');

  let searchTerm = '';
  let sortLowFirst = false;

  const updatePreview = () => {
    const value = imageInput.value.trim();
    if (value) {
      imagePreview.style.backgroundImage = `url('${value.replace(/'/g, '%27')}')`;
      imagePreview.innerHTML = '';
    } else {
      imagePreview.style.backgroundImage = '';
      imagePreview.innerHTML = '<i data-lucide="image"></i>';
      refreshIcons(imagePreview);
    }
  };

  const resetForm = () => {
    productForm.reset();
    idInput.value = '';
    lowStockInput.value = '3';
    updatePreview();
    submitLabel.textContent = 'บันทึกสินค้า';
    cancelEdit.hidden = true;
  };

  const loadProductToForm = (product) => {
    idInput.value = product.id;
    nameInput.value = product.name;
    priceInput.value = product.price;
    stockInput.value = product.stock;
    lowStockInput.value = product.lowStock ?? 3;
    descriptionInput.value = product.description || '';
    imageInput.value = product.image || '';
    updatePreview();
    submitLabel.textContent = 'บันทึกการแก้ไข';
    cancelEdit.hidden = false;
    productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const render = () => {
    const orders = readList(ORDERS_KEY);
    const sales = orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + order.items.reduce((lineSum, item) => lineSum + item.price * item.quantity, 0), 0);
    ordersMetric.textContent = orders.length;
    salesMetric.textContent = formatMoney(sales);

    const allProducts = getProducts();
    if (productsMetric) productsMetric.textContent = allProducts.length;

    const lowCount = allProducts.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= Number(p.lowStock ?? 3)).length;
    const outCount = allProducts.filter((p) => Number(p.stock || 0) <= 0).length;
    if (lowStockSummary) {
      lowStockSummary.hidden = lowCount + outCount === 0;
      const span = lowStockSummary.querySelector('span');
      if (span) span.textContent = `สต็อกต่ำ ${lowCount} รายการ · สินค้าหมด ${outCount} รายการ`;
    }

    let visible = allProducts.filter((p) => String(p.name || '').toLowerCase().includes(searchTerm));
    if (sortLowFirst) visible = [...visible].sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));

    if (productsList) {
      productsList.innerHTML = visible.length ? visible.map(renderAdminProductCard).join('') : '<p class="empty-state">ไม่พบสินค้าที่ค้นหา</p>';
      refreshIcons(productsList);
    }

    list.innerHTML = orders.length ? orders.map((order) => `
      <article class="admin-order" data-order-id="${escapeHTML(order.id)}">
        <div><h3>${escapeHTML(order.id)}</h3><p>${formatThaiDate(order.createdAt)} · ${escapeHTML(statusText[order.status] || order.status)}</p></div>
        <strong>${formatMoney(order.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong>
        <button class="pill" type="button" data-delete-order>ลบ</button>
      </article>
    `).join('') : '<p class="empty-state">ยังไม่มีคำสั่งซื้อให้จัดการ</p>';

    if (topupList) {
      const topups = getTopups();
      const usersForBalance = getUsers();
      if (topupPendingMetric) topupPendingMetric.textContent = topups.filter((item) => item.status === 'pending').length;
      topupList.innerHTML = topups.length ? topups.map((item) => {
        const account = usersForBalance.find((entry) => String(entry.username).toLowerCase() === String(item.username).toLowerCase());
        const currentBalance = Number(account?.balance || 0);
        return `
        <article class="admin-topup-card" data-topup-id="${escapeHTML(item.id)}">
          <button class="admin-topup-thumb" type="button" data-view-slip${item.slipImage ? ` style="background-image:url('${escapeHTML(item.slipImage)}')"` : ' disabled'} aria-label="ดูสลิปขนาดเต็ม">${item.slipImage ? '' : '<i data-lucide="image-off"></i>'}</button>
          <div class="admin-topup-info">
            <h3>${escapeHTML(item.displayName || item.username)} · ${formatMoney(item.amount)}</h3>
            <p>${formatThaiDate(item.createdAt)} · <span class="topup-status ${item.status}"><i data-lucide="${TOPUP_STATUS_ICON[item.status] || 'clock'}"></i>${TOPUP_STATUS_TEXT[item.status] || item.status}</span></p>
            <p class="admin-topup-balance">ยอดเงินคงเหลือปัจจุบัน: <strong data-topup-balance>${formatMoney(currentBalance)}</strong></p>
            ${item.note ? `<p class="admin-topup-note">${escapeHTML(item.note)}</p>` : ''}
          </div>
          <div class="admin-topup-actions">
            ${item.status === 'pending' ? `
              <button class="pill" type="button" data-approve-topup><i data-lucide="check"></i><span>อนุมัติ</span></button>
              <button class="pill ghost-pill" type="button" data-reject-topup><i data-lucide="x"></i><span>ปฏิเสธ</span></button>
            ` : `<button class="pill ghost-pill" type="button" data-delete-topup><i data-lucide="trash-2"></i><span>ลบ</span></button>`}
          </div>
        </article>
      `;
      }).join('') : '<p class="empty-state">ยังไม่มีรายการเติมเงินให้ตรวจสอบ</p>';
      refreshIcons(topupList);
    }
  };

  imageInput.addEventListener('input', updatePreview);
  imageFile.addEventListener('change', () => {
    const file = imageFile.files[0];
    if (!file) return;
    compressImageFile(file)
      .then((dataUrl) => { imageInput.value = dataUrl; updatePreview(); })
      .catch(() => showAlert({ title: 'อ่านไฟล์รูปไม่สำเร็จ', message: 'กรุณาลองเลือกไฟล์รูปอื่น', type: 'error' }));
  });

  cancelEdit.addEventListener('click', resetForm);

  searchInput?.addEventListener('input', () => { searchTerm = searchInput.value.trim().toLowerCase(); render(); });
  sortToggle?.addEventListener('click', () => {
    sortLowFirst = !sortLowFirst;
    sortToggle.classList.toggle('is-active', sortLowFirst);
    render();
  });

  refresh?.addEventListener('click', () => { render(); showAlert({ title: 'รีเฟรชข้อมูลแล้ว', message: 'อัปเดตรายการคำสั่งซื้อในระบบหลังบ้านสำเร็จ', type: 'success' }); });
  topupRefresh?.addEventListener('click', () => { render(); showAlert({ title: 'รีเฟรชข้อมูลแล้ว', message: 'อัปเดตรายการสลิปในระบบหลังบ้านสำเร็จ', type: 'success' }); });

  window.addEventListener('storage', (event) => {
    if (event.key === TOPUPS_KEY || event.key === USERS_KEY || event.key === ORDERS_KEY) render();
  });

  topupList?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-topup-id]');
    if (!card) return;
    const id = card.dataset.topupId;
    const topups = getTopups();
    const topup = topups.find((item) => item.id === id);
    if (!topup) return;

    if (event.target.closest('[data-view-slip]')) {
      if (topup.slipImage) window.open(topup.slipImage, '_blank', 'noopener');
      return;
    }

    if (event.target.closest('[data-approve-topup]')) {
      topup.status = 'approved';
      topup.reviewedAt = new Date().toISOString();
      saveTopups(topups);
      const users = getUsers();
      const account = users.find((entry) => String(entry.username).toLowerCase() === String(topup.username).toLowerCase());
      let newBalance = null;
      if (account) {
        account.balance = Number(account.balance || 0) + Number(topup.amount || 0);
        newBalance = account.balance;
        saveUsers(users);
        const current = getUser();
        if (current && String(current.username).toLowerCase() === String(account.username).toLowerCase()) setUser({ ...account });
      }
      render();
      showAlert({
        title: 'อนุมัติสลิปแล้ว เงินเข้าบัญชีลูกค้าเรียบร้อย',
        message: newBalance !== null
          ? `เติมเงิน ${formatMoney(topup.amount)} ให้ ${topup.displayName || topup.username} สำเร็จ · ยอดเงินคงเหลือล่าสุด ${formatMoney(newBalance)}`
          : `เติมเงิน ${formatMoney(topup.amount)} ให้ ${topup.displayName || topup.username} สำเร็จ`,
        type: 'success',
      });
      return;
    }

    if (event.target.closest('[data-reject-topup]')) {
      topup.status = 'rejected';
      topup.reviewedAt = new Date().toISOString();
      saveTopups(topups);
      render();
      showAlert({ title: 'ปฏิเสธสลิปแล้ว', message: `รายการของ ${topup.displayName || topup.username} ถูกปฏิเสธ`, type: 'warning' });
      return;
    }

    if (event.target.closest('[data-delete-topup]')) {
      if (!window.confirm('ยืนยันลบรายการสลิปนี้ใช่หรือไม่?')) return;
      saveTopups(topups.filter((item) => item.id !== id));
      render();
      showAlert({ title: 'ลบรายการสลิปแล้ว', type: 'success' });
    }
  });

  productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const products = getProducts();
    const id = idInput.value.trim();
    const payload = {
      name: nameInput.value.trim() || 'สินค้าใหม่',
      description: descriptionInput.value.trim() || 'สินค้าในร้าน Freal Boxser',
      price: Math.max(Number(priceInput.value || 0), 0),
      stock: Math.max(Number(stockInput.value || 0), 0),
      lowStock: Math.max(Number(lowStockInput.value || 3), 0),
      image: imageInput.value.trim(),
    };
    if (id) {
      const existing = products.find((entry) => entry.id === id);
      if (existing) Object.assign(existing, payload);
      saveProducts(products);
      showAlert({ title: 'แก้ไขสินค้าแล้ว', message: payload.name, type: 'success' });
    } else {
      products.unshift({ id: makeId(), featured: false, ...payload });
      saveProducts(products);
      showAlert({ title: 'เพิ่มสินค้าสำเร็จ', message: 'สินค้าใหม่ถูกเพิ่มเข้าระบบหลังบ้านแล้ว', type: 'success' });
    }
    resetForm();
    render();
  });

  productsList?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-product-id]');
    if (!card) return;
    const id = card.dataset.productId;
    const products = getProducts();
    const product = products.find((entry) => entry.id === id);
    if (!product) return;

    if (event.target.closest('[data-edit-product]')) { loadProductToForm(product); return; }

    if (event.target.closest('[data-delete-product]')) {
      if (!window.confirm(`ยืนยันลบสินค้า "${product.name}" ใช่หรือไม่?`)) return;
      saveProducts(products.filter((entry) => entry.id !== id));
      if (idInput.value === id) resetForm();
      render();
      showAlert({ title: 'ลบสินค้าแล้ว', message: product.name, type: 'success' });
      return;
    }

    if (event.target.closest('[data-stock-minus]')) {
      product.stock = Math.max(Number(product.stock || 0) - 1, 0);
      saveProducts(products);
      render();
      return;
    }

    if (event.target.closest('[data-stock-plus]')) {
      product.stock = Number(product.stock || 0) + 1;
      saveProducts(products);
      render();
    }
  });

  list.addEventListener('click', (event) => {
    const card = event.target.closest('[data-order-id]');
    if (!card || !event.target.closest('[data-delete-order]')) return;
    if (!window.confirm('ยืนยันลบคำสั่งซื้อนี้ใช่หรือไม่?')) return;
    writeList(ORDERS_KEY, readList(ORDERS_KEY).filter((order) => order.id !== card.dataset.orderId));
    render();
    showAlert({ title: 'ลบคำสั่งซื้อแล้ว', message: 'อัปเดตรายการคำสั่งซื้อเรียบร้อย', type: 'success' });
  });

  resetForm();
  render();
}

function initCart() {
  if (document.body.dataset.page !== 'cart') return;
  if (!requireAuth()) return;
  const list = document.querySelector('[data-cart-list]');
  const total = document.querySelector('[data-cart-total]');
  const checkout = document.querySelector('[data-checkout]');
  if (!list) return;

  const render = () => {
    const cart = readList(CART_KEY);
    list.innerHTML = cart.length ? cart.map((item) => `
      <article class="cart-item">
        <div>
          <h2>${escapeHTML(item.name)}</h2>
          <p>${escapeHTML(item.description)}</p>
          <small>จำนวน ${Number(item.quantity || 1)}</small>
        </div>
        <strong class="item-price">${formatMoney(item.price * item.quantity)}</strong>
      </article>
    `).join('') : '<p class="empty-state">ยังไม่มีสินค้าในตะกร้า กลับไปเลือกสินค้าได้ที่หน้าร้าน</p>';
    total.textContent = formatMoney(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
    checkout.disabled = !cart.length;
  };

  checkout?.addEventListener('click', () => {
    const cart = readList(CART_KEY);
    if (!cart.length) return;
    const products = getProducts();
    const outOfStock = cart.find((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product && Number(item.quantity || 0) > Number(product.stock || 0);
    });
    if (outOfStock) {
      showAlert({ title: 'สินค้าไม่พอ', message: `${outOfStock.name} มีไม่พอในสต็อกแล้ว กรุณาปรับจำนวนในตะกร้า`, type: 'error' });
      return;
    }
    createOrder(cart);
    decrementStock(cart);
    writeList(CART_KEY, []);
    showAlert({ title: 'สั่งซื้อสำเร็จ', message: 'ไปยังหน้ารายการคำสั่งซื้อเพื่อตรวจสอบสถานะ', type: 'success' });
    window.setTimeout(() => { window.location.href = 'orders.html'; }, 500);
  });
  render();
}

function initOrders() {
  if (document.body.dataset.page !== 'orders') return;
  if (!requireAuth()) return;
  const list = document.querySelector('[data-orders-list]');
  if (!list) return;
  const statusText = { pending: 'รอชำระเงิน', cancelled: 'ยกเลิกแล้ว', paid: 'ชำระเงินแล้ว' };
  const render = () => {
    const orders = readList(ORDERS_KEY);
    list.innerHTML = orders.length ? orders.map((order) => `
      <article class="order-card" data-order-id="${escapeHTML(order.id)}">
        <div class="order-head"><div><h2>รหัสคำสั่งซื้อ: ${escapeHTML(order.id)}</h2><p class="order-meta">วันที่: ${formatThaiDate(order.createdAt)}</p><p class="order-meta">การชำระเงิน: <span class="status ${order.status}">${statusText[order.status] || order.status}</span></p></div><p class="order-code">รหัสธุรกรรม:<br>${escapeHTML(order.transactionId)}</p></div>
        <div class="order-lines">${order.items.map((item) => `<div class="order-line"><div><h3>${escapeHTML(item.name)}</h3><small>จำนวน: ${Number(item.quantity || 1)}</small></div><strong class="order-price">${formatMoney(item.price * item.quantity)}<small>(${Number(item.price).toFixed(2)} x ${Number(item.quantity || 1)})</small></strong></div>`).join('')}</div>
        <div class="order-detail" hidden>รายละเอียดคำสั่งซื้อ: สินค้าทั้งหมด ${order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)} ชิ้น ยอดรวม ${formatMoney(order.items.reduce((sum, item) => sum + item.price * item.quantity, 0))} สถานะ ${statusText[order.status] || order.status}</div>
        <div class="order-actions"><button class="pill" type="button" data-cancel-order>ยกเลิกคำสั่งซื้อ</button><button class="pill pay-btn" type="button" data-pay-order>ชำระเงิน</button><button class="pill" type="button" data-toggle-detail>ดูรายละเอียด</button></div>
      </article>
    `).join('') : '<p class="empty-state">ยังไม่มีคำสั่งซื้อ</p>';
    refreshIcons(list);
  };
  list.addEventListener('click', (event) => {
    const card = event.target.closest('[data-order-id]');
    if (!card) return;
    const id = card.dataset.orderId;
    const orders = readList(ORDERS_KEY);
    const order = orders.find((item) => item.id === id);
    if (event.target.closest('[data-toggle-detail]')) card.querySelector('.order-detail').hidden = !card.querySelector('.order-detail').hidden;
    if (event.target.closest('[data-cancel-order]') && order) { order.status = 'cancelled'; writeList(ORDERS_KEY, orders); render(); showAlert({ title: 'ยกเลิกคำสั่งซื้อแล้ว', message: 'อัปเดตสถานะในระบบสำเร็จ', type: 'success' }); }
    if (event.target.closest('[data-pay-order]') && order) { order.status = 'paid'; writeList(ORDERS_KEY, orders); render(); showAlert({ title: 'ยืนยันการชำระเงินสำเร็จ', message: 'คำสั่งซื้อถูกปรับเป็นชำระเงินแล้ว', type: 'success' }); }
  });
  render();
}

const TOPUP_STATUS_TEXT = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ถูกปฏิเสธ' };
const TOPUP_STATUS_ICON = { pending: 'clock', approved: 'circle-check', rejected: 'circle-x' };

function renderTopupHistory(historyEl, username) {
  if (!historyEl) return;
  const items = getTopups().filter((item) => String(item.username).toLowerCase() === String(username).toLowerCase());
  historyEl.innerHTML = items.length ? items.map((item) => `
    <article class="topup-history-item">
      <div class="topup-history-thumb"${item.slipImage ? ` style="background-image:url('${escapeHTML(item.slipImage)}')"` : ''}>${item.slipImage ? '' : '<i data-lucide="image-off"></i>'}</div>
      <div class="topup-history-info">
        <h3>${formatMoney(item.amount)}</h3>
        <p>${formatThaiDate(item.createdAt)}${item.note ? ' · ' + escapeHTML(item.note) : ''}</p>
      </div>
      <span class="topup-status ${item.status}"><i data-lucide="${TOPUP_STATUS_ICON[item.status] || 'clock'}"></i>${TOPUP_STATUS_TEXT[item.status] || item.status}</span>
    </article>
  `).join('') : '<p class="empty-state">ยังไม่มีประวัติการเติมเงิน</p>';
  refreshIcons(historyEl);
}

function initPaymentInfo() {
  const card = document.querySelector('[data-payment-card]');
  if (!card) return;

  card.querySelector('[data-pay-bank]').textContent = PAYMENT_CONFIG.bankName;
  card.querySelector('[data-pay-name]').textContent = PAYMENT_CONFIG.accountName;
  card.querySelector('[data-pay-account]').textContent = PAYMENT_CONFIG.accountNumber;
  const ppLabelEl = card.querySelector('[data-pay-promptpay-label]');
  if (ppLabelEl) ppLabelEl.textContent = PAYMENT_CONFIG.promptpayLabel;
  card.querySelector('[data-pay-promptpay]').textContent = PAYMENT_CONFIG.promptpayId;

  card.querySelectorAll('[data-copy-value]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.copyTarget;
      const value = target === 'account' ? PAYMENT_CONFIG.accountNumber : PAYMENT_CONFIG.promptpayId;
      copyToClipboard(value, target === 'account' ? 'คัดลอกเลขบัญชีแล้ว' : 'คัดลอกเบอร์พร้อมเพย์แล้ว');
    });
  });

  const canvas = card.querySelector('[data-promptpay-qr]');
  if (canvas && window.QRCode) {
    const payload = generatePromptPayPayload(PAYMENT_CONFIG.promptpayId);
    window.QRCode.toCanvas(canvas, payload, { width: 176, margin: 1, color: { dark: '#111216', light: '#ffffff' } }, (err) => {
      if (err) console.error(err);
    });
  }
}

function initTopup() {
  const user = requireAuth();
  if (!user) return;
  initPaymentInfo();
  const form = document.querySelector('[data-topup-form]');
  if (!form) return;

  const amountInput = form.querySelector('[name="topup-amount"]');
  const slipInput = form.querySelector('[data-image-input]');
  const slipFile = form.querySelector('[data-image-file]');
  const slipPreview = form.querySelector('[data-image-preview]');
  const noteInput = form.querySelector('[name="topup-note"]');
  const historyEl = document.querySelector('[data-topup-history]');
  const balanceEl = document.querySelector('[data-wallet-balance-topup]');

  const updateBalance = () => {
    const current = findUser(user.username) || user;
    if (balanceEl) balanceEl.textContent = formatMoney(current.balance || 0);
  };

  const updatePreview = () => {
    const value = slipInput.value.trim();
    if (value) {
      slipPreview.style.backgroundImage = `url('${value.replace(/'/g, '%27')}')`;
      slipPreview.innerHTML = '';
    } else {
      slipPreview.style.backgroundImage = '';
      slipPreview.innerHTML = '<i data-lucide="image"></i>';
      refreshIcons(slipPreview);
    }
  };

  slipInput?.addEventListener('input', updatePreview);
  slipFile?.addEventListener('change', () => {
    const file = slipFile.files[0];
    if (!file) return;
    compressImageFile(file)
      .then((dataUrl) => { slipInput.value = dataUrl; updatePreview(); })
      .catch(() => showAlert({ title: 'อ่านไฟล์รูปไม่สำเร็จ', message: 'กรุณาลองเลือกไฟล์รูปอื่น', type: 'error' }));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Number(amountInput.value || 0);
    const slipValue = slipInput.value.trim();

    if (!amount || amount <= 0) {
      showAlert({ title: 'เติมเงินไม่สำเร็จ', message: 'กรุณาใส่จำนวนเงินที่โอนให้ถูกต้อง', type: 'error' });
      amountInput.focus();
      return;
    }
    if (!slipValue) {
      showAlert({ title: 'เติมเงินไม่สำเร็จ', message: 'กรุณาแนบรูปสลิปหรือลิงก์สลิปก่อนส่งยืนยัน', type: 'error' });
      return;
    }

    const topups = getTopups();
    topups.unshift({
      id: makeId(),
      username: user.username,
      displayName: user.displayName || user.username,
      amount,
      slipImage: slipValue,
      note: noteInput.value.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    saveTopups(topups);

    showAlert({ title: 'ส่งสลิปยืนยันการโอนเงินแล้ว', message: 'ระบบกำลังตรวจสอบสลิปของคุณ กรุณารอแอดมินอนุมัติ', type: 'success' });
    form.reset();
    updatePreview();
    renderTopupHistory(historyEl, user.username);
  });

  updatePreview();
  updateBalance();
  renderTopupHistory(historyEl, user.username);
}


function maskEmail(email) {
  if (!email) return 'kaerz.03.00@gmail...';
  const [name, domain = ''] = String(email).split('@');
  return `${name}@${domain}`.length > 18 ? `${name}@${domain}`.slice(0, 18) + '...' : `${name}@${domain}`;
}

function getProfileId(user) {
  const source = String(user?.id || user?.username || 'user');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) hash = ((hash << 5) - hash + source.charCodeAt(index)) >>> 0;
  return hash.toString(16).padStart(8, '0').slice(0, 8);
}

function initProfile() {
  if (document.body.dataset.page !== 'profile') return;
  const user = requireAuth(); if (!user) return;
  const displayName = user.displayName || user.username || 'ผู้ใช้งาน';
  const username = user.username || displayName;
  const orders = readList(ORDERS_KEY);
  const lastLogin = user.lastLogin || user.createdAt || new Date().toISOString();

  document.querySelectorAll('[data-profile-name]').forEach((el) => { el.textContent = displayName; });
  document.querySelector('[data-profile-username]')?.replaceChildren(document.createTextNode(username));
  document.querySelector('[data-profile-id]')?.replaceChildren(document.createTextNode(user.id || getProfileId(user)));
  document.querySelector('[data-profile-email]')?.replaceChildren(document.createTextNode(maskEmail(user.email)));
  document.querySelector('[data-last-login]')?.replaceChildren(document.createTextNode(formatThaiDate(lastLogin)));
  document.querySelectorAll('[data-user-role]').forEach((el) => { el.textContent = isAdmin(user) ? 'ผู้ดูแลระบบ' : 'สมาชิก'; });
  document.querySelector('[data-wallet-balance]')?.replaceChildren(document.createTextNode(formatMoney(user.balance || 0)));
  document.querySelector('[data-profile-orders]')?.replaceChildren(document.createTextNode(orders.length));
  const form = document.querySelector('[data-profile-form]');
  const nameInput = form?.querySelector('[name="displayName"]');
  if (nameInput) nameInput.value = displayName;
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const newName = new FormData(form).get('displayName') || user.displayName;
    user.displayName = newName;
    setUser(user);
    const account = findUser(user.username);
    if (account) { account.displayName = newName; saveUsers(getUsers().map((item) => (item.username === account.username ? account : item))); }
    requireAuth();
    showAlert({ title: 'บันทึกโปรไฟล์แล้ว', type: 'success' });
  });
}

function initDonate() {
  if (document.body.dataset.page !== 'donate') return;
  if (!requireAuth()) return;
  const goal = 10000, form = document.querySelector('[data-donate-form]'), list = document.querySelector('[data-donate-list]');
  const render = () => { const items = readList(DONATE_KEY); const total = items.reduce((s,i)=>s+Number(i.amount||0),0); document.querySelector('[data-donate-total]').textContent = `${formatMoney(total)} / ${formatMoney(goal)}`; document.querySelector('[data-donate-bar]').style.width = `${Math.min(total / goal * 100, 100)}%`; list.innerHTML = items.length ? items.map(i => `<article class="donate-row"><strong>${escapeHTML(i.donor)}</strong><span>${formatMoney(i.amount)}</span></article>`).join('') : '<p class="empty-state">ยังไม่มีผู้โดเนท เป็นคนแรกได้เลย!</p>'; };
  form?.addEventListener('submit', (event) => { event.preventDefault(); const fd = new FormData(form); const amount = Number(fd.get('amount') || 0); if (amount <= 0) return showAlert({ title: 'กรุณาใส่ยอดโดเนท', type: 'error' }); const items = readList(DONATE_KEY); items.unshift({ id: makeId(), donor: fd.get('donor') || getUser().username, amount, createdAt: new Date().toISOString() }); writeList(DONATE_KEY, items); form.reset(); render(); showAlert({ title: 'ขอบคุณสำหรับการโดเนท', message: formatMoney(amount), type: 'success' }); });
  render();
}

document.addEventListener('DOMContentLoaded', async () => {
  // ดึงข้อมูลล่าสุดจาก Supabase มาไว้ใน localStorage ก่อน render หน้าแรก
  // เพื่อให้ทุกเครื่อง/ทุกเบราว์เซอร์เห็นข้อมูล (ผู้ใช้, สลิปเติมเงิน, ออเดอร์ ฯลฯ) ชุดเดียวกัน
  if (window.__syncPullAll) {
    try { await window.__syncPullAll(); } catch (err) { console.error('[supabase] pull all failed:', err); }
  }

  initChrome();
  initLiveSync();
  refreshIcons();
  document.querySelectorAll('[data-logout]').forEach((button) => button.addEventListener('click', logout));
  initMobileNav();
  if (document.body.dataset.page === 'login') initLogin();
  if (document.body.dataset.page === 'register') initRegister();
  initHeroSlider();
  if (document.body.dataset.protected === 'true') {
    initStore();
    initCart();
    initOrders();
    initTopup();
    initAdmin();
    initProfile();
    initDonate();
  }

  // เปิดรับข้อมูลแบบเรียลไทม์จาก Supabase (เช่น แอดมินเห็นสลิปใหม่ทันทีโดยไม่ต้องกดรีเฟรช)
  if (window.__syncSubscribeRealtime) window.__syncSubscribeRealtime();
});
