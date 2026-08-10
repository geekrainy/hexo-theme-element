(function (global) {
  'use strict';

  var TEMPLATE = '<div id="u-search"><div class="modal"> <header class="modal-header clearfix"><form id="u-search-modal-form" class="u-search-form" name="uSearchModalForm"> <input type="text" id="u-search-modal-input" class="u-search-input" /> <button type="submit" id="u-search-modal-btn-submit" class="u-search-btn-submit"> <span class="icon icon-search"></span> </button></form> <a class="btn-close"> <span class="icon icon-close"></span> </a><div class="modal-loading"><div class="modal-loading-bar"></div></div> </header> <main class="modal-body"><ul class="modal-results modal-ajax-content"></ul> </main> <footer class="modal-footer clearfix"><div class="modal-metadata modal-ajax-content"> <strong class="range"></strong> of <strong class="total"></strong></div><div class="modal-error"></div> <div class="logo"></div> <a class="nav btn-next modal-ajax-content"> <span class="text">NEXT</span> <span class="icon icon-chevron-right"></span> </a> <a class="nav btn-prev modal-ajax-content"> <span class="icon icon-chevron-left"></span> <span class="text">PREV</span> </a> </footer></div><div class="modal-overlay"></div></div>';

  function qs(root, selector) {
    return (root || document).querySelector(selector);
  }

  function qsa(root, selector) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function show(el) {
    if (el) el.style.display = '';
  }

  function hide(el) {
    if (el) el.style.display = 'none';
  }

  function setHtml(el, html) {
    if (el) el.innerHTML = html;
  }

  function SearchService(options) {
    var self = this;
    self.config = Object.assign({
      per_page: 10,
      selectors: {
        body: 'body',
        form: '.u-search-form',
        input: '.u-search-input',
        container: '#u-search',
        modal: '#u-search .modal',
        modal_body: '#u-search .modal-body',
        modal_footer: '#u-search .modal-footer',
        modal_overlay: '#u-search .modal-overlay',
        modal_results: '#u-search .modal-results',
        modal_metadata: '#u-search .modal-metadata',
        modal_error: '#u-search .modal-error',
        modal_loading_bar: '#u-search .modal-loading-bar',
        modal_ajax_content: '#u-search .modal-ajax-content',
        modal_logo: '#u-search .modal-footer .logo',
        btn_close: '#u-search .btn-close',
        btn_next: '#u-search .btn-next',
        btn_prev: '#u-search .btn-prev'
      },
      brands: {
        azure: {
          logo: '/img/azure.svg',
          url: 'https://azure.microsoft.com/en-us/services/search/'
        }
      }
    }, options || {});

    self.dom = {};
    self.percentLoaded = 0;
    self.open = false;
    self.queryText = '';
    self.nav = { next: -1, prev: -1, total: 0, current: 1 };
    self.loadingTimer = null;

    self.parseSelectors = function () {
      Object.keys(self.config.selectors).forEach(function (key) {
        self.dom[key] = qs(document, self.config.selectors[key]);
      });
      self.dom.forms = qsa(document, self.config.selectors.form);
      self.dom.inputs = qsa(document, self.config.selectors.input);
      self.dom.modal_ajax_contents = qsa(document, self.config.selectors.modal_ajax_content);
    };

    self.beforeQuery = function () {
      if (!self.open) {
        if (self.dom.container) self.dom.container.style.display = 'block';
        document.body.classList.add('modal-active');
        self.open = true;
      }
      self.dom.inputs.forEach(function (input) {
        input.value = self.queryText;
      });
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      hide(self.dom.modal_error);
      self.dom.modal_ajax_contents.forEach(function (el) {
        el.classList.remove('loaded');
      });
      self.startLoading();
    };

    self.afterQuery = function () {
      if (self.dom.modal_body) self.dom.modal_body.scrollTop = 0;
      self.dom.modal_ajax_contents.forEach(function (el) {
        el.classList.add('loaded');
      });
      self.stopLoading();
    };

    self.search = function (startIndex) {
      self.beforeQuery();
      if (typeof self.query === 'function') {
        self.query(self.queryText, startIndex, function () {
          self.afterQuery();
        });
      } else {
        self.onQueryError(self.queryText, '');
        self.afterQuery();
      }
    };

    self.onQueryError = function (queryText, status) {
      var errMsg = 'Mysterious failure.';
      if (status === 'success') errMsg = 'No result found for "' + queryText + '".';
      else if (status === 'timeout') errMsg = 'Unfortunate timeout.';
      setHtml(self.dom.modal_results, '');
      setHtml(self.dom.modal_error, errMsg);
      show(self.dom.modal_error);
    };

    self.nextPage = function () {
      if (self.nav.next !== -1) self.search(self.nav.next);
    };

    self.prevPage = function () {
      if (self.nav.prev !== -1) self.search(self.nav.prev);
    };

    self.buildResult = function (url, title, digest) {
      return (
        '<li>' +
          '<a class="result" href="' + url + '">' +
            '<span class="title">' + title + '</span>' +
            '<span class="digest">' + digest + '</span>' +
            '<span class="icon icon-chevron-thin-right"></span>' +
          '</a>' +
        '</li>'
      );
    };

    self.close = function () {
      self.open = false;
      if (self.dom.container) self.dom.container.style.display = 'none';
      document.body.classList.remove('modal-active');
    };

    self.onSubmit = function (event) {
      event.preventDefault();
      var input = event.currentTarget.querySelector('.u-search-input');
      self.queryText = input ? input.value : '';
      self.search(1);
    };

    self.startLoading = function () {
      show(self.dom.modal_loading_bar);
      self.loadingTimer = setInterval(function () {
        self.percentLoaded = Math.min(self.percentLoaded + 5, 95);
        if (self.dom.modal_loading_bar) {
          self.dom.modal_loading_bar.style.width = self.percentLoaded + '%';
        }
      }, 100);
    };

    self.stopLoading = function () {
      clearInterval(self.loadingTimer);
      if (self.dom.modal_loading_bar) {
        self.dom.modal_loading_bar.style.width = '100%';
        setTimeout(function () {
          hide(self.dom.modal_loading_bar);
          self.percentLoaded = 0;
          self.dom.modal_loading_bar.style.width = '0%';
        }, 300);
      }
    };

    self.addLogo = function (service) {
      var brand = self.config.brands[service];
      if (!brand || !brand.logo || !self.dom.modal_logo) return;
      setHtml(
        self.dom.modal_logo,
        '<a href="' + brand.url + '"><img src="' + brand.logo + '" alt="' + service + '" /></a>'
      );
      self.dom.modal_logo.classList.add(service);
    };

    self.init = function () {
      if (!qs(document, '#u-search')) {
        document.body.insertAdjacentHTML('beforeend', TEMPLATE);
      }
      self.parseSelectors();
      self.dom.forms.forEach(function (form) {
        form.addEventListener('submit', self.onSubmit);
      });
      if (self.dom.modal_overlay) self.dom.modal_overlay.addEventListener('click', self.close);
      if (self.dom.btn_close) self.dom.btn_close.addEventListener('click', self.close);
      if (self.dom.btn_next) self.dom.btn_next.addEventListener('click', self.nextPage);
      if (self.dom.btn_prev) self.dom.btn_prev.addEventListener('click', self.prevPage);
    };

    self.init();
  }

  function AzureSearch(options) {
    SearchService.call(this, options);
    var self = this;
    var endpoint =
      'https://' +
      self.config.serviceName +
      '.search.windows.net/indexes/' +
      self.config.indexName +
      '/docs?api-version=2015-02-28';

    self.nav.current = 1;
    self.addLogo('azure');

    self.buildResultList = function (data) {
      return data.map(function (row) {
        var url = row.permalink || row.path || '';
        if (!row.permalink && row.path) url = '/' + url;
        return self.buildResult(url, row.title, row.excerptStrip || '');
      }).join('');
    };

    self.buildMetadata = function (data, startIndex) {
      self.nav.current = startIndex;
      self.nav.currentCount = data.value.length;
      self.nav.total = parseInt(data['@odata.count'], 10) || 0;

      var totalEl = self.dom.modal_metadata && self.dom.modal_metadata.querySelector('.total');
      var rangeEl = self.dom.modal_metadata && self.dom.modal_metadata.querySelector('.range');
      if (totalEl) totalEl.textContent = self.nav.total;
      if (rangeEl) {
        rangeEl.textContent =
          self.nav.current + '-' + (self.nav.current + self.nav.currentCount - 1);
      }

      if (self.nav.total > 0) show(self.dom.modal_metadata);
      else hide(self.dom.modal_metadata);

      if (self.nav.current + self.nav.currentCount <= self.nav.total) {
        self.nav.next = self.nav.current + self.nav.currentCount;
        show(self.dom.btn_next);
      } else {
        self.nav.next = -1;
        hide(self.dom.btn_next);
      }

      if (self.nav.current > 1) {
        self.nav.prev = self.nav.current - self.config.per_page;
        show(self.dom.btn_prev);
      } else {
        self.nav.prev = -1;
        hide(self.dom.btn_prev);
      }
    };

    self.query = function (queryText, startIndex, callback) {
      var params = new URLSearchParams({
        search: queryText,
        $skip: String(startIndex - 1),
        $top: String(self.config.per_page),
        $count: 'true'
      });

      fetch(endpoint + '&' + params.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'api-key': self.config.queryKey
        }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          if (data.value && data.value.length > 0) {
            setHtml(self.dom.modal_results, self.buildResultList(data.value));
            self.buildMetadata(data, startIndex);
          } else {
            self.onQueryError(queryText, 'success');
            self.buildMetadata({ value: [], '@odata.count': 0 }, startIndex);
          }
          if (callback) callback(data);
        })
        .catch(function () {
          self.onQueryError(queryText, 'error');
          if (callback) callback();
        });
    };
  }

  global.createAzureSearch = function (options) {
    return new AzureSearch(options);
  };
})(window);
