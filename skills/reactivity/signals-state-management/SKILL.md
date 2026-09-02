---
name: signals-state-management
description: Manage local Angular component state reactively using signal(), computed(), and linkedSignal(), and know when to use each.
---

# Signals State Management

This skill covers reactive local state in Angular components using the Signals primitives `signal()`, `computed()`, and `linkedSignal()`.

## When to use
- A component needs mutable internal state (selection, open/closed, search text, loading flags).
- A value is fully derived from other signals/inputs (should never be set directly).
- A piece of state should reset/re-sync whenever an upstream signal (often an `input()`) changes, but can also be locally overridden afterward.

## Key APIs

### `signal()` — mutable state
```typescript
selectedItems = signal<any[]>([]);
searchText = signal<string>('');
isLoading = signal<boolean>(false);

// Mutating
this.searchText.set('new value');
this.selectedItems.update(items => [...items, newItem]);
```
Use `signal()` for state that is genuinely owned by the component and changes over time (event handlers, user interaction).

### `computed()` — derived, read-only state
```typescript
isAllSelected = computed<boolean>(() =>
  !this.isLoading() && this.flatData().length > 0 &&
  this.flatData().every(item =>
    this.selectedItems().findIndex(x => x[this.keyValue()] === item[this.keyValue()]) !== -1
  )
);

hasFooter = computed<boolean>(() =>
  Object.keys(this.templates()).some(key => this.templates()[key].footerTemplate())
);
```
Rules:
- Never call `.set()`/`.update()` on a `computed()` — it has no setter.
- Keep the function pure — no side effects, no `console.log` mutating outside state.
- Prefer `computed()` over `effect()` whenever the goal is "produce a value", not "perform an action".

### `linkedSignal()` — resettable/derived-but-overridable state
```typescript
// Datepicker: selectedDate starts synced to the `date` input,
// but the user can pick a different date locally afterward.
date = signal<CalendarSelectedDatesNullable>(null);
selectedDate = linkedSignal<CalendarSelectedDatesNullable>(() => this.date());
```
Use `linkedSignal()` instead of `computed()` when:
- The value should re-initialize whenever the source signal changes, AND
- The component also needs to write a *different* value locally afterward (something `computed()` cannot do, since it's read-only).

Common use case: a component receives a value via `input()`, wants to let the user modify a local working copy, but reset that working copy whenever the input changes (e.g. date pickers, editable form drafts).

## Decision guide
| Need | Use |
|---|---|
| Mutable state owned by the component | `signal()` |
| Value 100% derived from other signals, never set directly | `computed()` |
| Value initialized from another signal, but can diverge afterward | `linkedSignal()` |

## Pitfalls
- Don't put expensive/impure logic inside `computed()` — it re-runs on every dependency change.
- Don't use `signal()` for something that's purely derived — duplicating state via `effect()` + `signal()` when `computed()` would work leads to sync bugs.
- Remember `linkedSignal()` still returns a writable signal — treat writes as deliberate local overrides, not permanent replacements of the source signal.
