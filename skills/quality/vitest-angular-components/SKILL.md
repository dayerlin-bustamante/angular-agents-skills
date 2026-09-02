---
name: vitest-angular-components
description: Configure and write component tests for standalone Angular components using Vitest browser mode with Playwright, including TestBed setup and overlay cleanup.
---

# Testing Angular Components with Vitest (Browser Mode)

This skill covers setting up and writing tests for standalone Angular components using Vitest's browser mode (real browser via Playwright) instead of Karma/Jasmine.

## When to use
- Writing unit/component tests for a standalone Angular component/directive/service in this kind of workspace.
- Setting up a new library's test configuration to match the workspace's existing Vitest setup.
- Debugging flaky tests caused by leftover overlay DOM elements between tests.

## `vitest.config.ts` essentials
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1920, height: 1080 },
    },
    setupFiles: ['./setup-vitest.ts'],
  },
});
```

## `setup-vitest.ts` — global TestBed initialization
```typescript
import '@analogjs/vitest-angular/setup-zone'; // or the workspace's equivalent zoneless setup
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

// Global ResizeObserver mock — required since components query element size in effects
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  // Clean up any overlay elements dynamically appended to <body>
  // (see dynamic-component-creation / overlay-animation-lifecycle skills)
  document.querySelectorAll('.modal, .popover, .toast, .tooltip, .slide-panel, .overlay')
    .forEach(el => el.remove());
  document.body.classList.remove('overlay-open');
});
```
This cleanup step is critical: overlay services attach elements directly to `document.body` (outside the component fixture), so `TestBed`'s automatic teardown never removes them — leftover nodes leak state and z-index stacking into the next test.

## Writing a component test
```typescript
import { render, screen } from '@testing-library/angular'; // or TestBed.createComponent directly
import { ButtonComponent } from './ui-button.component';

describe('ButtonComponent', () => {
  it('applies the size and type host classes', async () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('size', 'big');
    fixture.componentRef.setInput('type', 'primary');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList.contains('ui-button-size-big')).toBe(true);
    expect(host.classList.contains('ui-button-type-primary')).toBe(true);
  });
});
```
Use `fixture.componentRef.setInput(name, value)` to set signal `input()`s from tests — direct property assignment (`component.size = 'big'`) does not work since inputs are read-only signals.

## Testing signal-driven effects/computed values
- Call `fixture.detectChanges()` (or `await fixture.whenStable()`) after changing an input to allow `effect()`/`afterRenderEffect()` to flush.
- For `computed()` values, just read `component.someComputed()` directly — no `detectChanges()` needed since computed signals update synchronously on read.

## Testing overlay-based components (modal/popover/toast)
- Trigger the service call (`modalService.create(...)`) inside the test, then query `document.body` (not the fixture) for the rendered overlay content, since it's mounted outside the fixture's DOM tree.
- Await the `afterOpened$`/`afterClosed$` observables exposed by the returned ref rather than arbitrary timeouts, to synchronize with the animation lifecycle (see `overlay-animation-lifecycle`).

## Pitfalls
- Forgetting the `afterEach` overlay cleanup causes intermittent failures when tests run in sequence (duplicate `role="dialog"` elements, click interception by a stale backdrop).
- Testing `@defer` blocks requires explicitly resolving the deferred state (e.g. via Angular's testing utilities for defer blocks) — a plain `detectChanges()` will not render the deferred content on its own.
- Since tests run in a real browser (Playwright/Chromium), avoid Node-only APIs in test files; use browser-safe utilities.
