## Specs Are the Truth

`.agents/workflows/developer-team/spec/` describes how AKVJ works **today**.
`.agents/workflows/developer-team/spec/README.md` indexes every spec and its status.

- **Read the spec your work cites.** A task may carry a `spec:` frontmatter field naming the spec it
  derives from. When it does, read that spec before you touch code and check your work against it
  before you report. Plenty of tasks have no spec — a dependency bump, a lint sweep — and those are
  judged on their own terms.
- **Only `status: approved` specs are binding.** A `draft` spec is useful context, not authority —
  do not reject or block work over one.
- **If the code contradicts an approved spec, stop.** That is a defect in one of them, and which
  one changes is the human's call, not yours. Say so in a `blocked` message (developers) or a
  rejection (QA), naming the spec section and the file:line that disagrees. Never quietly pick a
  winner.
- **Do not edit `spec/`.** Propose changes in `.agents/workflows/developer-team/epics/drafts/` or
  ask in `.agents/workflows/developer-team/mail/out/`. Only the human approves a spec; only the
  Overseer corrects facts inside an approved one.
