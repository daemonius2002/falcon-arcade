---
name: ultracode
description: Run the request as a multi-agent workflow (fan out sub-agents, verify their work, integrate). Use when the user types /ultracode or asks for many sub-agents on one task.
---

# /ultracode

The user has opted into multi-agent orchestration for this request. Treat the text after `/ultracode` as the task.

1. Scout inline first: read the relevant files and work out the list of independent pieces of work.
2. Load the `workflow-authoring` skill, then run the task with the Workflow tool. If the user names an agent
   count, size the workflow to it; otherwise keep it under 10 agents.
3. Give every agent a disjoint set of files to own, so parallel agents never edit the same file.
   In this repo: one agent per `public/games/<id>.js`; Star Falcon features go in
   `tools/star-falcon/src/features/NN-slug.js` (see `tools/star-falcon/CONTRACT.md`).
4. Always follow implementation with independent review agents, then fix what they find.
5. Sub-agents must not run git commands that write (commit, checkout, stash, reset). Commit once at the end.
6. Before reporting, run both test suites and state the real results:
   - `node tools/star-falcon/build.js && node tools/star-falcon/smoke.js`
   - `node tools/test-arcade.js`
