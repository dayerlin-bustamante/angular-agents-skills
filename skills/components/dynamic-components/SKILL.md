---
name: dynamic-components
description: Create and mount Angular components dynamically at runtime using createComponent() and ApplicationRef, and tear them down safely (used for modals, popovers, toasts).
---

# Dynamic Component Creation

This skill covers programmatically creating and mounting Angular components outside the normal template tree — the foundation of overlay services (modal, popover, toast, tooltip).

## When to use
- Building a service that opens a modal/dialog/toast/popover imperatively (`.open(SomeComponent, config)`).
- Any UI that must be rendered detached from its "logical" parent component in the DOM (e.g. attached to `document.body` to escape `overflow: hidden`/z-index contexts).

## Creating a component
```typescript
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly applicationRef = inject(ApplicationRef);
  private readonly injector = inject(Injector);

  create(component: Type<unknown>, config?: unknown): DialogRef {
    const dialogRef = new DialogRef(/* ... */);

    const componentRef = createComponent(component, {
      environmentInjector: this.applicationRef.injector,
      elementInjector: Injector.create({
        providers: [{ provide: DIALOG_REF, useValue: dialogRef }],
        parent: this.injector,
      }),
    });

    // Attach the host view to change detection
    this.applicationRef.attachView(componentRef.hostView);

    // Mount into the DOM (typically document.body for overlays)
    document.body.appendChild(componentRef.location.nativeElement);

    dialogRef.componentRef = componentRef;
    return dialogRef;
  }
}
```

## Key pieces
- `createComponent(Component, options)` — instantiates the component and its view without a host template.
- `ApplicationRef.attachView(hostView)` — registers the view with Angular's change detection so signal/input changes are picked up. **Required**, otherwise the component silently never updates.
- `elementInjector` (via `Injector.create`) — the mechanism for providing per-instance tokens (like a `DIALOG_REF` the created component can `inject()` optionally — see `injection-tokens-pattern`).
- `componentRef.location.nativeElement` — the actual DOM element to insert manually into the document.

## Passing data in and getting data out
- **In**: provide via `elementInjector`, or set `componentRef.setInput('propName', value)` for signal `input()`s.
- **Out**: expose a `Subject`/`Observable` (`afterClosed$`) on the returned ref object; the created component calls `dialogRef.close(result)` which the ref translates into emitting that subject.

## Teardown
```typescript
destroy(componentRef: ComponentRef<unknown>): void {
  this.applicationRef.detachView(componentRef.hostView);
  componentRef.destroy();
  componentRef.location.nativeElement.remove();
}
```
Always: detach the view **before** destroying, and remove the DOM node explicitly (Angular does not do this automatically for manually-appended elements).

## Coordinating with route changes
Overlay services in this codebase inject `Router` and subscribe to navigation events to auto-close the dialog if the user navigates away, preventing orphaned overlay elements:
```typescript
private readonly router = inject(Router);
this.router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe(() => this.close());
```

## Pitfalls
- Forgetting `attachView`/`detachView` causes either “ghost” components that never update, or memory leaks after destroy.
- Not removing the DOM node on destroy leaves stale, invisible overlay elements accumulating in `document.body` (a common source of flaky tests — see the `vitest-angular-components` skill's overlay cleanup notes).
- Always destroy in a `finally`/guaranteed path (e.g. also on component `DestroyRef.onDestroy`) so a thrown error during open doesn't leak the component.
