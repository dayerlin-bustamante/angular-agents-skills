---
name: control-flow-syntax
description: Use Angular's built-in template control flow (@if, @for, @switch) instead of the *ngIf/*ngFor/*ngSwitch structural directives.
---

# Built-in Control Flow Syntax

This skill covers Angular's native `@if`/`@for`/`@switch` block syntax, which replaces the `*ngIf`/`*ngFor`/`*ngSwitch` structural directives.

## When to use
- Writing or reviewing any Angular template (`.html` or inline template).
- Migrating a component still using `*ngIf`, `*ngFor`, or `*ngSwitch`.

## `@if` / `@else if` / `@else`
```html
@if (!iconOnly()) {
  <ng-container [ngTemplateOutlet]="labelTpl" />
} @else {
  <ui-button class="calendar-button" [size]="'small'" [type]="'clear'">
    <ui-icon [icon]="'ui-calendar'" />
  </ui-button>
}
```
```html
@if (formatHours() === '24') {
  <span class="format-hours">{{ formatHours() }}h</span>
} @else if (formatHours() === '12') {
  <div class="format-hours-buttons">
    <button class="format-hours-button">AM</button>
    <button class="format-hours-button">PM</button>
  </div>
} @else {
  <span>Unknown format</span>
}
```
Bind the condition result to a local template variable to avoid recomputation, using `as`:
```html
@if (itemTmpl(); as tmpl) {
  <ng-container [ngTemplateOutlet]="tmpl.templateRef" />
}
```

## `@for` with mandatory `track`
```html
@for (day of weekDays(); track $index) {
  <div class="day">{{ day }}</div>
}

@for (item of data(); track item.id; let i = $index) {
  <div class="tree-node">{{ item.label }}</div>
}
```
`track` is **required** (unlike `*ngFor`'s optional `trackBy`). Prefer tracking by a stable unique key (`item.id`) over `$index` whenever the list can reorder/filter, since `$index` tracking causes Angular to treat every reordering as a full replace.

Available implicit variables: `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.

`@for` also supports an `@empty` block:
```html
@for (item of items(); track item.id) {
  <div>{{ item.label }}</div>
} @empty {
  <div class="no-items">No items found</div>
}
```

## `@switch` / `@case` / `@default`
```html
@switch (currentView()) {
  @case ('month') {
    <gantt-month-view />
  }
  @case ('week') {
    <gantt-week-view />
  }
  @default {
    <gantt-day-view />
  }
}
```

## Migration checklist
| Legacy | Modern |
|---|---|
| `*ngIf="cond"` | `@if (cond) { ... }` |
| `*ngIf="cond; else tpl"` | `@if (cond) { ... } @else { ... }` |
| `*ngFor="let x of items; trackBy: fn"` | `@for (x of items; track x.id) { ... }` |
| `*ngSwitch` / `*ngSwitchCase` / `*ngSwitchDefault` | `@switch` / `@case` / `@default` |

Since these are compiler-level syntax (not directives), `CommonModule`/`NgIf`/`NgFor`/`NgSwitch` no longer need to be imported just to use them — only import `NgTemplateOutlet`/`NgClass`/etc. for directives you still explicitly use.

## Pitfalls
- Forgetting `track` in `@for` is a compile error — always pick a stable key, not an object reference that changes identity on every request.
- `@if...as` only binds within that block's scope, not in sibling `@else` blocks.
- Don't mix `*ngIf`/`*ngFor` and `@if`/`@for` in the same file inconsistently — migrate a whole template at once for readability.
