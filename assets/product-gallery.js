(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var carousel = document.getElementById('pdp-carousel');
    if (!carousel) return;

    var slides = carousel.querySelectorAll('.pdp__slide');
    var dots = document.querySelectorAll('.pdp__dot');
    var prevBtn = document.getElementById('pdp-prev');
    var nextBtn = document.getElementById('pdp-next');
    var header = document.querySelector('.site-header');
    var current = 0;
    var count = slides.length;

    if (count <= 0) return;

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });

    dots.forEach(function(d) {
      d.addEventListener('click', function() {
        goTo(parseInt(this.dataset.index, 10));
      });
    });

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          setActive(parseInt(entry.target.dataset.index, 10));
        }
      });
    }, { root: carousel, threshold: 0.6 });

    slides.forEach(function(s) { observer.observe(s); });

    document.addEventListener('variant:changed', function(e) {
      if (e.detail && e.detail.featured_image) {
        var filename = e.detail.featured_image.src.split('?')[0].split('/').pop();
        slides.forEach(function(slide, i) {
          var img = slide.querySelector('img');
          if (img && img.src.indexOf(filename) > -1) goTo(i);
        });
      }
    });

    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    });

    // Header scroll state (no zoom, just header bg)
    if (header) {
      window.addEventListener('scroll', function() {
        if (window.pageYOffset > 50) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      }, { passive: true });
    }

    // Description toggle
    var descToggle = document.getElementById('pdp-desc-toggle');
    var descShort = document.getElementById('pdp-desc');
    var descFull = document.getElementById('pdp-desc-full');
    var descLess = document.getElementById('pdp-desc-less');

    if (descToggle && descFull) {
      descToggle.addEventListener('click', function() {
        descShort.hidden = true;
        descFull.hidden = false;
      });
    }
    if (descLess && descShort) {
      descLess.addEventListener('click', function() {
        descFull.hidden = true;
        descShort.hidden = false;
      });
    }

    function goTo(index) {
      if (index < 0) index = 0;
      if (index >= count) index = count - 1;
      var slide = slides[index];
      if (!slide) return;
      carousel.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      setActive(index);
    }

    function setActive(index) {
      current = index;
      slides.forEach(function(s, i) { s.classList.toggle('is-active', i === index); });
      dots.forEach(function(d, i) { d.classList.toggle('is-active', i === index); });
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index >= count - 1;
    }

    setActive(0);
  }
})();
