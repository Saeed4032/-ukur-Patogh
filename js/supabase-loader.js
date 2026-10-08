(function () {
  if (window.supabase) return;
  var urls = [
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0",
    "https://fastly.jsdelivr.net/npm/@supabase/supabase-js@2.116.0",
    "https://unpkg.com/@supabase/supabase-js@2.116.0/dist/umd/supabase.js",
  ];
  var i = 0;
  function next() {
    if (window.supabase) return;
    if (i >= urls.length) {
      return;
    }
    var s = document.createElement("script");
    s.src = urls[i];
    s.async = false;
    s.defer = false;
    s.onload = function () {
      if (window.supabase) return;
      i++;
      next();
    };
    s.onerror = function () {
      i++;
      next();
    };
    document.head.appendChild(s);
  }
  next();
})();
