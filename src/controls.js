import { el, icon, storageGet, storageSet } from "./dom.js";
import { directions, gallery, moods } from "./content.js";
import { clampPosition } from "./validation.js";
import { motionEnabled } from "./motion.js";

export function initTheme() {
  const html = document.documentElement;
  const system = matchMedia("(prefers-color-scheme: dark)");
  const buttons = document.querySelectorAll("[data-theme-toggle]");
  let timer;
  const set = (theme, persist = false) => {
    clearTimeout(timer);
    html.classList.toggle("theme-anim", motionEnabled());
    timer = setTimeout(() => html.classList.remove("theme-anim"), 400);
    html.dataset.theme = theme;
    if (persist) storageSet("dentara-theme", theme);
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-label",
        theme === "dark" ? "Enable light theme" : "Enable dark theme",
      );
      button.setAttribute("aria-pressed", String(theme === "dark"));
    });
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#20191a" : "#f4efe7");
  };
  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      set(html.dataset.theme === "dark" ? "light" : "dark", true),
    ),
  );
  system.addEventListener("change", (event) => {
    if (!["dark", "light"].includes(storageGet("dentara-theme")))
      set(event.matches ? "dark" : "light");
  });
  set(html.dataset.theme);
}

export function initNavigation(layers) {
  const menu = document.getElementById("menu");
  const button = document.querySelector(".menu-btn");
  layers.register(menu, (open) =>
    button.setAttribute("aria-expanded", String(open)),
  );
  button.addEventListener("click", () =>
    menu.open ? layers.close(menu) : layers.open(menu),
  );
  const desktop = matchMedia("(min-width: 1100px)");
  desktop.addEventListener("change", (event) => {
    if (event.matches && menu.open) layers.close(menu, { immediate: true });
  });
  menu
    .querySelectorAll("li")
    .forEach((item, index) => item.style.setProperty("--k", index));
  document.querySelectorAll('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      if (menu.open)
        layers.close(menu, { immediate: true, restoreFocus: false });
      target.scrollIntoView({
        behavior: motionEnabled() ? "smooth" : "auto",
        block: "start",
      });
      if (link.hash !== "#main") history.replaceState(null, "", link.hash);
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }),
  );
  const links = [...document.querySelectorAll("[data-nav]")];
  const sections = [
    ...new Set(
      links
        .map((link) => document.getElementById(link.hash.slice(1)))
        .filter(Boolean),
    ),
  ];
  if ("IntersectionObserver" in window) {
    const active = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting
            ? active.add(entry.target.id)
            : active.delete(entry.target.id),
        );
        const current = sections.find((section) => active.has(section.id));
        if (!current) return;
        links.forEach((link) => {
          const selected = link.hash === `#${current.id}`;
          link.classList.toggle("active", selected);
          if (selected) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
  }
  const topbar = document.querySelector(".topbar");
  const update = () => topbar.classList.toggle("scrolled", scrollY > 8);
  update();
  addEventListener("scroll", update, { passive: true });
}

export function initAccordions() {
  for (const [selector, single] of [
    [".svc", true],
    [".faq-item", false],
  ]) {
    const items = [...document.querySelectorAll(selector)];
    const sync = (item, open) => {
      const button = item.querySelector("button[aria-controls]");
      const panel = document.getElementById(
        button.getAttribute("aria-controls"),
      );
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      panel.inert = !open;
      panel.setAttribute("aria-hidden", String(!open));
    };
    items.forEach((item) => {
      if (single)
        item.querySelector("[data-book]").dataset.topic =
          item.querySelector(".svc-name").textContent;
      sync(item, item.classList.contains("is-open"));
      item
        .querySelector("button[aria-controls]")
        .addEventListener("click", () => {
          const open = !item.classList.contains("is-open");
          if (single && open)
            items
              .filter((other) => other !== item)
              .forEach((other) => sync(other, false));
          sync(item, open);
        });
    });
  }
}

