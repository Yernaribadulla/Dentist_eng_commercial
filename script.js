import { createLayers } from "./src/layers.js";
import { initMotion } from "./src/motion.js";
import { initBooking } from "./src/booking.js";
import {
  initTheme,
  initNavigation,
  initAccordions,
  initGallery,
  initComparison,
  initDirections,
  initSmile,
} from "./src/controls.js";

const layers = createLayers();
initTheme();
initNavigation(layers);
initAccordions();
initGallery();
initComparison();
initDirections(layers);
initSmile();
const openBooking = initBooking(layers);
document
  .querySelectorAll("[data-book]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      openBooking(button.dataset.topic || null),
    ),
  );
document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
initMotion();
