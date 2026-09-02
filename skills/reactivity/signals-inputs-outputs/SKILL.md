---
name: signals-inputs-outputs
description: Migrate Angular @Input()/@Output() decorators to the modern signal-based input(), output(), and model() APIs with defaults, required fields, and transforms.
---

# Signals-based Inputs & Outputs

This skill helps write or refactor Angular component inputs/outputs using the Angular 17+ functional API instead of the `@Input()`/`@Output()` decorators.

## When to use
- Creating a new standalone component that needs configurable properties or events.
- Refactoring a component that still uses `@Input()`/`@Output()` decorators.
- Needing two-way bound properties (replacement for `@Input() x` + `@Output() xChange`).

## Key APIs

### `input()`
```typescript
// Optional input with a default value
size = input<'small' | 'medium' | 'big'>('medium');

// Required input (no default, must be provided by the consumer)
label = input.required<string>();

// Input with a transform function (e.g. coerce string attribute to boolean)
disabled = input(false, { transform: booleanAttribute });

// Alias the public input name
value = input<string>('', { alias: 'inputValue' });
```
Inputs are read-only signals. Read them with `this.size()`, never assign directly.

### `output()`
```typescript
calendarOpened = output<void>();
searchEvent = output<string>();
rowSelected = output<any>();

// Emitting
this.calendarOpened.emit();
this.searchEvent.emit(this.searchText());
```
`output()` replaces `@Output() x = new EventEmitter<T>()`. No need to import `EventEmitter` for this case.

### `model()` (two-way binding)
```typescript
// Component
checked = model<boolean>(false);

// Usage in template: [(checked)]="isChecked"
this.checked.set(true); // updates the bound parent value automatically
```
Use `model()` only when the component genuinely needs to mutate a parent-bound value (e.g. checkbox, toggle). Prefer plain `input()` + `output()` when the parent should stay in control of the source of truth.

## Migration checklist
1. Replace `@Input() foo: T;` → `foo = input<T>();` (or `input.required<T>()` if it had no default and was always provided).
2. Replace `@Output() foo = new EventEmitter<T>();` → `foo = output<T>();`.
3. Remove `EventEmitter`/`Input`/`Output` imports that are no longer used.
4. Update every internal read of `this.foo` to `this.foo()` (inputs are signals now).
5. Update templates: input signals are read the same way in bindings (`[value]="foo()"` if read inside a getter/computed, but plain property bindings from the parent don't need `()`— only accessed from within the component's own TS/template as a signal call).
6. If the input value was watched via `ngOnChanges`, replace with `effect()` reading the signal, or `computed()` if it's a pure derivation (see the `signals-effects` and `signals-state-management` skills).

## Example
```typescript
@Component({ selector: 'ui-button', ... })
export class ButtonComponent {
  size = input<ButtonSize>('medium');
  type = input<ButtonType>('primary');
  buttonType = input<'button' | 'submit' | 'reset'>('button');
}
```

## Pitfalls
- Do not use `input()` results as a mutable variable — they are read-only; use `signal()` for local mutable state instead.
- Don't wrap `input()` calls in `effect()` unnecessarily if a `computed()` would do — see `signals-state-management`.
- `model()` creates an implicit two-way contract with the parent; document it clearly since it's easy to miss in code review.
