// hon.ey landing - language switch, copy buttons, screenshot lightbox. Vanilla, no deps.
(function () {
  'use strict';

  var LANG_KEY = 'honey-lang';
  var docLang = document.documentElement.lang || 'en';

  // 1. Auto-pick language on the English (root) page only, once, if no saved choice.
  function pickLanguage() {
    if (docLang !== 'en') return;
    try {
      if (localStorage.getItem(LANG_KEY)) return;
    } catch (e) { return; }
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.indexOf('de') === 0) {
      location.replace('de/');
    }
  }

  // 2. Remember the chosen language when a switcher link is clicked.
  function wireLangSwitch() {
    var links = document.querySelectorAll('.lang-switch a[data-lang]');
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function () {
        try { localStorage.setItem(LANG_KEY, a.getAttribute('data-lang')); } catch (e) {}
      });
    });
  }

  // 3. Copy-to-clipboard buttons.
  function wireCopyButtons() {
    var btns = document.querySelectorAll('[data-copy]');
    Array.prototype.forEach.call(btns, function (btn) {
      var original = btn.innerHTML;
      var copied = btn.getAttribute('data-copied') || 'Copied';
      btn.addEventListener('click', function () {
        var target = document.querySelector(btn.getAttribute('data-copy'));
        if (!target) return;
        var text = target.innerText || target.textContent || '';
        var done = function () {
          btn.textContent = copied;
          setTimeout(function () { btn.innerHTML = original; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          done();
        }
      });
    });
  }

  // 4. Screenshot lightbox.
  function wireLightbox() {
    var box = document.getElementById('lightbox');
    if (!box) return;
    var img = box.querySelector('img');
    var closeBtn = box.querySelector('.close');

    function open(src, alt) {
      img.src = src;
      img.alt = alt || '';
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('open');
      document.body.style.overflow = '';
      img.src = '';
    }

    var triggers = document.querySelectorAll('[data-shot]');
    Array.prototype.forEach.call(triggers, function (t) {
      t.addEventListener('click', function () {
        var inner = t.querySelector('img');
        open(t.getAttribute('data-shot'), inner ? inner.alt : '');
      });
    });
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('open')) close();
    });
  }

  pickLanguage();
  wireLangSwitch();
  wireCopyButtons();
  wireLightbox();
})();
