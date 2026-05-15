# Repository Guidelines

## How to Use This Guide

- Start here for cross-project norms. Prowler is a monorepo with several components.
- Each component has an `AGENTS.md` file with specific guidelines (e.g., `api/AGENTS.md`, `ui/AGENTS.md`).
- Component docs override this file when guidance conflicts.

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)

| Skill               | Description                          | URL                                              |
| ------------------- | ------------------------------------ | ------------------------------------------------ |
| `fastapi-module`    | modules for fastapi                  | [SKILL.md](skills/fastapi-module/SKILL.md)       |
| `sqlalchemy-async`  | SQLAlchemy 2.0 async patterns (API)  | [SKILL.md](skills/sqlalchemy-async/SKILL.md)     |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                      | Skill              |
| ------------------------------------------- | ------------------ |
| Adding new module                           | `fastapi-module`   |
| Writing or modifying models.py / repository.py in apps/api | `sqlalchemy-async` |
