/* ========================================
   JEEVO TOURS - INTERACTIVE SELECTOR SCRIPT
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
  const selectorItems = document.querySelectorAll('.jv-selector-item');
  if (!selectorItems.length) return;

  selectorItems.forEach(function (item) {
    item.addEventListener('click', function () {
      if (item.classList.contains('active')) return;

      selectorItems.forEach(function (el) {
        el.classList.remove('active');
      });

      item.classList.add('active');
    });
  });
});
