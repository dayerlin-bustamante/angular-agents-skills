---
name: modern-host-bindings
description: Bind dynamic classes, attributes, and ARIA properties via the @Component "host" object instead of @HostBinding/@HostListener decorators.
---

# Modern Host Bindings

This skill covers declaring dynamic host classes/attributes/ARIA declaratively in the `@Component` decorator's `host` object, avoiding `@HostBinding`/`@HostListener`.

## When to use
- A component's root element needs classes that depend on signal state (size, type, disabled, open/closed).
- A component needs ARIA roles/attributes reflecting internal state.
- You're reviewing a component that still uses `@HostBinding`/`@HostListener` decorators and want to modernize it.

## Dynamic classes from signals
```typescript
@Component({
  selector: 'ui-button',
  host: {
    '[class]': '"ui-button-size-" + this.size() + " ui-button-type-" + this.type()'
  }
})
export class ButtonComponent {
  size = input<ButtonSize>('medium');
  type = input<ButtonType>('primary');
}
```

## Conditional single classes
```typescript
host: {
  '[class.ui-input-disabled]': 'isDisabledClassValue()',
  '[class.ui-slot-left]': 'slotLeftClassValue()',
  '[class.ui-slot-right]': 'slotRightClassValue()',
  '[class.ui-input-has-value]': 'hasValueClassValue()',
  '[class]': '"ui-input-size-" + size()'
}
```
Both a computed `[class]` string binding and multiple `[class.x]` boolean bindings can coexist on the same host object.

## ARIA / attribute bindings
```typescript
host: {
  '[class]': '"ui-" + type() + " ui-dropdown-size-" + size()',
  '[class.ui-dropdown-disabled]': 'isDisabled()',
  '[attr.role]': '"listbox"',
  '[attr.aria-multiselectable]': 'multiple()'
}
```
Use `[attr.x]` for ARIA/attribute reflection (attributes can be `null`/removed), and `[class.x]`/`[class]` for CSS classes.

## Event bindings on the host
```typescript
host: {
  '(click)': 'onHostClick($event)',
  '(keydown.escape)': 'onEscape()'
}
```
This replaces `@HostListener('click', ['$event'])`.

## Migration from decorators
| Legacy | Modern |
|---|---|
| `@HostBinding('class.disabled') get isDisabled() {...}` | `host: { '[class.disabled]': 'isDisabled()' }` |
| `@HostBinding('attr.role') role = 'listbox';` | `host: { '[attr.role]': '"listbox"' }` |
| `@HostListener('click', ['$event']) onClick(e) {...}` | `host: { '(click)': 'onClick($event)' }` |

## Pitfalls
- Expressions in the `host` object are evaluated in the component's context, not a template — signals must still be called with `()`.
- Don't mix a `[class]` string binding that already contains a class with an unrelated `[class.foo]` binding that toggles the *same* class name — Angular merges them, but it's easy to introduce conflicting logic.
- Keep expressions in `host` small; if logic gets complex, compute it in a `computed()` signal and reference that signal's name in the binding.
