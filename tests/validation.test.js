import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRequest, clampPosition } from "../src/validation.js";
import { gallery, topics, directions } from "../src/content.js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const valid = {
  name: "Sample Guest",
  phone: "+7 700 000 00 00",
  consent: true,
};
test("valid request trims fields and supports international numbers", () => {
  const result = validateRequest({
    ...valid,
    name: " Sample Guest ",
    phone: " +44 (20) 1234-5678 ",
  });
  assert.equal(result.valid, true);
  assert.equal(result.name, "Sample Guest");
  assert.equal(result.phone, "+44 (20) 1234-5678");
});
test("name is required and bounded", () => {
  for (const name of ["", " ", "A", "a".repeat(81)])
    assert.equal(validateRequest({ ...valid, name }).valid, false);
});
test("name is data, not HTML that needs interpolation", () => {
  const name = '\"><img src=x onerror=alert(1)>';
  assert.equal(validateRequest({ ...valid, name }).name, name);
});
test("phone numbers reject short, long, alphabetic and embedded-plus values", () => {
  for (const phone of [
    "",
    "12345",
    "1".repeat(16),
    "call me 1234567",
    "7700+0000000",
    "++77000000000",
  ])
    assert.equal(validateRequest({ ...valid, phone }).valid, false, phone);
});
test("acknowledgment is required and errors can coexist", () => {
  const result = validateRequest({ name: "", phone: "", consent: false });
  assert.deepEqual(Object.keys(result.errors), ["name", "phone", "consent"]);
});
test("comparison is finite and bounded", () => {
  for (const [value, expected] of [
    [-20, 0],
    [140, 100],
    ["76", 76],
    [NaN, 50],
    [Infinity, 50],
    ["oops", 50],
  ])
    assert.equal(clampPosition(value), expected);
});
test("gallery references real local optimized assets", () => {
  assert.equal(gallery.length, 4);
  for (const item of gallery) {
    assert.equal(existsSync(resolve(item.src)), true);
    assert.match(item.src, /optimized\/.+\.webp$/);
    assert.ok(item.alt);
  }
  assert.equal(directions.length, 3);
  assert.equal(new Set(topics).size, topics.length);
});
test("local HTML and stylesheet asset references exist", () => {
  for (const file of ["index.html", "styles.css", "editorial.css"]) {
    const text = readFileSync(file, "utf8");
    const paths = [
      ...text.matchAll(
        /(?:src|href)="(assets\/[^"#?]+)"|url\(["']?(assets\/[^"')]+)["']?\)/g,
      ),
    ];
    for (const match of paths)
      assert.ok(
        existsSync(match[1] || match[2]),
        `${file}: ${match[1] || match[2]}`,
      );
  }
});