export function initGallery() {
  const image = document.getElementById("gallery-image");
  const group = document.querySelector(".slats");
  const status = document.getElementById("gallery-status");
  const buttons = [...document.querySelectorAll("[data-slat]")];
  let revision = 0;
  buttons.forEach((button) =>
    button.addEventListener("click", async () => {
      const entry = gallery[Number(button.dataset.slat)];
      if (!entry) return;
      const request = ++revision;
      group.setAttribute("aria-busy", "true");
      try {
        const next = new Image();
        next.src = entry.src;
        await next.decode();
        if (request !== revision) return;
        image.src = entry.src;
        image.alt = entry.alt;
        image.classList.remove("gallery-in");
        requestAnimationFrame(() => image.classList.add("gallery-in"));
        buttons.forEach((item) => {
          const selected = item === button;
          item.classList.toggle("is-active", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        status.textContent = entry.title;
      } catch {
        if (request === revision)
          status.textContent =
            "This image could not be loaded. Please try another view.";
      } finally {
        if (request === revision) group.setAttribute("aria-busy", "false");
      }
    }),
  );
}

export function initComparison() {
  const compare = document.querySelector("[data-compare]");
  const input = compare.querySelector("input");
  const buttons = document.querySelectorAll("[data-compare-position]");
  const update = () => {
    const value = clampPosition(input.value);
    compare.style.setProperty("--pos", String(value));
    input.setAttribute("aria-valuetext", `${value}% of digital model visible`);
    buttons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.comparePosition) === value),
      ),
    );
  };
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      input.value = button.dataset.comparePosition;
      update();
    }),
  );
  input.addEventListener("input", update);
  update();
}

export function initDirections(layers) {
  const dialog = document.getElementById("doctor-modal");
  layers.register(dialog);
  document.querySelector(".dir-grid").replaceChildren(
    ...directions.map((direction, index) => {
      const button = el("button", "dir");
      button.type = "button";
      button.setAttribute("aria-haspopup", "dialog");
      button.append(
        el("span", "dir-top", null, [
          el("span", "dir-n", `0${index + 1}`),
          el("span", "direction-symbol", ["⌁", "✧", "◌"][index]),
        ]),
        el("span", "dir-body", null, [
          el("span", "dir-tag", direction.tag),
          el("span", "dir-title", direction.title),
          el("span", "dir-sum", direction.summary),
          el("span", "dir-cta", "Explore direction", [icon()]),
        ]),
      );
      button.addEventListener("click", () => {
        dialog.querySelector(".modal-mark").textContent = `0${index + 1}`;
        dialog.querySelector(".modal-eyebrow").textContent =
          `${direction.tag} / DIRECTION`;
        dialog.querySelector("#direction-title").textContent = direction.title;
        dialog.querySelector(".bio").textContent = direction.summary;
        dialog
          .querySelector(".bio-list")
          .replaceChildren(
            ...direction.items.map((item) => el("li", "", item)),
          );
        dialog.querySelector(".fact-focus").textContent =
          direction.tag.toLowerCase();
        dialog.querySelector("[data-book]").dataset.topic = direction.topic;
        layers.open(dialog);
      });
      return button;
    }),
  );
}

export function initSmile() {
  const svg = document.querySelector(".smile-svg");
  const ns = svg.namespaceURI;
  const mouth = document.createElementNS(ns, "path");
  mouth.setAttribute("d", "M40 150c60 90 460 90 520 0-60 130-460 130-520 0Z");
  mouth.classList.add("mouth");
  svg.append(mouth);
  for (let index = 0; index < 8; index++) {
    const tooth = document.createElementNS(ns, "rect");
    const height = 78 - Math.abs(index - 3.5) * 6;
    for (const [key, value] of Object.entries({
      x: 62 + index * 60,
      y: 150 - height / 2,
      width: 56,
      height,
      rx: 14,
      class: "tooth",
    }))
      tooth.setAttribute(key, String(value));
    svg.append(tooth);
  }
  const apply = (index) => {
    svg.style.setProperty("--tooth", moods[index].tooth);
    document
      .querySelector(".smile-preview")
      .style.setProperty("--tint", moods[index].tint);
    document.querySelector(".smile-mode").textContent = moods[index].label;
  };
  const buttons = moods.map((mood, index) => {
    const swatch = el("button", "sw", null, [
      el("i"),
      document.createTextNode(mood.label),
    ]);
    swatch.type = "button";
    swatch.style.setProperty("--c", mood.tooth);
    swatch.setAttribute("aria-pressed", String(index === 0));
    swatch.addEventListener("click", () => {
      buttons.forEach((item, i) =>
        item.setAttribute("aria-pressed", String(index === i)),
      );
      apply(index);
    });
    return swatch;
  });
  document.querySelector(".swatches").replaceChildren(...buttons);
  apply(0);
}
