document.querySelectorAll('.logo img').forEach(img => {
	img.addEventListener('click', function (e) {
		e.preventDefault(); // Prevent immediate navigation
		img.classList.add('spin-on-click');
		setTimeout(() => {
		window.location.href = img.closest('a').href;
		}, 600); // match animation duration
	});
});

// animations.js

(function () {
  let blinkInterval = null;

  window.startBlinkingExpiredMessage = function () {
    const el = document.getElementById('sellCountdown');
    if (!el) return;

    if (blinkInterval) clearInterval(blinkInterval); // Prevent multiple intervals

    blinkInterval = setInterval(() => {
      el.style.visibility = (el.style.visibility === 'hidden') ? 'visible' : 'hidden';
    }, 600);
  };

  window.stopBlinkingExpiredMessage = function () {
    const el = document.getElementById('sellCountdown');
    if (!el) return;

    clearInterval(blinkInterval);
    blinkInterval = null;
    el.style.visibility = 'visible';
  };
})();

