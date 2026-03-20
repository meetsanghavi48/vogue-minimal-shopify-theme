(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {

    // =============================================
    // 1. SCROLL REVEAL — IntersectionObserver
    // =============================================
    var revealEls = document.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.dataset.delay || '0', 10);
            setTimeout(function() {
              entry.target.classList.add('is-revealed');
            }, delay);
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function(el) {
        revealObserver.observe(el);
      });
    } else {
      // Fallback: show everything
      revealEls.forEach(function(el) { el.classList.add('is-revealed'); });
    }

    // =============================================
    // 2. VIEWER COUNT — random fluctuation
    // =============================================
    var viewerEl = document.getElementById('viewer-count');
    if (viewerEl) {
      var baseCount = parseInt(viewerEl.textContent, 10) || 12;
      setInterval(function() {
        var change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        var newCount = Math.max(baseCount - 5, Math.min(baseCount + 10, baseCount + change));
        baseCount = newCount;
        viewerEl.textContent = newCount;
      }, 4000 + Math.random() * 3000);
    }

    // =============================================
    // 3. COUNTDOWN TIMER — dispatch cutoff
    // =============================================
    var countdownEl = document.getElementById('countdown-timer');
    if (countdownEl) {
      // Set cutoff at 6 PM today
      var now = new Date();
      var cutoff = new Date();
      cutoff.setHours(18, 0, 0, 0);
      if (now >= cutoff) {
        // Past cutoff — set to tomorrow
        cutoff.setDate(cutoff.getDate() + 1);
      }

      function updateCountdown() {
        var n = new Date();
        var diff = cutoff - n;
        if (diff <= 0) {
          countdownEl.textContent = '0h 0m';
          return;
        }
        var hours = Math.floor(diff / 3600000);
        var minutes = Math.floor((diff % 3600000) / 60000);
        countdownEl.textContent = hours + 'h ' + minutes + 'm';
      }
      updateCountdown();
      setInterval(updateCountdown, 30000);
    }

    // =============================================
    // 4. STICKY BUY BAR — shows after scrolling past purchase zone
    // =============================================
    var stickyBar = document.getElementById('pdp-sticky-bar');
    var purchaseZone = document.querySelector('.pdp__purchase-zone');
    if (stickyBar && purchaseZone) {
      var stickyObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            stickyBar.classList.remove('is-visible');
          } else {
            stickyBar.classList.add('is-visible');
          }
        });
      }, { threshold: 0 });
      stickyObserver.observe(purchaseZone);

      // Sticky buy button — triggers same logic as main add button
      var stickyBuy = document.getElementById('sticky-buy');
      if (stickyBuy) {
        stickyBuy.addEventListener('click', function() {
          var mainAdd = document.getElementById('btn-add');
          if (mainAdd) {
            // Scroll to top first if size not selected
            var hasSizes = this.dataset.hasSizes === 'true';
            var sizeLabel = document.querySelector('.pdp__select-label');
            if (hasSizes && sizeLabel && sizeLabel.textContent === 'Size') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(function() { mainAdd.click(); }, 500);
            } else {
              mainAdd.click();
            }
          }
        });
      }
    }

    // =============================================
    // 5. DESCRIPTION TOGGLE
    // =============================================
    var descToggle = document.getElementById('desc-toggle');
    var descContent = document.getElementById('desc-content');
    if (descToggle && descContent) {
      descToggle.addEventListener('click', function() {
        var isOpen = descContent.classList.contains('is-open');
        if (isOpen) {
          descContent.classList.remove('is-open');
          descToggle.setAttribute('aria-expanded', 'false');
        } else {
          descContent.classList.add('is-open');
          descToggle.setAttribute('aria-expanded', 'true');
        }
      });
    }

    // =============================================
    // 6. DOT SYNC — update dots with carousel position
    // =============================================
    var carousel = document.getElementById('pdp-carousel');
    var dots = document.querySelectorAll('.pdp__dot');
    if (carousel && dots.length > 1) {
      var slides = carousel.querySelectorAll('.pdp__slide');
      if ('IntersectionObserver' in window) {
        var dotObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var idx = parseInt(entry.target.dataset.index, 10);
              dots.forEach(function(d, i) {
                d.classList.toggle('is-active', i === idx);
              });
            }
          });
        }, { root: carousel, threshold: 0.5 });

        slides.forEach(function(slide) { dotObserver.observe(slide); });
      }
    }

  });
})();
