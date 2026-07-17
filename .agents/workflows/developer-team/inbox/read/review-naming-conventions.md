# Task: Review and Refactor Naming Conventions

## Core Goal
Conduct a comprehensive review of the naming conventions used across the entire AKVJ project (including `akvj`, `mainframe`, and the JSON file schemas). The primary objective is to ensure that all class names, function names, variable names, and file names are exceptionally intuitive, logical, and easily understandable by a human reader.

## Requirements

### 1. Human Understandable
- Names must clearly describe intent. Avoid overly cryptic abbreviations or acronyms unless they are universally accepted MIDI standards (like `cc` or `sysex`).
- If a developer reads a variable or function name for the first time, they should immediately grasp what it does without needing to read the implementation.

### 2. Domain Consistency
- Enforce strict use of our VJ/MIDI domain terminology. For example, consistently use terms like `Clip`, `Sprite`, `LayerGroup`, `Velocity`, and `Note`. Do not mix terminology (e.g., calling a clip an "animation" or a "video" in one place but a "clip" in another).

### 3. Actionable Workflow
- Audit the current codebase to identify any names that are confusing, overly generic (`data`, `manager`, `item`), or misleading.
- Execute surgical renaming refactors to clean up the code. Remember to update any corresponding imports or JSON fields to match!
