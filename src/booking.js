import { el, icon } from "./dom.js";
import { topics } from "./content.js";
import { validateRequest } from "./validation.js";

// This repository has no booking backend. The flow is an explicit local preview.
export function initBooking(layers) {
  const dialog = document.getElementById("booking-modal");
  const body = dialog.querySelector(".booking-body");
  const back = dialog.querySelector(".back");
  let draft;
  const reset = () => {
    draft = { topic: "", name: "", phone: "", consent: false, step: 1 };
  };
  reset();
  layers.register(dialog, (open) => {
    if (!open) {
      reset();
      body.replaceChildren();
    }
  });

  function heading(text) {
    const title = el("h2", "", text);
    title.id = "booking-step-title";
    title.tabIndex = -1;
    dialog.setAttribute("aria-labelledby", title.id);
    return title;
  }
  function render() {
    dialog.querySelector(".booking-step").textContent = `0${draft.step} / 03`;
    dialog.querySelector(".booking-progress i").style.width =
      `${(draft.step / 3) * 100}%`;
    back.hidden = draft.step === 1 || draft.step === 3;
    body.replaceChildren();
    if (draft.step === 1) {
      const choices = el("div", "choice-list");
      for (const topic of topics) {
        const choice = el("button", "choice", topic, [icon()]);
        choice.type = "button";
        choice.addEventListener("click", () => {
          draft.topic = topic;
          draft.step = 2;
          render();
        });
        choices.append(choice);
      }
      body.append(
        heading("What brings you here?"),
        el(
          "p",
          "summary",
          "Choose a direction. We will help you explore the next step.",
        ),
        choices,
      );
    } else if (draft.step === 2) {
      const form = el("form", "booking-form");
      form.noValidate = true;
      const fields = {};
      for (const [key, title, type, placeholder] of [
        ["name", "Your name", "text", "Sample name"],
        ["phone", "Phone number", "tel", "+7 700 000 00 00"],
      ]) {
        const label = el("label", "field", title);
        label.htmlFor = `booking-${key}`;
        const input = el("input");
        input.id = label.htmlFor;
        input.name = key;
        input.type = type;
        input.autocomplete = key === "name" ? "name" : "tel";
        input.placeholder = placeholder;
        input.maxLength = key === "name" ? 80 : 40;
        input.required = true;
        input.value = draft[key];
        const error = el("span", "field-error");
        error.id = `${input.id}-error`;
        error.setAttribute("aria-live", "polite");
        input.setAttribute("aria-describedby", error.id);
        input.addEventListener("input", () => {
          draft[key] = input.value;
          input.removeAttribute("aria-invalid");
          error.textContent = "";
        });
        label.append(input, error);
        form.append(label);
        fields[key] = { input, error };
      }
      const consent = el("input");
      consent.id = "booking-consent";
      consent.type = "checkbox";
      consent.checked = draft.consent;
      consent.required = true;
      const consentError = el("span", "field-error");
      consentError.id = "booking-consent-error";
      consentError.setAttribute("aria-live", "polite");
      consent.setAttribute("aria-describedby", consentError.id);
      consent.addEventListener("change", () => {
        draft.consent = consent.checked;
        consent.removeAttribute("aria-invalid");
        consentError.textContent = "";
      });
      const acknowledgment = el("label", "consent", null, [
        consent,
        el(
          "span",
          "",
          "I understand this is a local demo and no appointment will be booked.",
        ),
      ]);
      const confirm = el("button", "btn confirm", "Preview request", [icon()]);
      confirm.type = "submit";
      form.append(acknowledgment, consentError, confirm);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        // Read fields on submit too, including browser autofill.
        draft.name = fields.name.input.value;
        draft.phone = fields.phone.input.value;
        draft.consent = consent.checked;
        const result = validateRequest(draft);
        for (const [key, field] of Object.entries(fields)) {
          field.error.textContent = result.errors[key] || "";
          field.input.setAttribute(
            "aria-invalid",
            String(Boolean(result.errors[key])),
          );
        }
        consentError.textContent = result.errors.consent || "";
        consent.setAttribute(
          "aria-invalid",
          String(Boolean(result.errors.consent)),
        );
        if (!result.valid) {
          (fields[Object.keys(result.errors)[0]]?.input || consent).focus();
          return;
        }
        draft.name = result.name;
        draft.phone = result.phone;
        draft.step = 3;
        render();
      });
      body.append(
        heading("Make it personal."),
        el("p", "summary", `Direction: ${draft.topic}`),
        form,
      );
    } else {
      const facts = el("dl", "facts");
      for (const [label, value] of [
        ["Direction", draft.topic],
        ["Name", draft.name],
        ["Phone", draft.phone],
      ])
        facts.append(
          el("div", "", null, [el("dt", "", label), el("dd", "", value)]),
        );
      const done = el("button", "btn", "Close preview", [icon()]);
      done.type = "button";
      done.addEventListener("click", () => layers.close(dialog));
      body.append(
        heading("Your preview is ready."),
        el(
          "p",
          "summary",
          "Nothing has been sent or booked. This preview stays in this browser tab and is cleared when you close it.",
        ),
        facts,
        done,
      );
    }
    body.classList.remove("step-in");
    requestAnimationFrame(() => body.classList.add("step-in"));
    dialog.querySelector(".modal").scrollTop = 0;
    if (dialog.open) body.querySelector("h2").focus({ preventScroll: true });
  }
  back.addEventListener("click", () => {
    if (draft.step > 1) {
      draft.step--;
      render();
    }
  });
  return (topic) => {
    reset();
    if (topics.includes(topic)) {
      draft.topic = topic;
      draft.step = 2;
    }
    render();
    layers.open(dialog);
    body.querySelector("h2").focus({ preventScroll: true });
  };
}
