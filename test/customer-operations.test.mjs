// Content contract of the customer-operations review page: every in-page
// link has a target, every cross-reference in the deliverables opens a
// deliverable (and a gate file) that exists, and the quoted testimonial is
// a verbatim cut of the one in site.ts. Imports the TS modules directly —
// Node strips types natively.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The content modules import each other without extensions (`./site`), as
// the bundler resolves them; Node's type stripping doesn't, so a resolve
// hook adds the `.ts` before the modules load (hence the dynamic imports).
registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
        return next(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const { anchors, customerOperationsPath, deliverables, hero, questions, reviewer, story } =
  await import("../src/content/customerOperations.ts");
const { review, testimonials } = await import("../src/content/site.ts");

const anchorIds = new Set(Object.values(anchors));

test("the hero doors target sections of the page", () => {
  for (const door of Object.values(hero.doors)) {
    const [path, id] = door.href.split("#");
    assert.equal(path, customerOperationsPath, door.href);
    assert.ok(anchorIds.has(id), `no section with id "${id}" for ${door.href}`);
  }
});

test("the home page's customer relations context leads to the page", () => {
  const entry = review.context.items.find((item) => item.name === "Customer relations");
  assert.ok(entry, "no Customer relations context on the home page");
  assert.equal(entry.href, customerOperationsPath);
  assert.equal(entry.ariaLabel, undefined, "a page link keeps its visible name");
});

test("every cross-reference opens an existing deliverable and gate file", () => {
  const keys = new Set(deliverables.items.map((item) => item.key));
  const cases = new Set(deliverables.checks.cases.map((c) => c.key));
  const texts = [
    ...deliverables.summary.bullets,
    ...deliverables.findings.evidence.map((row) => row.value),
    ...deliverables.design.columns.map((row) => row.value),
    ...deliverables.roadmap.step.meta.map((row) => row.value),
  ];
  let refs = 0;
  for (const text of texts) {
    for (const part of text) {
      if (typeof part === "string") continue;
      refs += 1;
      assert.ok(keys.has(part.go), `xref ${part.label} opens unknown deliverable "${part.go}"`);
      if (part.caseKey !== undefined) {
        assert.equal(part.go, "checks", `xref ${part.label} names a gate file but opens "${part.go}"`);
        assert.ok(cases.has(part.caseKey), `xref ${part.label} opens unknown gate "${part.caseKey}"`);
      }
    }
  }
  assert.ok(refs >= 5, "the excerpts lost their cross-references");
});

test("the story has the trigger first, then three illustrated steps", () => {
  assert.equal(story.cards[0].kind, "trigger");
  const steps = story.cards.filter((card) => card.kind === "step");
  assert.equal(steps.length, 3);
  assert.deepEqual(
    steps.map((card) => card.art),
    ["team", "pattern", "conditions"],
    "each sprite panel is used once, left to right",
  );
  assert.equal(new Set(story.cards.map((card) => card.name)).size, story.cards.length);
});

test("the quoted testimonial is a verbatim cut of the one in site.ts", () => {
  const full = testimonials.items.find((item) => item.name === reviewer.testimonial.name);
  assert.ok(full, `no testimonial by ${reviewer.testimonial.name} in site.ts`);
  assert.ok(full.quote.startsWith(reviewer.testimonial.quote), "the cut is not the start of the full quote");
  assert.equal(reviewer.testimonial.role, full.role);
  assert.equal(reviewer.testimonial.href, full.href);
});

test("questions are numbered in order and all shown", () => {
  assert.deepEqual(
    questions.items.map((item) => item.num),
    questions.items.map((_, index) => String(index + 1).padStart(2, "0")),
  );
  assert.equal(questions.visibleCount, undefined);
});
