(function () {
  "use strict";
  try {
    var DEFAULT_PLAYERS = [];
    /* بازیکن‌های پیش‌فرضی که نباید دیگر برگردند.
   این تعریف عمداً در همین IIFE و پیش از فراخوانی load() است، چون
   loadPlayers() همین‌جا اجرا می‌شود. چون کدِ بلوک اسکریپت دوم
   (pull / ensurePlayerExists) هم به آن نیاز دارد و به متغیرهای این
   IIFE دسترسی ندارد، هر سه را روی window هم می‌گذاریم. */
    var BLOCKED_PLAYERS = ["سعید جنائی", "مجتبی دهقان", "حسین دهقان"];
    function isBlocked(name) {
      return typeof name === "string" && BLOCKED_PLAYERS.indexOf(name.trim()) > -1;
    }
    function unblockPlayer(name) {
      var n = String(name || "").trim();
      if (!n) return false;
      var i = BLOCKED_PLAYERS.indexOf(n);
      if (i < 0) return false;
      BLOCKED_PLAYERS.splice(i, 1);
      PLAYERS = PLAYERS.filter(function (x) {
        return x !== n;
      });
      put(PKEY, PLAYERS);
      buildPairs();
      return true;
    }
    window.BLOCKED_PLAYERS = BLOCKED_PLAYERS;
    window.isBlocked = isBlocked;
    window.unblockPlayer = unblockPlayer;
    var PKEY = "backgammon_players";
    var AVKEY = "backgammon_avatars";
    var PLAYERS = [],
      PAIRS = [],
      avatars = {},
      KEY = "backgammon_main_games",
      SKEY = "backgammon_main_settings";
    var TYPES = {
      normal: { name: "عادی", full: "برد عادی", points: 1, cls: "normal", emoji: "✅" },
      mars: { name: "مارس", full: "مارس", points: 2, cls: "mars", emoji: "🔥" },
      black: { name: "سیاه مارس", full: "سیاه مارس", points: 3, cls: "black", emoji: "💀" },
    };
    var PRESET_TAGS = ["حساس", "تمرینی", "پایانی", "دوستان", "انتقامی"];

    var THEMES = {
      blackgold: [
        "#07070c",
        "#101018",
        "#181824",
        "#0c0c14",
        "rgba(212,175,55,.22)",
        "rgba(212,175,55,.09)",
        "#f8f0d8",
        "#a8987a",
        "#d4af37",
        "#7a5f1a",
        "#f4cf6a",
        "#07070c",
        "rgba(212,175,55,.20)",
        "'Vazirmatn',sans-serif",
        "16px",
        "10px",
        "radial-gradient(ellipse at 50% -30%,rgba(244,207,106,.20),transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(212,175,55,.10),transparent 45%),radial-gradient(ellipse at 0% 50%,rgba(138,111,42,.08),transparent 40%),linear-gradient(180deg,#0e0e16 0%,#07070c 60%,#04040a 100%)",
      ],
      royal: [
        "#050505",
        "#0d0c0a",
        "#15130f",
        "#0a0908",
        "rgba(230,195,120,.28)",
        "rgba(230,195,120,.10)",
        "#f6ecd6",
        "#a99a7c",
        "#e3c27a",
        "#8a6a2c",
        "#f7e2a8",
        "#120d04",
        "rgba(227,194,122,.18)",
        "'Vazirmatn',sans-serif",
        "22px",
        "14px",
        "radial-gradient(ellipse at 50% -20%,rgba(247,226,168,.18),transparent 55%),radial-gradient(ellipse at 100% 110%,rgba(227,194,122,.10),transparent 50%),repeating-linear-gradient(45deg,rgba(227,194,122,.03) 0 1px,transparent 1px 22px),repeating-linear-gradient(-45deg,rgba(227,194,122,.03) 0 1px,transparent 1px 22px),linear-gradient(180deg,#0b0a08 0%,#050505 70%)",
      ],
      emerald: [
        "#03140f",
        "#062019",
        "#0a2a21",
        "#041a14",
        "rgba(216,180,90,.30)",
        "rgba(216,180,90,.10)",
        "#f2ead2",
        "#9fb3a6",
        "#d8b45a",
        "#7d6224",
        "#f3d98c",
        "#04130e",
        "rgba(216,180,90,.18)",
        "'Vazirmatn',sans-serif",
        "22px",
        "14px",
        "radial-gradient(ellipse at 50% -10%,rgba(243,217,140,.16),transparent 45%),radial-gradient(ellipse at 50% 35%,rgba(26,120,86,.55),transparent 65%),radial-gradient(ellipse at 50% 120%,rgba(0,0,0,.7),transparent 60%),repeating-radial-gradient(circle at 30% 30%,rgba(255,255,255,.012) 0 1px,transparent 1px 3px),linear-gradient(180deg,#063026 0%,#021a13 100%)",
      ],
      walnut: [
        "#1a0f08",
        "#24160d",
        "#2e1c11",
        "#1c110a",
        "rgba(222,184,120,.30)",
        "rgba(222,184,120,.10)",
        "#f7ead3",
        "#c0a586",
        "#d9a85b",
        "#8a5a24",
        "#f0c987",
        "#1a0f08",
        "rgba(217,168,91,.18)",
        "'Vazirmatn',sans-serif",
        "22px",
        "14px",
        "radial-gradient(ellipse at 50% -10%,rgba(240,201,135,.18),transparent 50%),radial-gradient(ellipse at 50% 120%,rgba(0,0,0,.55),transparent 60%),repeating-linear-gradient(93deg,rgba(0,0,0,.20) 0 2px,transparent 2px 9px,rgba(255,210,150,.05) 9px 11px,transparent 11px 23px,rgba(0,0,0,.12) 23px 24px,transparent 24px 37px),linear-gradient(180deg,#3b2111 0%,#1f1209 100%)",
      ],
      rainy: [
        "#080b12",
        "rgba(22,28,40,.55)",
        "rgba(32,40,56,.65)",
        "rgba(15,20,30,.55)",
        "rgba(160,180,210,.24)",
        "rgba(150,170,200,.12)",
        "#e8edf5",
        "#8a95a8",
        "#5a7a9a",
        "#3d5670",
        "#a8c4dd",
        "#ffffff",
        "rgba(90,122,154,.20)",
        "'Vazirmatn',sans-serif",
        "22px",
        "14px",
        "radial-gradient(ellipse at 50% -10%,rgba(120,150,190,.16),transparent 55%),radial-gradient(ellipse at 0% 100%,rgba(70,90,120,.14),transparent 50%),radial-gradient(ellipse at 100% 80%,rgba(90,110,140,.10),transparent 45%),repeating-linear-gradient(105deg,transparent 0 4px,rgba(180,200,220,.022) 4px 5px),repeating-linear-gradient(75deg,transparent 0 7px,rgba(160,180,210,.015) 7px 8px),linear-gradient(180deg,#0c1018 0%,#080b12 50%,#05070c 100%)",
      ],
    };
    var themeNames = {
      blackgold: "👑 طلای سیاه",
      royal: "💎 شاهانه",
      emerald: "♣️ زمرد سلطنتی",
      walnut: "🪵 گردو و چرم",
      rainy: "🌧️ باران شیشه‌ای",
    };
    var LUX_THEMES = ["royal", "emerald", "walnut"];

    var AVATAR_PALETTE = [
      "#e06a6a",
      "#d18f3e",
      "#548b67",
      "#4a7ab8",
      "#8a5cc4",
      "#c46a9e",
      "#3d8b8b",
      "#a35a3d",
      "#5b6fa8",
      "#8a7a3d",
      "#a8495c",
      "#3d6e8b",
    ];
    var colors = ["#5b9dc4", "#b075c1", "#65a276", "#e0a340", "#e06a6a", "#6ac1e0", "#c58ae0", "#7ec17e"];
    var games = [],
      settings = { theme: "blackgold", font: "1", intensity: "standard" },
      selected = { pair: null, winner: null, type: null, slot1: null, slot2: null },
      storageOK = true;

    var quickTags = [],
      lastDeleted = null,
      undoTimer = null,
      poolFilter = "";
    var TKEY = "backgammon_tournaments";
    var tournament = { name: "تورنمنت ۱", start: 0, nextNum: 1 };
    var archive = [];

    function $(x) {
      return document.getElementById(x);
    }
    function esc(x) {
      return String(x == null ? "" : x).replace(/[&<>'"`]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;", "`": "&#96;" }[c];
      });
    }
    function safeHtmlFragment(value) {
      var s = String(value == null ? "" : value);
      return s.replace(/[&<>'"`]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;", "`": "&#96;" }[c];
      });
    }
    function secureId() {
      try {
        var a = new Uint8Array(10);
        (window.crypto || window.msCrypto).getRandomValues(a);
        var s = "";
        for (var i = 0; i < a.length; i++) {
          s += ("0" + a[i].toString(36)).slice(-2);
        }
        return "g_" + Date.now().toString(36) + "_" + s.slice(0, 12);
      } catch (e) {
        return "g_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
      }
    }
    function id() {
      return secureId();
    }
    function pts(t) {
      return TYPES[t] ? TYPES[t].points : 0;
    }
    function loser(g) {
      return g.winner === g.player1 ? g.player2 : g.player1;
    }
    function n(x, d) {
      return Number(x || 0).toLocaleString("fa-IR", { maximumFractionDigits: d == null ? 2 : d });
    }
    function percent(w, t) {
      return t ? n((w * 100) / t, 1) + "٪" : "۰٪";
    }
    function pdate(t) {
      try {
        return new Date(t).toLocaleDateString("fa-IR-u-ca-persian");
      } catch (e) {
        return new Date(t).toLocaleDateString("fa-IR");
      }
    }
    function ptime(t) {
      try {
        return new Date(t).toLocaleTimeString("fa-IR");
      } catch (e) {
        return new Date(t).toLocaleTimeString();
      }
    }
    function pad2(x) {
      return String(x).padStart(2, "0");
    }
    function dateInputValue(t) {
      var d = new Date(Number(t));
      return isNaN(d.getTime()) ? "" : d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
    }
    function timeInputValue(t) {
      var d = new Date(Number(t));
      return isNaN(d.getTime()) ? "" : pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    }
    function localDateStart(value) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
      return m ? new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0).getTime() : NaN;
    }
    function localDateTime(dateValue, timeValue) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue || ""));
      var t = /^(\d{2}):(\d{2})/.exec(String(timeValue || ""));
      if (!m || !t) return NaN;
      return new Date(+m[1], +m[2] - 1, +m[3], +t[1], +t[2], 0, 0).getTime();
    }
    function pairKey(a, b) {
      return [a, b].sort().join("|");
    }
    function valid(g) {
      return (
        g &&
        typeof g.player1 === "string" &&
        g.player1.trim() &&
        typeof g.player2 === "string" &&
        g.player2.trim() &&
        g.player1 !== g.player2 &&
        typeof g.winner === "string" &&
        (g.winner === g.player1 || g.winner === g.player2) &&
        TYPES[g.type] &&
        isFinite(Number(g.timestamp))
      );
    }
    function sign(g) {
      return [g.timestamp, pairKey(g.player1, g.player2), g.winner, g.type].join("::");
    }

    function avatarColor(name) {
      if (!name) return AVATAR_PALETTE[0];
      var h = 0;
      for (var i = 0; i < name.length; i++) {
        h = (h * 31 + name.charCodeAt(i)) | 0;
      }
      return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
    }
    var AV_RE = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+\/]+={0,2}$/;
    function safeAvatar(v) {
      return typeof v === "string" && v.length <= 400000 && AV_RE.test(v) ? v : "";
    }
    function avatarHTML(name, size) {
      var s = size || 32;
      var trimmed = String(name || "").trim();
      var img = safeAvatar(avatars[trimmed]);
      if (img) {
        return (
          '<span class="avatar avatar-img" style="width:' +
          s +
          "px;height:" +
          s +
          "px;background-image:url('" +
          img +
          "')\"></span>"
        );
      }
      var letter = trimmed ? trimmed.charAt(0) : "?";
      var color = avatarColor(trimmed);
      return (
        '<span class="avatar" style="background:' +
        color +
        ";width:" +
        s +
        "px;height:" +
        s +
        "px;font-size:" +
        Math.round(s * 0.42) +
        'px">' +
        esc(letter) +
        "</span>"
      );
    }
    function avatarInline(name, size) {
      return avatarHTML(name, size || 26);
    }

    function get(k, d) {
      try {
        var x = localStorage.getItem(k);
        return x ? JSON.parse(x) : d;
      } catch (e) {
        storageOK = false;
        $("storageWarning").classList.remove("hidden");
        return d;
      }
    }
    function put(k, v) {
      try {
        var json = JSON.stringify(v);
        localStorage.setItem(k, json);
        if (window.__sbOnLocalSave) window.__sbOnLocalSave(k, json);
      } catch (e) {
        storageOK = false;
        $("storageWarning").classList.remove("hidden");
      }
    }
    function remove(k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        storageOK = false;
        $("storageWarning").classList.remove("hidden");
      }
    }

    function buildPairs() {
      PAIRS = [];
      for (var i = 0; i < PLAYERS.length; i++)
        for (var j = i + 1; j < PLAYERS.length; j++) PAIRS.push([PLAYERS[i], PLAYERS[j]]);
    }
    function loadPlayers() {
      var s = get(PKEY, null);
      PLAYERS = Array.isArray(s) ? s.slice() : [];
      // حذف دائمی بازیکن‌های پیش‌فرض بلاک‌شده
      var before = PLAYERS.length;
      PLAYERS = PLAYERS.filter(function (n) {
        return !isBlocked(n);
      });
      if (PLAYERS.length !== before) put(PKEY, PLAYERS);
      buildPairs();
    }
    function savePlayers() {
      put(PKEY, PLAYERS);
      buildPairs();
    }
    function loadAvatars() {
      var a = get(AVKEY, null);
      avatars = {};
      if (a && typeof a === "object" && !Array.isArray(a)) {
        Object.keys(a).forEach(function (k) {
          var v = safeAvatar(a[k]);
          if (v) avatars[k] = v;
        });
      }
    }
    function saveAvatars() {
      put(AVKEY, avatars);
    }

    function saveSelection() {
      try {
        sessionStorage.setItem("backgammon_sel", JSON.stringify(selected));
      } catch (_) {}
    }
    function loadSelection() {
      try {
        var s = JSON.parse(sessionStorage.getItem("backgammon_sel") || "{}");
        if (s && typeof s === "object") {
          if (s.slot1 && PLAYERS.indexOf(s.slot1) > -1) selected.slot1 = s.slot1;
          if (s.slot2 && PLAYERS.indexOf(s.slot2) > -1) selected.slot2 = s.slot2;
          if (selected.slot1 && selected.slot2) selected.pair = [selected.slot1, selected.slot2];
          if (selected.pair && (s.winner === selected.pair[0] || s.winner === selected.pair[1]))
            selected.winner = s.winner;
          if (TYPES[s.type]) selected.type = s.type;
        }
      } catch (_) {}
    }

    function loadTournament() {
      var t = get(TKEY, null);
      if (t && typeof t === "object") {
        if (typeof t.name === "string") tournament.name = t.name;
        if (typeof t.start === "number") tournament.start = t.start;
        if (typeof t.nextNum === "number") tournament.nextNum = t.nextNum;
        if (Array.isArray(t.archive)) archive = t.archive;
      }
    }
    function saveTournament() {
      put(TKEY, { name: tournament.name, start: tournament.start, nextNum: tournament.nextNum, archive: archive });
    }

    function load() {
      loadPlayers();
      loadAvatars();
      var a = get(KEY, []),
        s = get(SKEY, {});
      games = Array.isArray(a)
        ? a.filter(valid).map(function (g) {
            g.timestamp = Number(g.timestamp);
            g.id = g.id || id();
            g.note = typeof g.note === "string" ? g.note : "";
            g.tags = Array.isArray(g.tags) ? g.tags : [];
            g.date = g.date || pdate(g.timestamp);
            g.time = g.time || ptime(g.timestamp);
            return g;
          })
        : [];
      if (s && typeof s === "object") for (var k in s) settings[k] = s[k];
      if (!THEMES[settings.theme]) settings.theme = "blackgold";
      loadTournament();
      loadSelection();
    }
    function save() {
      put(KEY, games);
    }
    function saveSettings() {
      put(SKEY, settings);
    }

    function apply() {
      var v = THEMES[settings.theme] || THEMES.blackgold;
      var k = [
        "--bg",
        "--card",
        "--card2",
        "--input",
        "--border",
        "--soft",
        "--text",
        "--muted",
        "--primary",
        "--dark",
        "--accent",
        "--contrast",
        "--hover",
        "--font",
        "--radius",
        "--btnradius",
        "--bgimg",
      ];
      k.forEach(function (x, i) {
        document.documentElement.style.setProperty(x, v[i]);
      });
      document.documentElement.setAttribute("data-theme", settings.theme);
      if (LUX_THEMES.indexOf(settings.theme) > -1) document.documentElement.setAttribute("data-lux", "");
      else document.documentElement.removeAttribute("data-lux");
      document.documentElement.style.fontSize = 16 * Number(settings.font || 1) + "px";
      document.querySelector(".app").style.filter =
        settings.intensity === "calm" ? "saturate(.82)" : settings.intensity === "bold" ? "saturate(1.16)" : "";
      document.documentElement.style.scrollBehavior = "smooth";
      $("themeCurrent") && renderThemes();
    }
    function stats(p) {
      var s = { name: p, games: 0, wins: 0, losses: 0, normal: 0, mars: 0, black: 0, total: 0 };
      games.forEach(function (g) {
        if (g.player1 !== p && g.player2 !== p) return;
        s.games++;
        if (g.winner === p) {
          s.wins++;
          s[g.type]++;
          s.total += pts(g.type);
        } else s.losses++;
      });
      s.rate = s.games ? s.wins / s.games : 0;
      s.avg = s.games ? s.total / s.games : 0;
      return s;
    }
    function h2h(a, b) {
      var list = games.filter(function (g) {
        return pairKey(g.player1, g.player2) === pairKey(a, b);
      });
      var aw = list.filter(function (g) {
        return g.winner === a;
      }).length;
      var bw = list.filter(function (g) {
        return g.winner === b;
      }).length;
      return { a: a, b: b, list: list, aw: aw, bw: bw, total: list.length };
    }
    function rankingSort(a, b) {
      var pa = a.games < 5,
        pb = b.games < 5;
      if (pa !== pb) return pa ? 1 : -1;
      if (b.rate !== a.rate) return b.rate - a.rate;
      if (b.total !== a.total) return b.total - a.total;
      if (b.wins !== a.wins) return b.wins - a.wins;
      var h = h2h(a.name, b.name),
        d = h.aw - h.bw;
      if (d) return -d;
      return a.name.localeCompare(b.name, "fa");
    }
    function validateSelection() {
      if (selected.slot1 && PLAYERS.indexOf(selected.slot1) === -1) selected.slot1 = null;
      if (selected.slot2 && PLAYERS.indexOf(selected.slot2) === -1) selected.slot2 = null;
      if (selected.slot1 && selected.slot2) {
        selected.pair = [selected.slot1, selected.slot2];
      } else {
        selected.pair = null;
      }
      if (selected.winner && selected.pair && selected.pair.indexOf(selected.winner) === -1) selected.winner = null;
      if (selected.type && !TYPES[selected.type]) selected.type = null;
    }
    function revealCard(el) {
      el.classList.add("reveal");
      setTimeout(function () {
        el.classList.remove("reveal");
      }, 360);
    }
    var lastScrollGesture = 0;
    function markScrollGesture() {
      lastScrollGesture = Date.now();
    }
    window.addEventListener("wheel", markScrollGesture, { passive: true });
    window.addEventListener("touchmove", markScrollGesture, { passive: true });
    function prefersReduced() {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    function smartScroll(el) {
      if (!el) return;
      if (Date.now() - lastScrollGesture < 1500) return;
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top >= 70 && rect.bottom <= vh - 20) return;
      var targetY = window.pageYOffset + rect.top - 85;
      if (targetY < 0) targetY = 0;
      window.scrollTo({ top: targetY, behavior: prefersReduced() ? "auto" : "smooth" });
    }
    function forceScrollTop() {
      window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
    }
    function forceScrollBottom() {
      window.scrollTo({ top: document.body.scrollHeight, behavior: prefersReduced() ? "auto" : "smooth" });
    }
    function processImage(file, callback) {
      if (!file || !/^image\//.test(file.type)) {
        message("فایل انتخابی عکس نیست.", true);
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var max = 220;
          var w = img.width,
            h = img.height;
          if (w > h) {
            if (w > max) {
              h = Math.round((h * max) / w);
              w = max;
            }
          } else {
            if (h > max) {
              w = Math.round((w * max) / h);
              h = max;
            }
          }
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          try {
            var dataUrl = canvas.toDataURL("image/jpeg", 0.82);
            callback(dataUrl);
          } catch (err) {
            message("پردازش عکس ممکن نشد.", true);
          }
        };
        img.onerror = function () {
          message("عکس نامعتبر است.", true);
        };
        img.src = e.target.result;
      };
      reader.onerror = function () {
        message("خواندن فایل ناموفق بود.", true);
      };
      reader.readAsDataURL(file);
    }
    function pickAvatar(playerName, callback) {
      var inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "image/*";
      inp.style.display = "none";
      document.body.appendChild(inp);
      inp.onchange = function () {
        var f = inp.files && inp.files[0];
        cleanup();
        if (!f) return;
        processImage(f, function (dataUrl) {
          avatars[playerName] = dataUrl;
          saveAvatars();
          if (typeof callback === "function") callback();
        });
      };
      inp.click();
      var cleaned = false;
      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        inp.remove();
        window.removeEventListener("focus", onFocus);
      }
      function onFocus() {
        setTimeout(function () {
          if (inp.files && inp.files.length) return;
          cleanup();
        }, 500);
      }
      window.addEventListener("focus", onFocus);
    }
    function removeAvatar(playerName, callback) {
      if (!avatars[playerName]) return;
      delete avatars[playerName];
      saveAvatars();
      if (window.__sbAvatarRemoved) window.__sbAvatarRemoved(playerName);
      if (typeof callback === "function") callback();
    }

    function slotContentHTML(name) {
      var s = stats(name);
      return (
        avatarHTML(name, 50) +
        '<strong class="vs-slot-name">' +
        esc(name) +
        "</strong>" +
        '<span class="vs-stat">' +
        n(s.games, 0) +
        " بازی · " +
        (s.games ? percent(s.wins, s.games) : "—") +
        "</span>" +
        '<span class="vs-slot-remove" aria-hidden="true">×</span>'
      );
    }
    function renderSlots() {
      var el = $("vsSlots");
      if (!el) return;
      var s1 = selected.slot1,
        s2 = selected.slot2;
      el.innerHTML =
        '<button type="button" class="vs-slot' +
        (s1 ? " filled" : "") +
        '" data-slot="1" aria-pressed="' +
        (s1 ? "true" : "false") +
        '"' +
        (s1 ? ' aria-label="حذف ' + esc(s1) + ' از جای اول"' : ' aria-label="انتخاب بازیکن اول"') +
        ">" +
        (s1
          ? slotContentHTML(s1)
          : '<span class="vs-slot-label">انتخاب ۱</span><span class="vs-slot-hint">کلیک کن یا بنداز</span>') +
        "</button>" +
        '<div class="vs-slot-divider"><span class="vs-text' +
        (s1 && s2 ? "" : " small") +
        '">VS</span></div>' +
        '<button type="button" class="vs-slot' +
        (s2 ? " filled" : "") +
        '" data-slot="2" aria-pressed="' +
        (s2 ? "true" : "false") +
        '"' +
        (s2 ? ' aria-label="حذف ' + esc(s2) + ' از جای دوم"' : ' aria-label="انتخاب بازیکن دوم"') +
        ">" +
        (s2
          ? slotContentHTML(s2)
          : '<span class="vs-slot-label">انتخاب ۲</span><span class="vs-slot-hint">کلیک کن یا بنداز</span>') +
        "</button>";
      [].forEach.call(el.querySelectorAll(".vs-slot"), function (slot) {
        var slotNum = slot.dataset.slot;
        slot.addEventListener("dragover", function (e) {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
          slot.classList.add("dragover");
        });
        slot.addEventListener("dragenter", function (e) {
          e.preventDefault();
          slot.classList.add("dragover");
        });
        slot.addEventListener("dragleave", function () {
          slot.classList.remove("dragover");
        });
        slot.addEventListener("drop", function (e) {
          e.preventDefault();
          slot.classList.remove("dragover");
          var name = e.dataTransfer ? e.dataTransfer.getData("text/plain") : "";
          if (!name) name = e.dataTransfer ? e.dataTransfer.getData("text") : "";
          if (name) setSlot(slotNum, name);
        });
        slot.onclick = function () {
          var filled = slotNum === "1" ? selected.slot1 : selected.slot2;
          if (filled) clearSlot(slotNum);
        };
      });
    }
    function renderPool() {
      var el = $("playerPool");
      if (!el) return;
      var search = $("poolSearch");
      if (search) {
        search.classList.toggle("hidden", PLAYERS.length < 9);
        if (search.value !== poolFilter) search.value = poolFilter;
      }
      if (PLAYERS.length < 2) {
        el.innerHTML = '<div class="empty">حداقل دو بازیکن لازم است.</div>';
        return;
      }
      if (PLAYERS.length === 2) {
        if (!selected.slot1) selected.slot1 = PLAYERS[0];
        if (!selected.slot2) selected.slot2 = PLAYERS[1];
      }
      var used = [selected.slot1, selected.slot2].filter(Boolean);
      var q = poolFilter.trim().toLowerCase();
      var list = q
        ? PLAYERS.filter(function (p) {
            return p.toLowerCase().indexOf(q) > -1;
          })
        : PLAYERS.slice();
      if (!list.length) {
        el.innerHTML = '<div class="empty">بازیکنی با این نام پیدا نشد.</div>';
        return;
      }
      el.innerHTML = list
        .map(function (p) {
          var s = stats(p);
          var placed = used.indexOf(p) > -1;
          return (
            '<button type="button" class="pool-player' +
            (placed ? " placed" : "") +
            '" draggable="' +
            (placed ? "false" : "true") +
            '" data-player="' +
            esc(p) +
            '" aria-pressed="' +
            (placed ? "true" : "false") +
            '">' +
            avatarHTML(p, 44) +
            '<span class="pp-name">' +
            esc(p) +
            "</span>" +
            '<span class="pp-stats">' +
            (placed
              ? "✓ انتخاب شده"
              : n(s.games, 0) + " بازی · " + (s.games ? percent(s.wins, s.games) + " برد" : "—")) +
            "</span>" +
            "</button>"
          );
        })
        .join("");
      [].forEach.call(el.querySelectorAll(".pool-player"), function (card) {
        if (card.classList.contains("placed")) {
          card.onclick = function () {
            var name = card.dataset.player;
            if (selected.slot1 === name) clearSlot("1");
            else if (selected.slot2 === name) clearSlot("2");
          };
          return;
        }
        card.addEventListener("dragstart", function (e) {
          card.classList.add("dragging");
          if (e.dataTransfer) {
            e.dataTransfer.setData("text/plain", card.dataset.player);
            e.dataTransfer.setData("text", card.dataset.player);
            e.dataTransfer.effectAllowed = "move";
          }
        });
        card.addEventListener("dragend", function () {
          card.classList.remove("dragging");
        });
        card.onclick = function () {
          var name = card.dataset.player;
          if (!name) return;
          if (!selected.slot1) setSlot("1", name);
          else if (!selected.slot2) setSlot("2", name);
          else message("هر دو انتخاب پُر شدن. یکی رو برداشته کن.", true);
        };
      });
    }
    function setSlot(num, name) {
      if (!name || PLAYERS.indexOf(name) === -1) return;
      if (num === "1") {
        if (selected.slot2 === name) selected.slot2 = null;
        selected.slot1 = name;
      } else {
        if (selected.slot1 === name) selected.slot1 = null;
        selected.slot2 = name;
      }
      selected.winner = null;
      selected.type = null;
      renderRegister();
      if (selected.slot1 && selected.slot2) {
        requestAnimationFrame(function () {
          smartScroll($("winnerArea"));
        });
      }
    }
    function clearSlot(num) {
      if (num === "1") selected.slot1 = null;
      else selected.slot2 = null;
      selected.pair = null;
      selected.winner = null;
      selected.type = null;
      renderRegister();
    }
    function renderWinner() {
      var wa = $("winnerArea"),
        arena = $("winnerArena"),
        hint = $("winnerHint");
      if (!wa || !arena) return;
      if (!selected.pair) {
        wa.classList.add("hidden");
        return;
      }
      var wasHidden = wa.classList.contains("hidden");
      wa.classList.remove("hidden");
      if (wasHidden) revealCard(wa);
      var a = selected.pair[0],
        b = selected.pair[1];
      var sa = stats(a),
        sb = stats(b);
      var key = selected.pair.join("|");
      if (arena.dataset.key !== key) {
        arena.dataset.key = key;
        arena.innerHTML =
          '<div class="winner-arena">' +
          '<button type="button" class="winner-side' +
          (selected.winner === a ? " active" : "") +
          '" data-win="' +
          esc(a) +
          '" aria-pressed="' +
          (selected.winner === a ? "true" : "false") +
          '">' +
          avatarHTML(a, 58) +
          '<span class="winner-name">' +
          esc(a) +
          "</span>" +
          '<span class="winner-stat">' +
          n(sa.games, 0) +
          " بازی · " +
          (sa.games ? percent(sa.wins, sa.games) : "—") +
          "</span>" +
          '<span class="winner-pick">برنده</span>' +
          "</button>" +
          '<div class="vs-slot-divider"><span class="vs-text">VS</span></div>' +
          '<button type="button" class="winner-side' +
          (selected.winner === b ? " active" : "") +
          '" data-win="' +
          esc(b) +
          '" aria-pressed="' +
          (selected.winner === b ? "true" : "false") +
          '">' +
          avatarHTML(b, 58) +
          '<span class="winner-name">' +
          esc(b) +
          "</span>" +
          '<span class="winner-stat">' +
          n(sb.games, 0) +
          " بازی · " +
          (sb.games ? percent(sb.wins, sb.games) : "—") +
          "</span>" +
          '<span class="winner-pick">برنده</span>' +
          "</button>" +
          "</div>" +
          '<div class="vs-comparison">' +
          '<div class="vs-comp-row"><span class="vs-comp-val left">' +
          n(sa.games, 0) +
          '</span><span class="vs-comp-label">بازی</span><span class="vs-comp-val right">' +
          n(sb.games, 0) +
          "</span></div>" +
          '<div class="vs-comp-row"><span class="vs-comp-val left">' +
          n(sa.wins, 0) +
          '</span><span class="vs-comp-label">برد</span><span class="vs-comp-val right">' +
          n(sb.wins, 0) +
          "</span></div>" +
          '<div class="vs-comp-row"><span class="vs-comp-val left">' +
          (sa.games ? percent(sa.wins, sa.games) : "—") +
          '</span><span class="vs-comp-label">درصد برد</span><span class="vs-comp-val right">' +
          (sb.games ? percent(sb.wins, sb.games) : "—") +
          "</span></div>" +
          "</div>";
        [].forEach.call(arena.querySelectorAll("[data-win]"), function (btn) {
          btn.onclick = function () {
            selected.winner = btn.dataset.win;
            renderRegister();
            requestAnimationFrame(function () {
              smartScroll($("typeArea"));
            });
          };
        });
      } else {
        [].forEach.call(arena.querySelectorAll("[data-win]"), function (btn) {
          var on = btn.dataset.win === selected.winner;
          btn.classList.toggle("active", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
      }
      if (hint) hint.classList.toggle("hidden", !!selected.winner);
    }
    function renderTypes() {
      var ta = $("typeArea"),
        tb = $("typeButtons");
      if (!selected.pair) {
        ta.classList.add("hidden");
        return;
      }
      var wasHidden = ta.classList.contains("hidden");
      ta.classList.remove("hidden");
      if (wasHidden) revealCard(ta);
      if (!tb.children.length) {
        tb.innerHTML = Object.keys(TYPES)
          .map(function (t) {
            var x = TYPES[t];
            return (
              '<button class="choice" data-t="' +
              t +
              '" aria-pressed="false"><span class="choice-emoji">' +
              x.emoji +
              '</span><span class="choice-name">' +
              x.name +
              "</span><small>" +
              n(x.points, 0) +
              "×</small></button>"
            );
          })
          .join("");
        [].forEach.call(tb.children, function (b) {
          b.onclick = function () {
            selected.type = b.dataset.t;
            renderRegister();
            requestAnimationFrame(function () {
              forceScrollBottom();
            });
          };
        });
      }
      [].forEach.call(tb.children, function (b) {
        var on = b.dataset.t === selected.type;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    function renderPreview() {
      var el = $("preview");
      if (!selected.pair) {
        el.innerHTML = '<div class="preview-empty">برای شروع، یک بازیکن رو بکش توی جای خالی 👆</div>';
      } else {
        var a = selected.pair[0],
          b = selected.pair[1];
        var win = selected.winner;
        var isWinA = win === a,
          isWinB = win === b;
        var playerA =
          '<div class="preview-player' +
          (isWinA ? " is-winner" : isWinB ? " is-loser" : "") +
          '">' +
          avatarHTML(a, 48) +
          '<span class="pp-pname">' +
          esc(a) +
          "</span>" +
          (isWinA ? '<span class="preview-check">✓ برنده</span>' : "") +
          "</div>";
        var playerB =
          '<div class="preview-player' +
          (isWinB ? " is-winner" : isWinA ? " is-loser" : "") +
          '">' +
          avatarHTML(b, 48) +
          '<span class="pp-pname">' +
          esc(b) +
          "</span>" +
          (isWinB ? '<span class="preview-check">✓ برنده</span>' : "") +
          "</div>";
        var summary = "";
        if (win) {
          var ti = selected.type ? TYPES[selected.type] : null;
          var badges = "";
          if (ti) badges += '<span class="preview-badge badge-' + ti.cls + '">' + ti.full + "</span>";
          if (ti) badges += '<span class="preview-badge badge-points">+' + n(ti.points, 0) + " امتیاز</span>";
          summary =
            '<div class="preview-summary">' +
            (badges ? '<div class="preview-badges">' + badges + "</div>" : "") +
            '<div class="preview-line"><b>' +
            esc(win) +
            "</b> این بازی رو برد</div>" +
            (!ti ? '<div class="preview-hint">الان نوع برد رو انتخاب کن 👇</div>' : "") +
            "</div>";
        } else {
          summary =
            '<div class="preview-summary"><div class="preview-line">کی برنده شد؟ 🤔</div><div class="preview-hint">روی طرف برنده کلیک کن</div></div>';
        }
        el.innerHTML =
          '<div class="preview-versus">' +
          playerA +
          '<span class="preview-x-circle">×</span>' +
          playerB +
          "</div>" +
          summary;
      }
      var btn = $("add");
      if (!selected.pair) {
        btn.textContent = "➊ ابتدا زوج را انتخاب کنید";
        btn.disabled = true;
      } else if (!selected.winner) {
        btn.textContent = "➋ برنده را انتخاب کنید";
        btn.disabled = true;
      } else if (!selected.type) {
        btn.textContent = "➌ نوع برد را انتخاب کنید";
        btn.disabled = true;
      } else {
        var t = TYPES[selected.type];
        btn.textContent = "✅ ثبت بازی (" + t.full + " برای " + selected.winner + ")";
        btn.disabled = false;
      }
    }
    function renderQuickTags() {
      var el = $("quickTags");
      if (!el) return;
      el.innerHTML = PRESET_TAGS.map(function (t) {
        var on = quickTags.indexOf(t) > -1;
        return (
          '<button type="button" class="tag ' +
          (on ? "active" : "") +
          '" data-qt="' +
          esc(t) +
          '" aria-pressed="' +
          (on ? "true" : "false") +
          '">' +
          esc(t) +
          "</button>"
        );
      }).join("");
      [].forEach.call(el.querySelectorAll("[data-qt]"), function (b) {
        b.onclick = function () {
          var t = b.dataset.qt,
            i = quickTags.indexOf(t);
          if (i > -1) quickTags.splice(i, 1);
          else quickTags.push(t);
          renderQuickTags();
        };
      });
    }
    function updatePairTitle() {
      var t = $("pairTitle"),
        h = $("dndHint");
      if (!t || !h) return;
      if (selected.slot1 && selected.slot2) {
        t.textContent = "نبرد آماده‌ست ⚔️";
        h.textContent = "حالا برنده رو انتخاب کن";
      } else if (selected.slot1 || selected.slot2) {
        t.textContent = "یه نفر دیگه انتخاب کن";
        h.textContent = "دومی رو بزن یا بکش داخل جای خالی";
      } else {
        t.textContent = "انتخاب بازیکنان";
        h.textContent = "روی بازیکن بزن یا بکشش داخل جای خالی";
      }
    }
    function renderRegister() {
      validateSelection();
      updatePairTitle();
      renderSlots();
      renderPool();
      renderWinner();
      renderTypes();
      renderPreview();
      renderQuickTags();
      var lb = $("last");
      if (lb) lb.disabled = !games.length;
      saveSelection();
    }
    function toast(html, bad) {
      var e = $("toast");
      e.innerHTML = safeHtmlFragment(html);
      e.className = "toast show" + (bad ? " bad" : "");
      clearTimeout(window._tt);
      window._tt = setTimeout(
        function () {
          e.className = "toast";
          e.innerHTML = "";
        },
        bad ? 3400 : 2400,
      );
    }
    function message(t, bad) {
      toast(esc(t), bad);
    }
    function showUndo(text, onUndo) {
      var e = $("toast");
      e.innerHTML = "<span>" + safeHtmlFragment(text) + '</span><button id="undoBtn">واگرد</button>';
      e.className = "toast show";
      clearTimeout(window._tt);
      window._tt = setTimeout(function () {
        e.className = "toast";
        e.innerHTML = "";
        lastDeleted = null;
      }, 5000);
      $("undoBtn").onclick = function () {
        if (typeof onUndo === "function") onUndo();
        clearTimeout(window._tt);
        e.className = "toast";
        e.innerHTML = "";
      };
    }
    function add() {
      if ($("add").disabled) return;
      var now = Date.now();
      var noteEl = $("quickNote");
      var g = {
        id: id(),
        player1: selected.pair[0],
        player2: selected.pair[1],
        winner: selected.winner,
        type: selected.type,
        note: noteEl ? noteEl.value.trim() : "",
        tags: quickTags.slice(),
        timestamp: now,
        date: pdate(now),
        time: ptime(now),
      };
      var _wa1 = $("winnerArena");
      if (_wa1) _wa1.dataset.key = "";
      games.push(g);
      save();
      if (window.__sbMarkDirty) window.__sbMarkDirty(g.id, "add");
      toast("✅ ثبت شد: <b>" + esc(g.winner) + "</b> با " + TYPES[g.type].full + " مقابل " + esc(loser(g)));
      selected.winner = null;
      selected.type = null;
      selected.slot1 = null;
      selected.slot2 = null;
      selected.pair = null;
      if (noteEl) noteEl.value = "";
      quickTags = [];
      poolFilter = "";
      renderAll();
      requestAnimationFrame(function () {
        forceScrollTop();
      });
    }
    async function deleteLast() {
      if (!games.length) {
        message("هنوز بازی‌ای ثبت نشده است.", true);
        return;
      }
      var g = games.slice().sort(function (a, b) {
        return b.timestamp - a.timestamp;
      })[0];
      var ok = await confirmDialog(
        "آخرین بازی ثبت‌شده حذف می‌شود:\n" + g.winner + " مقابل " + loser(g) + " (" + TYPES[g.type].full + ")",
        "حذف کن",
      );
      if (!ok) return;
      if (window.__sbDeleteGame) await window.__sbDeleteGame(g.id);
      var _wa2 = $("winnerArena");
      if (_wa2) _wa2.dataset.key = "";
      games = games.filter(function (x) {
        return x.id !== g.id;
      });
      save();
      lastDeleted = g;
      showUndo("🗑️ بازی حذف شد: " + g.winner + " مقابل " + loser(g), function () {
        if (lastDeleted) {
          var __rid1 = lastDeleted.id;
          games.push(lastDeleted);
          save();
          if (window.__sbMarkDirty) window.__sbMarkDirty(__rid1, "add");
          lastDeleted = null;
          renderAll();
          message("بازی بازگردانی شد.");
        }
      });
      renderAll();
    }
    function tournamentGames() {
      return games.filter(function (g) {
        return g.timestamp >= tournament.start;
      });
    }
    function tournamentStats(p) {
      var s = { name: p, games: 0, wins: 0, losses: 0, normal: 0, mars: 0, black: 0, total: 0 };
      tournamentGames().forEach(function (g) {
        if (g.player1 !== p && g.player2 !== p) return;
        s.games++;
        if (g.winner === p) {
          s.wins++;
          s[g.type]++;
          s.total += pts(g.type);
        } else s.losses++;
      });
      s.rate = s.games ? s.wins / s.games : 0;
      s.avg = s.games ? s.total / s.games : 0;
      return s;
    }
    function localIso(d) {
      var off = d.getTimezoneOffset();
      var local = new Date(d.getTime() - off * 60000);
      return local.toISOString().slice(0, 16);
    }
    function renderTournament() {
      if (!$("tName")) return;
      $("tName").textContent = tournament.name;
      var tg = tournamentGames();
      var cnt = tg.length;
      var startTxt = tournament.start ? pdate(tournament.start) : "از ابتدا";
      $("tMeta").textContent = "شروع: " + startTxt + " — " + n(cnt, 0) + " بازی";
      var s = PLAYERS.map(tournamentStats).sort(rankingSort);
      var totalPts = tg.reduce(function (a, g) {
        return a + pts(g.type);
      }, 0);
      var lead = cnt && s.length ? s[0] : null;
      $("tSummary").innerHTML = lead
        ? [
            ["بازی‌های تورنمنت", n(cnt, 0)],
            ["امتیازهای تورنمنت", n(totalPts, 0)],
            ["صدرنشین", lead.name + (lead.games < 5 ? " (ارزیابی)" : "")],
            ["درصد صدرنشین", percent(lead.wins, lead.games)],
          ]
            .map(function (x) {
              return '<div class="stat"><span>' + x[0] + "</span><strong>" + esc(x[1]) + "</strong></div>";
            })
            .join("")
        : '<div class="card empty" style="grid-column:1/-1;margin:0">هنوز بازی‌ای در این تورنمنت ثبت نشده است.</div>';
      $("tRankBody").innerHTML = s
        .map(function (x, i) {
          var winRate = x.games > 0 ? (x.wins / x.games) * 100 : 0;
          var winRateColor = winRate > 60 ? "var(--success)" : winRate > 40 ? "var(--mars)" : "var(--danger)";
          var rankIcon =
            i === 0 && cnt
              ? "\uD83E\uDD47"
              : i === 1 && cnt
                ? "\uD83E\uDD48"
                : i === 2 && cnt
                  ? "\uD83E\uDD49"
                  : n(i + 1, 0);
          var rankCls = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
          return (
            '<div class="rank-card' +
            (i % 2 === 1 ? " alt" : "") +
            '"' +
            ' data-rank="' +
            i +
            '"' +
            ' data-name="' +
            esc(x.name) +
            '"' +
            ' data-games="' +
            x.games +
            '"' +
            ' data-wins="' +
            x.wins +
            '"' +
            ' data-losses="' +
            x.losses +
            '"' +
            ' data-winrate="' +
            winRate.toFixed(2) +
            '"' +
            ' data-breakdown="' +
            x.normal +
            '"' +
            ' data-points="' +
            x.total +
            '"' +
            ' data-avg="' +
            x.avg.toFixed(2) +
            '">' +
            '<div class="rank-pos ' +
            rankCls +
            '">' +
            rankIcon +
            "</div>" +
            '<div class="rank-info">' +
            '<div class="rank-name">' +
            avatarInline(x.name, 32) +
            "<span>" +
            esc(x.name) +
            "</span>" +
            (x.games < 5 ? '<span class="evaluation">در حال ارزیابی</span>' : "") +
            "</div>" +
            '<div class="rank-stats"><span>' +
            n(x.games, 0) +
            ' بازی</span><span class="sep">•</span>' +
            "<span>" +
            n(x.wins, 0) +
            ' برد</span><span class="sep">•</span>' +
            "<span>" +
            n(x.losses, 0) +
            ' باخت</span><span class="sep">•</span>' +
            '<b style="color:' +
            winRateColor +
            '">' +
            percent(x.wins, x.games) +
            "</b></div>" +
            '<div class="rank-breakdown">' +
            '<span class="rb ok">عادی ' +
            n(x.normal, 0) +
            "</span>" +
            '<span class="rb mid">مارس ' +
            n(x.mars, 0) +
            "</span>" +
            '<span class="rb bad">سیاه ' +
            n(x.black, 0) +
            "</span></div>" +
            "</div>" +
            '<div class="rank-side"><div class="rank-points">' +
            n(x.total, 0) +
            "</div>" +
            '<div class="rank-avg">میانگین ' +
            n(x.avg, 2) +
            "</div></div>" +
            "</div>"
          );
        })
        .join("");
      $("tArchive").innerHTML = archive.length
        ? archive
            .slice()
            .reverse()
            .map(function (a) {
              var winner = a.snapshot && a.snapshot[0] ? a.snapshot[0].name : "—";
              return (
                '<div class="paircard" style="cursor:pointer" data-snap="' +
                esc(a.id) +
                '"><strong>📦 ' +
                esc(a.name) +
                '</strong><div class="muted" style="margin-top:5px">' +
                esc(pdate(a.start)) +
                " تا " +
                esc(pdate(a.end)) +
                '</div><div class="score">🥇 ' +
                esc(winner) +
                '</div><div class="muted">' +
                n(a.gamesCount || 0, 0) +
                " بازی</div></div>"
              );
            })
            .join("")
        : '<div class="card empty" style="grid-column:1/-1;margin:0">هنوز تورنمنتی آرشیو نشده.</div>';
      [].forEach.call($("tArchive").querySelectorAll("[data-snap]"), function (el) {
        el.onclick = function () {
          openSnapshot(el.dataset.snap);
        };
      });
    }
    async function startNewTournament() {
      var suggested = "تورنمنت " + n(tournament.nextNum, 0);
      var newName = await promptDialog("نام تورنمنت جدید:", suggested);
      if (newName === null) return;
      newName = (newName || "").trim() || suggested;
      var tg = tournamentGames();
      var now = Date.now();
      if (tg.length) {
        var snap = PLAYERS.map(tournamentStats)
          .sort(rankingSort)
          .map(function (x) {
            return {
              name: x.name,
              games: x.games,
              wins: x.wins,
              losses: x.losses,
              rate: x.rate,
              normal: x.normal,
              mars: x.mars,
              black: x.black,
              total: x.total,
              avg: x.avg,
            };
          });
        archive.push({
          id: "t_" + now.toString(36) + "_" + secureId().slice(-10),
          name: tournament.name,
          start: tournament.start,
          end: now,
          gamesCount: tg.length,
          snapshot: snap,
        });
      }
      tournament.name = newName;
      tournament.start = now;
      tournament.nextNum++;
      saveTournament();
      renderTournament();
      toast("🏆 تورنمنت جدید شروع شد: <b>" + esc(newName) + "</b>");
    }
    async function editTournamentName() {
      var v = await promptDialog("نام تورنمنت:", tournament.name);
      if (v === null) return;
      v = (v || "").trim();
      if (!v) {
        message("نام خالی است.", true);
        return;
      }
      tournament.name = v;
      saveTournament();
      renderTournament();
      message("نام تورنمنت ذخیره شد.");
    }
    function editTournamentStart() {
      var cur = tournament.start ? new Date(tournament.start) : new Date();
      var iso = localIso(cur);
      $("modalBg").innerHTML =
        '<div class="modal"><h2>📅 ویرایش نقطه شروع</h2><p class="muted">بازی‌های بعد از این لحظه، در تورنمنت حساب می‌شوند.</p><label>تاریخ و ساعت<input type="datetime-local" id="tStartInput" value="' +
        iso +
        '" style="margin-bottom:14px"></label><div class="actions"><button id="tStartOk" class="btn success">ذخیره</button><button id="tStartClear" class="btn secondary">پاک کردن</button><button id="tStartCancel" class="btn secondary">انصراف</button></div></div>';
      $("modalBg").className = "modalbg show";
      $("tStartOk").onclick = function () {
        var v = $("tStartInput").value;
        if (!v) {
          message("تاریخ نامعتبر است.", true);
          return;
        }
        var ts = new Date(v).getTime();
        if (isNaN(ts)) {
          message("تاریخ نامعتبر است.", true);
          return;
        }
        tournament.start = ts;
        saveTournament();
        renderTournament();
        closeModal();
        message("نقطه شروع ذخیره شد.");
      };
      $("tStartClear").onclick = function () {
        tournament.start = 0;
        saveTournament();
        renderTournament();
        closeModal();
        message("نقطه شروع پاک شد.");
      };
      $("tStartCancel").onclick = closeModal;
    }
    function openSnapshot(id) {
      var a = archive.filter(function (x) {
        return x.id === id;
      })[0];
      if (!a) return;
      var rows = (a.snapshot || [])
        .map(function (x, i) {
          return (
            "<tr><td>" +
            n(i + 1, 0) +
            "</td><td>" +
            esc(x.name) +
            "</td><td>" +
            n(x.games, 0) +
            "</td><td>" +
            n(x.wins, 0) +
            "</td><td>" +
            n(x.losses, 0) +
            "</td><td>" +
            percent(x.wins, x.games) +
            "</td><td>" +
            n(x.normal, 0) +
            "</td><td>" +
            n(x.mars, 0) +
            "</td><td>" +
            n(x.black, 0) +
            "</td><td>" +
            n(x.total, 0) +
            "</td><td>" +
            n(x.avg, 2) +
            "</td></tr>"
          );
        })
        .join("");
      $("modalBg").innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="snapshotTitle"><h2 id="snapshotTitle">📦 ' +
        esc(a.name) +
        '</h2><p class="muted">' +
        esc(pdate(a.start)) +
        " تا " +
        esc(pdate(a.end)) +
        " — " +
        n(a.gamesCount || 0, 0) +
        ' بازی</p><div class="wrap"><table><thead><tr><th>رتبه</th><th>نام</th><th>بازی</th><th>برد</th><th>باخت</th><th>درصد</th><th>عادی</th><th>مارس</th><th>سیاه</th><th>امتیاز</th><th>میانگین</th></tr></thead><tbody>' +
        rows +
        '</tbody></table></div><div class="actions"><button id="snapClose" class="btn secondary" aria-label="بستن">بستن</button></div></div>';
      $("modalBg").className = "modalbg show";
      $("snapClose").onclick = closeModal;
      var dialog = $("modalBg").querySelector(".modal");
      if (dialog) {
        var first = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (first && first.focus) first.focus();
      }
    }
    window.renderRanking = function () {
      var key = [
        PLAYERS.slice().sort().join("|"),
        games.length,
        games
          .map(function (g) {
            return [g.id, g.player1, g.player2, g.winner, g.type, pts(g.type)].join(":");
          })
          .join("|"),
      ].join("::");
      if (renderRankingCache.key === key) {
        if ($("summary")) $("summary").innerHTML = renderRankingCache.summary;
        if ($("rankbody")) $("rankbody").innerHTML = renderRankingCache.body;
        return;
      }
      var s = PLAYERS.map(stats).sort(rankingSort);
      var totalPts = games.reduce(function (a, g) {
        return a + pts(g.type);
      }, 0);
      var lead = games.length && s.length ? s[0] : null;
      var summary = lead
        ? [
            ["مجموع بازی‌ها", n(games.length, 0)],
            ["مجموع امتیازها", n(totalPts, 0)],
            ["صدرنشین", lead.name + (lead.games < 5 ? " (ارزیابی)" : "")],
            ["درصد صدرنشین", percent(lead.wins, lead.games)],
          ]
            .map(function (x) {
              return '<div class="stat"><span>' + x[0] + "</span><strong>" + esc(x[1]) + "</strong></div>";
            })
            .join("")
        : '<div class="card empty" style="grid-column:1/-1;margin:0">هنوز بازی‌ای ثبت نشده است.</div>';
      var body = s
        .map(function (x, i) {
          var winRate = x.games > 0 ? (x.wins / x.games) * 100 : 0;
          var winRateColor = winRate > 60 ? "var(--success)" : winRate > 40 ? "var(--mars)" : "var(--danger)";
          var breakdown =
            '<span style="color:var(--success);font-weight:700;">' +
            n(x.normal, 0) +
            '</span> | <span style="color:var(--mars);font-weight:700;">' +
            n(x.mars, 0) +
            '</span> | <span style="color:var(--danger);font-weight:700;">' +
            n(x.black, 0) +
            "</span>";
          return (
            '<tr style="background:' +
            (i % 2 === 0 ? "var(--card)" : "var(--card2)") +
            ';border-bottom:1px solid var(--soft);"' +
            ' data-name="' +
            esc(x.name) +
            '"' +
            ' data-games="' +
            x.games +
            '"' +
            ' data-wins="' +
            x.wins +
            '"' +
            ' data-winrate="' +
            winRate.toFixed(2) +
            '"' +
            ' data-points="' +
            x.total +
            '"' +
            ' data-breakdown="' +
            x.normal +
            '"' +
            ' data-breakdownscore="' +
            (x.normal * 1 + x.mars * 2 + x.black * 3) +
            '"' +
            ">" +
            '<td style="padding:12px 8px;text-align:center;font-weight:700;">' +
            avatarInline(x.name, 32) +
            " " +
            esc(x.name) +
            "</td>" +
            '<td style="padding:12px 8px;text-align:center;font-weight:700;">' +
            n(x.games, 0) +
            "</td>" +
            '<td style="padding:12px 8px;text-align:center;font-weight:700;">' +
            n(x.wins, 0) +
            "</td>" +
            '<td style="padding:12px 8px;text-align:center;font-weight:700;font-size:1.05rem;color:' +
            winRateColor +
            ';">' +
            percent(x.wins, x.games) +
            "</td>" +
            '<td style="padding:12px 8px;text-align:center;color:var(--primary);font-weight:900;font-size:1.1rem;">' +
            n(x.total, 0) +
            "</td>" +
            '<td style="padding:12px 8px;text-align:center;font-size:0.85rem;">' +
            breakdown +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
      renderRankingCache = { key: key, summary: summary, body: body };
      if ($("summary")) $("summary").innerHTML = summary;
      if ($("rankbody")) $("rankbody").innerHTML = body;
    };
    function persianYM(t) {
      try {
        return new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric", month: "numeric" }).format(new Date(t));
      } catch (e) {
        var d = new Date(t);
        return d.getFullYear() + "-" + d.getMonth();
      }
    }
    function dayStart(d) {
      var x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x.getTime();
    }
    var renderHistoryCache = { key: null, html: null };
    var renderRankingCache = { key: null, summary: null, body: null };
    var renderChartsCache = { key: null };
    function debounce(fn, delay) {
      var timer = null;
      return function () {
        var self = this,
          args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(self, args);
        }, delay);
      };
    }
    function match(g) {
      var q = $("search").value.trim().toLowerCase();
      var t = $("filterType").value,
        p = $("filterPlayer").value;
      if (p !== "all" && g.player1 !== p && g.player2 !== p) return false;
      var now = new Date(),
        today = dayStart(now);
      if (t === "today" && g.timestamp < today) return false;
      if (t === "week" && g.timestamp < today - 6 * 86400000) return false;
      if (t === "month" && persianYM(g.timestamp) !== persianYM(now)) return false;
      if (["normal", "mars", "black"].indexOf(t) > -1 && g.type !== t) return false;
      var fv = $("fromDate") && $("fromDate").value;
      var tv = $("toDate") && $("toDate").value;
      if (fv) {
        var f = localDateStart(fv);
        if (isFinite(f) && g.timestamp < f) return false;
      }
      if (tv) {
        var t2 = localDateStart(tv);
        if (isFinite(t2) && g.timestamp >= t2 + 86400000) return false;
      }
      var hay = [
        g.player1,
        g.player2,
        g.winner,
        loser(g),
        TYPES[g.type].full,
        g.date,
        g.time,
        g.note,
        (g.tags || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return !q || hay.indexOf(q) > -1;
    }
    var HISTORY_PAGE = 20,
      historyLimit = HISTORY_PAGE;
    function renderHistory() {
      var order = $("sortHistory").value;
      var key = [
        order,
        $("search").value,
        $("filterType").value,
        $("filterPlayer").value,
        $("fromDate").value,
        $("toDate").value,
        games.length,
        games
          .map(function (g) {
            return [g.id, g.player1, g.player2, g.winner, g.type, g.note, (g.tags || []).join("|"), g.timestamp].join(
              ":",
            );
          })
          .join("|"),
        historyLimit,
      ].join("::");
      if (renderHistoryCache.key === key && renderHistoryCache.html !== null) {
        if ($("list")) $("list").innerHTML = renderHistoryCache.html;
        bindHistory();
        return;
      }
      var list = games.filter(match).sort(function (a, b) {
        return order === "old" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
      });
      var shown = list.slice(0, historyLimit);
      var html = list.length
        ? shown
            .map(function (g) {
              var t = TYPES[g.type];
              var tags = (g.tags || [])
                .map(function (tg) {
                  return '<span class="tag">' + esc(tg) + "</span>";
                })
                .join("");
              return (
                '<article class="game"><div class="gamehead"><div class="winner">' +
                avatarInline(g.winner, 26) +
                " " +
                esc(g.winner) +
                ' برنده شد</div><span class="badge ' +
                t.cls +
                '">' +
                t.full +
                " · " +
                n(t.points, 0) +
                " امتیاز</span></div><p>" +
                avatarInline(g.player1, 20) +
                " " +
                esc(g.player1) +
                " × " +
                avatarInline(g.player2, 20) +
                " " +
                esc(g.player2) +
                "</p>" +
                (tags ? "<div>" + tags + "</div>" : "") +
                '<div class="meta">بازنده: ' +
                esc(loser(g)) +
                " | " +
                esc(g.date) +
                "، " +
                esc(g.time) +
                "</div>" +
                (g.note ? '<p class="muted">یادداشت: ' + esc(g.note) + "</p>" : "") +
                '<div class="game-actions"><button class="btn mini secondary" aria-label="ویرایش بازی" data-edit="' +
                esc(g.id) +
                '">✏️ ویرایش</button><button class="btn mini danger-text" aria-label="حذف بازی" data-del="' +
                esc(g.id) +
                '">🗑️ حذف</button></div></article>'
              );
            })
            .join("")
        : '<div class="card empty">بازی مطابق فیلتر شما پیدا نشد.</div>';
      if (list.length > shown.length)
        html +=
          '<button type="button" class="btn secondary more-btn" id="historyMore">نمایش بیشتر (' +
          n(list.length - shown.length, 0) +
          " بازی دیگر)</button>";
      renderHistoryCache = { key: key, html: html };
      if ($("list")) $("list").innerHTML = html;
      bindHistory();
    }
    function bindHistory() {
      if (!$("list")) return;
      [].forEach.call($("list").querySelectorAll("[data-edit]"), function (b) {
        b.onclick = function () {
          edit(b.dataset.edit);
        };
      });
      [].forEach.call($("list").querySelectorAll("[data-del]"), function (b) {
        b.onclick = function () {
          del(b.dataset.del);
        };
      });
      var moreBtn = $("historyMore");
      if (moreBtn)
        moreBtn.onclick = function () {
          historyLimit += HISTORY_PAGE;
          renderHistory();
        };
    }
    async function del(i) {
      var g = games.filter(function (x) {
        return x.id === i;
      })[0];
      if (!g) return;
      if (window.__sbDeleteGame) await window.__sbDeleteGame(i);
      var _wa3 = $("winnerArena");
      if (_wa3) _wa3.dataset.key = "";
      games = games.filter(function (x) {
        return x.id !== i;
      });
      save();
      lastDeleted = g;
      renderAll();
      showUndo("🗑️ بازی حذف شد: " + g.winner + " مقابل " + loser(g), function () {
        if (lastDeleted) {
          var __rid2 = lastDeleted.id;
          games.push(lastDeleted);
          save();
          if (window.__sbMarkDirty) window.__sbMarkDirty(__rid2, "add");
          lastDeleted = null;
          renderAll();
          message("بازی بازگردانی شد.");
        }
      });
    }
    function opts(sel, g) {
      var list = PLAYERS.slice();
      if (g)
        [g.player1, g.player2].forEach(function (x) {
          if (x && list.indexOf(x) < 0) list.push(x);
        });
      return list
        .map(function (p) {
          return '<option value="' + esc(p) + '" ' + (p === sel ? "selected" : "") + ">" + esc(p) + "</option>";
        })
        .join("");
    }
    function edit(i) {
      var g = games.filter(function (x) {
        return x.id === i;
      })[0];
      if (!g) return;
      var tagChips = PRESET_TAGS.map(function (t) {
        var on = (g.tags || []).indexOf(t) > -1;
        return (
          '<button type="button" class="tag" data-tag="' +
          esc(t) +
          '" style="cursor:pointer;' +
          (on ? "background:var(--primary);color:var(--contrast)" : "") +
          '">' +
          esc(t) +
          "</button>"
        );
      }).join("");
      $("modalBg").innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="editGameTitle"><h2 id="editGameTitle">ویرایش بازی</h2><div class="grid"><label>بازیکن اول<select id="ep1">' +
        opts(g.player1, g) +
        '</select></label><label>بازیکن دوم<select id="ep2">' +
        opts(g.player2, g) +
        '</select></label><label>برنده<select id="ew"></select></label><label>نوع برد<select id="et"><option value="normal">برد عادی</option><option value="mars">مارس</option><option value="black">سیاه مارس</option></select></label><label>یادداشت<textarea id="en">' +
        esc(g.note) +
        '</textarea></label><label>برچسب‌ها<div id="tagBox" style="margin-top:4px">' +
        tagChips +
        '</div><input id="tagInput" placeholder="برچسب سفارشی + Enter" style="margin-top:6px"></label><label>تاریخ بازی<input type="date" id="editDate" value="' +
        dateInputValue(g.timestamp) +
        '"></label><label>ساعت بازی<input type="time" id="editTime" value="' +
        timeInputValue(g.timestamp) +
        '"></label></div><p id="autoLoser" class="muted"></p><div class="actions"><button id="saveEdit" class="btn success">ذخیره تغییرات</button><button id="cancelEdit" class="btn secondary">انصراف</button></div></div>';
      $("modalBg").className = "modalbg show";
      $("et").value = g.type;
      var currentTags = (g.tags || []).slice();
      function sync(preferred) {
        var a = $("ep1").value,
          b = $("ep2").value,
          w = $("ew");
        if (a === b) {
          $("autoLoser").textContent = "بازیکنان باید متفاوت باشند.";
          return;
        }
        w.innerHTML =
          '<option value="' +
          esc(a) +
          '">' +
          esc(a) +
          '</option><option value="' +
          esc(b) +
          '">' +
          esc(b) +
          "</option>";
        w.value = preferred === a || preferred === b ? preferred : a;
        $("autoLoser").textContent = "بازنده خودکار: " + (w.value === a ? b : a);
      }
      $("ep1").onchange = function () {
        sync($("ew").value);
      };
      $("ep2").onchange = function () {
        sync($("ew").value);
      };
      $("ew").onchange = function () {
        sync($("ew").value);
      };
      sync(g.winner);
      [].forEach.call($("tagBox").querySelectorAll("[data-tag]"), function (b) {
        b.onclick = function () {
          var t = b.dataset.tag,
            idx = currentTags.indexOf(t);
          if (idx > -1) currentTags.splice(idx, 1);
          else currentTags.push(t);
          b.style.background = idx > -1 ? "" : "var(--primary)";
          b.style.color = idx > -1 ? "" : "var(--contrast)";
        };
      });
      $("tagInput").onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var v = this.value.trim();
          if (!v) return;
          if (currentTags.indexOf(v) === -1) currentTags.push(v);
          this.value = "";
          var chip = document.createElement("button");
          chip.type = "button";
          chip.className = "tag";
          chip.style.background = "var(--primary)";
          chip.style.color = "var(--contrast)";
          chip.textContent = v;
          chip.onclick = function () {
            var i = currentTags.indexOf(v);
            if (i > -1) currentTags.splice(i, 1);
            chip.remove();
          };
          $("tagBox").appendChild(chip);
        }
      };
      $("saveEdit").onclick = function () {
        var a = $("ep1").value,
          b = $("ep2").value,
          w = $("ew").value;
        if (a === b || !w) {
          message("بازیکنان باید متفاوت باشند و برنده مشخص شود.", true);
          return;
        }
        var dateVal = $("editDate").value,
          timeVal = $("editTime").value;
        if (!dateVal || !timeVal) {
          message("تاریخ و ساعت باید مشخص شوند.", true);
          return;
        }
        var newTimestamp = localDateTime(dateVal, timeVal);
        if (isNaN(newTimestamp)) {
          message("تاریخ یا ساعت نامعتبر است.", true);
          return;
        }
        g.player1 = a;
        g.player2 = b;
        g.winner = w;
        g.type = $("et").value;
        g.note = $("en").value.trim();
        g.tags = currentTags;
        g.timestamp = newTimestamp;
        g.date = pdate(newTimestamp);
        g.time = ptime(newTimestamp);
        save();
        if (window.__sbMarkDirty) window.__sbMarkDirty(g.id, "edit");
        var _wa4 = $("winnerArena");
        if (_wa4) _wa4.dataset.key = "";
        closeModal();
        renderAll();
      };
      $("cancelEdit").onclick = closeModal;
    }
    function closeModal() {
      $("modalBg").className = "modalbg";
      $("modalBg").innerHTML = "";
    }
    function confirmDialog(msg, okLabel) {
      return new Promise(function (resolve) {
        $("modalBg").innerHTML =
          '<div class="modal"><h2>تایید</h2><p class="muted" style="white-space:pre-line;margin:0 0 16px">' +
          esc(msg) +
          '</p><div class="actions"><button id="cdYes" class="btn danger">' +
          esc(okLabel || "تایید") +
          '</button><button id="cdNo" class="btn secondary">انصراف</button></div></div>';
        $("modalBg").className = "modalbg show";
        function done(v) {
          closeModal();
          resolve(v);
        }
        $("modalBg").onclick = function (e) {
          if (e.target === $("modalBg")) done(false);
        };
        $("cdYes").onclick = function () {
          done(true);
        };
        $("cdNo").onclick = function () {
          done(false);
        };
      });
    }
    function promptDialog(title, def) {
      return new Promise(function (resolve) {
        $("modalBg").innerHTML =
          '<div class="modal"><h2>' +
          esc(title) +
          '</h2><input id="pdInput" style="margin-bottom:16px"><div class="actions"><button id="pdOk" class="btn success">تایید</button><button id="pdCancel" class="btn secondary">انصراف</button></div></div>';
        $("modalBg").className = "modalbg show";
        var inp = $("pdInput");
        inp.value = def || "";
        inp.focus();
        inp.select();
        function done(v) {
          closeModal();
          resolve(v);
        }
        $("modalBg").onclick = function (e) {
          if (e.target === $("modalBg")) done(null);
        };
        $("pdOk").onclick = function () {
          done(inp.value);
        };
        $("pdCancel").onclick = function () {
          done(null);
        };
        inp.onkeydown = function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            done(inp.value);
          } else if (e.key === "Escape") {
            done(null);
          }
        };
      });
    }
    function svg(w, h, content) {
      return '<svg viewBox="0 0 ' + w + " " + h + '" role="img">' + content + "</svg>";
    }
    function bars(labels, vals, cols, max) {
      var W = 620,
        H = 230,
        L = 38,
        B = 42,
        range = W - L - 12;
      var m = max || Math.max.apply(null, vals.concat([1]));
      var s =
        '<line x1="' +
        L +
        '" y1="10" x2="' +
        L +
        '" y2="' +
        (H - B) +
        '" stroke="currentColor" opacity=".35"/><line x1="' +
        L +
        '" y1="' +
        (H - B) +
        '" x2="' +
        (W - 10) +
        '" y2="' +
        (H - B) +
        '" stroke="currentColor" opacity=".35"/>';
      vals.forEach(function (v, i) {
        var step = range / vals.length;
        var x = L + i * step + step * 0.18,
          bw = step * 0.64;
        var bh = ((H - B - 16) * v) / m,
          y = H - B - bh;
        s +=
          '<rect x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          bw +
          '" height="' +
          bh +
          '" rx="5" fill="' +
          cols[i % cols.length] +
          '"/><text x="' +
          (x + bw / 2) +
          '" y="' +
          (y - 4) +
          '" text-anchor="middle" fill="currentColor" font-size="10">' +
          n(v, 1) +
          '</text><text x="' +
          (x + bw / 2) +
          '" y="' +
          (H - 14) +
          '" text-anchor="middle" fill="currentColor" font-size="10">' +
          esc(labels[i]) +
          "</text>";
      });
      return svg(W, H, s);
    }
    function chartSafe(el, fn) {
      try {
        $(el).innerHTML = fn();
      } catch (e) {
        console.error("Chart " + el + ":", e);
        $(el).innerHTML = '<div class="empty">نمایش این نمودار با خطا مواجه شد.</div>';
      }
    }
    function streaks() {
      var out = {};
      PLAYERS.forEach(function (p) {
        var l = games
          .filter(function (g) {
            return g.player1 === p || g.player2 === p;
          })
          .sort(function (a, b) {
            return a.timestamp - b.timestamp;
          });
        var cw = 0,
          mw = 0,
          cl = 0,
          ml = 0;
        l.forEach(function (g) {
          if (g.winner === p) {
            cw++;
            mw = Math.max(mw, cw);
            cl = 0;
          } else {
            cl++;
            ml = Math.max(ml, cl);
            cw = 0;
          }
        });
        var end = 0;
        for (var i = l.length - 1; i >= 0 && l[i].winner === p; i--) end++;
        out[p] = { mw: mw, ml: ml, end: end };
      });
      return out;
    }
    function momentum() {
      var out = {};
      PLAYERS.forEach(function (p) {
        var l = games
          .filter(function (g) {
            return g.player1 === p || g.player2 === p;
          })
          .sort(function (a, b) {
            return a.timestamp - b.timestamp;
          });
        var afterW = { w: 0, t: 0 },
          afterL = { w: 0, t: 0 };
        for (var i = 1; i < l.length; i++) {
          var prev = l[i - 1],
            cur = l[i];
          if (prev.winner === p) {
            afterW.t++;
            if (cur.winner === p) afterW.w++;
          } else {
            afterL.t++;
            if (cur.winner === p) afterL.w++;
          }
        }
        out[p] = { afterWin: afterW.t ? afterW.w / afterW.t : 0, afterLoss: afterL.t ? afterL.w / afterL.t : 0 };
      });
      return out;
    }
    function currentLossStreak() {
      var out = {};
      PLAYERS.forEach(function (p) {
        var l = games
          .filter(function (g) {
            return g.player1 === p || g.player2 === p;
          })
          .sort(function (a, b) {
            return a.timestamp - b.timestamp;
          });
        var cur = 0;
        for (var i = l.length - 1; i >= 0; i--) {
          if (l[i].winner !== p) cur++;
          else break;
        }
        out[p] = cur;
      });
      return out;
    }
    function lossByType() {
      var out = {};
      PLAYERS.forEach(function (p) {
        var s = { normal: 0, mars: 0, black: 0 };
        games.forEach(function (g) {
          if (g.player1 !== p && g.player2 !== p) return;
          if (g.winner !== p) s[g.type]++;
        });
        out[p] = s;
      });
      return out;
    }
    function bestWeekday() {
      var out = {};
      PLAYERS.forEach(function (p) {
        var buckets = {};
        games.forEach(function (g) {
          if (g.player1 !== p && g.player2 !== p) return;
          var d = new Date(g.timestamp).getDay();
          if (!buckets[d]) buckets[d] = { w: 0, t: 0 };
          buckets[d].t++;
          if (g.winner === p) buckets[d].w++;
        });
        var best = null;
        Object.keys(buckets).forEach(function (d) {
          var b = buckets[d];
          if (b.t < 3) return;
          var r = b.w / b.t;
          if (!best || r > best.r || (r === best.r && b.t > best.t)) best = { d: +d, r: r, w: b.w, t: b.t };
        });
        out[p] = best;
      });
      return out;
    }
    function ironWall() {
      var out = null;
      PLAYERS.forEach(function (p) {
        var total = 0,
          wins = 0;
        games.forEach(function (g) {
          if (g.player1 !== p && g.player2 !== p) return;
          total++;
          if (g.winner === p) wins++;
        });
        if (total < 10) return;
        var oppRate = (total - wins) / total;
        if (!out || oppRate < out.oppRate || (oppRate === out.oppRate && total > out.total)) {
          out = { name: p, oppRate: oppRate, wins: wins, total: total };
        }
      });
      return out;
    }
    function renderRecords() {
      if (!PLAYERS.length) {
        var _r0 = $("records");
        if (_r0) _r0.innerHTML = '<div class="empty">هنوز بازیکنی وجود ندارد.</div>';
        return;
      }
      var ss = PLAYERS.map(stats);
      var st = streaks();
      var mm = momentum();
      var cls = currentLossStreak();
      var bwd = bestWeekday();
      var iw = ironWall();
      var lbt = lossByType();
      var dayNames = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
      var best = PLAYERS.slice().sort(function (a, b) {
        return st[b].mw - st[a].mw;
      })[0];
      var loss = PLAYERS.slice().sort(function (a, b) {
        return st[b].ml - st[a].ml;
      })[0];
      var hunter = null;
      PAIRS.forEach(function (p) {
        var h = h2h(p[0], p[1]);
        if (h.total >= 3)
          [
            [p[0], h.aw, p[1]],
            [p[1], h.bw, p[0]],
          ].forEach(function (x) {
            var z = { p: x[0], w: x[1], o: x[2], t: h.total, r: x[1] / h.total };
            if (!hunter || z.r > hunter.r) hunter = z;
          });
      });
      function maxBy(fn) {
        var best = null;
        PLAYERS.forEach(function (p) {
          var v = fn(p);
          if (!best || v > best.v) best = { name: p, v: v };
        });
        return best;
      }
      var mostNormalWins = maxBy(function (p) {
        return stats(p).normal;
      });
      var mostMarsWins = maxBy(function (p) {
        return stats(p).mars;
      });
      var mostBlackWins = maxBy(function (p) {
        return stats(p).black;
      });
      var mostNormalLosses = maxBy(function (p) {
        return lbt[p].normal;
      });
      var mostMarsLosses = maxBy(function (p) {
        return lbt[p].mars;
      });
      var mostBlackLosses = maxBy(function (p) {
        return lbt[p].black;
      });
      var rows = [
        [
          "🏆 بیشترین برد متوالی",
          st[best].mw ? best + " · " + n(st[best].mw, 0) + " برد پشت‌سرهم" : "هنوز داده‌ای نیست",
        ],
        [
          "🔵 برد متوالی فعلی",
          PLAYERS.map(function (p) {
            return p.split(" ")[0] + ": " + n(st[p].end, 0);
          }).join(" | "),
        ],
        [
          "📉 طولانی‌ترین باخت متوالی",
          st[loss].ml ? loss + " · " + n(st[loss].ml, 0) + " باخت پشت‌سرهم" : "هنوز داده‌ای نیست",
        ],
        [
          "🔴 باخت متوالی فعلی",
          PLAYERS.map(function (p) {
            return p.split(" ")[0] + ": " + n(cls[p], 0);
          }).join(" | "),
        ],
        [
          "🎯 شکارچی حریف",
          hunter
            ? hunter.p + " مقابل " + hunter.o + " · " + percent(hunter.w, hunter.t)
            : "هنوز رودرروی ۳ بازیه‌ای نیست",
        ],
        [
          "💪 نرخ برد بعد از برد",
          PLAYERS.map(function (p) {
            return p.split(" ")[0] + ": " + percent(mm[p].afterWin * 10, 10);
          }).join(" | "),
        ],
        [
          "🩹 نرخ برد بعد از باخت",
          PLAYERS.map(function (p) {
            return p.split(" ")[0] + ": " + percent(mm[p].afterLoss * 10, 10);
          }).join(" | "),
        ],
        [
          "🎯 بیشترین برد عادی",
          mostNormalWins.v ? mostNormalWins.name + " · " + n(mostNormalWins.v, 0) : "هنوز داده‌ای نیست",
        ],
        ["🔥 بیشترین مارس", mostMarsWins.v ? mostMarsWins.name + " · " + n(mostMarsWins.v, 0) : "هنوز داده‌ای نیست"],
        [
          "💀 بیشترین سیاه مارس",
          mostBlackWins.v ? mostBlackWins.name + " · " + n(mostBlackWins.v, 0) : "هنوز داده‌ای نیست",
        ],
        [
          "💔 بیشترین باخت عادی",
          mostNormalLosses.v ? mostNormalLosses.name + " · " + n(mostNormalLosses.v, 0) : "هنوز داده‌ای نیست",
        ],
        [
          "🥶 بیشترین باخت مارس",
          mostMarsLosses.v ? mostMarsLosses.name + " · " + n(mostMarsLosses.v, 0) : "هنوز داده‌ای نیست",
        ],
        [
          "☠️ بیشترین باخت سیاه مارس",
          mostBlackLosses.v ? mostBlackLosses.name + " · " + n(mostBlackLosses.v, 0) : "هنوز داده‌ای نیست",
        ],
        [
          "📅 بهترین روز هفته",
          PLAYERS.map(function (p) {
            var b = bwd[p];
            return p.split(" ")[0] + ": " + (b ? dayNames[b.d] + " (" + percent(b.w, b.t) + ")" : "—");
          }).join(" | "),
        ],
        [
          "🛡️ دیوار آهنین",
          iw ? iw.name + " · حریف‌ها فقط " + percent(iw.total - iw.wins, iw.total) + " بردن" : "حداقل ۱۰ بازی لازم است",
        ],
      ];
      $("records").innerHTML = rows
        .map(function (x) {
          return (
            '<div class="record"><small>' +
            x[0] +
            "</small><strong>" +
            (x[1].indexOf(" | ") > -1
              ? '<span class="rchips">' +
                x[1]
                  .split(" | ")
                  .map(function (c) {
                    return '<span class="rchip">' + esc(c) + "</span>";
                  })
                  .join("") +
                "</span>"
              : esc(x[1])) +
            "</strong></div>"
          );
        })
        .join("");
    }
    function renderAnalytics() {
      renderRecords();
      renderCharts();
    }
    function renderCharts() {
      var chartKey = [
        PLAYERS.slice().sort().join("|"),
        games.length,
        games
          .map(function (g) {
            return [g.id, g.player1, g.player2, g.winner, g.type, g.timestamp].join(":");
          })
          .join("|"),
        ($("recentRange") && $("recentRange").value) || "",
        ($("progressSelect") && $("progressSelect").value) || "",
      ].join("::");
      if (renderChartsCache.key === chartKey) {
        return;
      }
      renderChartsCache = { key: chartKey };
      chartSafe("pointsChart", function () {
        if (!games.length) return '<div class="empty">برای نمودار، حداقل یک بازی ثبت کنید.</div>';
        var list = games.slice().sort(function (a, b) {
          return a.timestamp - b.timestamp;
        });
        var series = {};
        PLAYERS.forEach(function (p) {
          series[p] = [0];
        });
        list.forEach(function (g) {
          PLAYERS.forEach(function (p) {
            series[p].push(series[p][series[p].length - 1] + (g.winner === p ? pts(g.type) : 0));
          });
        });
        var max = 1;
        PLAYERS.forEach(function (p) {
          max = Math.max(max, Math.max.apply(null, series[p]));
        });
        var W = 620,
          H = 230,
          L = 38,
          B = 33;
        var s =
          '<line x1="' +
          L +
          '" y1="10" x2="' +
          L +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/><line x1="' +
          L +
          '" y1="' +
          (H - B) +
          '" x2="' +
          (W - 10) +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/>';
        PLAYERS.forEach(function (p, j) {
          var q = series[p]
            .map(function (v, i) {
              return L + ((W - L - 15) * i) / (series[p].length - 1) + "," + (10 + (H - B - 10) * (1 - v / max));
            })
            .join(" ");
          s +=
            '<polyline points="' +
            q +
            '" fill="none" stroke="' +
            colors[j % colors.length] +
            '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
        });
        $("pointsLegend").innerHTML = PLAYERS.map(function (p, i) {
          return '<span><i class="dot" style="background:' + colors[i % colors.length] + '"></i>' + esc(p) + "</span>";
        }).join("");
        return svg(W, H, s);
      });
      chartSafe("rateChart", function () {
        var range = $("recentRange").value;
        var v = PLAYERS.map(function (p) {
          var l = games
            .filter(function (g) {
              return g.player1 === p || g.player2 === p;
            })
            .sort(function (a, b) {
              return b.timestamp - a.timestamp;
            });
          if (range !== "all") l = l.slice(0, Number(range));
          return l.length
            ? (l.filter(function (g) {
                return g.winner === p;
              }).length *
                100) /
                l.length
            : 0;
        });
        return (
          '<p class="muted">بازه برای هر بازیکن جداگانه محاسبه می‌شود.</p>' +
          bars(
            PLAYERS.map(function (p) {
              return p.split(" ")[0];
            }),
            v,
            colors,
            100,
          )
        );
      });
      chartSafe("typesChart", function () {
        var ss = PLAYERS.map(stats);
        var W = 620,
          H = 230,
          L = 38,
          B = 38,
          max = 1;
        ss.forEach(function (s) {
          max = Math.max(max, s.normal, s.mars, s.black);
        });
        var groupW = (W - L - 10) / ss.length;
        var s =
          '<line x1="' +
          L +
          '" y1="10" x2="' +
          L +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/><line x1="' +
          L +
          '" y1="' +
          (H - B) +
          '" x2="' +
          (W - 10) +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/>';
        ss.forEach(function (x, i) {
          ["normal", "mars", "black"].forEach(function (k, j) {
            var h = ((H - B - 15) * x[k]) / max;
            var xx = L + i * groupW + 18 + j * Math.min(38, groupW / 4);
            var bw = Math.min(27, groupW / 5);
            s +=
              '<rect x="' +
              xx +
              '" y="' +
              (H - B - h) +
              '" width="' +
              bw +
              '" height="' +
              h +
              '" fill="' +
              ["#548b67", "#ae7837", "#8d3947"][j] +
              '" rx="4"/>';
          });
          s +=
            '<text x="' +
            (L + i * groupW + groupW / 2) +
            '" y="' +
            (H - 12) +
            '" fill="currentColor" text-anchor="middle" font-size="10">' +
            esc(x.name.split(" ")[0]) +
            "</text>";
        });
        return (
          '<div class="legend"><span><i class="dot" style="background:#548b67"></i>عادی</span><span><i class="dot" style="background:#ae7837"></i>مارس</span><span><i class="dot" style="background:#8d3947"></i>سیاه مارس</span></div>' +
          svg(W, H, s)
        );
      });
      chartSafe("activityChart", function () {
        var t = dayStart(new Date()),
          labels = [],
          v = [];
        for (var i = 13; i >= 0; i--) {
          var d = t - i * 86400000;
          labels.push(pdate(d).split("/").slice(-2).join("/"));
          v.push(
            games.filter(function (g) {
              return g.timestamp >= d && g.timestamp < d + 86400000;
            }).length,
          );
        }
        return bars(labels, v, ["var(--primary)"], Math.max.apply(null, v.concat([1])));
      });
      chartSafe("winRateTrendChart", function () {
        if (!games.length) return '<div class="empty">برای نمودار، حداقل یک بازی ثبت کنید.</div>';
        var list = games.slice().sort(function (a, b) {
          return a.timestamp - b.timestamp;
        });
        var played = {},
          wins = {};
        PLAYERS.forEach(function (p) {
          played[p] = [0];
          wins[p] = [0];
        });
        list.forEach(function (g) {
          PLAYERS.forEach(function (p) {
            var pl = played[p][played[p].length - 1];
            var wn = wins[p][wins[p].length - 1];
            if (g.player1 === p || g.player2 === p) {
              pl++;
              if (g.winner === p) wn++;
            }
            played[p].push(pl);
            wins[p].push(wn);
          });
        });
        var W = 620,
          H = 230,
          L = 42,
          B = 33;
        var s =
          '<line x1="' +
          L +
          '" y1="10" x2="' +
          L +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/><line x1="' +
          L +
          '" y1="' +
          (H - B) +
          '" x2="' +
          (W - 10) +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/>';
        [0, 25, 50, 75, 100].forEach(function (v) {
          var y = 10 + (H - B - 10) * (1 - v / 100);
          s +=
            '<line x1="' +
            L +
            '" y1="' +
            y +
            '" x2="' +
            (W - 10) +
            '" y2="' +
            y +
            '" stroke="currentColor" opacity=".12" stroke-dasharray="3 3"/>';
          s +=
            '<text x="' +
            (L - 4) +
            '" y="' +
            (y + 3) +
            '" fill="currentColor" opacity=".6" font-size="9" text-anchor="end">' +
            n(v, 0) +
            "٪</text>";
        });
        PLAYERS.forEach(function (p, j) {
          var pts = [];
          for (var i = 0; i < played[p].length; i++) {
            var pl = played[p][i];
            var r = pl ? (wins[p][i] * 100) / pl : 0;
            pts.push(L + ((W - L - 15) * i) / (played[p].length - 1) + "," + (10 + (H - B - 10) * (1 - r / 100)));
          }
          s +=
            '<polyline points="' +
            pts.join(" ") +
            '" fill="none" stroke="' +
            colors[j % colors.length] +
            '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
        });
        $("winRateTrendLegend").innerHTML = PLAYERS.map(function (p, i) {
          return '<span><i class="dot" style="background:' + colors[i % colors.length] + '"></i>' + esc(p) + "</span>";
        }).join("");
        return svg(W, H, s);
      });
      chartSafe("heatmap", function () {
        var days = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
        var grid = [];
        for (var d = 0; d < 7; d++) {
          grid.push([]);
          for (var h = 0; h < 24; h++) grid[d].push(0);
        }
        games.forEach(function (g) {
          var dd = new Date(g.timestamp);
          var day = (dd.getDay() + 1) % 7;
          var hr = dd.getHours();
          grid[day][hr]++;
        });
        var max = 1;
        grid.forEach(function (r) {
          r.forEach(function (v) {
            if (v > max) max = v;
          });
        });
        var cw = 22,
          ch = 22,
          W = 24 * cw + 60,
          H = 7 * ch + 50;
        var s = '<text x="30" y="18" fill="currentColor" font-size="11" text-anchor="middle">ساعت</text>';
        for (var h = 0; h < 24; h++) {
          if (h % 3 === 0)
            s +=
              '<text x="' +
              (50 + h * cw + cw / 2) +
              '" y="18" fill="currentColor" font-size="10" text-anchor="middle">' +
              n(h, 0) +
              "</text>";
        }
        days.forEach(function (dname, d) {
          s +=
            '<text x="45" y="' +
            (34 + d * ch + ch / 2 + 3) +
            '" fill="currentColor" font-size="10" text-anchor="end">' +
            esc(dname) +
            "</text>";
          for (var h = 0; h < 24; h++) {
            var v = grid[d][h];
            var opacity = v / max;
            var fill = v ? "rgba(120,168,200," + (0.15 + 0.85 * opacity) + ")" : "rgba(255,255,255,.04)";
            s +=
              '<rect x="' +
              (50 + h * cw) +
              '" y="' +
              (30 + d * ch) +
              '" width="' +
              (cw - 2) +
              '" height="' +
              (ch - 2) +
              '" rx="4" fill="' +
              fill +
              '"/>';
            if (v)
              s +=
                '<text x="' +
                (50 + h * cw + cw / 2 - 1) +
                '" y="' +
                (30 + d * ch + ch / 2 + 3) +
                '" fill="' +
                (opacity > 0.5 ? "#fff" : "#1c2a3a") +
                '" font-size="9" text-anchor="middle">' +
                n(v, 0) +
                "</text>";
          }
        });
        return svg(W, H, s);
      });
      chartSafe("progressChart", function () {
        var idx = Number($("progressSelect").value) || 0;
        var p = PAIRS[idx];
        if (!p) return '<div class="empty">زوجی موجود نیست.</div>';
        var l = games
          .filter(function (g) {
            return pairKey(g.player1, g.player2) === pairKey(p[0], p[1]);
          })
          .sort(function (a, b) {
            return a.timestamp - b.timestamp;
          });
        if (!l.length) return '<div class="empty">بازی‌ای بین این دو ثبت نشده.</div>';
        var seriesA = [0],
          seriesB = [0];
        l.forEach(function (g) {
          var aPts = seriesA[seriesA.length - 1] + (g.winner === p[0] ? pts(g.type) : 0);
          var bPts = seriesB[seriesB.length - 1] + (g.winner === p[1] ? pts(g.type) : 0);
          seriesA.push(aPts);
          seriesB.push(bPts);
        });
        var max = Math.max(Math.max.apply(null, seriesA), Math.max.apply(null, seriesB), 1);
        var W = 620,
          H = 230,
          L = 38,
          B = 33;
        var s =
          '<line x1="' +
          L +
          '" y1="10" x2="' +
          L +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/><line x1="' +
          L +
          '" y1="' +
          (H - B) +
          '" x2="' +
          (W - 10) +
          '" y2="' +
          (H - B) +
          '" stroke="currentColor" opacity=".35"/>';
        [seriesA, seriesB].forEach(function (series, j) {
          var q = series
            .map(function (v, i) {
              return L + ((W - L - 15) * i) / (series.length - 1) + "," + (10 + (H - B - 10) * (1 - v / max));
            })
            .join(" ");
          s +=
            '<polyline points="' +
            q +
            '" fill="none" stroke="' +
            colors[j % colors.length] +
            '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
        });
        return (
          '<div class="legend"><span><i class="dot" style="background:' +
          colors[0] +
          '"></i>' +
          esc(p[0]) +
          '</span><span><i class="dot" style="background:' +
          colors[1] +
          '"></i>' +
          esc(p[1]) +
          "</span></div>" +
          svg(W, H, s)
        );
      });
    }
    function themeGridHTML() {
      return Object.keys(THEMES)
        .map(function (k) {
          var v = THEMES[k];
          return (
            '<button class="theme ' +
            (settings.theme === k ? "active" : "") +
            '" data-theme="' +
            k +
            '"><div class="swatch" style="background:linear-gradient(135deg,' +
            v[8] +
            "," +
            v[9] +
            ')"></div>' +
            themeNames[k] +
            "</button>"
          );
        })
        .join("");
    }
    function renderThemes() {
      var k = settings.theme,
        v = THEMES[k] || THEMES.blackgold;
      if ($("themeCurrent"))
        $("themeCurrent").innerHTML =
          '<span class="theme-hint">برای تغییر، کلیک کن</span><div class="swatch" style="background:linear-gradient(135deg,' +
          v[8] +
          "," +
          v[9] +
          ')"></div><span>' +
          themeNames[k] +
          "</span>";
    }
    function openThemes() {
      $("modalBg").innerHTML =
        '<div class="modal"><h2>🎨 انتخاب قالب</h2><div class="themegrid">' +
        themeGridHTML() +
        '</div><div class="actions"><button id="closeThemes" class="btn secondary">بستن</button></div></div>';
      $("modalBg").className = "modalbg show";
      [].forEach.call($("modalBg").querySelectorAll(".theme"), function (b) {
        b.onclick = function () {
          settings.theme = b.dataset.theme;
          apply();
          saveSettings();
          renderThemes();
          closeModal();
        };
      });
      $("closeThemes").onclick = closeModal;
    }
    function fill() {
      var fp = $("filterPlayer");
      if (fp) {
        var curFp = fp.value;
        fp.innerHTML =
          '<option value="all">همه بازیکنان</option>' +
          PLAYERS.map(function (p) {
            return '<option value="' + esc(p) + '">' + esc(p) + "</option>";
          }).join("");
        if (
          curFp &&
          Array.prototype.some.call(fp.options, function (o) {
            return o.value === curFp;
          })
        )
          fp.value = curFp;
      }
      var ps = $("progressSelect");
      if (ps) {
        var curPs = ps.value;
        ps.innerHTML = PAIRS.map(function (p, i) {
          return '<option value="' + i + '">' + esc(p[0]) + " × " + esc(p[1]) + "</option>";
        }).join("");
        if (
          curPs &&
          Array.prototype.some.call(ps.options, function (o) {
            return o.value === curPs;
          })
        )
          ps.value = curPs;
      }
      if ($("fontScale")) $("fontScale").value = settings.font || "1";
      if ($("intensity")) $("intensity").value = settings.intensity || "standard";
    }
    /* curUser فقط داخل sync.js تعریف شده؛ اینجا از window.isAdmin استفاده کن */
    function isAdminUser() {
      return typeof window.isAdmin === "function" && !!window.isAdmin();
    }
    function renameEverywhere(old, nn) {
      var nw = String(nn || "").trim();
      if (!nw) return { ok: false, msg: "نام نمی‌تواند خالی باشد." };
      var dup = PLAYERS.some(function (p) {
        return p.toLowerCase() === nw.toLowerCase() && p !== old;
      });
      if (dup) return { ok: false, msg: "این نام قبلاً وجود دارد." };
      var idx = PLAYERS.indexOf(old);
      if (idx === -1) return { ok: false, msg: "بازیکن پیدا نشد." };
      if (avatars[old]) {
        avatars[nw] = avatars[old];
        delete avatars[old];
        saveAvatars();
      }
      PLAYERS[idx] = nw;
      games.forEach(function (g) {
        var c = false;
        if (g.player1 === old) {
          g.player1 = nw;
          c = true;
        }
        if (g.player2 === old) {
          g.player2 = nw;
          c = true;
        }
        if (g.winner === old) {
          g.winner = nw;
          c = true;
        }
        if (c && window.__sbMarkDirty) window.__sbMarkDirty(g.id, "quiet");
      });
      archive.forEach(function (a) {
        (a.snapshot || []).forEach(function (x) {
          if (x.name === old) x.name = nw;
        });
      });
      if (selected.slot1 === old) selected.slot1 = nw;
      if (selected.slot2 === old) selected.slot2 = nw;
      savePlayers();
      save();
      saveTournament();
      if (window.__sbDeletePlayer) window.__sbDeletePlayer(old);
      return { ok: true, newName: nw };
    }
    function renderPlayers() {
      var el = $("playerList");
      if (!el) return;
      var admin = isAdminUser();
      el.innerHTML = PLAYERS.map(function (p, i) {
        var s = stats(p);
        var hasImg = !!avatars[p];
        return (
          '<div class="game" style="padding:12px">' +
          '<div class="gamehead"><strong style="display:inline-flex;align-items:center;gap:8px">' +
          avatarInline(p, 40) +
          esc(p) +
          "</strong>" +
          '<span class="muted">' +
          n(s.games, 0) +
          " بازی · " +
          percent(s.wins, s.games) +
          "</span></div>" +
          '<div class="actions">' +
          '<button class="btn secondary" data-av="' +
          i +
          '">' +
          (hasImg ? "🖼️ تغییر عکس" : "📷 افزودن عکس") +
          "</button>" +
          (hasImg && admin ? '<button class="btn secondary" data-avrm="' + i + '">🗑️ حذف عکس</button>' : "") +
          (admin ? '<button class="btn secondary" data-ren="' + i + '">✏️ تغییر نام</button>' : "") +
          (admin
            ? '<button class="btn danger" data-remp="' +
              i +
              '" ' +
              (PLAYERS.length <= 2 ? "disabled" : "") +
              ">حذف</button>"
            : "") +
          "</div></div>"
        );
      }).join("");
      [].forEach.call(el.querySelectorAll("[data-av]"), function (b) {
        b.onclick = function () {
          var i = +b.dataset.av;
          var name = PLAYERS[i];
          pickAvatar(name, function () {
            fill();
            renderAll();
            message("عکس " + name + " ذخیره شد.");
          });
        };
      });
      [].forEach.call(el.querySelectorAll("[data-avrm]"), function (b) {
        b.onclick = function () {
          var i = +b.dataset.avrm;
          var name = PLAYERS[i];
          removeAvatar(name, function () {
            fill();
            renderAll();
            message("عکس " + name + " حذف شد.");
          });
        };
      });
      [].forEach.call(el.querySelectorAll("[data-ren]"), function (b) {
        b.onclick = function () {
          if (localBlock()) return;
          if (!isAdminUser()) return;
          var i = +b.dataset.ren;
          var old = PLAYERS[i];
          promptDialog("نام جدید:", old).then(function (nn) {
            if (!nn) return;
            var r = renameEverywhere(old, nn);
            if (!r.ok) {
              message(r.msg, true);
              return;
            }
            if (window.__onPlayerRenamed) window.__onPlayerRenamed(old, r.newName);
            fill();
            renderAll();
          });
        };
      });
      [].forEach.call(el.querySelectorAll("[data-remp]"), function (b) {
        b.onclick = function () {
          if (localBlock()) return;
          if (!isAdminUser()) return;
          var i = +b.dataset.remp,
            name = PLAYERS[i];
          var gc = games.filter(function (g) {
            return g.player1 === name || g.player2 === name;
          }).length;
          var msg = gc
            ? "«" + name + "» از لیست بازیکنان حذف می‌شود. " + n(gc, 0) + " بازی ثبت‌شده‌ی او حفظ می‌شود. ادامه؟"
            : "«" + name + "» حذف شود؟";
          confirmDialog(msg).then(function (ok) {
            if (!ok) return;
            if (avatars[name]) {
              delete avatars[name];
              saveAvatars();
            }
            PLAYERS.splice(i, 1);
            savePlayers();
            if (window.__sbDeletePlayer) window.__sbDeletePlayer(name);
            fill();
            renderAll();
            message("بازیکن حذف شد.");
          });
        };
      });
      updatePlayerCountBadge();
    }
    function activePageId() {
      var el = document.querySelector(".page.active");
      return el ? el.id : "register";
    }
    function renderPage(p) {
      if (p === "register") renderRegister();
      else if (p === "ranking") renderRanking();
      else if (p === "tournament") renderTournament();
      else if (p === "history") renderHistory();
      else if (p === "analytics") renderAnalytics();
      else if (p === "settings") {
        renderThemes();
        renderPlayers();
      } else if (p === "profile") {
        if (window.__renderProfile) window.__renderProfile();
      }
    }
    function renderAll() {
      renderPage(activePageId());
    }

    function backup() {
      try {
        var data = {
          version: 20,
          exportedAt: new Date().toISOString(),
          players: PLAYERS,
          avatars: avatars,
          settings: settings,
          games: games,
          tournament: tournament,
          archive: archive,
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        var u = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = u;
        a.download = "backgammon-backup-" + Date.now() + ".json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () {
          URL.revokeObjectURL(u);
        }, 1000);
      } catch (e) {
        message("ساخت فایل پشتیبان ممکن نشد.", true);
      }
    }
    function restore(f) {
      if (!f) return;
      var r = new FileReader();
      r.onload = async function (e) {
        try {
          var d = JSON.parse(e.target.result),
            arr = Array.isArray(d) ? d : d.games;
          if (!Array.isArray(arr)) throw Error();
          if (d.players && Array.isArray(d.players) && d.players.length >= 2) {
            if (await confirmDialog("بازیکنان فعلی با فایل پشتیبان جایگزین شوند؟")) {
              var _oldPl = PLAYERS.slice();
              PLAYERS = d.players.slice();
              savePlayers();
              if (window.__sbDeletePlayer) {
                for (var _oi = 0; _oi < _oldPl.length; _oi++) {
                  if (PLAYERS.indexOf(_oldPl[_oi]) < 0) {
                    try {
                      await window.__sbDeletePlayer(_oldPl[_oi]);
                    } catch (_oe) {}
                  }
                }
              }
            }
          }
          var seen = {};
          games.forEach(function (g) {
            seen[g.timestamp + "::" + pairKey(g.player1, g.player2)] = 1;
          });
          var clean = [];
          arr.forEach(function (g) {
            var _sig = g.timestamp + "::" + pairKey(g.player1, g.player2);
            if (valid(g) && !seen[_sig]) {
              seen[_sig] = 1;
              g.timestamp = Number(g.timestamp);
              g.id = g.id || id();
              g.note = typeof g.note === "string" ? g.note : "";
              g.tags = Array.isArray(g.tags) ? g.tags : [];
              g.date = g.date || pdate(g.timestamp);
              g.time = g.time || ptime(g.timestamp);
              clean.push(g);
            }
          });
          if (!(await confirmDialog(n(clean.length, 0) + " بازی معتبر قابل ورود است. ادامه؟"))) return;
          games = games.concat(clean);
          clean.forEach(function (x) {
            if (window.__sbMarkDirty) window.__sbMarkDirty(x.id, "quiet");
          });
          if (d.avatars && typeof d.avatars === "object" && !Array.isArray(d.avatars)) {
            if (await confirmDialog("عکس‌های بازیکنان بارگذاری شوند؟")) {
              avatars = {};
              Object.keys(d.avatars).forEach(function (k) {
                var v = safeAvatar(d.avatars[k]);
                if (v) avatars[k] = v;
              });
              saveAvatars();
            }
          }
          if (d.settings && typeof d.settings === "object") for (var k in d.settings) settings[k] = d.settings[k];
          if (!THEMES[settings.theme]) settings.theme = "blackgold";
          if ([".9", "1", "1.12", "1.24"].indexOf(String(settings.font)) < 0) settings.font = "1";
          if (["calm", "standard", "bold"].indexOf(settings.intensity) < 0) settings.intensity = "standard";
          if (d.tournament && typeof d.tournament === "object") {
            if (typeof d.tournament.name === "string") tournament.name = d.tournament.name;
            if (typeof d.tournament.start === "number") tournament.start = d.tournament.start;
            if (typeof d.tournament.nextNum === "number") tournament.nextNum = d.tournament.nextNum;
          }
          if (Array.isArray(d.archive)) archive = d.archive.slice();
          var _wa = $("winnerArena");
          if (_wa) _wa.dataset.key = "";
          saveTournament();
          save();
          saveSettings();
          apply();
          fill();
          renderAll();
          message("بازیابی با موفقیت انجام شد.");
        } catch (x) {
          message("فایل پشتیبان معتبر نیست.", true);
        }
      };
      r.onerror = function () {
        message("خواندن فایل ناموفق بود.", true);
      };
      r.readAsText(f);
    }
    async function clearAll() {
      if (!(await confirmDialog("مرحله اول: همه بازی‌ها و تنظیمات حذف شوند؟ ابتدا پشتیبان بگیرید."))) return;
      if (!(await confirmDialog("مرحله نهایی: این عمل قابل بازگشت نیست. حذف کامل تأیید می‌شود؟"))) return;
      if (window.__sbClearAllData) {
        try {
          await window.__sbClearAllData(
            games
              .map(function (g) {
                return g && g.id;
              })
              .filter(Boolean),
          );
        } catch (e) {
          console.error("clearAll sync", e);
        }
      }
      games = [];
      settings = { theme: "blackgold", font: "1", intensity: "standard" };
      tournament = { name: "تورنمنت ۱", start: 0, nextNum: 1 };
      archive = [];
      selected = { pair: null, winner: null, type: null, slot1: null, slot2: null };
      avatars = {};
      remove(KEY);
      remove(SKEY);
      remove(PKEY);
      remove(TKEY);
      remove(AVKEY);
      PLAYERS = [];
      buildPairs();
      var _wa6 = $("winnerArena");
      if (_wa6) _wa6.dataset.key = "";
      apply();
      fill();
      renderAll();
      message("همه اطلاعات حذف شد.");
    }
    function exportCSV() {
      var head = [
        "تاریخ",
        "ساعت",
        "بازیکن اول",
        "بازیکن دوم",
        "برنده",
        "بازنده",
        "نوع برد",
        "امتیاز",
        "برچسب‌ها",
        "یادداشت",
      ];
      var rows = games
        .slice()
        .sort(function (a, b) {
          return a.timestamp - b.timestamp;
        })
        .map(function (g) {
          return [
            g.date,
            g.time,
            g.player1,
            g.player2,
            g.winner,
            loser(g),
            TYPES[g.type].full,
            pts(g.type),
            (g.tags || []).join("|"),
            g.note || "",
          ]
            .map(function (v) {
              return '"' + String(v).replace(/"/g, '""') + '"';
            })
            .join(",");
        });
      var csv = "\ufeff" + head.join(",") + "\n" + rows.join("\n");
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      var u = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = u;
      a.download = "backgammon-" + Date.now() + ".csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () {
        URL.revokeObjectURL(u);
      }, 1000);
    }
    function setupCollapsibles() {
      var saved = {};
      try {
        saved = JSON.parse(localStorage.getItem("backgammon_collapse") || "{}");
      } catch (_) {}
      [].forEach.call(document.querySelectorAll(".collapse-header"), function (btn) {
        var targetId = btn.dataset.target;
        var body = $(targetId);
        if (!body) return;
        var isOpen = !!saved[targetId];
        if (isOpen) {
          body.classList.add("open");
          btn.setAttribute("aria-expanded", "true");
        }
        btn.onclick = function () {
          var nowOpen = !body.classList.contains("open");
          body.classList.toggle("open", nowOpen);
          btn.setAttribute("aria-expanded", nowOpen ? "true" : "false");
          saved[targetId] = nowOpen;
          try {
            localStorage.setItem("backgammon_collapse", JSON.stringify(saved));
          } catch (_) {}
        };
      });
    }
    function updatePlayerCountBadge() {
      var b = $("playerCountBadge");
      if (b) b.textContent = n(PLAYERS.length, 0) + " نفر";
    }
    function bind() {
      function gotoPage(p) {
        [].forEach.call(document.querySelectorAll(".page"), function (x) {
          x.classList.toggle("active", x.id === p);
        });
        renderPage(p);
        window.scrollTo(0, 0);
      }
      window.gotoPage = gotoPage;
      window.deselectTabs = function () {
        [].forEach.call(document.querySelectorAll(".tab"), function (x) {
          x.classList.remove("active");
          x.setAttribute("aria-selected", "false");
        });
        $("settingsGear").classList.remove("active");
      };
      [].forEach.call(document.querySelectorAll(".tab"), function (b) {
        b.onclick = function () {
          var p = b.dataset.page;
          [].forEach.call(document.querySelectorAll(".tab"), function (x) {
            var on = x === b;
            x.classList.toggle("active", on);
            x.setAttribute("aria-selected", on ? "true" : "false");
          });
          $("settingsGear").classList.remove("active");
          gotoPage(p);
        };
      });
      $("settingsGear").onclick = function () {
        [].forEach.call(document.querySelectorAll(".tab"), function (x) {
          x.classList.remove("active");
          x.setAttribute("aria-selected", "false");
        });
        $("settingsGear").classList.add("active");
        gotoPage("settings");
      };
      $("add").onclick = add;
      $("last").onclick = deleteLast;
      var poolSearchEl = $("poolSearch");
      if (poolSearchEl)
        poolSearchEl.addEventListener("input", function () {
          poolFilter = this.value;
          renderPool();
        });
      ["search", "filterType", "filterPlayer", "sortHistory", "fromDate", "toDate"].forEach(function (x) {
        var el = $(x);
        if (!el) return;
        el.addEventListener(x === "search" ? "input" : "change", function () {
          historyLimit = HISTORY_PAGE;
          renderHistory();
        });
      });
      ["recentRange", "progressSelect"].forEach(function (x) {
        var el = $(x);
        if (el) el.addEventListener("change", renderCharts);
      });
      $("fontScale").onchange = function () {
        settings.font = this.value;
        apply();
        saveSettings();
      };
      $("intensity").onchange = function () {
        settings.intensity = this.value;
        apply();
        saveSettings();
      };
      var tc = $("themeCurrent");
      if (tc) {
        tc.onclick = openThemes;
        tc.onkeydown = function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openThemes();
          }
        };
      }
      $("tReset").onclick = startNewTournament;
      $("tEditName").onclick = editTournamentName;
      $("tEditStart").onclick = editTournamentStart;
      $("export").onclick = backup;
      $("exportCSV").onclick = exportCSV;
      $("importBtn").onclick = function () {
        $("importFile").click();
      };
      $("importFile").onchange = function (e) {
        restore(e.target.files[0]);
        this.value = "";
      };
      $("clear").onclick = clearAll;
      $("addPlayer").onclick = function () {
        if (localBlock()) return;
        var v = $("newPlayer").value.trim().replace(/\s+/g, " ");
        if (!v) {
          message("نام خالی است.", true);
          return;
        }
        var dup = PLAYERS.some(function (p) {
          return p.toLowerCase() === v.toLowerCase();
        });
        if (dup) {
          message("این نام قبلاً وجود دارد.", true);
          return;
        }
        PLAYERS.push(v);
        savePlayers();
        $("newPlayer").value = "";
        fill();
        renderAll();
      };
      $("newPlayer").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          $("addPlayer").click();
        }
      });
      $("modalBg").onclick = function (e) {
        if (e.target === $("modalBg")) closeModal();
      };
      window.onscroll = function () {
        $("top").style.display = window.scrollY > 420 ? "block" : "none";
      };
      $("top").onclick = function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && $("modalBg").classList.contains("show")) {
          closeModal();
          return;
        }
        if (e.target.matches("input,textarea,select")) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.body.classList.contains("guest-mode")) return;
        var active = document.querySelector(".page.active");
        if (!active || active.id !== "register") return;
        if (e.key === "Enter" && !$("add").disabled) {
          e.preventDefault();
          add();
        }
        if (e.key === "Backspace" && e.shiftKey) {
          e.preventDefault();
          deleteLast();
        }
      });
    }
    function setupPWA() {
      /* مانیفست دیگر با blob ساخته نمی‌شود: Chrome برای «نصب» مانیفست
     blob را قبول نمی‌کند. به‌جایش فایل استاتیک manifest.json لینک شده. */
      try {
        var fav =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4af37"/><stop offset="1" stop-color="#7a5f1a"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="#0a0a12"/><g fill="none" stroke="#d4af37" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22 L32 6 L50 22"/><path d="M14 42 L32 58 L50 42"/></g><circle cx="32" cy="28.2" r="1.5" fill="#f4cf6a"/><circle cx="32" cy="32" r="1.5" fill="#f4cf6a"/><circle cx="32" cy="35.8" r="1.5" fill="#f4cf6a"/></svg>';
        var fl = document.getElementById("faviconLink");
        if (fl) fl.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fav);
      } catch (_) {}
      /* ثبت service worker برای اجرای آفلاین.
     فقط روی HTTPS یا localhost ثبت می‌شود؛ روی http ساده بی‌اثر است. */
      try {
        if (
          "serviceWorker" in navigator &&
          (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ) {
          window.addEventListener("load", function () {
            navigator.serviceWorker.register("service-worker.js").catch(function (e) {
              console.warn("SW register failed", e);
            });
          });
        }
      } catch (_) {}
    }
    function localBlock(id) {
      if (!window.__localMode) return false;
      if (id && window.__localIsNew && window.__localIsNew(id)) return false;
      message("🔌 حالت محلی: این کار فقط وقتی به سرور وصل باشی ممکنه.", true);
      return true;
    }
    var _lm_del = del,
      _lm_edit = edit,
      _lm_deleteLast = deleteLast,
      _lm_snt = startNewTournament,
      _lm_etn = editTournamentName,
      _lm_ets = editTournamentStart,
      _lm_restore = restore,
      _lm_clearAll = clearAll,
      _lm_pick = pickAvatar,
      _lm_rmav = removeAvatar;
    del = async function (i) {
      if (localBlock(i)) return;
      return await _lm_del(i);
    };
    edit = function (i) {
      if (document.body.classList.contains("guest-mode")) return;
      if (localBlock(i)) return;
      return _lm_edit(i);
    };
    deleteLast = function () {
      if (window.__localMode && games.length) {
        var lg = games.slice().sort(function (a, b) {
          return b.timestamp - a.timestamp;
        })[0];
        if (localBlock(lg.id)) return;
      }
      return _lm_deleteLast();
    };
    function needAdmin(what) {
      if (typeof window.isAdmin === "function" && window.isAdmin()) return false;
      message("🔒 «" + what + "» فقط برای ادمین ممکنه.", true);
      return true;
    }
    startNewTournament = function () {
      if (needAdmin("شروع تورنمنت جدید")) return;
      if (localBlock()) return;
      return _lm_snt();
    };
    editTournamentName = function () {
      if (needAdmin("ویرایش نام تورنمنت")) return;
      if (localBlock()) return;
      return _lm_etn();
    };
    editTournamentStart = function () {
      if (needAdmin("ویرایش نقطه شروع")) return;
      if (localBlock()) return;
      return _lm_ets();
    };
    restore = function (f) {
      if (needAdmin("وارد کردن پشتیبان")) return;
      if (localBlock()) return;
      return _lm_restore(f);
    };
    clearAll = function () {
      if (needAdmin("حذف کامل اطلاعات")) return;
      if (localBlock()) return;
      return _lm_clearAll();
    };
    pickAvatar = function (n, cb) {
      if (localBlock()) return;
      return _lm_pick(n, cb);
    };
    removeAvatar = function (n, cb) {
      if (localBlock()) return;
      return _lm_rmav(n, cb);
    };
    load();
    apply();
    fill();
    bind();
    renderAll();
    setupPWA();
    setupCollapsibles();
    updatePlayerCountBadge();
    window.renderAll = renderAll;
    window.__reload = load;
    window.__loaded = true;
    window.fill = fill;
    window.__avatarHTML = avatarHTML;
    window.__avatarColor = avatarColor;
    window.__stats = function (name) {
      return stats(name);
    };
    window.__allPlayerStats = function () {
      return PLAYERS.map(stats);
    };
    window.__playerNames = function () {
      return PLAYERS.slice();
    };
    window.__hasAvatar = function (name) {
      return !!avatars[name];
    };
    window.__pickAvatar = function (name, cb) {
      pickAvatar(name, cb);
    };
    window.__removeAvatar = function (name, cb) {
      removeAvatar(name, cb);
    };
    window.__renameEverywhere = function (old, nn) {
      return renameEverywhere(old, nn);
    };
    window.__confirm = confirmDialog;
    window.__rankingSort = rankingSort;
    window.__esc = esc;
    window.__n = n;
    window.__percent = percent;
    window.__message = message;
  } catch (e) {
    var x = document.getElementById("fatal");
    if (x) {
      x.textContent =
        "خطای قابل فهم در اجرای برنامه رخ داد: " +
        (e.message || "خطای ناشناخته") +
        "؛ لطفاً فایل را دوباره ذخیره و باز کنید.";
      x.classList.remove("hidden");
    } else document.body.innerHTML = '<p style="padding:20px;direction:rtl">خطا در اجرای برنامه رخ داد.</p>';
  }
})();

