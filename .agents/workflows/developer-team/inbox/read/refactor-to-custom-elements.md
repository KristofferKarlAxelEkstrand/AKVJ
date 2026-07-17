# Task: Refactor Frontend UI to Custom Elements

## Core Goal
Transition the frontend codebase (both in the `mainframe` UI and `akvj` where applicable) to rely heavily on native Web Components (Custom Elements and Extended HTML Elements).

## Requirements

### 1. Component Modularity
- Identify distinct pieces of the UI (e.g., clip lists, editors, piano visualization, forms, settings panels) and encapsulate them into their own Custom Elements.
- Use `customElements.define('akvj-element-name', ClassName)`.
- If extending a native element makes more sense (e.g., extending `HTMLButtonElement`), do so (`{ extends: 'button' }`).

### 2. Lifecycle Management
- Ensure clean setup and teardown of event listeners within `connectedCallback` and `disconnectedCallback`.
- Manage reactive state via `observedAttributes` and `attributeChangedCallback` where appropriate.

### 3. Iterative Migration
- This is a technical spec and long-term goal. It does not need to be done all at once.
- Pick one area of the UI to refactor first as a proof of concept, establish the pattern, and then gradually migrate the rest of the application.
- Ensure the Vanilla JS constraint is strictly maintained. Do not use Shadow DOM unless specifically required for styling encapsulation (Light DOM is perfectly fine for most of our use cases).
