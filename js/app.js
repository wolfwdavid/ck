(function () {
  'use strict';

  var state = {
    screens: [],
    assets: {},
    index: 0,
  };

  var el = {
    app: document.getElementById('app'),
    progressFill: document.getElementById('progress-fill'),
    pageCounter: document.getElementById('page-counter'),
    zonePrev: document.getElementById('zone-prev'),
    zoneNext: document.getElementById('zone-next'),
    menuToggle: document.getElementById('menu-toggle'),
    jumpMenu: document.getElementById('jump-menu'),
    jumpMenuBody: document.getElementById('jump-menu-body'),
    jumpMenuClose: document.getElementById('jump-menu-close'),
  };

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function anchorFor(screen) {
    var c = screen.content || {};
    var pp = Array.isArray(screen.physicalPage) ? screen.physicalPage[0] : screen.physicalPage;
    if (screen.type === 'pantry-letter' && c.letter) return 'pantry-' + c.letter.toLowerCase();
    if (screen.type === 'divider' && c.title) return slugify(c.title);
    // Recipes often span multiple physical pages with the same title (e.g. "Milk" on pp.23-24) —
    // the page number keeps each screen's anchor unique so direct links/back-forward still work.
    if (screen.type === 'recipe' && c.title) return 'recipe-' + slugify(c.title) + '-' + pp;
    return 'p' + pp;
  }

  function labelFor(screen) {
    var c = screen.content || {};
    return c.title || c.letter || c.heading || c.item ||
      (screen.printedPage ? 'Page ' + screen.printedPage : 'Screen ' + (screen.physicalPage || ''));
  }

  function footerLabel(screen) {
    if (screen.printedPage) return screen.printedPage;
    var pp = Array.isArray(screen.physicalPage) ? screen.physicalPage.join('–') : screen.physicalPage;
    return pp != null ? String(pp) : '';
  }

  function buildScreen(screen) {
    var wrap = document.createElement('div');
    wrap.className = 'screen screen--' + screen.type;
    wrap.id = 'screen-' + anchorFor(screen);

    var inner = document.createElement('div');
    inner.className = 'screen__inner';

    if (screen.section && screen.type !== 'cover' && screen.type !== 'divider') {
      var label = document.createElement('p');
      label.className = 'screen__section-label';
      label.textContent = screen.section;
      inner.appendChild(label);
    }

    var content = document.createElement('div');
    content.innerHTML = window.FlipbookTemplates.render(screen, state.assets);
    inner.appendChild(content);

    wrap.appendChild(inner);

    var footText = footerLabel(screen);
    if (footText) {
      var foot = document.createElement('div');
      foot.className = 'screen__footer';
      foot.textContent = footText;
      wrap.appendChild(foot);
    }

    return wrap;
  }

  function hydrateWorksheet(wrapEl, screen) {
    if (screen.type !== 'worksheet') return;
    var STORAGE_KEY = 'vnv-worksheet-answers';
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { /* storage unavailable (private mode etc) — ignore */ }

    var note = wrapEl.querySelector('[data-worksheet-note]');
    var timer = null;

    wrapEl.querySelectorAll('[data-worksheet-key]').forEach(function (ta) {
      var key = ta.getAttribute('data-worksheet-key');
      if (saved[key]) ta.value = saved[key];
      ta.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          try {
            var current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            current[key] = ta.value;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
            if (note) note.textContent = 'Saved on this device';
          } catch (e) { /* ignore */ }
        }, 400);
      });
    });
  }

  function render(index, direction) {
    index = Math.max(0, Math.min(state.screens.length - 1, index));
    var screen = state.screens[index];
    var wrap = buildScreen(screen);

    if (direction) {
      wrap.style.transition = 'none';
      wrap.style.transform = 'translateX(' + (direction === 'next' ? '35%' : '-35%') + ')';
      wrap.style.opacity = '0';
    }

    el.app.innerHTML = '';
    el.app.appendChild(wrap);
    hydrateWorksheet(wrap, screen);

    if (direction) {
      // force reflow so the transition actually plays
      // eslint-disable-next-line no-unused-expressions
      wrap.offsetWidth;
      wrap.style.transition = '';
      wrap.style.transform = 'translateX(0)';
      wrap.style.opacity = '1';
    }

    state.index = index;
    updateChrome();
    updateHash(screen, false);
  }

  function updateChrome() {
    var total = state.screens.length;
    var pct = total > 1 ? (state.index / (total - 1)) * 100 : 0;
    el.progressFill.style.width = pct + '%';
    el.pageCounter.textContent = (state.index + 1) + ' / ' + total;
    el.zonePrev.setAttribute('aria-hidden', state.index === 0 ? 'true' : 'false');
    el.zoneNext.setAttribute('aria-hidden', state.index === total - 1 ? 'true' : 'false');
    highlightJumpMenu();
  }

  function updateHash(screen, push) {
    var hash = '#' + anchorFor(screen);
    if (window.location.hash === hash) return;
    if (push) {
      window.location.hash = hash;
    } else if (history.replaceState) {
      history.replaceState(null, '', hash);
    }
  }

  function goTo(index, opts) {
    opts = opts || {};
    if (index === state.index) return;
    var direction = index > state.index ? 'next' : 'prev';
    render(index, direction);
    if (opts.push) updateHash(state.screens[index], true);
    if (opts.closeMenu) closeJumpMenu();
  }

  function next() { if (state.index < state.screens.length - 1) goTo(state.index + 1); }
  function prev() { if (state.index > 0) goTo(state.index - 1); }

  function indexForAnchor(anchor) {
    for (var i = 0; i < state.screens.length; i++) {
      if (anchorFor(state.screens[i]) === anchor) return i;
    }
    return -1;
  }

  /* ---------- jump menu ---------- */
  function buildJumpMenu() {
    var sections = [];
    var bySection = {};
    state.screens.forEach(function (screen, i) {
      var key = screen.section || 'Other';
      if (!bySection[key]) {
        bySection[key] = [];
        sections.push(key);
      }
      // keep the jump menu scannable: one entry per recipe/pantry-letter/divider/standalone page,
      // skip essay/quote/photo continuation pages that share a section with a more specific entry
      var showTypes = ['recipe', 'pantry-letter', 'divider', 'worksheet', 'bio', 'table', 'link-list', 'cover', 'closing'];
      if (showTypes.indexOf(screen.type) === -1 && bySection[key].length > 0) return;
      var label = labelFor(screen);
      var list = bySection[key];
      var last = list[list.length - 1];
      // a recipe/table/etc. that continues onto another physical page repeats the same label —
      // keep only the first screen as the jump target, the rest are reached by swiping forward
      if (last && last.label === label) return;
      list.push({ index: i, label: label });
    });

    el.jumpMenuBody.innerHTML = '';
    sections.forEach(function (key) {
      var sec = document.createElement('div');
      sec.className = 'jump-section';
      var title = document.createElement('h3');
      title.className = 'jump-section__title';
      title.textContent = key;
      sec.appendChild(title);

      var list = document.createElement('ul');
      list.className = 'jump-section__list';
      bySection[key].forEach(function (item) {
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = item.label;
        btn.dataset.index = item.index;
        btn.addEventListener('click', function () {
          goTo(item.index, { push: true, closeMenu: true });
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
      sec.appendChild(list);
      el.jumpMenuBody.appendChild(sec);
    });
  }

  function highlightJumpMenu() {
    el.jumpMenuBody.querySelectorAll('button[data-index]').forEach(function (btn) {
      btn.setAttribute('aria-current', String(Number(btn.dataset.index) === state.index));
    });
  }

  function openJumpMenu() {
    el.jumpMenu.hidden = false;
    el.menuToggle.setAttribute('aria-expanded', 'true');
  }
  function closeJumpMenu() {
    el.jumpMenu.hidden = true;
    el.menuToggle.setAttribute('aria-expanded', 'false');
  }

  /* ---------- input handling ---------- */
  function bindInput() {
    el.zonePrev.addEventListener('click', prev);
    el.zoneNext.addEventListener('click', next);
    el.menuToggle.addEventListener('click', function () {
      el.jumpMenu.hidden ? openJumpMenu() : closeJumpMenu();
    });
    el.jumpMenuClose.addEventListener('click', closeJumpMenu);

    document.addEventListener('keydown', function (e) {
      if (!el.jumpMenu.hidden) {
        if (e.key === 'Escape') closeJumpMenu();
        return;
      }
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') { /* no-op, nothing to close */ }
    });

    var touchStartX = null, touchStartY = null;
    el.app.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }, { passive: true });

    el.app.addEventListener('touchend', function (e) {
      if (touchStartX == null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - touchStartX;
      var dy = t.clientY - touchStartY;
      touchStartX = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return; // not a horizontal swipe
      if (dx < 0) next(); else prev();
    }, { passive: true });

    window.addEventListener('hashchange', function () {
      var anchor = window.location.hash.replace(/^#/, '');
      if (!anchor) return;
      var idx = indexForAnchor(anchor);
      if (idx !== -1 && idx !== state.index) render(idx, idx > state.index ? 'next' : 'prev');
    });
  }

  /* ---------- boot ---------- */
  function boot(content, assets) {
    state.screens = content;
    state.assets = assets;

    buildJumpMenu();
    bindInput();

    var startAnchor = window.location.hash.replace(/^#/, '');
    var startIndex = startAnchor ? indexForAnchor(startAnchor) : 0;
    if (startIndex === -1) startIndex = 0;
    render(startIndex, null);
  }

  Promise.all([
    fetch('data/content.json').then(function (r) { return r.json(); }),
    fetch('data/assets.json').then(function (r) { return r.json(); })
  ]).then(function (results) {
    boot(results[0], results[1]);
  }).catch(function (err) {
    el.app.innerHTML = '<div class="screen"><div class="screen__inner"><p class="body-text">Could not load the book content: ' + String(err) + '</p></div></div>';
  });
})();