function toggleFullscreen() {
  var table = document.querySelector("#ranking table");
  if (!table) return;
  var existing = document.getElementById("fullscreenOverlay");
  if (existing) {
    existing.remove();
    return;
  }
  var overlay = document.createElement("div");
  overlay.id = "fullscreenOverlay";
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: var(--bg); z-index: 9999; overflow: auto; padding: 20px; box-sizing: border-box;";
  var clonedTable = table.cloneNode(true);
  clonedTable.style.cssText = "width: 100%; min-width: 700px; border-collapse: collapse; margin: 0 auto;";
  var closeBtn = document.createElement("button");
  closeBtn.textContent = "✕ بستن";
  closeBtn.style.cssText =
    "position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: var(--danger); color: var(--contrast); border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; z-index: 10000;";
  function closeOverlay() {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    if (screen.orientation && screen.orientation.unlock)
      try {
        screen.orientation.unlock();
      } catch (e) {}
    overlay.remove();
  }
  closeBtn.onclick = closeOverlay;
  overlay.appendChild(closeBtn);
  overlay.appendChild(clonedTable);
  document.body.appendChild(overlay);
  if (overlay.requestFullscreen) {
    overlay
      .requestFullscreen()
      .then(function () {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {});
      })
      .catch(function () {});
  } else if (overlay.webkitRequestFullscreen) {
    overlay.webkitRequestFullscreen();
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {});
  } else if (overlay.msRequestFullscreen) {
    overlay.msRequestFullscreen();
  }
}

