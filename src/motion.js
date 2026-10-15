import { storageGet, storageSet } from "./dom.js";
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let enabled = !reduced.matches && storageGet("dentara-motion") !== "off";
export const motionEnabled = () => enabled;

export function initMotion() {
  const html = document.documentElement;
  const controls = document.querySelectorAll("[data-motion-toggle]");
  const apply = () => {
    html.classList.toggle("motion-paused", !enabled);
    controls.forEach((button) => {
      button.textContent = reduced.matches
        ? "Reduced motion enabled"
        : enabled
          ? "Pause animations"
          : "Resume animations";
      button.disabled = reduced.matches;
      button.setAttribute("aria-pressed", String(enabled));
    });
  };
  controls.forEach((button) =>
    button.addEventListener("click", () => {
      enabled = !enabled && !reduced.matches;
      storageSet("dentara-motion", enabled ? "on" : "off");
      apply();
    }),
  );
  reduced.addEventListener("change", () => {
    enabled = !reduced.matches && storageGet("dentara-motion") !== "off";
    apply();
  });
  apply();
  html.classList.add("js");
  const targets = document.querySelectorAll("[data-reveal]");
  document
    .querySelectorAll("[data-stagger]")
    .forEach((group) =>
      [...group.children].forEach((child, index) =>
        child.style.setProperty("--d", `${Math.min(index, 5) * 70}ms`),
      ),
    );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    targets.forEach((node) => observer.observe(node));
  } else targets.forEach((node) => node.classList.add("is-in"));
  document.addEventListener("visibilitychange", () =>
    html.classList.toggle("tab-paused", document.hidden),
  );
  const photo = document.querySelector(".hero-photo");
  const hero = document.querySelector(".hero-portrait");
  if (!photo || !hero) return;
  let frame = 0,
    visible = true;
  if ("IntersectionObserver" in window)
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }).observe(hero);
  const update = () => {
    frame = 0;
    const offset =
      enabled && visible
        ? Math.min(
            22,
            Math.max(
              -22,
              (hero.getBoundingClientRect().top / innerHeight - 0.3) * 25,
            ),
          )
        : 0;
    photo.style.setProperty("--py", `${offset.toFixed(1)}px`);
  };
  addEventListener(
    "scroll",
    () => {
      if (!frame && enabled && visible) frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}
