---
name: standalone-component-library
description: Scaffold and structure a standalone Angular component library (no NgModules) buildable independently with ng-packagr, ready for a multi-library workspace.
---

# Standalone Component Library

This skill helps create a new Angular library that follows the standalone-only architecture (no `NgModule`), independently buildable and publishable.

## When to use
- Adding a brand new UI component (e.g. `badge`, `slider`) to a multi-library Angular workspace.
- Reviewing whether an existing library still relies on `NgModule` and should be converted.

## Folder structure
```
projects/ui/<component-name>/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── <component-name>.component.ts
│   │   │   └── <component-name>.component.html
│   │   │   └── <component-name>.component.scss
│   │   ├── directives/
│   │   ├── services/
│   │   ├── interfaces/
│   │   ├── injectors/
│   │   ├── types/
│   │   ├── adapters/
│   │   └── helpers/
│   └── public-api.ts
├── ng-package.json
├── package.json
└── tsconfig.lib.json
```

## `public-api.ts`
Only export what consumers are meant to use — component classes, public interfaces/types, directives, and injection tokens. Do not export internal helpers/adapters.
```typescript
export * from './lib/components/ui-button.component';
export * from './lib/types/ui-button-size.type';
export * from './lib/types/ui-button-type.type';
```

## Component definition (standalone)
```typescript
@Component({
  selector: 'ui-button',
  standalone: true, // implicit/default in modern Angular, but explicit is fine
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.scss'],
  imports: [NgTemplateOutlet, IconComponent],
  host: {
    '[class]': '"ui-button-size-" + this.size() + " ui-button-type-" + this.type()'
  }
})
export class ButtonComponent { }
```
```
Every dependency the template needs (other components, directives, pipes, `CommonModule` pieces like `NgTemplateOutlet`) must be listed explicitly in `imports`. There is no root `NgModule` providing them implicitly.

## `ng-package.json`
```json
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../../dist/ui/button",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
```

## `angular.json` project entry
Register the library as its own project with the `@angular/build:ng-packagr` builder so it can be built in isolation:
```json
"button": {
  "projectType": "library",
  "root": "projects/ui/button",
  "sourceRoot": "projects/ui/button/src",
  "architect": {
    "build": {
      "builder": "@angular/build:ng-packagr",
      "options": { "project": "projects/ui/button/ng-package.json" }
    }
  }
}
```

## Path aliases for cross-library consumption
In the workspace `tsconfig.json`, map each library to its **built** output so other libraries/apps import the compiled package, not source:
```json
"paths": {
  "@ui/button": ["dist/ui/button"],
  "@ui/core": ["dist/ui/core"]
}
```

## Checklist for a new component library
1. Create the folder structure above under `projects/ui/<name>/`.
2. Write `public-api.ts` exporting only the public surface.
3. Add `ng-package.json` and `package.json` (with `peerDependencies` on `@angular/core`/`@angular/common` and any `@ui/*` libs it depends on).
4. Register the project in `angular.json`.
5. Add the `@ui/<name>` path alias in `tsconfig.json`.
6. Build with the workspace's library build script (see `angular-monorepo-ng-packagr` skill) before consuming it from another library.
