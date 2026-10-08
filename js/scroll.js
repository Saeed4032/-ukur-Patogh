(function () {
  var lastY = 0,
    threshold = 80,
    ticking = false;
  function check() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var goingDown = y > lastY;
    if (y > threshold && goingDown) {
      document.body.classList.add("hide-actions");
    } else if (!goingDown || y <= threshold) {
      document.body.classList.remove("hide-actions");
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(check);
        ticking = true;
      }
    },
    { passive: true },
  );
})();
