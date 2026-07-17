# Team Dashboard

## Backlog
- **Task 82**: Grayscale-Driven Displacement / Fade Effects — feature idea (user: "test the basics first", filed for future design discussion). User also drew inspiration from Amiga demo scene for effects direction.
- **Task 39a**: AKVJ Dependency Upgrades — Team Lead executes npm install (new protocol)
- **Task 39b**: Mainframe & Root Dependency Upgrades — Team Lead executes npm install (new protocol)
- **Task 73**: Introduce "Project" Concept — DEFERRED (user: sequence after clip format + MIDI clock are solid)

## In Progress (AKVJ)
- No active task — user HIGH PRIORITY work complete (Tasks 79 + 80 QA approved). Awaiting user testing feedback or new assignments.

## In Progress (Mainframe)
- **Task 38b**: Mainframe Naming Conventions Audit — assigned to mainframe-developer (Low/Code quality)

## Implemented — Pending QA Audit
*Tasks verified by Team Lead (lint + tests pass) but not yet audited by QA Reviewer.*
- Task 62: Add Unit Tests for ClipEditor, StagingPreview, PianoKeyboard — verified: 139 mainframe tests pass (42 new)

## QA Reviewer Backlog (1 review pending)
- Review Tasks: 62

## Done (QA Audited or Team Lead Direct Fix)
- Task 81: Wire MainframeState Events to UI Updates — QA APPROVED (165 mainframe tests, resolves Task 61 rejection)
- Task 42: Fix MaskManager Memory Leak — QA APPROVED (already resolved by Task 70, no changes needed)
- Task 38a: AKVJ Naming Conventions Audit — QA APPROVED (324 akvj tests, 1 bound handler fix)
- Task 32: Sticky Piano Roll Component — QA APPROVED (165 mainframe tests, 11 new; clear-filter feedback fix applied)
- Task 80: Audit MIDI Clock / BPM-Sync Robustness — QA APPROVED (324 akvj tests, stale #lastTime bug fixed)
- Task 61: Introduce MainframeState — QA REJECTED (events not wired in main.js, Task 81 created to fix)
- Task 79: Audit Clip Format & Metadata — QA APPROVED (323 akvj + 144 mainframe tests, docs updated)
- Task 78: Fix Pingpong Playback Freezes — QA APPROVED (144 mainframe tests, PingpongState)
- Task 77: Fix StagingPreview Play/Pause Button — QA APPROVED (142 mainframe tests)
- Task 70: Fix Clip Clock Subscription Scaling — QA APPROVED (323 akvj tests)
- Task 55: Fix Server serveSprite 404 — QA APPROVED (144 mainframe tests)
- Task 72: Add package.json Sorting Tool — QA APPROVED (139 mainframe tests)
- Task 51: Fix AppState.reset() Clock Timeout Race — QA APPROVED (323 akvj tests, regression test)
- Task 46: Refactor AppState Singleton for Testing Isolation — QA APPROVED (323 akvj tests)
- Task 43: Refactor Midi Singleton to Lazy Init — QA APPROVED (6 Midi tests)
- Task 52: Fix ClipEditor Save Response Check — QA APPROVED (12 ClipEditor tests)
- Task 74: Fix Server handlePostClips Missing Error Handling — verified: 97 mainframe tests pass, test updated 500 to 400
- Task 71: Remove MCP Configuration Files — verified: files removed
- Task 69: Restore AppState Unit Test Suite — verified: 322 akvj tests pass
- Task 68: Fix Midi destroy() Async Race Condition — developer verified
- Task 67: Fix ClipList attachEditForm Toggle — developer verified
- Task 66: Fix ClipList attachEditForm Dead Code and Encapsulation (found by QA)
- Task 65: Revert MaskManager destroy() Calls (Task 42) — PRIORITY fix, QA-verified
- Task 64: Revert Compositor ImageData Caching — verified: 321 akvj tests pass
- Task 63: Fix StagingPreview Shuffle Mode — verified: 97 mainframe tests pass
- Task 60: Add Clip Name to ClipList Search Filter
- Task 59: Extract Shared API Client Module
- Task 58: Optimize PianoKeyboard Re-render on Update — verified: 97 mainframe tests pass
- Task 57: Parallelize listClips I/O — verified: 97 mainframe tests pass
- Task 56: Fix ClipList Preview Missing Playback Modes — verified: 97 mainframe tests pass
- Task 55: Fix Server serveSprite 404 Handling
- Task 54: Fix Server handlePutClipMeta Error Handling — developer verified
- Task 53: Fix ClipList attachEditForm Ignoring clipId — developer verified
- Task 52: Fix ClipEditor Save Response Check — verified: 12 ClipEditor tests pass
- Task 51: Fix AppState.reset() Clock Timeout Race — verified: 323 akvj tests pass (regression test added)
- Task 50: Add EffectsPipeline destroy() Method — verified: 322 akvj tests pass
- Task 49: Refactor LayerGroup Trigger Group to Use Map — verified: 322 akvj tests pass
- Task 48: Cache DebugOverlay DOM Element References — verified: 322 akvj tests pass
- Task 47: Remove ClipLoader Redundant Trigger Type Setting — verified: 322 akvj tests pass
- Task 45: Document EffectsPipeline Scratch Buffer Contract — verified: 322 akvj tests pass
- Task 44: Hoist Compositor Per-Pixel BitDepth Branch — verified: 322 akvj tests pass
- Task 41: Fix Clip Double-Advancement Risk — verified: 322 akvj tests pass, regression test added
- Task 40: Fix Compositor ImageData Per-Frame Allocation — WON'T FIX (developer analysis: caching not beneficial at 240x135, previous revert confirmed)
- Task 75: Fix Docs Referencing set-mapping.json (fixed by Team Lead, grep verified)
- Task 76: Fix Await-Messages Scripts Instant Re-Trigger (fixed by Team Lead, code review verified)
- Task 37b: Mainframe Proactive Code Review (12 findings: Tasks 52-63)
- Task 37a: AKVJ Proactive Code Review (12 findings: Tasks 40-51)
- Task 36: Relocate Repository-Wide Scripts to monorepo-scripts/
- Task 35: Delete Legacy Root Directories
- Task 34b: Move Mainframe Tests (already in place, root test/ deleted)
- Task 33: Remove Husky and lint-staged
- Task 34a: Move AKVJ Tests (already in place, no changes needed)
- Task 26a: AKVJ E2E and Smoke Tests
- Task 26b: Mainframe E2E and Visual Regression Tests
- Bug: Rolldown Native Binding Error (fixed by clean npm install)
- Task 25: Fix Server Startup Hang
- Task 27: Code Quality Tools
- Task 28: DevContainer Port Locking
- Task 29: Rename MIDI Layout to Key Map
- Task 30: Ensure Everything Works
- Task 31: Change API Port to 7777
