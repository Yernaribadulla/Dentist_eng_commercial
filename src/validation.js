export function validateRequest(draft) {
  const name = String(draft.name ?? "").trim();
  const phone = String(draft.phone ?? "").trim();
  const digits = phone.replace(/\D/g, "");
  const errors = {};
  if (name.length < 2 || name.length > 80)
    errors.name = "Enter a name between 2 and 80 characters.";
  if (
    !/^[+\d\s().-]+$/.test(phone) ||
    digits.length < 7 ||
    digits.length > 15 ||
    /\+/.test(phone.slice(1))
  ) {
    errors.phone =
      "Enter a phone number with 7–15 digits. Spaces and + are allowed.";
  }
  if (draft.consent !== true)
    errors.consent = "Please acknowledge that this is a local preview.";
  return { valid: Object.keys(errors).length === 0, errors, name, phone };
}

export function clampPosition(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 50;
}
