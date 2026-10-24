/* صفحه ورود — راهنمای فراموشی رمز + پیام خطای دقیق‌تر.
   sync.js دست نخورده: این فایل بعد از sync.js لود می‌شه و فقط
   signInWithPassword رو wrap می‌کنه تا نوع خطا رو بفهمه. */
(function () {
  var err = document.getElementById("supaErr");
  var loginBtn = document.getElementById("supaLogin");
  var forgot = document.getElementById("supaForgot");
  var overlay = document.getElementById("supaAuthOverlay");
  if (!err || !loginBtn) return;

  var passInput = document.getElementById("supaPass");
  var passToggle = document.getElementById("supaPassToggle");
  if (passInput && passToggle) {
    passToggle.setAttribute("aria-pressed", "false");
    passToggle.addEventListener("click", function () {
      var isVisible = passInput.type === "password";
      passInput.type = isVisible ? "text" : "password";
      passToggle.setAttribute("aria-label", isVisible ? "مخفی کردن رمز" : "نمایش رمز");
      passToggle.setAttribute("aria-pressed", String(isVisible));
    });
  }

  if (forgot)
    forgot.onclick = function () {
      err.className = "login-msg info";
      err.textContent = "🔑 به ادمین پاتوق پیام بده تا رمزت رو ریست کنه.";
      err.style.display = "block";
    };

  function detail(e) {
    if (!navigator.onLine) return "اینترنتت قطعه 🔌";
    if (e.code === "invalid_credentials" || /invalid login/i.test(e.message || "")) return "نام کاربری یا رمز اشتباهه.";
    if (e.status === 429 || e.code === "over_request_rate_limit") return "تلاش زیاد بود، یه دقیقه صبر کن.";
    return "";
  }

  function wrap() {
    var sb = window.__sb;
    if (!sb || !sb.auth || sb.auth.__patoghWrapped) return;
    var orig = sb.auth.signInWithPassword.bind(sb.auth);
    sb.auth.signInWithPassword = function (creds) {
      return orig(creds).then(function (r) {
        // فقط روی صفحه ورود؛ تأیید رمز در «تغییر رمز» دست نمی‌خوره
        if (r && r.error && overlay && overlay.style.display !== "none") {
          var msg = detail(r.error);
          if (msg)
            setTimeout(function () {
              if (err.style.display !== "none") err.textContent = msg;
            }, 0);
        }
        return r;
      });
    };
    sb.auth.__patoghWrapped = true;
  }

  // capture: قبل از هندلر sync.js اجرا می‌شه
  loginBtn.addEventListener(
    "click",
    function () {
      err.className = "login-msg";
      wrap();
    },
    true,
  );
})();
