# Feeding Data to OctoBoss

OctoBoss is the meta-agent orchestrator. Instead of writing code directly, it analyzes your requirements, plans the work, and delegates tasks to other tentacles. 

To orchestrate effectively, OctoBoss needs context. The **Knowledge Panel** in the OctoBoss canvas provides three tabs to feed it the necessary data: **Briefing**, **Prompt**, and **Files**. 

All data provided through these tabs is persisted in the OctoBoss tentacle folder (`.octogent/tentacles/octoboss/`) and is read by OctoBoss when it plans tasks.

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
- Specific commands for OctoBoss to execute right now.
- Asking OctoBoss to review the Briefing and generate a `todo.md` plan.
- Providing mid-flight course corrections if the swarm gets stuck.

### Sample Pattern

```md
Read the new Authentication requirements in the Briefing.
Break the implementation down into small, actionable steps and add them to the `todo.md` checklist so we can spawn a swarm.
Make sure to include a task for writing unit tests.
```

## 3. Files (Vault Files)

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
3. **Give an instruction** in the **Prompt** tab telling OctoBoss what to do with that information.
4. **Run** OctoBoss (or start a swarm) to let it execute the plan based on the data you provided.
