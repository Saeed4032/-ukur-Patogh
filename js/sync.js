(function () {
  var U = "https://tnnvqgbthiwwupadqszn.supabase.co";
  var K =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubnZxZ2J0aGl3d3VwYWRxc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjA5OTYsImV4cCI6MjEwNTEzNjk5Nn0.KecGjf2Qq9xcm5cSO5b5hxf3hyhAfFE1l23dn5BXf5g";
  var sb;
  var initRetry = 0;
  var curUser = null,
    curName = "",
    curRole = "",
    paused = false,
    timers = {},
    dirtyIds = {},
    isGuest = false;
  function activateOfflineMode(text) {
    if (window.__enterLocalMode) window.__enterLocalMode();
    if (typeof message === "function") {
      message(text || "اتصال به سرور برقرار نشد؛ حالت آفلاین فعال شد.", true);
    } else if (typeof toast === "function") {
      toast(text || "اتصال به سرور برقرار نشد؛ حالت آفلاین فعال شد.", true);
    }
  }
  function initSupabase() {
    if (!window.supabase || !window.supabase.createClient) {
      initRetry++;
      if (initRetry < 3) {
        setTimeout(initSupabase, 1500);
        return;
      }
      activateOfflineMode("اتصال به سرور برقرار نشد؛ حالت آفلاین فعال شد.");
      return;
    }
    try {
      sb = window.supabase.createClient(U, K);
    } catch (e) {
      console.error("supabase init", e);
      initRetry++;
      if (initRetry < 3) {
        setTimeout(initSupabase, 1500);
        return;
      }
      activateOfflineMode("اتصال به سرور برقرار نشد؛ حالت آفلاین فعال شد.");
      return;
    }
    window.sb = sb;
    window.__sb = sb;
    window.__fakeEmail = function (u) {
      return u + "@backgammon.local";
    };
    if (window.__leaveLocalMode) window.__leaveLocalMode();
  }
  initSupabase();
  try {
    var _dd = localStorage.getItem("backgammon_dirty");
    var _p = _dd ? JSON.parse(_dd) : null;
    if (_p && typeof _p === "object" && !Array.isArray(_p)) dirtyIds = _p;
  } catch (_) {
    dirtyIds = {};
  }
  function saveDirty() {
    try {
      localStorage.setItem("backgammon_dirty", JSON.stringify(dirtyIds));
    } catch (_) {}
  }
  window.__sbMarkDirty = function (id, action) {
    if (!id || isGuest) return;
    if (!dirtyIds[id]) dirtyIds[id] = action || "edit";
    var pd = getPendingDel();
    if (pd[id]) {
      delete pd[id];
      setPendingDel(pd);
    }
    saveDirty();
  };
  var PKEY = "backgammon_players",
    AVKEY = "backgammon_avatars",
    KEY = "backgammon_main_games",
    TKEY = "backgammon_tournaments",
    SKEY = "backgammon_main_settings";
  /* BLOCKED_PLAYERS و isBlocked در بلوک اسکریپت اول (داخل IIFE، پیش از
   فراخوانی load()) تعریف و روی window هم قرار داده شده‌اند تا این
   بلوک هم بتواند از آن‌ها استفاده کند. */
  var NAME_MAP = { saeed: "سعید جنائی", mojtaba: "مجتبی دهقان", hossein: "حسین دهقان" };
  /* BLOCKED_PLAYERS در بالای فایل تعریف شده است (یک منبع حقیقت). */

  function $(id) {
    return document.getElementById(id);
  }
  var AV_RE = /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+\/]+={0,2}$/;
  function safeAv(v) {
    return typeof v === "string" && v.length <= 400000 && AV_RE.test(v) ? v : "";
  }
  function fakeEmail(u) {
    return u + "@backgammon.local";
  }
  function normDigits(x) {
    return String(x || "")
      .replace(/[۰-۹]/g, function (d) {
        return String(d.charCodeAt(0) - 1776);
      })
      .replace(/[٠-٩]/g, function (d) {
        return String(d.charCodeAt(0) - 1632);
      });
  }

  var _loadingTimer = null;
  var _loadingIdx = 0;
  var _loadingMsgs = [
    "🎲 در حال چیدن مهره‌ها...",
    "✨ در حال آماده‌سازی میز...",
    "📊 در حال بارگذاری آمار...",
    "🎯 تقریباً آماده...",
  ];

  /* ---- محافظ شبکه ----------------------------------------------------
   بدون این، اگر سرور بی‌پاسخ بماند (نه خطا، بلکه بی‌پاسخ) هیچ awaitی
   هرگز settle نمی‌شود و کاربر روی صفحه‌ی لودینگ گیر می‌کند.
   -------------------------------------------------------------------- */
  var NET_TIMEOUT = 12000;
  function withTimeout(p, ms, label) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var t = setTimeout(function () {
        if (settled) return;
        settled = true;
        var err = new Error("timeout:" + (label || "network"));
        err.isTimeout = true;
        reject(err);
      }, ms || NET_TIMEOUT);
      Promise.resolve(p).then(
        function (v) {
          if (settled) return;
          settled = true;
          clearTimeout(t);
          resolve(v);
        },
        function (e) {
          if (settled) return;
          settled = true;
          clearTimeout(t);
          reject(e);
        },
      );
    });
  }
  window.withTimeout = withTimeout;
  window.NET_TIMEOUT = NET_TIMEOUT;
  var _loadWatchdog = null;
  function armLoadingWatchdog() {
    clearTimeout(_loadWatchdog);
    _loadWatchdog = setTimeout(function () {
      var el = document.getElementById("loadingScreen");
      if (el && !el.classList.contains("hide")) {
        hideLoading();
        var eb = document.getElementById("supaErr");
        if (eb && getComputedStyle(document.getElementById("supaAuthOverlay") || document.body).display !== "none") {
          eb.textContent = "اتصال به سرور طول کشید. اینترنتت را بررسی کن و دوباره تلاش کن.";
          eb.style.display = "block";
        }
      }
    }, NET_TIMEOUT + 6000);
  }

  function showLoading() {
    var el = document.getElementById("loadingScreen");
    var msgEl = document.getElementById("loadingMsg");
    if (!el) return;
    el.classList.remove("hide");
    armLoadingWatchdog();
    if (msgEl) {
      _loadingIdx = 0;
      msgEl.textContent = _loadingMsgs[0];
      msgEl.classList.remove("swap");
    }
    clearInterval(_loadingTimer);
    _loadingTimer = setInterval(function () {
      if (!msgEl) return;
      _loadingIdx = (_loadingIdx + 1) % _loadingMsgs.length;
      msgEl.classList.add("swap");
      setTimeout(function () {
        msgEl.textContent = _loadingMsgs[_loadingIdx];
        msgEl.classList.remove("swap");
      }, 400);
    }, 1500);
  }
  function hideLoading() {
    var el = document.getElementById("loadingScreen");
    if (!el) return;
    clearTimeout(_loadWatchdog);
    clearInterval(_loadingTimer);
    el.classList.add("hide");
  }
  async function logAct(action, details) {
    if (!curName || isGuest) return;
    try {
      await sb.from("activity_log").insert([{ user_name: curName, action: action, details: details || {} }]);
    } catch (e) {}
  }

  $("supaGuest").onclick = guestLogin;
  async function guestLogin() {
    showLoading();
    isGuest = true;
    curUser = null;
    curRole = "guest";
    curName = "بیننده";
    try {
      await withTimeout(pull(), NET_TIMEOUT, "guest-pull");
    } catch (e) {
      console.error("guest pull", e);
    }
    hideLoading();
    showApp();
    if (window.__reload) window.__reload();
    if (window.renderAll) window.renderAll();
    if (typeof fill === "function") fill();
    var rankTab = document.querySelector('.tab[data-page="ranking"]');
    if (rankTab) rankTab.click();
  }

  var PDKEY = "backgammon_pending_del",
    _flushing = false;
  function getPendingDel() {
    try {
      var o = JSON.parse(localStorage.getItem(PDKEY) || "{}");
      return o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (_) {
      return {};
    }
  }
  function setPendingDel(o) {
    try {
      localStorage.setItem(PDKEY, JSON.stringify(o));
    } catch (_) {}
  }
  function isRlsErr(e) {
    return !!e && (e.code === "42501" || /row-level security/i.test(String(e.message || "")));
  }
  async function rejectedRestore() {
    showSyncToast("⛔ فقط صاحب بازی یا ادمین می‌تواند این بازی را تغییر بدهد", true);
    try {
      await pull();
      if (window.__reload) window.__reload();
      if (window.renderAll) window.renderAll();
      if (typeof fill === "function") fill();
    } catch (e) {
      console.error("rejectedRestore", e);
    }
  }
  async function flushDeletes() {
    if (_flushing || !curUser) return;
    _flushing = true;
    try {
      for (var round = 0; round < 3; round++) {
        var pd = getPendingDel(),
          ids = Object.keys(pd);
        if (!ids.length) break;
        var r = await sb.from("games").upsert(
          ids.map(function (i) {
            return { id: i, data: { id: i, deleted: true, deletedAt: Date.now() } };
          }),
        );
        if (r.error) {
          console.error("push deletes failed:", r.error);
          if (isRlsErr(r.error)) {
            var okIds = [],
              badIds = [];
            for (var q2 = 0; q2 < ids.length; q2++) {
              var r2 = await sb
                .from("games")
                .upsert([{ id: ids[q2], data: { id: ids[q2], deleted: true, deletedAt: Date.now() } }]);
              if (!r2.error) okIds.push(ids[q2]);
              else if (isRlsErr(r2.error)) badIds.push(ids[q2]);
            }
            var cur2 = getPendingDel();
            okIds.concat(badIds).forEach(function (i) {
              delete cur2[i];
            });
            setPendingDel(cur2);
            okIds.forEach(function () {
              logAct("del", { info: "یک بازی حذف شد" });
            });
            if (badIds.length) setTimeout(rejectedRestore, 0);
          }
          break;
        }
        var cur = getPendingDel(),
          restored = [];
        ids.forEach(function (i) {
          if (cur[i]) delete cur[i];
          else restored.push(i);
        });
        setPendingDel(cur);
        ids.forEach(function (i) {
          if (restored.indexOf(i) < 0) logAct("del", { info: "یک بازی حذف شد" });
        });
        if (restored.length) {
          restored.forEach(function (i) {
            dirtyIds[i] = "add";
          });
          pushKey(KEY, localStorage.getItem(KEY));
        }
      }
    } catch (e) {
      console.error("flushDeletes", e);
    }
    _flushing = false;
  }
  window.__sbDeleteGame = async function (id) {
    if (!curUser || !id) return;
    var pd = getPendingDel();
    pd[id] = 1;
    setPendingDel(pd);
    delete dirtyIds[id];
    saveDirty();
    await flushDeletes();
  };
  window.__sbClearAllGames = async function (ids) {
    if (!curUser || !Array.isArray(ids) || !ids.length) return;
    try {
      var pd = getPendingDel();
      ids.forEach(function (id) {
        if (id) pd[id] = 1;
      });
      setPendingDel(pd);
      ids.forEach(function (id) {
        if (id) delete dirtyIds[id];
      });
      saveDirty();
      await flushDeletes();
    } catch (e) {
      console.error("clearAll games", e);
    }
  };
  window.__sbClearAllData = async function (ids) {
    if (!curUser) return;
    var _u = (await sb.auth.getUser()).data.user;
    if (!(_u && _u.app_metadata && _u.app_metadata.role === "admin")) return;
    try {
      if (Array.isArray(ids) && ids.length) {
        var pd0 = getPendingDel();
        ids.forEach(function (id) {
          if (id) pd0[id] = 1;
        });
        setPendingDel(pd0);
        ids.forEach(function (id) {
          if (id) delete dirtyIds[id];
        });
        saveDirty();
        await flushDeletes();
      }
      var pr = await sb.from("players").delete().neq("name", "");
      if (pr.error) console.error("clear all players", pr.error);
      var tr = await sb.from("tournament_state").upsert([{ id: "main", data: { deleted_players: [] } }]);
      if (tr.error) console.error("clear tournament", tr.error);
    } catch (e) {
      console.error("clearAll data", e);
    }
  };
  window.__sbAvatarRemoved = async function (name) {
    if (!name) return;
    var _u = (await sb.auth.getUser()).data.user;
    if (!(_u && _u.app_metadata && _u.app_metadata.role === "admin")) return;
    try {
      await sb.from("players").update({ avatar: null }).eq("name", name);
    } catch (e) {
      console.error("avatar remove", e);
    }
  };
  window.__sbDeletePlayer = async function (name) {
    if (!name) return;
    var _u = (await sb.auth.getUser()).data.user;
    if (!(_u && _u.app_metadata && _u.app_metadata.role === "admin")) return;
    try {
      await sb.from("players").delete().eq("name", name);
      var t = await sb.from("tournament_state").select("data").eq("id", "main").maybeSingle();
      var data = (t.data && t.data.data) || {};
      var del = Array.isArray(data.deleted_players) ? data.deleted_players.slice() : [];
      if (del.indexOf(name) < 0) del.push(name);
      data.deleted_players = del;
      await sb.from("tournament_state").upsert([{ id: "main", data: data }]);
    } catch (e) {
      console.error("delete player", e);
    }
  };

  /* بازی‌های جدید با user_id فرستاده می‌شن؛ ویرایش‌ها بدون user_id،
     تا مالکیت بازیِ بقیه عوض نشه. دو گروه جدا upsert می‌شن چون upsert
     ستون‌های غایب رو null می‌کنه. */
  async function upsertGames(list) {
    var uid = curUser && curUser.id;
    var adds = [],
      edits = [];
    list.forEach(function (x) {
      if (dirtyIds[x.id] === "add") adds.push({ id: x.id, data: x, user_id: uid });
      else edits.push({ id: x.id, data: x });
    });
    var res = { error: null };
    if (adds.length) res = await sb.from("games").upsert(adds);
    if (!res.error && edits.length) res = await sb.from("games").upsert(edits);
    return res;
  }

  /* pull سبک (برای polling/realtime) عکس‌ها رو دانلود نمی‌کنه؛
     هر FULL_PULL_EVERY یک بار یا با سینک دستی/ورود، pull کامل انجام می‌شه. */
  var FULL_PULL_EVERY = 10 * 60 * 1000;
  var _lastFullPull = 0;
  async function pull(opts) {
    var light = !!(opts && opts.light) && Date.now() - _lastFullPull < FULL_PULL_EVERY;
    paused = true;
    var changed = false,
      gamesOk = false,
      needPush = false;
    try {
      await flushDeletes();
      var p = await sb.from("players").select(light ? "name" : "name,avatar");
      if (!p.error) {
        if (!light) _lastFullPull = Date.now();
        var remotePlayers = Array.isArray(p.data) ? p.data : [];
        var remoteNames = [];
        remotePlayers.forEach(function (x) {
          if (x && typeof x.name === "string" && x.name.trim() && remoteNames.indexOf(x.name) < 0) {
            // فیلتر بازیکن‌های بلاک‌شده
            if (!isBlocked(x.name)) remoteNames.push(x.name);
          }
        });
        var localNames = [];
        try {
          var localNameRaw = localStorage.getItem(PKEY);
          var parsedNames = localNameRaw ? JSON.parse(localNameRaw) : [];
          if (Array.isArray(parsedNames))
            localNames = parsedNames.filter(function (x) {
              return typeof x === "string" && x.trim() && !isBlocked(x);
            });
        } catch (_) {}
        var mergedNames = remoteNames.slice();
        localNames.forEach(function (name) {
          if (mergedNames.indexOf(name) < 0) mergedNames.push(name);
        });
        // همیشه بازیکن‌های بلاک‌شده را از لیست نهایی حذف کن
        mergedNames = mergedNames.filter(function (n) {
          return !isBlocked(n);
        });
        // گارد: با کمتر از ۲ بازیکن چیزی ننویس (وگرنه روی کاربر تازه
        // "[]" ثبت می‌شد و یک render اضافه تریگر می‌شد)
        if (mergedNames.length >= 2) {
          var namesStr = JSON.stringify(mergedNames);
          if (namesStr !== localStorage.getItem(PKEY)) {
            localStorage.setItem(PKEY, namesStr);
            changed = true;
          }
        }
        if (!light) {
          var localAv = {};
          try {
            var localAvRaw = localStorage.getItem(AVKEY);
            var parsedAv = localAvRaw ? JSON.parse(localAvRaw) : {};
            if (parsedAv && typeof parsedAv === "object" && !Array.isArray(parsedAv)) localAv = parsedAv;
          } catch (_) {}
          var av = {};
          if (remoteNames.length) {
            remotePlayers.forEach(function (x) {
              if (x && typeof x.name === "string" && safeAv(x.avatar)) av[x.name] = x.avatar;
            });
            localNames.forEach(function (name) {
              if (remoteNames.indexOf(name) < 0 && safeAv(localAv[name])) av[name] = localAv[name];
            });
          } else {
            av = localAv;
          }
          var avStr = JSON.stringify(av);
          if (avStr !== localStorage.getItem(AVKEY)) {
            localStorage.setItem(AVKEY, avStr);
            changed = true;
          }
        }
      }
      var g = await sb.from("games").select("id,data");
      if (!g.error) {
        gamesOk = true;
        var serverGames = [],
          tomb = {},
          pend = getPendingDel();
        (g.data || []).forEach(function (x) {
          if (!x || !x.data) return;
          if (x.data.deleted) {
            tomb[x.id] = 1;
            return;
          }
          if (pend[x.id]) return;
          serverGames.push(x.data);
        });
        var localRaw = localStorage.getItem(KEY);
        var localGames = [];
        try {
          localGames = localRaw ? JSON.parse(localRaw) : [];
        } catch (_) {
          localGames = [];
        }
        if (!Array.isArray(localGames)) localGames = [];
        var kept = localGames.filter(function (x) {
          return !(x && x.id && tomb[x.id]);
        });
        if (kept.length !== localGames.length) {
          localGames.forEach(function (x) {
            if (x && x.id && tomb[x.id]) delete dirtyIds[x.id];
          });
          localGames = kept;
          localRaw = JSON.stringify(localGames);
          localStorage.setItem(KEY, localRaw);
          changed = true;
        }
        if (!serverGames.length && localGames.length && curUser) {
          try {
            var uid = curUser && curUser.id;
            await sb.from("games").upsert(
              localGames.map(function (x) {
                return { id: x.id, data: x, user_id: uid };
              }),
            );
            localGames.forEach(function (x) {
              if (x && x.id) delete dirtyIds[x.id];
            });
          } catch (e) {
            console.error("upload local->server failed", e);
          }
        } else if (serverGames.length && localGames.length && curUser) {
          var map = {};
          serverGames.forEach(function (x) {
            if (x && x.id) map[x.id] = x;
          });
          var added = 0;
          localGames.forEach(function (x) {
            if (!x || !x.id) return;
            if (!map[x.id]) {
              map[x.id] = x;
              added++;
              dirtyIds[x.id] = "add";
              needPush = true;
            } else if (dirtyIds[x.id]) {
              map[x.id] = x;
              needPush = true;
            }
          });
          var merged = Object.keys(map).map(function (k) {
            return map[k];
          });
          var mergedStr = JSON.stringify(merged);
          if (mergedStr !== localRaw) {
            localStorage.setItem(KEY, mergedStr);
            changed = true;
          }
        } else if (serverGames.length) {
          var sStr = JSON.stringify(serverGames);
          if (sStr !== localRaw) {
            localStorage.setItem(KEY, sStr);
            changed = true;
          }
        }
      }
      var t = await sb.from("tournament_state").select("data").eq("id", "main").maybeSingle();
      if (!t.error) {
        var serverT = (t.data && t.data.data) || null;
        if (serverT && typeof serverT === "object" && Object.keys(serverT).length) {
          var tStr = JSON.stringify(serverT);
          if (tStr !== localStorage.getItem(TKEY)) {
            localStorage.setItem(TKEY, tStr);
            changed = true;
          }
          if (Array.isArray(serverT.deleted_players) && serverT.deleted_players.length) {
            try {
              var localNamesArr = JSON.parse(localStorage.getItem(PKEY) || "[]");
              if (Array.isArray(localNamesArr)) {
                var filtered = localNamesArr.filter(function (n) {
                  return serverT.deleted_players.indexOf(n) < 0;
                });
                if (filtered.length !== localNamesArr.length) {
                  localStorage.setItem(PKEY, JSON.stringify(filtered));
                  changed = true;
                }
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.error("pull", e);
    }
    paused = false;
    if (curUser && gamesOk && (needPush || Object.keys(dirtyIds).length)) {
      try {
        pushKey(KEY, localStorage.getItem(KEY));
      } catch (_) {}
    }
    if (gamesOk && curUser) {
      try {
        localStorage.removeItem("backgammon_local_new");
      } catch (_) {}
    }
    return changed;
  }

  async function pushKey(k, v, attempt) {
    attempt = attempt || 0;
    if (!curUser) return;
    if (paused) {
      clearTimeout(timers[k]);
      timers[k] = setTimeout(function () {
        pushKey(k, localStorage.getItem(k), attempt);
      }, 1500);
      return;
    }
    try {
      if (k === KEY) {
        var arr = JSON.parse(v);
        var toSend = arr.filter(function (x) {
          return x && x.id && dirtyIds[x.id];
        });
        if (toSend.length) {
          var r = await upsertGames(toSend);
          if (r.error) {
            console.error("push games failed (attempt " + (attempt + 1) + "):", r.error);
            if (isRlsErr(r.error)) {
              var rej = 0;
              for (var q3 = 0; q3 < toSend.length; q3++) {
                var x3 = toSend[q3];
                var r3 = await upsertGames([x3]);
                if (!r3.error) delete dirtyIds[x3.id];
                else if (isRlsErr(r3.error)) {
                  delete dirtyIds[x3.id];
                  rej++;
                }
              }
              saveDirty();
              if (rej) setTimeout(rejectedRestore, 0);
              return;
            }
            if (attempt < 3) {
              clearTimeout(timers[k]);
              timers[k] = setTimeout(function () {
                pushKey(k, v, attempt + 1);
              }, 3000);
            }
            return;
          }
          var sentActions = {};
          toSend.forEach(function (x) {
            if (dirtyIds[x.id]) {
              sentActions[x.id] = dirtyIds[x.id];
              delete dirtyIds[x.id];
            }
          });
          toSend.forEach(function (x) {
            var act = sentActions[x.id];
            if (act && act !== "quiet")
              logAct(act, {
                info:
                  act === "add"
                    ? x.winner + " مقابل " + (x.player1 === x.winner ? x.player2 : x.player1)
                    : "ویرایش بازی " + x.winner + " × " + (x.player1 === x.winner ? x.player2 : x.player1),
              });
          });
        }
      } else if (k === AVKEY) {
        var a = JSON.parse(v);
        var playerNames = [];
        try {
          var storedPlayers = JSON.parse(localStorage.getItem(PKEY) || "[]");
          if (Array.isArray(storedPlayers))
            playerNames = storedPlayers.filter(function (n) {
              return typeof n === "string" && n.trim();
            });
        } catch (_) {}
        var rows = playerNames
          .filter(function (n) {
            return safeAv(a[n]);
          })
          .map(function (n) {
            return { name: n, avatar: safeAv(a[n]) };
          });
        if (rows.length) {
          var r2 = await sb.from("players").upsert(rows);
          if (r2.error) {
            console.error("push avatars failed:", r2.error);
          }
        }
      } else if (k === PKEY) {
        var list = JSON.parse(v);
        var rows2 = list.map(function (n) {
          return { name: n };
        });
        if (rows2.length) {
          try {
            var t3 = await sb.from("tournament_state").select("data").eq("id", "main").maybeSingle();
            if (!t3.error && t3.data && t3.data.data && Array.isArray(t3.data.data.deleted_players)) {
              var data3 = t3.data.data;
              var newDel = data3.deleted_players.filter(function (n) {
                return list.indexOf(n) < 0;
              });
              if (newDel.length !== data3.deleted_players.length) {
                data3.deleted_players = newDel;
                await sb.from("tournament_state").upsert([{ id: "main", data: data3 }]);
              }
            }
          } catch (_) {}
          var r3 = await sb.from("players").upsert(rows2);
          if (r3.error) {
            console.error("push players failed:", r3.error);
          }
        }
      } else if (k === TKEY) {
        var t = JSON.parse(v);
        try {
          var t2 = await sb.from("tournament_state").select("data").eq("id", "main").maybeSingle();
          if (!t2.error && t2.data && t2.data.data) {
            var rm = t2.data.data;
            if (Array.isArray(rm.deleted_players)) t.deleted_players = rm.deleted_players;
            if (Array.isArray(rm.archive) && Array.isArray(t.archive)) {
              var seenArc = {};
              t.archive.forEach(function (a) {
                if (a && a.id) seenArc[a.id] = 1;
              });
              rm.archive.forEach(function (a) {
                if (a && a.id && !seenArc[a.id]) t.archive.push(a);
              });
            }
          }
        } catch (_) {}
        var r4 = await sb.from("tournament_state").upsert([{ id: "main", data: t }]);
        if (r4.error) {
          console.error("push tournament failed:", r4.error);
        }
      }
    } catch (e) {
      console.error("push", e);
    }
  }

  /* app.js بعد از هر ذخیره‌ی محلی (put) این رو صدا می‌زنه */
  function scheduleLocalPush(k, v) {
    if (paused || !curUser) return;
    if ([KEY, AVKEY, PKEY, TKEY].indexOf(k) > -1) {
      clearTimeout(timers[k]);
      timers[k] = setTimeout(function () {
        pushKey(k, v);
      }, 900);
    }
  }
  window.__sbOnLocalSave = scheduleLocalPush;

  function updateSyncDot(state) {
    var dot = document.getElementById("syncDot");
    if (!dot) return;
    var colors = { online: "#4caf50", syncing: "#ffc107", offline: "#f44336", error: "#9e9e9e" };
    var titles = {
      online: "آنلاین — همه‌چیز سینک شده",
      syncing: "در حال سینک...",
      offline: "آفلاین — بعداً سینک می‌شه",
      error: "خطا در اتصال",
    };
    dot.style.background = colors[state] || colors.error;
    dot.title = titles[state] || "";
  }

  function updateOnlineStatus() {
    if (!navigator.onLine) {
      updateSyncDot("offline");
    } else {
      updateSyncDot("online");
    }
    updateRealtimeBadge(realtimeConnected);
  }

  function showSyncToast(msg, isBad) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast show" + (isBad ? " bad" : "");
    clearTimeout(window._syncToastTimeout);
    window._syncToastTimeout = setTimeout(function () {
      el.className = "toast";
      el.textContent = "";
    }, 2000);
  }

  async function manualSync() {
    if (!curUser) return;
    updateSyncDot("syncing");
    try {
      await pull();
      if (window.__reload) window.__reload();
      if (window.renderAll) window.renderAll();
      var localRaw = localStorage.getItem(KEY);
      if (localRaw && Object.keys(dirtyIds).length) {
        await pushKey(KEY, localRaw);
      }
      updateSyncDot(navigator.onLine ? "online" : "offline");
      showSyncToast("✅ سینک شد");
    } catch (e) {
      console.error("manualSync", e);
      updateSyncDot("error");
      showSyncToast("❌ خطا در سینک", true);
      setTimeout(updateOnlineStatus, 3000);
    }
  }

  window.addEventListener("online", function () {
    updateOnlineStatus();
    manualSync();
  });
  window.addEventListener("offline", updateOnlineStatus);

  // ===== دکمه سینک دستی =====
  (function () {
    var btn = document.getElementById("syncBtn");
    if (!btn) return;

    window.__syncBtnUpdate = function (state) {
      if (!btn) return;
      btn.classList.remove("syncing", "ok", "err");
      if (state === "syncing") {
        btn.classList.add("syncing");
        btn.title = "در حال سینک...";
      } else if (state === "ok") {
        btn.classList.add("ok");
        btn.title = "سینک شد ✅";
      } else if (state === "err") {
        btn.classList.add("err");
        btn.title = "خطا ❌";
      } else {
        btn.title = "سینک دستی";
      }
    };

    btn.onclick = async function () {
      if (btn.classList.contains("syncing")) return;
      if (!curUser) {
        if (window.__reload) window.__reload();
        return;
      }
      window.__syncBtnUpdate("syncing");
      try {
        await manualSync();
        window.__syncBtnUpdate("ok");
        setTimeout(function () {
          window.__syncBtnUpdate("");
        }, 1200);
      } catch (e) {
        window.__syncBtnUpdate("err");
        setTimeout(function () {
          window.__syncBtnUpdate("");
        }, 1500);
      }
    };
  })();

  var realtimeChannel = null;
  var realtimeConnected = false;
  var _pollTimer = null;
  var _realtimeSyncTimer = null;
  var _realtimeRetryTimer = null;

  function updateRealtimeBadge(connected) {
    var b = document.getElementById("rtBadge");
    if (!b) return;
    b.style.display = "flex";
    if (!navigator.onLine) {
      b.textContent = "";
      b.style.opacity = "0";
      b.title = "آفلاین";
      return;
    }
    b.style.opacity = "1";
    if (connected) {
      b.textContent = "R";
      b.style.color = "#4caf50";
      b.title = "Realtime متصل — سینک آنی";
    } else {
      b.textContent = "P";
      b.style.color = "#8bc34a";
      b.title = "Realtime قطع — سینک با Polling";
    }
  }

  function initRealtime() {
    if (!curUser || !sb) return;
    if (realtimeChannel) {
      try {
        sb.removeChannel(realtimeChannel);
      } catch (_) {}
      realtimeChannel = null;
    }
    updateRealtimeBadge(false);
    try {
      realtimeChannel = sb
        .channel("games-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "games" }, function (payload) {
          debouncedRealtimeSync();
        })
        .subscribe(function (status) {
          if (status === "SUBSCRIBED") {
            realtimeConnected = true;
            updateOnlineStatus();
            updateRealtimeBadge(true);
            scheduleNextPoll();
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            realtimeConnected = false;
            updateRealtimeBadge(false);
            scheduleNextPoll();
            clearTimeout(_realtimeRetryTimer);
            _realtimeRetryTimer = setTimeout(function () {
              if (!realtimeConnected && curUser) initRealtime();
            }, 8000);
          }
        });
    } catch (e) {
      console.error("initRealtime", e);
      realtimeConnected = false;
      updateRealtimeBadge(false);
    }
  }

  function debouncedRealtimeSync() {
    clearTimeout(_realtimeSyncTimer);
    _realtimeSyncTimer = setTimeout(async function () {
      try {
        var changed = await withTimeout(pull({ light: true }), NET_TIMEOUT, "realtime-pull");
        if (changed) {
          if (window.__reload) window.__reload();
          if (window.renderAll) window.renderAll();
        }
        var localRaw = localStorage.getItem(KEY);
        if (localRaw && Object.keys(dirtyIds).length) {
          await withTimeout(pushKey(KEY, localRaw), NET_TIMEOUT, "realtime-push");
        }
      } catch (e) {
        console.error("realtimeSync", e);
      }
    }, 300);
  }

  function startPolling() {
    scheduleNextPoll();
  }

  function scheduleNextPoll() {
    clearTimeout(_pollTimer);
    var delay = realtimeConnected ? 45000 : 20000;
    _pollTimer = setTimeout(async function () {
      try {
        await liveSync();
      } catch (e) {
        console.error("poll", e);
      }
      scheduleNextPoll();
    }, delay);
  }

  function showApp() {
    $("supaAuthOverlay").style.display = "none";
    var sbBtn = document.getElementById("syncBtn");
    if (sbBtn) sbBtn.style.display = "flex";
    var lb = document.getElementById("profileBtn");
    if (lb) {
      lb.style.display = isGuest ? "none" : "flex";
      updateProfileBtn();
      if (!lb.onclick) {
        lb.onclick = function () {
          if (window.deselectTabs) window.deselectTabs();
          if (window.gotoPage) window.gotoPage("profile");
        };
      }
    }
    var dot = document.getElementById("syncDot");
    if (dot) dot.style.display = "block";
    var sbtn = document.getElementById("syncStatusBtn");
    if (sbtn) sbtn.style.display = "flex";
    var rt = document.getElementById("rtBadge");
    if (rt) rt.style.display = "flex";
    if (isGuest) {
      document.body.classList.add("guest-mode");
      updateRealtimeBadge(false);
    } else {
      initRealtime();
      initPresence();
    }
    updateOnlineStatus();
    startPolling();
    var pmCard = $("playerMgmtCard");
    if (pmCard) pmCard.style.display = isAdmin() ? "" : "none";
    ["tReset", "tEditName", "tEditStart", "importBtn", "clear"].forEach(function (id) {
      var el = $(id);
      if (el) el.style.display = isAdmin() ? "" : "none";
    });
    if (!isGuest) {
      addActivityTab();
    }
  }

  // ===== کاربران آنلاین (Presence) =====
  var presenceChannel = null;
  var onlineUsersList = [];

  function initPresence() {
    if (!curUser || !sb || isGuest) return;
    if (presenceChannel) {
      try {
        sb.removeChannel(presenceChannel);
      } catch (_) {}
      presenceChannel = null;
    }
    try {
      presenceChannel = sb.channel("online-users", {
        config: { presence: { key: curName || curRole || "anon" } },
      });
      presenceChannel
        .on("presence", { event: "sync" }, function () {
          var state = (presenceChannel && presenceChannel.presenceState()) || {};
          var names = [];
          Object.keys(state).forEach(function (k) {
            var metas = state[k];
            if (Array.isArray(metas)) {
              metas.forEach(function (m) {
                if (m && m.name && names.indexOf(m.name) < 0) names.push(m.name);
              });
            }
          });
          onlineUsersList = names;
          renderOnlineUsers();
        })
        .subscribe(function (status) {
          if (status === "SUBSCRIBED") {
            try {
              presenceChannel.track({ name: curName, online_at: Date.now() });
            } catch (_) {}
          }
        });
    } catch (e) {
      console.error("initPresence", e);
    }
  }

  function renderOnlineUsers() {
    var box = document.getElementById("onlineUsers");
    var wrap = document.getElementById("onlineAvatars");
    if (!box || !wrap) return;
    if (!onlineUsersList.length) {
      box.classList.remove("show");
      return;
    }
    var show = onlineUsersList.slice(0, 5);
    var extra = onlineUsersList.length - show.length;
    var html = show
      .map(function (name) {
        var av = typeof window.__avatarHTML === "function" ? window.__avatarHTML(name, 24) : "";
        return '<span class="online-av" title="' + escAct(name) + '">' + av + "</span>";
      })
      .join("");
    if (extra > 0)
      html +=
        '<span class="online-more" title="' +
        escAct(extra + " نفر دیگر آنلاین") +
        '">+' +
        extra.toLocaleString("fa-IR") +
        "</span>";
    wrap.innerHTML = html;
    box.classList.add("show");
  }

  // ===== خودکار کردن کاربر به‌عنوان بازیکن =====
  async function ensurePlayerExists(name) {
    if (!name || typeof name !== "string") return;
    if (isGuest) return;
    var clean = name.trim();
    if (!clean) return;
    // بازیکن‌های بلاک‌شده را هرگز اضافه نکن
    if (isBlocked(clean)) return;
    var storedPlayers = [];
    try {
      storedPlayers = JSON.parse(localStorage.getItem(PKEY) || "[]");
    } catch (_) {}
    if (!Array.isArray(storedPlayers)) storedPlayers = [];
    // پاک‌سازی بازیکن‌های بلاک‌شده از لیست موجود
    storedPlayers = storedPlayers.filter(function (n) {
      return !isBlocked(n);
    });
    if (storedPlayers.indexOf(clean) > -1) {
      try {
        localStorage.setItem(PKEY, JSON.stringify(storedPlayers));
        scheduleLocalPush(PKEY, JSON.stringify(storedPlayers));
      } catch (_) {}
      return;
    }
    storedPlayers.push(clean);
    try {
      localStorage.setItem(PKEY, JSON.stringify(storedPlayers));
      scheduleLocalPush(PKEY, JSON.stringify(storedPlayers));
    } catch (_) {}
    if (window.__reload) window.__reload();
    if (window.renderAll) window.renderAll();
  }

  // ===== پروفایل کاربر =====
  function updateProfileBtn() {
    var b = $("profileBtn");
    if (!b) return;
    b.innerHTML = curName && window.__avatarHTML ? window.__avatarHTML(curName, 38) : "";
  }
  window.__onPlayerRenamed = function (oldName, newName) {
    if (oldName === curName) afterSelfRename(newName);
  };
  function playerStatsSummaryHTML(name) {
    if (!window.__stats || !window.__allPlayerStats) return "";
    var s = window.__stats(name);
    var ranked = window.__allPlayerStats().sort(
      window.__rankingSort ||
        function (a, b) {
          if (b.rate !== a.rate) return b.rate - a.rate;
          if (b.total !== a.total) return b.total - a.total;
          return b.wins - a.wins;
        },
    );
    var rank = 0;
    for (var i = 0; i < ranked.length; i++) {
      if (ranked[i].name === name) {
        rank = i + 1;
        break;
      }
    }
    var nf =
      window.__n ||
      function (x) {
        return String(x);
      };
    var pf =
      window.__percent ||
      function (w, t) {
        return t ? Math.round((w * 100) / t) + "٪" : "۰٪";
      };
    var ef = window.__esc || escAct;
    return [
      ["تعداد بازی", nf(s.games, 0)],
      ["برد", nf(s.wins, 0)],
      ["درصد برد", s.games ? pf(s.wins, s.games) : "—"],
      ["امتیاز کل", nf(s.total, 0)],
      ["رتبه فعلی", rank ? "#" + nf(rank, 0) : "—"],
    ]
      .map(function (x) {
        return '<div class="stat"><span>' + x[0] + "</span><strong>" + ef(x[1]) + "</strong></div>";
      })
      .join("");
  }
  function afterSelfRename(newName) {
    curName = newName;
    try {
      if (presenceChannel) presenceChannel.track({ name: curName, online_at: Date.now() });
    } catch (_) {}
    updateProfileBtn();
    if (!isGuest && curUser && sb) {
      sb.auth
        .updateUser({ data: { display_name: newName } })
        .then(function (r) {
          if (r && r.error) {
            console.error("updateUser display_name", r.error);
            showSyncToast("⚠️ نام روی سرور ذخیره نشد؛ بعد از ورود دوباره ممکنه برگرده", true);
          }
        })
        .catch(function (e) {
          console.error("updateUser display_name", e);
        });
    }
  }
  function renderProfile() {
    if (!curName) return;
    var av = $("profileAvatarBtn");
    if (av && window.__avatarHTML) av.innerHTML = window.__avatarHTML(curName, 80);
    var nd = $("profileNameDisplay");
    if (nd) nd.textContent = curName;
    var ni = $("profileNameInput");
    if (ni && document.activeElement !== ni) ni.value = curName;
    var rm = $("profileAvatarRemove");
    if (rm) rm.style.display = window.__hasAvatar && window.__hasAvatar(curName) ? "inline-flex" : "none";
    var st = $("profileStats");
    if (st) st.innerHTML = playerStatsSummaryHTML(curName);
    buildPasswordForm();
    if (av && !av.dataset.bound) {
      av.dataset.bound = "1";
      av.onclick = function () {
        if (window.__pickAvatar)
          window.__pickAvatar(curName, function () {
            renderProfile();
            updateProfileBtn();
            if (window.fill) window.fill();
            if (window.renderAll) window.renderAll();
            if (window.__message) window.__message("عکس پروفایل به‌روزرسانی شد.");
          });
      };
      $("profileAvatarChange").onclick = function () {
        av.click();
      };
      $("profileAvatarRemove").onclick = function () {
        if (window.__removeAvatar)
          window.__removeAvatar(curName, function () {
            renderProfile();
            updateProfileBtn();
            if (window.fill) window.fill();
            if (window.renderAll) window.renderAll();
            if (window.__message) window.__message("عکس پروفایل حذف شد.");
          });
      };
      $("profileNameSave").onclick = function () {
        var errEl = $("profileNameErr");
        errEl.style.display = "none";
        if (!window.__renameEverywhere) return;
        if (!isAdmin()) {
          errEl.textContent = "تغییر نام فقط از طریق ادمین ممکنه، چون نامت توی بازی‌های بقیه هم ثبت شده.";
          errEl.style.background = "rgba(170,80,75,.15)";
          errEl.style.color = "#f8d8d6";
          errEl.style.border = "1px solid var(--danger)";
          errEl.style.display = "block";
          return;
        }
        var old = curName;
        var r = window.__renameEverywhere(old, $("profileNameInput").value);
        if (!r.ok) {
          errEl.textContent = r.msg;
          errEl.style.background = "rgba(170,80,75,.15)";
          errEl.style.color = "#f8d8d6";
          errEl.style.border = "1px solid var(--danger)";
          errEl.style.display = "block";
          return;
        }
        afterSelfRename(r.newName);
        if (window.fill) window.fill();
        if (window.renderAll) window.renderAll();
        if (window.__message) window.__message("نام نمایشی به‌روزرسانی شد.");
      };
      $("profileLogoutBtn").onclick = function () {
        if (isGuest) {
          location.reload();
          return;
        }
        var _ask = window.__confirm
          ? window.__confirm("از حسابت خارج بشی؟", "خروج")
          : Promise.resolve(confirm("از حسابت خارج بشی؟"));
        _ask.then(function (ok) {
          if (ok)
            sb.auth.signOut().then(function () {
              location.reload();
            });
        });
      };
    }
  }
  window.__renderProfile = renderProfile;
  // ===== تغییر رمز عبور (داخل پروفایل) =====
  function buildPasswordForm() {
    var box = $("profilePasswordFormBox");
    if (!box || box.dataset.built) return;
    box.dataset.built = "1";
    box.innerHTML =
      "<label>🔒 رمز فعلی" +
      '<div style="position:relative"><input id="pwdCur" type="password" placeholder="رمز فعلی" autocomplete="current-password">' +
      '<button type="button" class="pwd-eye" data-target="pwdCur">👁️</button></div></label>' +
      "<label>🔑 رمز جدید" +
      '<div style="position:relative"><input id="pwdNew" type="password" placeholder="حداقل ۶ کاراکتر" autocomplete="new-password">' +
      '<button type="button" class="pwd-eye" data-target="pwdNew">👁️</button></div></label>' +
      "<label>🔑 تکرار رمز جدید" +
      '<div style="position:relative"><input id="pwdNew2" type="password" placeholder="دوباره وارد کن" autocomplete="new-password">' +
      '<button type="button" class="pwd-eye" data-target="pwdNew2">👁️</button></div></label>' +
      '<div id="pwdErr" style="display:none;padding:9px 12px;border-radius:10px;font-size:.83rem;margin:6px 0"></div>' +
      '<div class="actions"><button id="pwdSave" class="btn success">🔒 تغییر رمز</button></div>';

    [].forEach.call(box.querySelectorAll(".pwd-eye"), function (b) {
      b.onclick = function () {
        var inp = $(b.dataset.target);
        if (!inp) return;
        var show = inp.type === "password";
        inp.type = show ? "text" : "password";
        b.textContent = show ? "🙈" : "👁️";
      };
    });

    $("pwdSave").onclick = async function () {
      var errEl = $("pwdErr");
      var cur = $("pwdCur").value;
      var nw = $("pwdNew").value;
      var nw2 = $("pwdNew2").value;
      errEl.style.display = "none";
      function showErr(msg) {
        errEl.textContent = msg;
        errEl.style.background = "rgba(170,80,75,.15)";
        errEl.style.color = "#f8d8d6";
        errEl.style.border = "1px solid var(--danger)";
        errEl.style.display = "block";
      }
      function showOk(msg) {
        errEl.textContent = msg;
        errEl.style.background = "rgba(84,139,103,.15)";
        errEl.style.color = "#d8f0e0";
        errEl.style.border = "1px solid var(--success)";
        errEl.style.display = "block";
      }
      if (!cur) {
        return showErr("رمز فعلی رو وارد کن");
      }
      if (nw.length < 6) {
        return showErr("رمز جدید باید حداقل ۶ کاراکتر باشه");
      }
      if (nw !== nw2) {
        return showErr("دو رمز جدید یکسان نیستن");
      }
      if (cur === nw) {
        return showErr("رمز جدید نباید با رمز فعلی یکی باشه");
      }

      var btn = $("pwdSave");
      btn.disabled = true;
      btn.textContent = "⏳ در حال بررسی...";

      var verify = await withTimeout(
        sb.auth.signInWithPassword({ email: fakeEmail(curRole), password: cur }),
        NET_TIMEOUT,
        "pwd-verify",
      );
      if (verify.error) {
        btn.disabled = false;
        btn.textContent = "🔒 تغییر رمز";
        return showErr("رمز فعلی اشتباهه");
      }

      btn.textContent = "⏳ در حال تغییر...";
      var upd = await withTimeout(sb.auth.updateUser({ password: nw }), NET_TIMEOUT, "pwd-update");
      btn.disabled = false;
      btn.textContent = "🔒 تغییر رمز";
      if (upd.error) {
        return showErr("تغییر رمز ناموفق بود: " + upd.error.message);
      }

      try {
        await withTimeout(logAct("edit", { info: "رمز عبور تغییر کرد" }), NET_TIMEOUT, "pwd-log");
      } catch (_) {}
      showOk("✅ رمز با موفقیت تغییر کرد. تا چند لحظه دیگه از حساب خارج می‌شی...");
      setTimeout(function () {
        sb.auth.signOut().then(function () {
          location.reload();
        });
      }, 1800);
    };
  }

  window.isAdmin = function () {
    return isAdmin();
  };
  function showLogin() {
    $("supaAuthOverlay").style.display = "flex";
  }

  function isAdmin() {
    if (!curUser) return false;
    if (curUser.app_metadata && curUser.app_metadata.role === "admin") return true;
    return false;
  }
  function addActivityTab() {
    if (!isAdmin()) return;
    var settingsPage = $("settings");
    if (!settingsPage) return;
    if ($("activityCard")) return;
    var card = document.createElement("div");
    card.className = "card collapsible";
    card.id = "activityCard";
    card.innerHTML =
      '<button type="button" class="collapse-header" data-target="activityBody" aria-expanded="false"><span class="collapse-title">📋 فعالیت کاربران</span><span class="collapse-arrow">▼</span></button><div class="collapse-body" id="activityBody"><div id="activityList" style="max-height:400px;overflow:auto">در حال بارگذاری...</div></div>';
    settingsPage.appendChild(card);
    var header = card.querySelector(".collapse-header");
    var body = $("activityBody");
    var loaded = false;
    header.onclick = function () {
      var open = !body.classList.contains("open");
      body.classList.toggle("open", open);
      header.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && !loaded) {
        loaded = true;
        loadActivities();
      }
    };
  }

  function escAct(x) {
    if (window.__esc) return window.__esc(x);
    return String(x == null ? "" : x).replace(/[&<>'"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c];
    });
  }
  function dayKey(d) {
    return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  }
  async function loadActivities() {
    try {
      var r = await sb.from("activity_log").select("*").order("created_at", { ascending: false }).limit(50);
      var el = $("activityList");
      if (!el) return;
      if (!r.data || !r.data.length) {
        el.innerHTML = '<p class="muted">هنوز فعالیتی ثبت نشده.</p>';
        return;
      }
      var badges = {
        add: { label: "➕ ثبت", color: "#548b67" },
        edit: { label: "✏️ ویرایش", color: "#d4af37" },
        del: { label: "🗑️ حذف", color: "#aa504b" },
        login: { label: "🔑 ورود", color: "#4a7ab8" },
        signup: { label: "🆕 ثبت‌نام", color: "#4a7ab8" },
      };
      var today = dayKey(new Date()),
        yest = dayKey(new Date(Date.now() - 86400000));
      var lastGroup = null,
        html = "";
      r.data.forEach(function (x) {
        var dt = new Date(x.created_at);
        var g = dayKey(dt);
        if (g !== lastGroup) {
          var label = g === today ? "امروز" : g === yest ? "دیروز" : dt.toLocaleDateString("fa-IR");
          html +=
            '<div class="muted" style="font-size:.72rem;font-weight:700;margin:' +
            (lastGroup ? "12px" : "0") +
            ' 0 6px;padding-bottom:4px;border-bottom:1px dashed var(--soft)">' +
            escAct(label) +
            "</div>";
          lastGroup = g;
        }
        var b = badges[x.action] || { label: "📌 " + escAct(x.action), color: "#8a987a" };
        var time = dt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
        html +=
          '<div class="game" style="padding:9px 12px;margin-bottom:6px;font-size:.83rem;overflow:hidden">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          "<span><strong>" +
          escAct(x.user_name) +
          '</strong> <span style="display:inline-block;padding:1px 8px;border-radius:99px;color:#fff;font-size:.7rem;font-weight:700;background:' +
          b.color +
          '">' +
          b.label +
          "</span></span>" +
          '<span class="muted" style="font-size:.72rem">' +
          escAct(time) +
          "</span>" +
          "</div>" +
          (x.details && x.details.info
            ? '<div class="muted" style="margin-top:4px;font-size:.78rem">' + escAct(x.details.info) + "</div>"
            : "") +
          "</div>";
      });
      el.innerHTML = html;
    } catch (e) {
      $("activityList") && ($("activityList").innerHTML = '<p class="muted">خطا در بارگذاری</p>');
    }
  }

  ["supaUser", "supaPass"].forEach(function (fid) {
    var fel = $(fid);
    if (fel)
      fel.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          $("supaLogin").click();
        }
      });
  });
  $("supaLogin").onclick = async function () {
    var u = normDigits($("supaUser").value).trim().toLowerCase(),
      p = $("supaPass").value;
    $("supaErr").style.display = "none";
    if (!u || p.length < 6)
      return ($("supaErr").textContent = "اسم و رمز (حداقل ۶) رو وارد کن"), ($("supaErr").style.display = "block");
    $("supaLogin").disabled = true;
    showLoading();
    var r;
    try {
      r = await withTimeout(sb.auth.signInWithPassword({ email: fakeEmail(u), password: p }), NET_TIMEOUT, "login");
    } catch (e) {
      r = { error: e };
    }
    $("supaLogin").disabled = false;
    if (r.error) {
      hideLoading();
      $("supaErr").textContent =
        r.error && r.error.isTimeout
          ? "اتصال به سرور طول کشید. اینترنتت را بررسی کن."
          : "اتصال به سرور یا ورود ناموفق بود. دوباره تلاش کن.";
      $("supaErr").style.display = "block";
      return;
    }
    curUser = r.data.user;
    curRole = u;
    var meta = (r.data.user && r.data.user.user_metadata) || {};
    curName = meta.display_name || NAME_MAP[u] || u;
    try {
      await withTimeout(logAct("login", { info: "ورود به برنامه" }), NET_TIMEOUT, "login-log");
    } catch (_) {}
    try {
      await withTimeout(pull(), NET_TIMEOUT, "login-pull");
    } catch (_) {}
    try {
      await withTimeout(ensurePlayerExists(curName), NET_TIMEOUT, "login-ensure");
    } catch (_) {}
    hideLoading();
    showApp();
    if (window.renderAll) window.renderAll();
  };

  async function liveSync() {
    if (document.hidden) return;
    if (!curUser && !isGuest) return;
    try {
      var changed = await withTimeout(pull({ light: true }), NET_TIMEOUT, "live-pull");
      if (changed) {
        if (window.__reload) window.__reload();
        if (window.renderAll) window.renderAll();
      }
    } catch (e) {
      console.error("liveSync", e);
    }
  }

  /* یک بار برای همه‌ی حالت‌ها (ورود تازه، سشن قبلی، مهمان) */
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      liveSync();
      if (!realtimeConnected && curUser) {
        clearTimeout(_realtimeRetryTimer);
        _realtimeRetryTimer = setTimeout(function () {
          initRealtime();
        }, 1000);
      }
    }
  });

  sb.auth
    .getSession()
    .then(function (r) {
      if (r.data.session) {
        curUser = r.data.session.user;
        var em = (r.data.session.user.email || "").split("@")[0];
        curRole = em;
        var meta = r.data.session.user.user_metadata || {};
        curName = meta.display_name || NAME_MAP[em] || em;
        showLoading();
        /* نقش ادمین (app_metadata) رو از سرور تازه بگیر؛ سشن ذخیره‌شده ممکنه قدیمی باشه */
        withTimeout(sb.auth.getUser(), NET_TIMEOUT, "session-user")
          .then(function (u) {
            if (u && u.data && u.data.user) curUser = u.data.user;
          })
          .catch(function (e) {
            console.error("getUser", e);
          })
          .then(function () {
            return withTimeout(pull(), NET_TIMEOUT, "session-pull");
          })
          .catch(function (e) {
            console.error("session pull", e);
          })
          .then(async function () {
            try {
              await ensurePlayerExists(curName);
            } catch (e) {
              console.error("ensurePlayerExists", e);
            }
            hideLoading();
            showApp();
            if (window.renderAll) window.renderAll();
          });
      } else {
        showLogin();
      }
    })
    .catch(function (e) {
      console.error("getSession", e);
      hideLoading();
      showLogin();
      var err = document.getElementById("supaErr");
      if (err) {
        err.textContent = "اتصال به سرویس ورود برقرار نشد.";
        err.style.display = "block";
      }
    });
})();
