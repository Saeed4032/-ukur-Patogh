// Test both authentication scripts in their actual page order and dispatch clicks
// to both onclick and addEventListener handlers, as a browser would.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const signup = readFileSync(new URL('../js/signup.js', import.meta.url), 'utf8');
const login = readFileSync(new URL('../js/login.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.indexOf('src="js/signup.js"') < html.indexOf('src="js/login.js"'));

function setup() {
  const elements = {};
  function element(id) {
    const listeners = {};
    const attrs = {};
    return elements[id] = {
      id, style: {}, className: '', textContent: '', value: '', type: '', disabled: false,
      addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      setAttribute(name, value) { attrs[name] = String(value); },
      getAttribute(name) { return attrs[name] ?? null; },
      async click() {
        // signup.js installs onclick before login.js installs its listener.
        if (this.onclick) await this.onclick({ type: 'click' });
        for (const fn of listeners.click || []) await fn({ type: 'click' });
      },
    };
  }
  for (const id of ['supaErr', 'supaLogin', 'supaForgot', 'supaAuthOverlay', 'supaPass', 'supaPassToggle', 'supaSignup']) element(id);
  elements.supaAuthOverlay.style.display = 'flex';
  elements.supaPass.type = 'password';
  elements.supaPassToggle.textContent = '👁';
  const document = {
    getElementById: id => elements[id] || null,
    createElement() {
      return {
        style: {},
        set innerHTML(value) {
          for (const match of value.matchAll(/id="([^"]+)"/g)) element(match[1]);
        },
      };
    },
    body: { appendChild(el) { elements[el.id] = el; } },
  };
  const calls = [];
  const window = {
    __sb: { auth: { signUp: async data => { calls.push(data); return { error: null }; } } },
    __fakeEmail: phone => phone + '@backgammon.local',
    withTimeout: promise => promise,
    NET_TIMEOUT: 12000,
  };
  const context = { document, window, navigator: { onLine: true }, setTimeout };
  runInNewContext(signup, context);
  runInNewContext(login, context);
  return { elements, calls };
}

test('one click shows the password and a second hides it, with matching icon and ARIA', async () => {
  const { elements: e } = setup();
  assert.equal(e.supaPass.type, 'password');
  assert.equal(e.supaPassToggle.getAttribute('aria-pressed'), 'false');
  await e.supaPassToggle.click();
  assert.equal(e.supaPass.type, 'text');
  assert.equal(e.supaPassToggle.textContent, '🙈');
  assert.equal(e.supaPassToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(e.supaPassToggle.getAttribute('aria-label'), 'مخفی کردن رمز');
  await e.supaPassToggle.click();
  assert.equal(e.supaPass.type, 'password');
  assert.equal(e.supaPassToggle.textContent, '👁');
  assert.equal(e.supaPassToggle.getAttribute('aria-pressed'), 'false');
  assert.equal(e.supaPassToggle.getAttribute('aria-label'), 'نمایش رمز');
});

test('signup form still opens, validates, submits and returns to login', async () => {
  const { elements: e, calls } = setup();
  await e.supaSignup.click();
  assert.equal(e.supaAuthOverlay.style.display, 'none');
  assert.equal(e.supaSignupOverlay.style.display, 'flex');
  e.signupPhone.value = '۱۲۳';
  e.signupName.value = 'علی';
  e.signupPass.value = e.signupPass2.value = 'password';
  await e.signupSubmit.click();
  assert.equal(calls.length, 0);
  assert.match(e.signupErr.textContent, /شماره/);
  e.signupPhone.value = '۰۹۱۲۳۴۵۶۷۸۹';
  await e.signupSubmit.click();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].email, '09123456789@backgammon.local');
  assert.equal(calls[0].options.data.display_name, 'علی');
  assert.match(e.signupErr.textContent, /حساب ساخته شد/);
  await e.signupCancel.click();
  assert.equal(e.supaSignupOverlay.style.display, 'none');
  assert.equal(e.supaAuthOverlay.style.display, 'flex');
});
