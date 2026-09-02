---
name: defer-blocks
description: Lazy-load template sections with Angular's @defer block, including triggers (viewport, idle, interaction), placeholder, loading, and error states.
---

# `@defer` Blocks

This skill covers deferring the loading and rendering of a template section (and the component code it depends on) until a trigger condition is met.

## When to use
- A heavy/rarely-visible component (charts, rich editors, large tables, secondary tabs) shouldn't be part of the initial bundle.
- Content only needs to render once it scrolls into the viewport, the browser is idle, or the user interacts with a trigger element.
- You want an explicit loading/placeholder/error UI for a lazily-loaded section.

## Basic syntax
```html
@defer {
  <app-gantt-chart [data]="ganttData()" />
} @placeholder {
  <div class="chart-placeholder">Chart will appear here</div>
} @loading (minimum 200ms) {
  <app-spinner />
} @error {
  <div class="chart-error">Failed to load chart</div>
}
```
- `@placeholder`: shown before the trigger fires (optional, defaults to nothing rendered).
- `@loading`: shown while the deferred dependencies are being fetched; supports `minimum`/`after` timing hints to avoid flicker.
- `@error`: shown if loading the deferred block's dependencies fails.

## Triggers
```html
<!-- Render when the placeholder scrolls into the viewport -->
@defer (on viewport) {
  <app-heavy-table [data]="rows()" />
} @placeholder {
  <div class="table-placeholder"></div>
}

<!-- Render when the browser is idle -->
@defer (on idle) {
  <app-recommendations />
}

<!-- Render on user interaction with a referenced element -->
@defer (on interaction(triggerBtn)) {
  <app-details-panel />
} @placeholder {
  <button #triggerBtn>Show details</button>
}

<!-- Render after another condition/signal becomes true -->
@defer (when isReady()) {
  <app-report />
}

<!-- Combine a timer with another trigger -->
@defer (on timer(2s)) {
  <app-promo-banner />
}
```
Other triggers: `on hover(ref)`, `on immediate`.

## Prefetching
Separate the trigger for *rendering* from the trigger for *fetching the code* ahead of time:
```html
@defer (on interaction; prefetch on idle) {
  <app-modal-content />
} @placeholder {
  <button>Open</button>
}
```
This downloads the deferred chunk during idle time but still waits for the interaction to actually render it.

## Guidelines for a component library
- Reserve `@defer` for genuinely optional/heavy UI (secondary panels, rarely-opened dialogs, charts) — don't wrap every component, since each `@defer` block becomes a separate lazy chunk with its own network round-trip.
- Always pair `on viewport`/`on interaction` triggers with a meaningful `@placeholder` sized close to the final content to avoid layout shift.
- `@defer` only affects the components/pipes/directives used **exclusively** inside the block — if a dependency is also used outside the block, it isn't deferred.

## Pitfalls
- Deferred content unmounts and loses state if its trigger condition becomes false again (depending on trigger) — don't rely on it for state that must persist.
- `on interaction`/`on hover` without an explicit element reference default to the placeholder itself — make sure a placeholder exists in that case.
- Testing `@defer` blocks requires explicitly flushing/triggering the deferred state in tests (e.g. Angular's `DeferBlockFixture` APIs) — see the `vitest-angular-components` skill.
