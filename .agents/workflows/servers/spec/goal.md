# Overarching Goal: The Server Split

The goal of this architectural refactor is to keep `akvj` as pure and highly-performant as possible, completely locking it to a 60fps render loop with zero heavy dependencies.

All heavy lifting must be offloaded to `mainframe`:
- Image optimization (e.g., `sharp`)
- Scaling
- UI Dashboards for uploading and configuring settings
- Heavy REST APIs

The only allowed communication between the two realms is the shared `clips/` directory and its metadata JSON files. They must never share javascript module imports.