var sortDirection = {};
function sortTable(column) {
  var tbody = document.getElementById("rankbody");
  if (!tbody) return;
  var rows = Array.from(tbody.querySelectorAll("tr"));
  if (!rows.length) return;

  if (sortDirection._col !== column) {
    sortDirection._col = column;
    sortDirection[column] = true;
  } else {
    sortDirection[column] = !sortDirection[column];
  }
  var direction = sortDirection[column] ? 1 : -1;

  rows.sort(function (a, b) {
    var aV, bV;
    switch (column) {
      case "avatar":
        return (a.dataset.name || "").localeCompare(b.dataset.name || "", "fa") * direction;
      case "games":
        aV = +a.dataset.games;
        bV = +b.dataset.games;
        break;
      case "wins":
        aV = +a.dataset.wins;
        bV = +b.dataset.wins;
        break;
      case "winRate":
        aV = +a.dataset.winrate;
        bV = +b.dataset.winrate;
        break;
      case "points":
        aV = +a.dataset.points;
        bV = +b.dataset.points;
        break;
      case "breakdown":
        aV = +a.dataset.breakdownscore;
        bV = +b.dataset.breakdownscore;
        break;
      default:
        return 0;
    }
    if (aV < bV) return -1 * direction;
    if (aV > bV) return 1 * direction;
    return 0;
  });

  rows.forEach(function (r) {
    tbody.appendChild(r);
  });
}

