---
name: signals-effects
description: Use effect() and afterRenderEffect() correctly for signal-driven side effects, replacing ngOnChanges, and avoiding infinite update loops.
---

# Signal Effects (`effect()` / `afterRenderEffect()`)

This skill covers running side effects in response to signal changes, and choosing between `effect()` and `afterRenderEffect()`.

## When to use
- You need to react to a signal/input change with a side effect that is **not** a derived value (DOM manipulation, calling a service, syncing to a non-signal API).
- You need logic that must run **after** the DOM has been updated/rendered (measuring elements, `requestAnimationFrame` work, `ResizeObserver` setup).
- You are replacing legacy `ngOnChanges` lifecycle logic in a component that has been migrated to signal inputs.

## `effect()`
Runs in the reactive context, tracking any signals read synchronously inside it. Must be created in an injection context (constructor, or field initializer of a component/directive/service).

```typescript
constructor() {
  effect(() => {
    if (this.slotLeft().nativeElement.children.length > 0) {
      this.slotLeftClassValue.set(true);
    }
  });
}
```

Rules:
- Only for side effects — do not use it to compute a value another part of the component needs (use `computed()` instead).
- Avoid writing to a signal that the same effect also reads — this causes infinite loops. If you must write to a signal inside an effect, make sure it's not one of the effect's own dependencies.
- Effects run once immediately on creation, then again whenever a tracked signal changes.

## `afterRenderEffect()`
Same reactive semantics as `effect()`, but guaranteed to run after Angular has finished rendering the current change detection cycle. Use it for anything that reads the DOM or needs layout to be settled.

```typescript
constructor() {
  afterRenderEffect(() => {
    const displayedColumns: string[] = this.displayedColumns();
    const lockedColumns: string[] = this.lockedColumns();
    this.setTableElements();
    requestAnimationFrame(() => {
      this.minTableWidth.set(this.getColumnsWidth(true));
    });
  });
}
```

Use this instead of `effect()` whenever the callback:
- Reads `ElementRef`/`nativeElement` geometry (`offsetWidth`, `getBoundingClientRect`).
- Needs to run after `viewChild()`/`contentChild()` results are guaranteed to reflect the latest template.

## Replacing `ngOnChanges`
| Legacy pattern | Signals replacement |
|---|---|
| `ngOnChanges(changes)` reacting to one `@Input()` | `effect(() => { const v = this.myInput(); ... })` |
| `ngOnChanges` computing a derived value | `computed()` — no effect needed |
| `ngOnChanges` doing DOM work after an input change | `afterRenderEffect()` |

## Pitfalls
- Don't call `.set()` on the same signal you're reading in the same `effect()` without an `untracked()` guard — infinite loop risk.
- Don't use `effect()` for value derivation reachable via `computed()` — effects can't be used as inputs to templates and add unnecessary reactivity overhead.
- Remember `effect()`/`afterRenderEffect()` need an injection context; if created outside the constructor (e.g. in a method), pass `{ injector }` explicitly.
