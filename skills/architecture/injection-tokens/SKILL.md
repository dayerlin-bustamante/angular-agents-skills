---
name: injection-tokens
description: Define and consume typed InjectionTokens for configuration objects and adapter/strategy patterns, including optional injection with inject().
---

# Injection Tokens Pattern

This skill covers creating and using typed `InjectionToken`s for configuration and pluggable adapter/strategy implementations, combined with the functional `inject()` API.

## When to use
- A library needs a way for consumers to provide configuration at the app/module level (e.g. default modal settings).
- A component needs a pluggable "adapter" whose implementation is swapped per-feature (e.g. data source adapters for a dropdown).
- A component needs to optionally read something that only exists in certain contexts (e.g. a dialog reference that's only present when opened via an overlay service).

## Defining a configuration token
```typescript
export interface IModalConfiguration {
  closeOnBackdropClick: boolean;
  backdropClass?: string;
}

export const MODAL_CONFIGURATION: InjectionToken<IModalConfiguration> =
  new InjectionToken<IModalConfiguration>('MODAL_CONFIGURATION');
```
Consumers provide a value at bootstrap or feature level:
```typescript
providers: [
  { provide: MODAL_CONFIGURATION, useValue: { closeOnBackdropClick: true } }
]
```
Service consumes it:
```typescript
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly modalConfig = inject(MODAL_CONFIGURATION);
}
```

## Adapter / strategy token pattern
Used when a component needs an interchangeable implementation without hard-coding which one:
```typescript
export interface IDropdownAdapter {
  fetchItems(query: string): Observable<any[]>;
}

export const DropdownAdapterToken = new InjectionToken<IDropdownAdapter>('DropdownAdapter');
```
```typescript
export class DropdownComponent {
  readonly dropdownAdapter = inject(DropdownAdapterToken);
}
```
Consumers plug in a concrete implementation per usage:
```typescript
providers: [
  { provide: DropdownAdapterToken, useClass: RemoteDropdownAdapter }
]
```

## Optional injection
Use `{ optional: true }` when a token is only available in some contexts (e.g. component rendered directly vs. rendered inside an overlay):
```typescript
private readonly dialogRef = inject(DIALOG_REF, { optional: true });

close(): void {
  this.dialogRef?.close();
}
```
Always guard usage with `?.` or an explicit `if` check when injecting optionally.

## Other `inject()` flags
```typescript
inject(SomeService, { self: true });     // only look at the current injector
inject(SomeService, { skipSelf: true }); // skip the current injector, look at ancestors
inject(SomeService, { host: true });     // stop searching at the host component boundary
```

## Guidelines
- Prefer an `InjectionToken` over an abstract class when the "contract" is a plain interface (interfaces don't exist at runtime, so they can't be used as DI tokens directly).
- Name tokens in SCREAMING_SNAKE_CASE-ish convention matching the library prefix (`MODAL_CONFIGURATION`) for configuration, and `PascalCase + Token` suffix for adapters (`DropdownAdapterToken`) — but stay consistent within one library.
- Always type the `InjectionToken<T>` generic — untyped tokens defeat the purpose of DI type safety.
- Provide a sensible default via a factory (`{ providedIn: 'root', factory: () => defaultConfig }`) when the token is optional at the library level but required internally.
