/* ===========================
   Variant Selector v3b
   Size dropdown → modal, color swatches, cart
   =========================== */
(function() {
  'use strict';

  var variantsJSON = document.getElementById('product-variants-json');
  if (!variantsJSON) return;

  var variants = JSON.parse(variantsJSON.textContent.trim());
  var variantInput = document.getElementById('variant-id');
  var priceEl = document.getElementById('pdp-price');
  var addBtn = document.getElementById('btn-add');
  var addBtnText = document.getElementById('btn-add-text');
  var sizeBtn = document.getElementById('size-trigger');
  var selectedOptions = {};
  var sizeSelected = false;

  // ===== SIZE MODAL =====
  var backdrop = document.getElementById('size-modal-backdrop');
  var closeBtn = document.getElementById('size-modal-close');
  var confirmBtn = document.getElementById('size-modal-confirm');
  var pills = document.querySelectorAll('.size-modal__pill');

  function openModal() {
    if (!backdrop) return;
    backdrop.hidden = false;
    requestAnimationFrame(function() { backdrop.classList.add('is-visible'); });
  }
  function closeModal() {
    if (!backdrop) return;
    backdrop.classList.remove('is-visible');
    setTimeout(function() { backdrop.hidden = true; }, 300);
  }

  if (sizeBtn) sizeBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) closeModal();
  });

  // Size pill selection
  pills.forEach(function(pill) {
    pill.addEventListener('click', function() {
      pills.forEach(function(p) { p.classList.remove('is-selected'); });
      pill.classList.add('is-selected');

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm — ' + pill.dataset.value;
      }
    });
  });

  // Confirm size
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      var selected = document.querySelector('.size-modal__pill.is-selected');
      if (!selected) return;

      var value = selected.dataset.value;
      var optIdx = selected.dataset.optionIndex;
      selectedOptions['option' + (parseInt(optIdx) + 1)] = value;
      sizeSelected = true;

      // Update size button text
      if (sizeBtn) {
        sizeBtn.querySelector('.pdp__select-label').textContent = value;
      }

      updateVariant();
      closeModal();
    });
  }

  // ===== COLOR SWATCHES =====
  var swatches = document.querySelectorAll('.pdp__color-swatch');
  swatches.forEach(function(swatch) {
    swatch.addEventListener('click', function() {
      var optIdx = swatch.dataset.optionIndex;
      document.querySelectorAll('.pdp__color-swatch[data-option-index="' + optIdx + '"]').forEach(function(s) {
        s.classList.remove('is-selected');
      });
      swatch.classList.add('is-selected');
      selectedOptions['option' + (parseInt(optIdx) + 1)] = swatch.dataset.value;
      updateVariant();
    });
  });

  // ===== FIND MATCHING VARIANT =====
  function updateVariant() {
    var match = variants.find(function(v) {
      return Object.keys(selectedOptions).every(function(key) {
        return v[key] === selectedOptions[key];
      });
    });

    if (match) {
      variantInput.value = match.id;
      if (priceEl) priceEl.textContent = formatMoney(match.price);

      var compareEl = document.querySelector('.pdp__compare-price');
      if (compareEl) {
        if (match.compare_at_price && match.compare_at_price > match.price) {
          compareEl.textContent = formatMoney(match.compare_at_price);
          compareEl.style.display = '';
        } else {
          compareEl.style.display = 'none';
        }
      }

      var url = new URL(window.location);
      url.searchParams.set('variant', match.id);
      history.replaceState(null, '', url);

      if (!match.available) {
        addBtn.disabled = true;
        addBtnText.textContent = 'Sold Out';
      } else {
        addBtn.disabled = false;
        addBtnText.textContent = addBtn.getAttribute('data-original-text') || 'Add to bag';
      }
    }
  }

  // ===== ADD TO CART =====
  if (addBtn) {
    addBtn.setAttribute('data-original-text', addBtnText.textContent);

    addBtn.addEventListener('click', function() {
      var hasSizes = addBtn.dataset.hasSizes === 'true';

      if (hasSizes && !sizeSelected) {
        // Shake size button
        if (sizeBtn) {
          sizeBtn.classList.add('is-shaking');
          setTimeout(function() { sizeBtn.classList.remove('is-shaking'); }, 600);
        }
        return;
      }

      if (addBtn.disabled) return;

      var variantId = variantInput.value;
      var originalText = addBtnText.textContent;
      addBtn.disabled = true;
      addBtnText.textContent = 'Adding...';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: parseInt(variantId), quantity: 1 }] })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(function() {
        addBtn.classList.add('is-success');
        addBtnText.textContent = 'Added!';

        fetch('/cart.json').then(function(r) { return r.json(); }).then(function(cart) {
          var countEl = document.querySelector('.header__cart-count');
          if (countEl) countEl.textContent = cart.item_count;
        });

        setTimeout(function() {
          addBtn.classList.remove('is-success');
          addBtn.disabled = false;
          addBtnText.textContent = originalText;
        }, 2000);
      })
      .catch(function() {
        addBtnText.textContent = 'Error - retry';
        addBtn.disabled = false;
        setTimeout(function() { addBtnText.textContent = originalText; }, 2000);
      });
    });
  }

  // ===== WISHLIST =====
  var wishBtn = document.querySelector('.pdp__wishlist');
  if (wishBtn) wishBtn.addEventListener('click', function() {
    wishBtn.classList.toggle('is-liked');
  });

  // ===== FORMAT MONEY (INR) =====
  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    return '\u20B9 ' + amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ===== PRE-SELECT FROM URL =====
  var urlVariant = new URLSearchParams(window.location.search).get('variant');
  if (urlVariant) {
    var v = variants.find(function(vr) { return vr.id === parseInt(urlVariant); });
    if (v) {
      if (v.option1) selectedOptions.option1 = v.option1;
      if (v.option2) selectedOptions.option2 = v.option2;
      if (v.option3) selectedOptions.option3 = v.option3;

      // Mark size as selected and update button
      if (sizeBtn && v.option1) {
        sizeBtn.querySelector('.pdp__select-label').textContent = v.option1;
        sizeSelected = true;
      }
      pills.forEach(function(p) {
        if (Object.values(selectedOptions).includes(p.dataset.value)) p.classList.add('is-selected');
      });
      swatches.forEach(function(s) {
        if (Object.values(selectedOptions).includes(s.dataset.value)) s.classList.add('is-selected');
      });
    }
  }

  // ===== HEADER SCROLL =====
  var header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function() {
      header.classList.toggle('is-scrolled', window.scrollY > 50);
    }, { passive: true });
  }

})();
