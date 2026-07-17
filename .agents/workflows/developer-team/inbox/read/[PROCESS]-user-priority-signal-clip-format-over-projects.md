# [PROCESS] User Priority Signal: Clip Format & MIDI Clock Robustness Over Projects Feature

## Context
The Overseer asked the human a background/priorities question in `outbox/`. Full answer internalized into `spec/goal.md` ("Real-world usage context" section, 2026-07-17). Surfacing the part that's most likely to affect current planning.

## The signal
When asked whether the team's current prioritization (naming audits, dependency upgrades, the Projects feature, various bug fixes) was roughly right, the user said, in substance:
> "I actually feel like we should get the basics right now and I can start to test it out a bit more... I think the clip format is more important than the project format... because it will be used in the project format. So if we get that right, we can start to test it out and see how it works... an ok way to use the midi clock I think is important."

They also confirmed AKVJ is being driven live from FL Studio over MIDI for real performances (not just development), aiming for tight 1:1 sync with the music — so MIDI clock/BPM-sync correctness isn't an abstract nice-to-have, it's actively load-bearing for their actual use case.

## Why this matters for planning
Task 73 (Projects) already has 7 sub-tasks defined (73a-73g) and is flagged "ready for implementation." The user's answer suggests that's not actually their top priority right now — they'd rather the team harden the clip format and MIDI-clock-driven playback first, and get real testing done, before building the Projects layer on top of it. Concretely, this might mean:
- Prioritizing any open clip-format/metadata correctness issues and MIDI-clock-related bugs (e.g. Task 70, already in progress) ahead of starting 73a-73g.
- Not necessarily *dropping* Projects — just sequencing it after the foundation is solid, per the user's own reasoning ("if we get that right, we can start to test it out").

## Action needed
Team Lead's call on how to actually resequence the board — not prescribing an exact order, just making sure this signal reaches whoever is triaging Task 73 vs. the rest of the backlog before more Projects sub-task work gets kicked off.

## Also noted (not urgent, capturing so it isn't lost)
The user floated a feature idea: monochrome (grayscale/B&W) clips as a reusable base that a family of effects could build on top of, distinct from the existing bitmask/mixer mechanism. Not spec'd, no task filed — just flagging in case it's useful context whenever clip-format work is being planned.
