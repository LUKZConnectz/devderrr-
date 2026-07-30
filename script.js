// script.js — guard DOM access and password strength updates
const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

// Password strength
const passwordInput = document.querySelector('[data-password-input]');
const passwordStrength = document.querySelector('.password-strength');
const strengthLabel = document.querySelector('[data-strength-label]');

const getPasswordScore = (password) => {
  if (!password) return 0;
  let score = password.length >= 6 ? 1 : 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 5);
};

const strengthText = ['กรอกรหัสผ่าน', 'อ่อน', 'พอใช้', 'ปานกลาง', 'ดี', 'แข็งแรง'];

if (passwordInput && passwordStrength && strengthLabel) {
  const bars = passwordStrength.querySelectorAll('.strength-bars span');

  // initial values
  passwordStrength.setAttribute('data-score', '0');
  strengthLabel.textContent = strengthText[0];

  passwordInput.addEventListener('input', (event) => {
    const val = event.target.value || '';
    const score = getPasswordScore(val);
    passwordStrength.setAttribute('data-score', String(score));
    strengthLabel.textContent = strengthText[score] || strengthText[0];

    // update bars if present
    if (bars && bars.length) {
      bars.forEach((bar, i) => bar.classList.toggle('active', i < score));
    }
  });
}
