---
name: content-projection-ng
description: Project content into Angular components using ng-content, select, and ngProjectAs, including named/multi-slot projection and optional template directives.
---

# Content Projection (`ng-content` / `ngProjectAs`)

This skill covers advanced content projection patterns used to build flexible, composable UI components.

## When to use
- A component (e.g. input, card, modal) needs to accept arbitrary consumer-provided markup in specific "slots" (label, left icon, footer, etc.).
- A consumer needs to project a component that doesn't natively match a `select` query, using `ngProjectAs` to make it match.
- A component needs to detect whether optional content was actually provided.

## Basic single slot
```html
<ng-content />
```
Projects everything not matched by a more specific `select` elsewhere in the template.

## Named slots with `select`
```html
<!-- ui-input template -->
<ng-content select="[slot=left]" />
<input #input ... />
<ng-content select="[slot=right]" />
<ng-content ngProjectAs="ui-label" />
```
Consumers target a slot either by a matching element/attribute selector:
```html
<ui-input>
  <span slot="left">$</span>
  <ui-label>Amount</ui-label>
</ui-input>
```

## `ngProjectAs`
Use when the element you want to project doesn't match the component's `select` selector by itself (e.g. you're projecting a generic `<div>` but the target slot expects `ui-label`):
```html
<div ngProjectAs="ui-label">Custom label markup</div>
```
`ngProjectAs` only affects *projection matching*; it does not change the rendered tag.

## Detecting whether content was projected
Combine with `contentChild()`/`viewChild()` (see `viewchild-contentchild-signals` skill) and check element children:
```typescript
constructor() {
  effect(() => {
    if (this.slotLeft().nativeElement.children.length > 0) {
      this.slotLeftClassValue.set(true); // toggles host class for spacing/layout
    }
  });
}
```
```html
<div #slotLeft class="ui-slot-left"><ng-content select="[slot=left]" /></div>
```

## Optional template directives (structural content projection)
For complex optional templates (custom item renderer, header, footer), define a directive applied to `<ng-template>` and read it with `contentChild()`:
```typescript
@Directive({ selector: 'ng-template[uiDropdownItemTmpl]' })
export class DropdownItemTmplDirective {
  templateRef = inject(TemplateRef);
}
```
```html
<!-- consumer -->
<ui-dropdown>
  <ng-template uiDropdownItemTmpl let-item>{{ item.label }}</ng-template>
</ui-dropdown>
```
```typescript
// component
itemTmpl = contentChild(DropdownItemTmplDirective);
```
```html
<!-- render with NgTemplateOutlet when provided, else a default row -->
@if (itemTmpl(); as tmpl) {
  <ng-container [ngTemplateOutlet]="tmpl.templateRef" [ngTemplateOutletContext]="{ $implicit: item }" />
} @else {
  <div class="default-item">{{ item[keyText()] }}</div>
}
```

## Pitfalls
- `select` selectors are evaluated once at compile time against the light DOM structure — dynamically changing an element's attribute after render won't re-route projection.
- Don't forget to import `NgTemplateOutlet` in the component's standalone `imports` array when using `[ngTemplateOutlet]`.
- Order of `<ng-content>` tags in the template determines render order, not the order elements appear in the consumer's markup.
