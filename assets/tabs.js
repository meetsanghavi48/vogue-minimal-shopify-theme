(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', initTabs);

  function initTabs() {
    var tabContainers = document.querySelectorAll('.product-tabs');
    tabContainers.forEach(function(container) {
      new TabGroup(container);
    });
  }

  function TabGroup(container) {
    this.container = container;
    this.tabs = container.querySelectorAll('[role="tab"]');
    this.panels = container.querySelectorAll('[role="tabpanel"]');

    if (!this.tabs.length) return;

    this.bindEvents();
  }

  TabGroup.prototype.bindEvents = function() {
    var self = this;

    this.tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        self.activateTab(tab);
      });

      tab.addEventListener('keydown', function(e) {
        self.handleKeydown(e, tab);
      });
    });
  };

  TabGroup.prototype.activateTab = function(selectedTab) {
    var self = this;

    // Deactivate all tabs
    this.tabs.forEach(function(tab) {
      tab.classList.remove('is-active');
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('tabindex', '-1');
    });

    // Activate selected tab
    selectedTab.classList.add('is-active');
    selectedTab.setAttribute('aria-selected', 'true');
    selectedTab.setAttribute('tabindex', '0');
    selectedTab.focus();

    // Show corresponding panel
    var panelId = selectedTab.getAttribute('aria-controls');
    this.panels.forEach(function(panel) {
      if (panel.id === panelId) {
        panel.classList.add('is-active');
        panel.removeAttribute('hidden');
      } else {
        panel.classList.remove('is-active');
        panel.setAttribute('hidden', '');
      }
    });
  };

  TabGroup.prototype.handleKeydown = function(e, currentTab) {
    var tabArray = Array.from(this.tabs);
    var currentIndex = tabArray.indexOf(currentTab);
    var targetIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        targetIndex = currentIndex - 1;
        if (targetIndex < 0) targetIndex = tabArray.length - 1;
        this.activateTab(tabArray[targetIndex]);
        break;

      case 'ArrowRight':
        e.preventDefault();
        targetIndex = currentIndex + 1;
        if (targetIndex >= tabArray.length) targetIndex = 0;
        this.activateTab(tabArray[targetIndex]);
        break;

      case 'Home':
        e.preventDefault();
        this.activateTab(tabArray[0]);
        break;

      case 'End':
        e.preventDefault();
        this.activateTab(tabArray[tabArray.length - 1]);
        break;
    }
  };
})();
