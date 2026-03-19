(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var jsonEl = document.getElementById('product-variants-json');
    if (!jsonEl) return;

    var variants;
    try { variants = JSON.parse(jsonEl.textContent); }
    catch(e) { return; }

    var addBtn = document.getElementById('btn-add');
    var sizeDropdown = document.getElementById('size-dropdown');
    var colorSwatches = document.querySelectorAll('.pdp__color-swatch');
    var selected = {};
    var hasSizes = addBtn && addBtn.dataset.hasSizes === 'true';

    // Init color with first value
    colorSwatches.forEach(function(btn) {
      if (btn.classList.contains('is-selected')) {
        selected[btn.dataset.optionIndex] = btn.dataset.value;
      }
    });

    // URL variant preselection
    var params = new URLSearchParams(window.location.search);
    var vp = params.get('variant');
    if (vp) {
      var pre = variants.find(function(v) { return v.id === parseInt(vp, 10); });
      if (pre) {
        preselectFromVariant(pre, sizeDropdown, colorSwatches, selected);
        if (addBtn) addBtn.disabled = false;
      }
    }

    // No sizes? Button ready immediately
    if (!hasSizes) {
      if (variants.length > 0) {
        selected['0'] = variants[0].option1;
        applyVariant(variants[0]);
      }
      if (addBtn) addBtn.disabled = false;
    }

    // Size dropdown change
    if (sizeDropdown) {
      sizeDropdown.addEventListener('change', function() {
        selected[this.dataset.optionIndex] = this.value;

        var match = findVariant(variants, selected);
        if (match) {
          applyVariant(match);
          if (addBtn) {
            addBtn.disabled = !match.available;
            if (!match.available) {
              addBtn.querySelector('span').textContent = 'Sold Out';
            } else {
              addBtn.querySelector('span').textContent = 'Add';
            }
          }
        } else {
          if (addBtn) {
            addBtn.disabled = true;
            addBtn.querySelector('span').textContent = 'Sold Out';
          }
        }
      });
    }

    // Color swatch click
    colorSwatches.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = this.dataset.optionIndex;
        colorSwatches.forEach(function(s) { s.classList.remove('is-selected'); });
        this.classList.add('is-selected');
        selected[idx] = this.dataset.value;

        var match = findVariant(variants, selected);
        if (match) {
          applyVariant(match);
          // Update button if size already selected or no sizes
          if (!hasSizes || (sizeDropdown && sizeDropdown.value)) {
            if (addBtn) {
              addBtn.disabled = !match.available;
              addBtn.querySelector('span').textContent = match.available ? 'Add' : 'Sold Out';
            }
          }
        }
      });
    });

    // Add button click
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        if (this.disabled) return;
        addToCart(this);
      });
    }

    function preselectFromVariant(variant, dropdown, swatches, sel) {
      if (variant.option1) {
        sel['0'] = variant.option1;
        if (dropdown && dropdown.dataset.optionIndex === '0') {
          dropdown.value = variant.option1;
        }
        swatches.forEach(function(s) {
          if (s.dataset.optionIndex === '0' && s.dataset.value === variant.option1) {
            swatches.forEach(function(x) { x.classList.remove('is-selected'); });
            s.classList.add('is-selected');
          }
        });
      }
      if (variant.option2) {
        sel['1'] = variant.option2;
        if (dropdown && dropdown.dataset.optionIndex === '1') {
          dropdown.value = variant.option2;
        }
      }
      if (variant.option3) {
        sel['2'] = variant.option3;
      }
    }
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
        priceEl.textContent = '\u20b9 ' + (variant.price / 100).toFixed(2);
      }
    }

    var url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url.toString());

    document.dispatchEvent(new CustomEvent('variant:changed', { detail: variant }));
  }

  function addToCart(button) {
    var input = document.getElementById('variant-id');
    if (!input) input = document.querySelector('input[name="id"]');
    var id = input ? input.value : null;
    if (!id || button.disabled) return;

    var spanEl = button.querySelector('span');
    var originalText = spanEl ? spanEl.textContent : 'Add';
    button.disabled = true;
    if (spanEl) spanEl.textContent = 'Adding...';

    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [{ id: parseInt(id, 10), quantity: 1 }] })
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Failed');
      return r.json();
    })
    .then(function() {
      if (spanEl) spanEl.textContent = 'Added!';
      button.classList.add('is-success');

      // Update cart count
      fetch(root + 'cart.json')
        .then(function(r) { return r.json(); })
        .then(function(cart) {
          document.querySelectorAll('#cart-count, .header__cart-count').forEach(function(el) {
            el.textContent = cart.item_count;
          });
        });

      setTimeout(function() {
        if (spanEl) spanEl.textContent = originalText;
        button.disabled = false;
        button.classList.remove('is-success');
      }, 2500);
    })
    .catch(function() {
      if (spanEl) spanEl.textContent = 'Error';
      setTimeout(function() {
        if (spanEl) spanEl.textContent = originalText;
        button.disabled = false;
      }, 2500);
    });
  }
})();
