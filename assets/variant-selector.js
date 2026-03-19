(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var jsonEl = document.getElementById('product-variants-json');
    if (!jsonEl) return;

    var variants;
    try { variants = JSON.parse(jsonEl.textContent); }
    catch(e) { return; }

    var buttons = document.querySelectorAll('.pdp__pill, .pdp__color-swatch');
    var selected = {};

    // Init first selected
    buttons.forEach(function(btn) {
      if (btn.classList.contains('is-selected')) {
        selected[btn.dataset.optionIndex] = btn.dataset.value;
      }
    });

    // URL variant
    var params = new URLSearchParams(window.location.search);
    var vp = params.get('variant');
    if (vp) {
      var pre = variants.find(function(v) { return v.id === parseInt(vp, 10); });
      if (pre) preselect(pre, buttons, selected);
    }

    // Clicks
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (this.classList.contains('is-unavailable')) return;
        var idx = this.dataset.optionIndex;
        var val = this.dataset.value;

        document.querySelectorAll(
          '[data-option-index="' + idx + '"].pdp__pill, ' +
          '[data-option-index="' + idx + '"].pdp__color-swatch'
        ).forEach(function(s) { s.classList.remove('is-selected'); });
        this.classList.add('is-selected');

        selected[idx] = val;
        var match = findVariant(variants, selected);
        if (match) applyVariant(match);
        else disableAll();
      });
    });

    markAvailability(variants, selected, buttons);
  }

  function preselect(v, btns, sel) {
    btns.forEach(function(b) { b.classList.remove('is-selected'); });
    if (v.option1) { sel['0'] = v.option1; pick(btns, '0', v.option1); }
    if (v.option2) { sel['1'] = v.option2; pick(btns, '1', v.option2); }
    if (v.option3) { sel['2'] = v.option3; pick(btns, '2', v.option3); }
  }

  function pick(btns, idx, val) {
    btns.forEach(function(b) {
      if (b.dataset.optionIndex === idx && b.dataset.value === val) b.classList.add('is-selected');
    });
  }

  function findVariant(variants, sel) {
    return variants.find(function(v) {
      var ok = true;
      if (sel['0'] && v.option1 !== sel['0']) ok = false;
      if (sel['1'] && v.option2 !== sel['1']) ok = false;
      if (sel['2'] && v.option3 !== sel['2']) ok = false;
      return ok;
    });
  }

  function applyVariant(variant) {
    document.querySelectorAll('input[name="id"]').forEach(function(i) { i.value = variant.id; });

    var priceEl = document.getElementById('pdp-price');
    if (priceEl) {
      if (window.Shopify && window.Shopify.formatMoney) {
        priceEl.textContent = Shopify.formatMoney(variant.price);
      } else {
        priceEl.textContent = '$' + (variant.price / 100).toFixed(2);
      }
    }

    var url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url.toString());

    var addBtn = document.getElementById('btn-add-to-cart');
    if (addBtn) {
      if (variant.available) {
        addBtn.disabled = false;
        addBtn.textContent = 'Add to my bag';
      } else {
        addBtn.disabled = true;
        addBtn.textContent = 'Sold Out';
      }
    }

    document.dispatchEvent(new CustomEvent('variant:changed', { detail: variant }));
  }

  function disableAll() {
    var addBtn = document.getElementById('btn-add-to-cart');
    if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Unavailable'; }
  }

  function markAvailability(variants, sel, btns) {
    btns.forEach(function(btn) {
      var test = Object.assign({}, sel);
      test[btn.dataset.optionIndex] = btn.dataset.value;
      var v = findVariant(variants, test);
      if (!v || !v.available) btn.classList.add('is-unavailable');
    });
  }
})();
