export function el(tag, className = "", text = null, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== null) node.textContent = text;
  node.append(...children);
  return node;
}
export function icon(id = "i-arrow") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS(svg.namespaceURI, "use");
  svg.classList.add("i");
  svg.setAttribute("aria-hidden", "true");
  use.setAttribute("href", `#${id}`);
  svg.append(use);
  return svg;
}
export function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preferences are optional. */
  }
}
