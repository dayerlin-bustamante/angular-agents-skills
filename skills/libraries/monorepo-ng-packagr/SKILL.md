---
name: monorepo-ng-packagr
description: Structure and operate a multi-library Angular monorepo built with ng-packagr, including workspace path aliases and orchestrated build/publish/version scripts.
---

# Angular Monorepo with ng-packagr

This skill covers organizing a workspace containing many independently-buildable Angular libraries (a design-system style monorepo), and the tooling that ties them together.

## When to use
- Setting up or maintaining a workspace where each UI component lives in its own publishable library under `projects/<scope>/<name>/`.
- Writing/maintaining Node.js scripts that build, version, or publish all (or a subset of) libraries in one command.
- Diagnosing "cannot find module `@scope/lib`" errors caused by stale `dist/` output or missing path aliases.

## Workspace layout
```
angular.json          # one "project" entry per library + per app
package.json           # workspaces: ["dist/ui/*"] — consumers resolve built packages
tsconfig.json          # path aliases mapping @scope/lib -> dist/scope/lib
scripts/
  build-library.mjs           # builds a single library via the Angular CLI builder
  generate-library.mjs        # scaffolds a new library folder structure
  update-library-version.mjs  # bumps a library's version + dependent peerDependencies
  publish-library.mjs         # npm publish for one library
  publish-libraries.mjs       # publish all libraries in dependency order
  tests-libraries.mjs         # run tests across all libraries
projects/
  ui/
    button/  input/  core/  ...  # each an independent ng-packagr library
```

## Why libraries depend on `dist/`, not `src/`
```json
// tsconfig.json
"paths": {
  "@ui/button": ["dist/ui/button"],
  "@ui/core": ["dist/ui/core"]
}
```
Libraries import each other via their **built** output (`dist/ui/*`), matching exactly how an external consumer would resolve the published npm package. This catches "works in source, breaks when published" bugs early, at the cost of requiring a build step before you can consume a library's latest changes from a sibling library.

## Build ordering matters
Libraries that depend on others (e.g. `datepicker` depends on `popover`, `input`, `calendar`, `core`) must be built **after** their dependencies. A build orchestration script typically:
1. Reads each library's `package.json` `peerDependencies`/`dependencies` on other `@ui/*` packages.
2. Topologically sorts libraries so dependencies build first.
3. Invokes the Angular CLI build (`ng build <project>`) for each, writing to `dist/ui/<name>`.

## Versioning across the monorepo
When a library's version changes (minor/major), every other library that lists it in `peerDependencies` needs a compatible version bump too (see the `update-library-version` skill in this same skills folder for the exact algorithm used in this repo).

## Publishing
`publish-library.mjs` typically:
1. Builds the library fresh.
2. Copies/verifies `package.json` metadata into `dist/ui/<name>`.
3. Runs `npm publish` from the `dist/ui/<name>` folder (never from `projects/`, since that folder contains source + config files that shouldn't ship).

`publish-libraries.mjs` wraps this for multiple libraries, respecting the same dependency order as the build step.

## Adding a brand-new library to the monorepo
1. Scaffold it (see `standalone-component-library` skill for the folder layout).
2. Add a project entry to `angular.json`.
3. Add its `@ui/<name>` path alias to `tsconfig.json`.
4. Add it to any orchestration script's library list/const (e.g. `scripts/const/library.const.mjs`).
5. Build it once (`node scripts/build-library.mjs <name>` or equivalent) before any sibling library imports it.

## Pitfalls
- Editing a library's `src/` and expecting a sibling library (importing via `@ui/<name>`) to pick up the change without rebuilding — it won't, since imports resolve to `dist/`.
- Publishing out of dependency order can publish a library whose `peerDependencies` point to a version of another library that isn't published yet.
- Forgetting to update the `tsconfig.json` path alias when adding a library causes confusing "cannot find module" errors that look like a build problem but are actually a path-mapping problem.
