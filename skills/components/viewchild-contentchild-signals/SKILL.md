---
name: viewchild-contentchild-signals
description: Query view and content children with the signal-based viewChild(), viewChildren(), contentChild(), and contentChildren() functions instead of decorators.
---

# Signal-based ViewChild / ContentChild Queries

This skill covers reading template references and projected content using the functional query API.

## When to use
- A component needs a reference to a native element or child component/directive in its own template (`viewChild`).
- A component needs to detect content the consumer projected into it via `<ng-content>` (`contentChild`), e.g. optional header/footer templates.
- Multiple matching elements need to be queried at once (`viewChildren`/`contentChildren`).

## `viewChild()` / `viewChild.required()`
```typescript
// Optional — returns Signal<ElementRef<HTMLInputElement> | undefined>
inputElementMaybe = viewChild<ElementRef<HTMLInputElement>>('input');

// Required — throws if not found, returns Signal<ElementRef<HTMLInputElement>>
inputElement = viewChild.required<ElementRef<HTMLInputElement>>('input');
slotLeft = viewChild.required<ElementRef<HTMLDivElement>>('slotLeft');
```
Use `.required()` whenever the template reference is guaranteed to exist for the lifetime of the component (e.g. it's not behind an `@if`). Use the plain (optional) form when the target may be conditionally rendered.

## `contentChild()`
```typescript
headerTmpl = contentChild<DropdownHeaderTmplDirective>(DropdownHeaderTmplDirective);
itemTmpl = contentChild<DropdownItemTmplDirective>(DropdownItemTmplDirective);
noItemsTmpl = contentChild<DropdownNoItemsTmplDirective>(DropdownNoItemsTmplDirective);
```
Typical pattern: define a structural/attribute directive (e.g. `*uiDropdownItemTmpl`) that consumers apply to an `<ng-template>`, then read it with `contentChild()` to know whether a custom template was provided and to get its `TemplateRef`.

## `viewChildren()` / `contentChildren()`
Return a `Signal<ReadonlyArray<T>>` that updates automatically when the matched set changes (e.g. items added/removed via `@for`).

```typescript
rows = viewChildren<ElementRef<HTMLTableRowElement>>('row');
```

## Reading query signals reactively
Because these are signals, they can be safely read inside `computed()` or `effect()`/`afterRenderEffect()`:
```typescript
constructor() {
  effect(() => {
    if (this.slotLeft().nativeElement.children.length > 0) {
      this.slotLeftClassValue.set(true);
    }
  });
}
```

## Migration from decorators
| Legacy | Signal-based |
|---|---|
| `@ViewChild('input') inputElement!: ElementRef;` | `inputElement = viewChild.required<ElementRef>('input');` |
| `@ViewChildren(Item) items!: QueryList<Item>;` | `items = viewChildren(Item);` |
| `@ContentChild(Tmpl) tmpl?: Tmpl;` | `tmpl = contentChild(Tmpl);` |
| `@ContentChildren(Tmpl) tmpls!: QueryList<Tmpl>;` | `tmpls = contentChildren(Tmpl);` |

All reads change from `this.inputElement` to `this.inputElement()`.

## Pitfalls
- Query signals are only populated after the component's view/content has been initialized — reading them in the constructor body (outside `effect()`) will return `undefined`/throw for `.required()`.
- Don't use `ngAfterViewInit`/`ngAfterContentInit` alongside signal queries just to "wait for them" — use `effect()`/`afterRenderEffect()`, which already re-run once the query resolves.
- `QueryList`-specific APIs (`.changes` Observable) don't exist on signal queries — read the signal reactively instead of subscribing.
