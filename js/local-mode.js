(function () {
  var LKEY = "backgammon_local_new";
  function getLN() {
    try {
      var a = JSON.parse(localStorage.getItem(LKEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (_) {
      return [];
    }
  }
  function setLN(a) {
    try {
      localStorage.setItem(LKEY, JSON.stringify(a));
    } catch (_) {}
  }
  window.__localMode = false;
  window.__localIsNew = function (id) {
    return getLN().indexOf(id) > -1;
  };
  window.__enterLocalMode = function () {
    if (window.__localMode) return;
    window.__localMode = true;
    var o = document.getElementById("supaAuthOverlay");
    if (o) o.style.display = "none";
    var b = document.getElementById("offlineBar");
    if (b) {
      b.style.display = "block";
      b.onclick = function () {
        location.reload();
      };
    }
    if (document.body && document.body.style) document.body.style.paddingBottom = "52px";
    window.__sbMarkDirty = function (id, action) {
      if (id && action === "add") {
        var a = getLN();
        if (a.indexOf(id) < 0) {
          a.push(id);
          setLN(a);
        }
      }
    };
    window.__sbDeleteGame = function (id) {
      var a = getLN(),
        i = a.indexOf(id);
      if (i > -1) {
        a.splice(i, 1);
        setLN(a);
      }
    };
  };
  window.__leaveLocalMode = function () {
    if (!window.__localMode) return;
    window.__localMode = false;
    var b = document.getElementById("offlineBar");
    if (b) {
      b.style.display = "none";
      b.onclick = null;
    }
    if (document.body && document.body.style) document.body.style.paddingBottom = "";
  };
})();