var _tSortState = { col: null, dir: 1 };
function sortTournament(column, th) {
  var tbody = document.getElementById("tRankBody");
  if (!tbody) return;
  var rows = Array.from(tbody.querySelectorAll(".rank-card"));
  if (!rows.length) return;
  if (_tSortState.col === column) _tSortState.dir *= -1;
  else {
    _tSortState.col = column;
    _tSortState.dir = 1;
  }
  var dir = _tSortState.dir;
  document.querySelectorAll("#tournament .sort-indicator").forEach(function (el) {
    el.classList.remove("active");
    el.textContent = "↕";
  });
  var ind = th ? th.querySelector(".sort-indicator") : null;
  if (ind) {
    ind.classList.add("active");
    ind.textContent = dir === 1 ? "▲" : "▼";
  }
  rows.sort(function (a, b) {
    var aV = a.dataset[column] || "";
    var bV = b.dataset[column] || "";
    var aN = parseFloat(aV),
      bN = parseFloat(bV);
    if (!isNaN(aN) && !isNaN(bN) && /^-?\d/.test(aV) && /^-?\d/.test(bV)) {
      return (aN - bN) * dir;
    }
    return aV.localeCompare(bV, "fa") * dir;
  });
  rows.forEach(function (r, i) {
    var rankCell = r.querySelector(".rank-pos");
    if (rankCell) {
      rankCell.textContent = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1).toLocaleString("fa-IR");
      rankCell.className = "rank-pos " + (i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "");
    }
    r.dataset.rank = i;
    tbody.appendChild(r);
  });
}
