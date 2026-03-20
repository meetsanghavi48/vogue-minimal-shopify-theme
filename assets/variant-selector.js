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
    var sizeTrigger = document.getElementById('size-trigger');
    var sizeLabel = sizeTrigger ? sizeTrigger.querySelector('.pdp__select-label') : null;
    var colorSwatches = document.querySelectorAll('.pdp__color-swatch');
    var selected = {};
    var hasSizes = addBtn && addBtn.dataset.hasSizes === 'true';
    var optionIndex = sizeTrigger ? sizeTrigger.dataset.optionIndex : '0';
    var sizeSelected = false;

    // Modal elements
    var backdrop = document.getElementById('size-modal-backdrop');
    var modal = document.getElementById('size-modal');
    var closeBtn = document.getElementById('size-modal-close');
    var confirmBtn = document.getElementById('size-modal-confirm');
    var pills = backdrop ? backdrop.querySelectorAll('.size-modal__pill') : [];
    var tempSize = null;

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
        preselectFromVariant(pre);
      }
    }

    // No sizes? Select first variant immediately
    if (!hasSizes) {
      if (variants.length > 0) {
        selected['0'] = variants[0].option1;
        applyVariant(variants[0]);
      }
    }

    // ---- Modal open/close ----
    if (sizeTrigger && backdrop) {
      sizeTrigger.addEventListener('click', function() {
        openModal();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        closeModal();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) closeModal();
      });
    }

    // ESC to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && backdrop && !backdrop.hidden) {
        closeModal();
      }
    });

    function openModal() {
      if (!backdrop) return;
      tempSize = null;
      backdrop.hidden = false;
      // Force reflow then animate
      void backdrop.offsetWidth;
      backdrop.classList.add('is-visible');
      document.body.style.overflow = 'hidden';

      // Highlight currently selected pill if any
      pills.forEach(function(p) {
        p.classList.remove('is-selected');
        if (sizeSelected && p.dataset.value === selected[optionIndex]) {
          p.classList.add('is-selected');
          tempSize = p.dataset.value;
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm — ' + tempSize;
          }
        }
      });
    }

    function closeModal() {
      if (!backdrop) return;
      backdrop.classList.remove('is-visible');
      document.body.style.overflow = '';
      setTimeout(function() {
        backdrop.hidden = true;
      }, 300);
    }

    // ---- Pill click inside modal ----
    pills.forEach(function(pill) {
      pill.addEventListener('click', function() {
        tempSize = this.dataset.value;
        pills.forEach(function(p) { p.classList.remove('is-selected'); });
        this.classList.add('is-selected');

        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirm — ' + tempSize;
        }
      });
    });

    // ---- Confirm button ----
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        if (!tempSize) return;

        selected[optionIndex] = tempSize;
        sizeSelected = true;

        // Update the size button label
        if (sizeLabel) sizeLabel.textContent = tempSize;

        // Find variant
        var match = findVariant(variants, selected);
        if (match) {
          applyVariant(match);
          if (addBtn) {
            addBtn.querySelector('span').textContent = match.available ? 'Add' : 'Sold Out';
          }
        } else {
          if (addBtn) {
            addBtn.querySelector('span').textContent = 'Sold Out';
          }
        }

        closeModal();
      });
    }

    // ---- Color swatch click ----
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
            if (addBtn) {
              addBtn.querySelector('span').textContent = match.available ? 'Add' : 'Sold Out';
            }
          }
        }
      });
    });

    // ---- Add button click — shake size if not selected, else open modal ----
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        if (hasSizes && !sizeSelected) {
          // Shake the size button
          if (sizeTrigger) {
            sizeTrigger.classList.remove('is-shaking');
            void sizeTrigger.offsetWidth;
            sizeTrigger.classList.add('is-shaking');
            setTimeout(function() {
              sizeTrigger.classList.remove('is-shaking');
            }, 600);
          }
          return;
        }
        if (this.disabled) return;
        addToCart(this);
      });
    }

    // ---- Scroll pressure effect ----
    var sheet = document.querySelector('.pdp__sheet');
    if (sheet) {
      var lastScrollY = 0;
      var pressTimer = null;
      window.addEventListener('scroll', function() {
        var sy = window.scrollY;
        if (sy > 20 && sy > lastScrollY) {
          sheet.classList.add('is-pressed');
          clearTimeout(pressTimer);
          pressTimer = setTimeout(function() {
            sheet.classList.remove('is-pressed');
          }, 150);
        } else {
          sheet.classList.remove('is-pressed');
        }
        lastScrollY = sy;
      }, { passive: true });
    }

    function preselectFromVariant(variant) {
      if (variant.option1) {
        selected['0'] = variant.option1;
        if (optionIndex === '0' && sizeLabel) {
          sizeLabel.textContent = variant.option1;
          sizeSelected = true;
        }
        colorSwatches.forEach(function(s) {
          if (s.dataset.optionIndex === '0' && s.dataset.value === variant.option1) {
            colorSwatches.forEach(function(x) { x.classList.remove('is-selected'); });
            s.classList.add('is-selected');
          }
        });
      }
      if (variant.option2) {
        selected['1'] = variant.option2;
        if (optionIndex === '1' && sizeLabel) {
          sizeLabel.textContent = variant.option2;
          sizeSelected = true;
        }
      }
      if (variant.option3) {
        selected['2'] = variant.option3;
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
