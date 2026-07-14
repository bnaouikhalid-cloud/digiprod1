(function () {
  "use strict";

  document.querySelectorAll("[data-workflow-switch]").forEach(function (switcher) {
    const buttons = Array.from(switcher.querySelectorAll('[role="tab"]'));
    const wrapper = switcher.closest(".before-after");
    const panels = Array.from(wrapper?.querySelectorAll('[role="tabpanel"]') || []);

    function activate(button) {
      const id = button.getAttribute("aria-controls");
      buttons.forEach(function (item) {
        const active = item === button;
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (panel) { panel.hidden = panel.id !== id; });
    }

    buttons.forEach(function (button, index) {
      button.addEventListener("click", function () { activate(button); });
      button.addEventListener("keydown", function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        activate(buttons[next]);
        buttons[next].focus();
      });
    });
  });

  document.querySelectorAll(".faq-list").forEach(function (list) {
    list.addEventListener("toggle", function (event) {
      if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
      list.querySelectorAll("details[open]").forEach(function (item) {
        if (item !== event.target) item.removeAttribute("open");
      });
    }, true);
  });
})();
