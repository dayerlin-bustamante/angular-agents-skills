---
name: library-versioning
description: Update the version of a specific library and manage its peer dependencies accordingly.
---

# Update Library Version Skill

This skill allows the user to update the version of a specific library in the repository and automatically manages its usage in other libraries' `peerDependencies`.

## Parameters
The user must provide:
1.  **Library Name**: The name of the library to update (e.g., `button`, `core`, `input`).
2.  **Update Type**: `patch`, `minor`, or `major`.

## Process Instructions

### 1. Identify and Read the Target Library
1.  Locate the library's `package.json` file. Based on the file structure, it is typically in `projects/[project-name]/[library-name]/package.json`.
2.  Read the file to obtain the current `version`.

### 2. Calculate New Version
Calculate the new version string based on the **Update Type**:
-   **Patch**: Increment the third number (z). Reset nothing. (e.g., `1.0.1` -> `1.0.2`)
-   **Minor**: Increment the second number (y). Reset the third number (z) to `0`. (e.g., `1.0.5` -> `1.1.0`)
-   **Major**: Increment the first number (x). Reset the second (y) and third (z) numbers to `0`. (e.g., `1.2.3` -> `2.0.0`)

### 3. Update the Target Library
1. The skill must not use any scripts or commands to update the version. Instead, it should directly edit the `package.json` file.
2.  Edit `projects/[project-name]/[library-name]/package.json`.
3.  Replace the old `version` value with the **New Version**.

### 4. Handle Peer Dependencies
**Condition**:
-   **IF Update Type is PATCH**: Do **NOT** update references in any other files. `peerDependencies` are assumed to handle patch updates automatically (via ranges like `^` or `~`).
-   **IF Update Type is MINOR or MAJOR**:
    1.  Search through all other libraries in `projects/[project-name]/` (look for `projects/[project-name]/*/package.json`).
    2.  In each `package.json`, check the `peerDependencies` section.
    3.  If the *Target Library* is listed in `peerDependencies`:
        -   Update its version value to the **New Version**.
    4.  Update patch version of the affected libraries if the update type is minor or major, to ensure compatibility. For example, if a library depends on `button` and the `button` library is updated from `1.0.0` to `1.1.0`, the dependent library's version should be updated from `1.0.0` to `1.0.1` (patch update) to reflect the change without breaking compatibility.

### 5. Final Report
Generate and display a Markdown table summarizing the actions taken:

| Library Name | Old Version | New Version | Strategy | Dependencies Updated |
| :--- | :--- | :--- | :--- | :--- |
| `<Found Name>` | `<Old>` | `<New>` | `<Type>` | `<List of other libs updated>` |

*If no dependencies were updated (e.g., for a patch), state "None" or "Skipped (Patch)".*
