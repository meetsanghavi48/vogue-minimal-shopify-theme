(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var addBtn = document.getElementById('btn-add-to-cart');
    if (addBtn) addBtn.addEventListener('click', function() { addToCart(this); });
  }

  function getVariantId() {
    var input = document.getElementById('variant-id');
    if (!input) input = document.querySelector('input[name="id"]');
    return input ? input.value : null;
  }

  function addToCart(button) {
    var id = getVariantId();
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
      updateCartCount();
      document.dispatchEvent(new CustomEvent('cart:updated'));

      setTimeout(function() {
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('is-success');
      }, 2500);
    })
    .catch(function() {
      button.textContent = 'Could not add';
      button.classList.add('is-error');

      setTimeout(function() {
        button.textContent = originalText;
        button.disabled = false;
        button.classList.remove('is-error');
      }, 2500);
    });
  }

  function updateCartCount() {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    fetch(root + 'cart.json')
      .then(function(r) { return r.json(); })
      .then(function(cart) {
        document.querySelectorAll('#cart-count, .header__cart-count').forEach(function(el) {
          el.textContent = cart.item_count;
        });
      })
      .catch(function() {});
  }
})();
