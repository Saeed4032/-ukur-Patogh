// تست دود (smoke test) — بررسی سلامت ساختار پروژه قبل از انتشار
// اجرا: node tests/smoke.mjs
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runInNewContext } from 'vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const ok = (name, cond) => { console.log((cond ? '✓' : '✗ FAIL'), name); if (!cond) failed++; };

// ۱) وجود فایل‌ها
const FILES = [
  'index.html', 'manifest.json', 'service-worker.js', 'README.md',
  'css/style.css', 'css/login.css', 'js/config.js', 'js/app.js',
  'js/local-mode.js', 'supabase.js', 'js/sync.js', 'js/signup.js', 'js/login.js',
  'js/sounds.js', 'js/bottom-nav.js', 'js/scroll.js',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'supabase/policies.sql', 'supabase/storage.sql', 'supabase/maintenance.sql'
];
for (const f of FILES) ok(`فایل: ${f}`, existsSync(join(root, f)));

// ۲) صحت manifest
try {
  const m = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  ok('manifest: name', m.name === 'پاتوق تخته‌نرد');
  ok('manifest: آیکون ۵۱۲', m.icons.some(i => i.sizes === '512x512'));
  ok('manifest: RTL فارسی', m.dir === 'rtl' && m.lang === 'fa');
} catch { ok('manifest: parse', false); }

// ۳) بررسی‌های HTML
const html = readFileSync(join(root, 'index.html'), 'utf8');
ok('HTML: متای CSP', html.includes('Content-Security-Policy'));
ok('HTML: بدون onclick ایستا', !/onclick=/.test(html));
ok('HTML: بدون اسکریپت inline', !/<script>(?!\s*<\/script>)/.test(html.replace(/<script [^>]*><\/script>/g, '')));
ok('HTML: اسکریپت خارجی config', html.includes('js/config.js'));

// ۴) کانفیگ
const cfg = readFileSync(join(root, 'js/config.js'), 'utf8');
ok('config: SUPABASE_URL', cfg.includes('SUPABASE_URL'));
ok('config: SUPABASE_ANON_KEY', cfg.includes('SUPABASE_ANON_KEY'));

// ۵) صحت سینتکس همه‌ی JSها
const jsFiles = FILES.filter(f => f.endsWith('.js'));
for (const f of jsFiles) {
  try { execSync(`node --check "${join(root, f)}"`, { stdio: 'pipe' }); ok(`syntax: ${f}`, true); }
  catch { ok(`syntax: ${f}`, false); }
}

// ۶) هیچ کلید سرویسی (service_role) در کد نیست
// ۶) رفتار دکمه نمایش/مخفی رمز ورود (بدون وابستگی مرورگر)
try {
  const handlers = {};
  const attributes = {};
  function mockElement(id) {
    return {
      className: '',
      style: { display: 'none' },
      addEventListener(type, handler) {
        if (!handlers[id]) handlers[id] = {};
        handlers[id][type] = handler;
      },
      setAttribute(name, value) {
        if (!attributes[id]) attributes[id] = {};
        attributes[id][name] = value;
      }
    };
  }
  const password = { type: 'password' };
  const elements = {
    supaErr: mockElement('supaErr'),
    supaLogin: mockElement('supaLogin'),
    supaForgot: mockElement('supaForgot'),
    supaAuthOverlay: mockElement('supaAuthOverlay'),
    supaPass: password,
    supaPassToggle: mockElement('supaPassToggle')
  };
  elements.supaAuthOverlay.style.display = 'flex';
  runInNewContext(readFileSync(join(root, 'js/login.js'), 'utf8'), {
    document: { getElementById: id => elements[id] || null },
    window: {},
    navigator: { onLine: true },
    setTimeout
  });
  const toggle = handlers.supaPassToggle && handlers.supaPassToggle.click;
  ok('login: handler دکمه نمایش رمز', typeof toggle === 'function');
  if (typeof toggle === 'function') {
    ok('login: شروع در حالت مخفی', password.type === 'password' && attributes.supaPassToggle['aria-pressed'] === 'false');
    toggle();
    ok('login: نمایش رمز', password.type === 'text' && attributes.supaPassToggle['aria-pressed'] === 'true' && attributes.supaPassToggle['aria-label'] === 'مخفی کردن رمز');
    toggle();
    ok('login: مخفی کردن دوباره رمز', password.type === 'password' && attributes.supaPassToggle['aria-pressed'] === 'false' && attributes.supaPassToggle['aria-label'] === 'نمایش رمز');
  } else {
    ok('login: شروع در حالت مخفی', false);
    ok('login: نمایش رمز', false);
    ok('login: مخفی کردن دوباره رمز', false);
  }
} catch (e) {
  ok('login: تست رفتاری نمایش رمز', false);
}

// ۷) هیچ کلید سرویسی (service_role) در کد نیست
const all = jsFiles.map(f => readFileSync(join(root, f), 'utf8')).join('\n');
ok('امنیت: بدون service_role key', !all.includes('service_role'));

console.log(failed ? `\n${failed} تست ناموفق` : '\n✓ همه‌ی تست‌ها موفق');
process.exit(failed ? 1 : 0);
