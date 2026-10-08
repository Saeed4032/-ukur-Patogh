/* هم‌گام‌سازی ناوبری پایین با تب‌های بالا
   کلیک روی آیتم پایین == کلیک برنامه‌ای روی همان تب بالا؛
   پس gotoPage / renderPage / aria-selected دست‌نخورده کار می‌کنند. */
(function () {
  var nav = document.getElementById("bottomNav");
  if (!nav) return;
  var items = Array.prototype.slice.call(nav.querySelectorAll(".nav-item"));

  function sync() {
    var page = document.querySelector(".page.active");
    var id = page ? page.id : "";
    items.forEach(function (it) {
      var on = it.dataset.page === id;
      it.classList.toggle("active", on);
      it.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  items.forEach(function (it) {
    it.addEventListener("click", function () {
      var top = document.querySelector('.tab[data-page="' + it.dataset.page + '"]');
      if (top) {
        top.click();
      } else {
        if (typeof gotoPage === "function") gotoPage(it.dataset.page);
      }
      sync();
    });
  });

  // دنبال‌کردن تغییر صفحه‌ی فعال
  var pages = document.querySelectorAll(".page");
  if (window.MutationObserver) {
    var mo = new MutationObserver(sync);
    pages.forEach(function (p) {
      mo.observe(p, { attributes: true, attributeFilter: ["class"] });
    });
  }
  // بعد از اجرای بقیه‌ی bind()ها، هم‌گام‌سازی اولیه
  if (document.readyState === "complete") setTimeout(sync, 0);
  else
    window.addEventListener("load", function () {
      setTimeout(sync, 0);
    });
  window.addEventListener("load", function () {
    setTimeout(sync, 60);
  });
  window.__syncBottomNav = sync;
})();
