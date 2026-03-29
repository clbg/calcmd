# Workflow Preferences

## Git Commit Policy

**DO NOT automatically commit changes unless explicitly requested by the user.**

- Make file modifications as needed
- Stage changes with `git add` if appropriate
- Wait for explicit user instruction before running `git commit`
- User will manually commit or explicitly say "commit this" / "commit these changes"

This preference applies to all interactions in this workspace.

## Task Document Convention

For any non-trivial task (new feature, migration, refactor), write a task doc **before** starting implementation.

### Naming

| State | Filename |
|-------|----------|
| In progress | `docs/task-<slug>.WIP.md` |
| Completed | `docs/task-<slug>.md` |

### What to put in a task doc

- **Goal** — what problem this solves and why
- **Current state** — what exists today
- **Approach** — the plan, key decisions, trade-offs
- **Steps** — ordered checklist of implementation steps
- **Acceptance criteria** — how to know it's done

### Workflow

1. Create `docs/task-<slug>.WIP.md` with the plan
2. Review / iterate on the plan before touching code
3. Implement, checking off steps as you go
4. When done, rename to `docs/task-<slug>.md` (drop `.WIP`)

The task doc stays in the repo as a permanent record of why decisions were made.
