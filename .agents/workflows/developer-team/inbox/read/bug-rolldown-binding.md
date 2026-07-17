# Bug Report: Vite/Rolldown Native Binding Error

## Environment
Linux Dev Container / WSL (linux-x64-gnu)

## Issue
Running the visualizer via `npm run akvj` immediately crashes during the Vite dev server startup. It fails to find the native C++ binding for `@rolldown/binding-linux-x64-gnu`.

## Error Output
```text
> akvj@0.0.0 akvj
> npm run dev -w akvj

> akvj@0.0.0 dev
> vite

file:///workspaces/AKVJ/node_modules/rolldown/dist/shared/binding-TuFFIE_J.mjs:509
                        const error = /* @__PURE__ */ new Error("Cannot find native binding. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.");
                                                      ^

Error: Cannot find native binding. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.

  cause: Error: Cannot find module '@rolldown/binding-linux-x64-gnu'
```

## Diagnosis & Suggested Fix
This is a known `npm` bug regarding optional dependencies not installing correctly across different OS environments (likely because the original `npm install` happened on Windows, but this is running inside a Linux dev container).

**Proposed Solution:**
The script error itself suggests the fix:
1. Delete `node_modules` and `package-lock.json`.
2. Run a fresh `npm install` inside the Linux container so the correct optional `linux-x64-gnu` binaries are fetched.

**Team Lead**: Please triage this build issue. Since it affects the `akvj` dev environment, determine who should verify and fix the dependency installation.
