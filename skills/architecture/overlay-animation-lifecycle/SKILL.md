---
name: overlay-animation-lifecycle
description: Coordinate enter/leave CSS animations for overlay components (modal, popover, toast, tooltip) using animationend events and Promise.all, without the Angular animations package.
---

# Overlay Animation Lifecycle

This skill covers driving open/close animations for dynamically created overlay components (see `dynamic-component-creation`) using native CSS animations and the `animationend` DOM event, instead of `@angular/animations`.

## When to use
- Building/maintaining a modal, popover, toast, tooltip, or slide-in panel service that needs an enter animation on open and a coordinated exit animation on close (including an optional backdrop).
- Avoiding the runtime cost/complexity of `@angular/animations` for simple CSS keyframe-based transitions.

## Component contract
Each overlay-capable component implements two methods returning a CSS class name:
```typescript
export interface IAnimatable {
  getEnterAnimationClass(): AnimationTypes;
  getLeaveAnimationClass(): AnimationTypes;
}

// Modal container
getEnterAnimationClass(): AnimationTypes {
  return 'modal-enter';
}
getLeaveAnimationClass(): AnimationTypes {
  return 'modal-leave';
}
```
```scss
.modal-enter { animation: modal-fade-in 200ms ease-out; }
.modal-leave { animation: modal-fade-out 150ms ease-in; }
```

## Opening: apply the class, wait for it to finish
```typescript
open(): void {
  this.beforeOpened$.next(undefined);

  const componentElement = this.componentRef.location.nativeElement as HTMLElement;

  const onOpenEnd = (event: AnimationEvent) => {
    if (event.target === componentElement) {
      this.afterOpened$.next();
      componentElement.removeEventListener('animationend', onOpenEnd);
    }
  };
  componentElement.addEventListener('animationend', onOpenEnd);

  this.enterAnimationClass = this.componentRef.instance.getEnterAnimationClass();
  if (this.enterAnimationClass) {
    componentElement.classList.add(this.enterAnimationClass);
  }
}
```
Always check `event.target === componentElement` — `animationend` bubbles, so a nested animated child could otherwise fire the handler prematurely.

## Closing: coordinate multiple elements (component + backdrop) with `Promise.all`
```typescript
close(data: unknown = null): void {
  const animationPromises: Promise<void>[] = [];

  const createEndPromise = (element: HTMLElement): Promise<void> =>
    new Promise(resolve => {
      const onEnd = (event: AnimationEvent) => {
        if (event.target === element) {
          element.removeEventListener('animationend', onEnd);
          resolve();
        }
      };
      element.addEventListener('animationend', onEnd);
    });

  const componentElement = this.componentRef.location.nativeElement as HTMLElement;
  componentElement.classList.add(this.componentRef.instance.getLeaveAnimationClass());
  animationPromises.push(createEndPromise(componentElement));

  if (this.backdropElement) {
    this.backdropElement.classList.add('backdrop-leave');
    animationPromises.push(createEndPromise(this.backdropElement));
  }

  Promise.all(animationPromises).then(() => {
    this.afterClosed$.next(data);
    // safe to destroy/detach the component now — see dynamic-component-creation
  });
}
```

## Why this pattern over `@angular/animations`
- Zero runtime dependency; keyframes live entirely in SCSS alongside the component's other styles (see design tokens/theming skills).
- Works uniformly for components created dynamically outside a template (no `[@trigger]` binding needed on a manually inserted element).
- `Promise.all` naturally expresses "wait for N independent animations (component + backdrop) before finalizing teardown".

## Pitfalls
- If a component defines an enter/leave class but the corresponding CSS animation doesn't exist (or `animation-duration: 0`), `animationend` never fires and the promise never resolves — always verify the class has an actual `@keyframes` animation attached, not just a `transition`.
- Remove the event listener after it fires (`removeEventListener`) to avoid leaks if the same element is reused.
- Always destroy/remove the DOM node only **after** the close animation promise resolves, otherwise the exit animation is skipped.
