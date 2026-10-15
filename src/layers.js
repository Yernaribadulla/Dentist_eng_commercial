import { motionEnabled } from "./motion.js";

// Native dialogs provide browser-managed inert background and focus containment.
export function createLayers() {
  const states = new Map();
  let active = null;
  function register(dialog, onChange = () => {}) {
    states.set(dialog, {
      timer: 0,
      frame: 0,
      returnTo: null,
      onChange,
      version: 0,
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close(dialog);
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close(dialog);
    });
    dialog.querySelector(".x")?.addEventListener("click", () => close(dialog));
  }
  function unlock() {
    if (!active) document.body.classList.remove("modal-open");
  }
  function finish(dialog, restoreFocus) {
    const state = states.get(dialog);
    clearTimeout(state.timer);
    cancelAnimationFrame(state.frame);
    dialog.classList.remove("open", "is-closing");
    if (dialog.open) dialog.close();
    if (active === dialog) active = null;
    state.onChange(false);
    unlock();
    if (restoreFocus && state.returnTo?.isConnected)
      state.returnTo.focus({ preventScroll: true });
  }
  function open(dialog) {
    const state = states.get(dialog);
    if (!state) return;
    let origin = document.activeElement;
    if (active && active !== dialog) {
      origin = states.get(active).returnTo;
      finish(active, false);
    }
    clearTimeout(state.timer);
    cancelAnimationFrame(state.frame);
    state.version++;
    const version = state.version;
    if (!dialog.open) {
      state.returnTo = origin;
      dialog.showModal();
    }
    active = dialog;
    document.body.classList.add("modal-open");
    dialog.classList.remove("is-closing");
    state.onChange(true);
    state.frame = requestAnimationFrame(() => {
      if (state.version === version && dialog.open)
        dialog.classList.add("open");
    });
    const focus = dialog.querySelector("[data-initial-focus], .x, button");
    focus?.focus({ preventScroll: true });
  }
  function close(dialog, { immediate = false, restoreFocus = true } = {}) {
    const state = states.get(dialog);
    if (!state || !dialog.open) return;
    clearTimeout(state.timer);
    cancelAnimationFrame(state.frame);
    const version = ++state.version;
    dialog.classList.remove("open");
    dialog.classList.add("is-closing");
    if (immediate || !motionEnabled()) finish(dialog, restoreFocus);
    else
      state.timer = setTimeout(() => {
        if (version === state.version) finish(dialog, restoreFocus);
      }, 300);
  }
  return { register, open, close };
}
