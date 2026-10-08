(function () {
  function initSignupForm() {
    if (document.getElementById("supaSignupOverlay")) return;
    var authOverlay = document.getElementById("supaAuthOverlay");
    if (!authOverlay) return;

    var overlay = document.createElement("div");
    overlay.id = "supaSignupOverlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:var(--bg);display:none;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:Vazirmatn,sans-serif";
    overlay.innerHTML =
      '<div style="width:100%;max-width:400px;background:linear-gradient(145deg,var(--card2),var(--card));border:1px solid var(--soft);border-radius:24px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
      '<h1 style="text-align:center;color:var(--accent);font-size:1.6rem;margin-bottom:6px">🎲 پاتوق تخته‌نرد</h1>' +
      '<p style="text-align:center;color:var(--muted);font-size:.85rem;margin-bottom:22px">ساخت حساب جدید</p>' +
      '<div style="margin-bottom:14px">' +
      '<label style="display:block;color:var(--muted);font-size:.82rem;font-weight:600;margin-bottom:6px">📱 شماره موبایل</label>' +
      '<input id="signupPhone" type="tel" placeholder="مثلاً: 09123456789" style="width:100%;padding:11px 14px;background:var(--input);color:var(--text);border:1.5px solid var(--soft);border-radius:12px;font-size:1rem">' +
      "</div>" +
      '<div style="margin-bottom:14px">' +
      '<label style="display:block;color:var(--muted);font-size:.82rem;font-weight:600;margin-bottom:6px">🎭 نام نمایشی</label>' +
      '<input id="signupName" type="text" placeholder="مثلاً: علی جان" maxlength="30" style="width:100%;padding:11px 14px;background:var(--input);color:var(--text);border:1.5px solid var(--soft);border-radius:12px;font-size:1rem">' +
      "</div>" +
      '<div style="margin-bottom:14px">' +
      '<label style="display:block;color:var(--muted);font-size:.82rem;font-weight:600;margin-bottom:6px">🔒 رمز عبور</label>' +
      '<input id="signupPass" type="password" placeholder="حداقل ۶ کاراکتر" style="width:100%;padding:11px 14px;background:var(--input);color:var(--text);border:1.5px solid var(--soft);border-radius:12px;font-size:1rem">' +
      "</div>" +
      '<div style="margin-bottom:18px">' +
      '<label style="display:block;color:var(--muted);font-size:.82rem;font-weight:600;margin-bottom:6px">🔒 تکرار رمز عبور</label>' +
      '<input id="signupPass2" type="password" placeholder="دوباره رمز رو وارد کن" style="width:100%;padding:11px 14px;background:var(--input);color:var(--text);border:1.5px solid var(--soft);border-radius:12px;font-size:1rem">' +
      "</div>" +
      '<div id="signupErr" style="display:none;padding:10px 14px;background:rgba(170,80,75,.15);border:1px solid var(--danger);color:#f8d8d6;border-radius:12px;font-size:.85rem;margin-bottom:14px"></div>' +
      '<button id="signupSubmit" style="width:100%;padding:13px;background:linear-gradient(145deg,var(--primary),var(--dark));color:var(--contrast);border:0;border-radius:14px;font-weight:800;font-size:1rem;cursor:pointer;margin-bottom:10px">✅ ساختن حساب</button>' +
      '<button id="signupCancel" style="width:100%;padding:11px;background:transparent;color:var(--muted);border:1px dashed var(--soft);border-radius:14px;font-weight:600;font-size:.85rem;cursor:pointer">← بازگشت به ورود</button>' +
      "</div>";
    document.body.appendChild(overlay);

    var signupBtn = document.getElementById("supaSignup");
    var cancelBtn = document.getElementById("signupCancel");
    var submitBtn = document.getElementById("signupSubmit");
    var errBox = document.getElementById("signupErr");

    if (signupBtn) {
      signupBtn.onclick = function () {
        authOverlay.style.display = "none";
        overlay.style.display = "flex";
        errBox.style.display = "none";
      };
    }

    cancelBtn.onclick = function () {
      overlay.style.display = "none";
      authOverlay.style.display = "flex";
    };
    submitBtn.onclick = async function () {
      var phone = String(document.getElementById("signupPhone").value || "")
        .replace(/[۰-۹]/g, function (d) {
          return String(d.charCodeAt(0) - 1776);
        })
        .replace(/[٠-٩]/g, function (d) {
          return String(d.charCodeAt(0) - 1632);
        })
        .trim();
      var name = document.getElementById("signupName").value.trim();
      var pass = document.getElementById("signupPass").value;
      var pass2 = document.getElementById("signupPass2").value;

      function showErr(msg) {
        errBox.style.background = "rgba(170,80,75,.15)";
        errBox.style.borderColor = "var(--danger)";
        errBox.style.color = "#f8d8d6";
        errBox.textContent = msg;
        errBox.style.display = "block";
      }
      function showOk(msg) {
        errBox.style.background = "rgba(84,139,103,.15)";
        errBox.style.borderColor = "var(--success)";
        errBox.style.color = "#d8f0e0";
        errBox.textContent = msg;
        errBox.style.display = "block";
      }

      errBox.style.display = "none";

      if (!/^0\d{10}$/.test(phone)) return showErr("شماره باید با ۰ شروع بشه و ۱۱ رقم باشه");
      if (!name) return showErr("نام نمایشی رو وارد کن");
      if (
        window.__playerNames &&
        window.__playerNames().some(function (p) {
          return p.toLowerCase() === name.toLowerCase();
        })
      )
        return showErr("این نام قبلاً استفاده شده. یه نام دیگه انتخاب کن.");
      if (pass.length < 6) return showErr("رمز باید حداقل ۶ کاراکتر باشه");
      if (pass !== pass2) return showErr("دو تا رمز یکسان نیستن");

      if (!window.__sb) return showErr("اتصال به سرور برقرار نیست");

      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ در حال ساخت...";

      try {
        var r = await window.withTimeout(
          window.__sb.auth.signUp({
            email: window.__fakeEmail(phone),
            password: pass,
            options: { data: { display_name: name, phone: phone } },
          }),
          window.NET_TIMEOUT,
          "signup",
        );

        submitBtn.disabled = false;
        submitBtn.textContent = "✅ ساختن حساب";

        if (r.error) {
          if (r.error.message && r.error.message.indexOf("already") > -1) {
            return showErr("این شماره قبلاً ثبت‌نام کرده");
          }
          return showErr("ثبت‌نام انجام نشد: " + r.error.message);
        }

        showOk("✅ حساب ساخته شد! حالا می‌تونی وارد بشی");
      } catch (e) {
        submitBtn.disabled = false;
        submitBtn.textContent = "✅ ساختن حساب";
        showErr("خطای غیرمنتظره: " + (e.message || "ناشناخته"));
      }
    };
  }

  initSignupForm();
})();

(function () {
  var b = document.getElementById("supaPassToggle"),
    i = document.getElementById("supaPass");
  if (!b || !i) return;
  b.onclick = function () {
    var show = i.type === "password";
    i.type = show ? "text" : "password";
    b.textContent = show ? "🙈" : "👁";
    b.setAttribute("aria-label", show ? "پنهان کردن رمز" : "نمایش رمز");
  };
})();
