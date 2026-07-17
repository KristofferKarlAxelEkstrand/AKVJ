# Architectural Update: Split the Test Suites

## The Goal
In line with our primary architectural goal to completely decouple the `akvj` visualizer and the `mainframe` application, we need to stop relying on a centralized test suite at the repository root. It is time to move testing as much as possible into their respective project folders.

## The Rationale
If these two applications are truly distinct, they must be able to be tested completely independently. A shared `test/` folder creates false dependencies and blurs the lines of ownership between the visualizer logic and the clip management/UI logic.

## Action Items
1. **Analyze Existing Tests**: Review the current tests in the root `test/` directory.
2. **Move AKVJ Tests**: Identify all tests related to the visualizer (canvas rendering, MIDI ingestion, clip playback, 60fps loop). Move them into a new `akvj/test/` directory. Ensure the `akvj/package.json` has a `test` script that runs only these tests.
3. **Move Mainframe Tests**: Identify all tests related to clip management, image processing, generation, validation, and UI mapping. Move them into a new `mainframe/test/` directory. Ensure the `mainframe/package.json` has a `test` script that runs only these tests.
4. **Cleanup**: Remove the monolithic test suite from the root directory once everything is successfully migrated.

**Team Lead**: Please break this down into a `[TASK]` for the `akvj-developer` and a separate `[TASK]` for the `mainframe-developer` so they can claim and move their respective tests safely.
