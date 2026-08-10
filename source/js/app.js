(function () {
  'use strict';

  function switchSidebarTab(e) {
    e.preventDefault();
    var self = e.currentTarget;
    var target = self.getAttribute('data-toggle');
    var counterTarget = target === 'toc' ? 'bio' : 'toc';
    if (self.classList.contains('active')) return;

    var sibling = self.parentNode.querySelector('.dark-btn.active');
    self.classList.add('active');
    if (sibling && sibling !== self) sibling.classList.remove('active');

    var hideEl = document.querySelector('.site-' + counterTarget);
    var showEl = document.querySelector('.site-' + target);
    if (hideEl) hideEl.classList.remove('show');

    setTimeout(function () {
      if (hideEl) hideEl.style.display = 'none';
      if (showEl) showEl.style.display = 'block';
      setTimeout(function () {
        if (showEl) showEl.classList.add('show');
      }, 50);
    }, 240);
  }

  function scrolltoElement(e) {
    e.preventDefault();
    var href = e.currentTarget.getAttribute('href');
    if (!href) return;
    var target = document.querySelector(decodeURI(href));
    if (!target) return;
    var correction = (e.data && e.data.correction) || 0;
    var top = target.getBoundingClientRect().top + window.pageYOffset - correction;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function openBio(e) {
    e.preventDefault();
    document.body.classList.add('bio-open');
    var btn = document.querySelector('.site-nav-switch');
    if (btn) btn.classList.add('active');
  }

  function closeBio(e) {
    e.preventDefault();
    document.body.classList.remove('bio-open');
    var btn = document.querySelector('.site-nav-switch');
    if (btn) btn.classList.remove('active');
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function () {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function initSearchLazy() {
    if (!window.__SEARCH_CONFIG__ || !window.__SEARCH_CONFIG__.enable) return;

    var loading = null;
    var instance = null;

    function ensureSearch() {
      if (instance) return Promise.resolve(instance);
      if (loading) return loading;
      loading = loadScript(window.__SEARCH_CONFIG__.scriptUrl).then(function () {
        if (typeof window.createAzureSearch !== 'function') {
          throw new Error('Search module missing');
        }
        instance = window.createAzureSearch({
          serviceName: window.__SEARCH_CONFIG__.azureServiceName,
          indexName: window.__SEARCH_CONFIG__.azureIndexName,
          queryKey: window.__SEARCH_CONFIG__.azureQueryKey
        });
        return instance;
      });
      return loading;
    }

    document.addEventListener('submit', function (e) {
      var form = e.target && e.target.closest ? e.target.closest('.u-search-form') : null;
      if (!form) return;
      e.preventDefault();
      var input = form.querySelector('.u-search-input');
      var queryText = input ? input.value : '';
      ensureSearch().then(function (search) {
        search.queryText = queryText;
        search.search(1);
      }).catch(function (err) {
        console.error(err);
      });
    });
  }

  function initThemeToggle() {
    var STORAGE_KEY = 'rainylog-theme';
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    function currentTheme() {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function applyTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}
      toggle.setAttribute(
        'aria-label',
        theme === 'dark' ? '切换浅色模式' : '切换深色模式'
      );
      toggle.setAttribute(
        'title',
        theme === 'dark' ? '切换浅色模式' : '切换深色模式'
      );
    }

    applyTheme(currentTheme());

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    ['.post-list', '#footer', '#page-nav'].forEach(function (sel) {
      var node = document.querySelector(sel);
      if (node) node.classList.add('show');
    });

    var navSwitch = document.querySelector('.site-nav-switch');
    if (navSwitch) navSwitch.addEventListener('click', openBio);

    var overlay = document.querySelector('.site-wrapper .overlay');
    if (overlay) overlay.addEventListener('click', closeBio);

    document.querySelectorAll('.window-nav, .go-comment, .site-toc a').forEach(function (el) {
      el.addEventListener('click', scrolltoElement);
    });

    document.querySelectorAll('.sidebar-switch .dark-btn').forEach(function (el) {
      el.addEventListener('click', switchSidebarTab);
    });

    var loadingBar = document.getElementById('loading-bar-wrapper');
    if (loadingBar) {
      setTimeout(function () {
        loadingBar.style.opacity = '0';
        loadingBar.style.transition = 'opacity 0.5s ease';
        setTimeout(function () {
          loadingBar.style.display = 'none';
        }, 500);
      }, 300);
    }

    initThemeToggle();
    initSearchLazy();
  });

  function upgradeAvatar() {
    var img = document.querySelector('.avatar img[data-full-src]');
    if (!img) return;

    var fullSrc = img.getAttribute('data-full-src');
    if (!fullSrc || img.getAttribute('src') === fullSrc) return;

    var preload = new Image();
    preload.onload = function () {
      var picture = img.closest('picture');
      if (picture) {
        Array.prototype.slice.call(picture.querySelectorAll('source')).forEach(function (source) {
          source.parentNode.removeChild(source);
        });
      }
      img.src = fullSrc;
      img.removeAttribute('srcset');
      img.classList.remove('is-placeholder');
      img.classList.add('is-full');
      img.removeAttribute('data-full-src');
    };
    preload.onerror = function () {
      img.classList.remove('is-placeholder');
      img.classList.add('is-full');
    };
    preload.src = fullSrc;
  }

  if (document.readyState === 'complete') {
    upgradeAvatar();
  } else {
    window.addEventListener('load', upgradeAvatar);
  }
})();
