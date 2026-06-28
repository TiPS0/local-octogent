# Feeding Data to OctoBoss

OctoBoss is the meta-agent orchestrator. Instead of writing code directly, it analyzes your requirements, plans the work, and delegates tasks to other tentacles. 

To orchestrate effectively, OctoBoss needs context. The **Knowledge Panel** in the OctoBoss canvas provides three tabs to feed it the necessary data: **Briefing**, **Prompt**, and **Files**. 

All data provided through these tabs is persisted in the OctoBoss tentacle folder (`.octogent/tentacles/__octoboss__/`) and is read by OctoBoss when it plans tasks.

> [!IMPORTANT]
> **AI Generation Rules:** If an AI assistant (like Claude) is asked to generate data based on this file, it MUST generate exactly four markdown artifacts:
> 1. `Briefing.md` - Overall context.
> 2. `Prompt.md` - Delegation instructions (must follow the strict agentic pattern below).
> 3. `Task List.md` - A human-readable summary of the work.
> 4. `todo.md` - The actual system checklist grouped by department tentacles.

## 1. Briefing (`BRIEFING.md`)

The **Briefing** is your overarching project context and goal definition. It's the "what" and the "why" of the task at hand. 

Use the Briefing tab for:
- Project background and business requirements
- Acceptance criteria
- Architectural constraints or style guidelines

### Sample Pattern

```md
# Feature: User Authentication

We are implementing a JWT-based login system for the new web app.

**Goals:**
- Users can log in with email and password.
- Server returns a secure HTTP-only cookie containing the JWT.

**Constraints:**
- Use `bcrypt` for password hashing.
- Follow the existing error handling patterns defined in `utils/errors.ts`.
```

## 2. Prompt (`PROMPT.md`)

The **Prompt** is your direct, immediate instruction to OctoBoss. If the Briefing is the long-term context, the Prompt is the trigger for the current session.

Use the Prompt tab for:
- Explicit commands for OctoBoss to act as a manager.
- Ensuring OctoBoss delegates tasks instead of doing them itself.
- Providing mid-flight course corrections if the swarm gets stuck.

### Sample Pattern (Agentic Supervisor)

To force OctoBoss to behave as a supervisor (and not write code itself), use this exact pattern:

```md
I have uploaded a `todo.md` file into your vault. Your job is to act as the Engineering Manager. 
You must NOT write the code for these tasks yourself. 
Instead, decompose these tasks, assign them to the appropriate department tentacles (e.g., core-domain, api-server, web-ui), and spawn swarms to complete them. 
Monitor their progress and run `verify.js` only when they all report completion.
```

## 3. Todo List (`todo.md`)

The **Todo** tab holds the actual checklist of work. For OctoBoss to delegate effectively, this checklist should group tasks by the department that owns them, rather than just listing sequential chronological steps.

### Sample Pattern (Department Grouping)

```md
- [ ] **core-domain**: Create `core/types.js` with `SystemPing` typedef.
- [ ] **api-server**: Implement `api/server.js` using the core types.
- [ ] **web-ui**: Create `ui/index.html` to fetch and render the ping.
- [ ] **Boss/QA**: Create and run `verify.js` to test the integrated system.
```

## 4. Files (Vault Files)

The **Files** tab allows you to drag-and-drop or upload multiple Markdown (`.md`) or text (`.txt`) files directly into OctoBoss's vault. 

Use the Files tab for:
- Raw reference data (e.g., API documentation, JSON schemas).
- Existing code snippets that OctoBoss needs to analyze.
- Error logs or stack traces to debug.
- External context that is too large or detailed to fit inside the Briefing.

### Sample Pattern

You might upload files named:
- `api-spec-v2.md`
- `production-crash-log.md`
- `database-schema.md`

OctoBoss will see these files in its vault and can read them when devising its execution plan or answering your Prompts.

## Workflow Summary

1. **Upload** any necessary reference documents via the **Files** tab.
2. **Write** your project goals and constraints in the **Briefing** tab.
3. **List** your tasks grouped by department in the **Todo** tab.
4. **Give an instruction** in the **Prompt** tab telling OctoBoss to manage and delegate.
5. **Run** OctoBoss (or start a swarm) to let it execute the plan based on the data you provided.
