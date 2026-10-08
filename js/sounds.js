(function () {
  var audio = null;

  function ctx() {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audio;
  }

  function tone(freq, duration, type, volume) {
    try {
      var c = ctx();
      var oscillator = c.createOscillator();
      var gain = c.createGain();

      oscillator.type = type || "sine";
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(volume || 0.12, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      oscillator.connect(gain);
      gain.connect(c.destination);
      oscillator.start();
      oscillator.stop(c.currentTime + duration);
    } catch (e) {}
  }

  function winSound() {
    tone(523, 0.08, "sine", 0.18);
    setTimeout(function () {
      tone(659, 0.08, "sine", 0.18);
    }, 80);
    setTimeout(function () {
      tone(784, 0.16, "sine", 0.2);
    }, 160);
  }

  function deleteSound() {
    tone(330, 0.12, "triangle", 0.14);
    setTimeout(function () {
      tone(220, 0.18, "triangle", 0.12);
    }, 100);
  }

  function errorSound() {
    tone(200, 0.14, "square", 0.09);
    setTimeout(function () {
      tone(180, 0.18, "square", 0.07);
    }, 120);
  }

  var toast = document.getElementById("toast");

  if (toast && window.MutationObserver) {
    var lastText = "";

    new MutationObserver(function () {
      var text = toast.innerText || "";
      if (!text || text === lastText) return;
      lastText = text;

      if (text.indexOf("ثبت شد") !== -1) winSound();
      else if (text.indexOf("حذف شد") !== -1) deleteSound();
      else if (toast.classList.contains("bad") || text.indexOf("خطا") !== -1 || text.indexOf("ناموفق") !== -1)
        errorSound();
    }).observe(toast, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
})();
