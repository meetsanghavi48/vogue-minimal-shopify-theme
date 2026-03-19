(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var jsonEl = document.getElementById('product-variants-json');
    if (!jsonEl) return;

    var variants;
    try { variants = JSON.parse(jsonEl.textContent); }
    catch(e) { return; }

    var smartBtn = document.getElementById('btn-smart');
    var sizesExpand = document.getElementById('sizes-panel');
    var sizeChips = document.querySelectorAll('.pdp__size-chip');
    var colorSwatches = document.querySelectorAll('.pdp__color-swatch');
    var selected = {};
    var hasSizes = smartBtn && smartBtn.dataset.hasSizes === 'true';
    var sizeSelected = false;

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
        preselectFromVariant(pre, sizeChips, colorSwatches, selected);
        sizeSelected = true;
        if (sizesExpand) sizesExpand.hidden = false;
        updateSmartBtn('ready', pre.available);
      }
    }

    // No sizes? Button is ready immediately
    if (!hasSizes) {
      // Single variant product — select first variant
      if (variants.length > 0) {
        selected['0'] = variants[0].option1;
        applyVariant(variants[0]);
      }
      updateSmartBtn('ready', variants[0] && variants[0].available);
    }

    // Smart button tap — expand sizes
    if (smartBtn) {
      smartBtn.addEventListener('click', function() {
        var state = this.dataset.state;

        if (state === 'select' && sizesExpand) {
          sizesExpand.hidden = false;
          this.textContent = 'Choose your size';
          this.classList.add('is-disabled-state');
          this.dataset.state = 'choosing';
          // Scroll body so sizes are visible
          var body = document.getElementById('pdp-sheet-body');
          if (body) {
            setTimeout(function() { body.scrollTop = body.scrollHeight; }, 50);
          }
        } else if (state === 'ready') {
          // Add to cart
          addToCart(this);
        }
      });
    }

    // Size chip click
    sizeChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        if (this.classList.contains('is-unavailable')) return;

        // Update UI
        sizeChips.forEach(function(c) { c.classList.remove('is-selected'); });
        this.classList.add('is-selected');

        selected[this.dataset.optionIndex] = this.dataset.value;
        sizeSelected = true;

        var match = findVariant(variants, selected);
        if (match) {
          applyVariant(match);
          updateSmartBtn('ready', match.available);
        } else {
          updateSmartBtn('ready', false);
        }
      });
    });

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
          if (sizeSelected || !hasSizes) {
            updateSmartBtn('ready', match.available);
          }
        }
      });
    });

    // Mark unavailable sizes
    sizeChips.forEach(function(chip) {
      var test = Object.assign({}, selected);
      test[chip.dataset.optionIndex] = chip.dataset.value;
      var v = findVariant(variants, test);
      if (!v || !v.available) chip.classList.add('is-unavailable');
    });

    function updateSmartBtn(state, available) {
      if (!smartBtn) return;
      smartBtn.dataset.state = state;
      smartBtn.classList.remove('is-select-state', 'is-disabled-state');

      if (state === 'ready' && available) {
        smartBtn.disabled = false;
        smartBtn.textContent = 'Add to my bag';
      } else if (state === 'ready' && !available) {
        smartBtn.disabled = true;
        smartBtn.textContent = 'Sold Out';
      } else {
        smartBtn.textContent = 'Select Size';
        smartBtn.classList.add('is-select-state');
        smartBtn.disabled = false;
      }
    }

    function preselectFromVariant(variant, chips, swatches, sel) {
      if (variant.option1) {
        sel['0'] = variant.option1;
        chips.forEach(function(c) {
          if (c.dataset.optionIndex === '0' && c.dataset.value === variant.option1) c.classList.add('is-selected');
        });
        swatches.forEach(function(s) {
          if (s.dataset.optionIndex === '0' && s.dataset.value === variant.option1) {
            swatches.forEach(function(x) { x.classList.remove('is-selected'); });
            s.classList.add('is-selected');
          }
        });
      }
      if (variant.option2) {
        sel['1'] = variant.option2;
        chips.forEach(function(c) {
          if (c.dataset.optionIndex === '1' && c.dataset.value === variant.option2) c.classList.add('is-selected');
        });
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

    var originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Adding...';

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
      button.textContent = 'Added to bag!';
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
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('is-success');
      }, 2500);
    })
    .catch(function() {
      button.textContent = 'Could not add';
      setTimeout(function() {
        button.textContent = originalText;
        button.disabled = false;
      }, 2500);
    });
  }
})();
