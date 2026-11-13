# JARVIS — Architecture and Engineering Decisions

## 1. System topology

```text
                         JARVIS CLIENTS
       +-----------------------------------------------+
       | Windows/macOS Desktop (Tauri + React)         |
       |  - 3D avatar (Three.js)                       |
       |  - voice session + captions                  |
       |  - shared workspace / browser view            |
       |  - capture controls / activity / approvals   |
       +----------------------+------------------------+
                              |
                   authenticated API / realtime
                              |
       +----------------------v------------------------+
       |                JARVIS BACKEND                 |
       | FastAPI: auth, conversation, projects, tasks  |
       | Orchestrator: plans, delegates, verifies      |
       | Policy engine: scopes, approvals, audit      |
       | Provider adapters: LLM, voice, vision         |
       +----+------------------+-------------------+---+
            |                  |                   |
       +----v------+      +----v------+       +----v------+
       | Memory    |      | Agents    |       | Tool      |
       | service   |      | research  |       | gateway   |
       | Postgres  |      | coding    |       | browser   |
       | pgvector  |      | business  |       | desktop   |
       | documents |      | creative  |       | GitHub    |
       +-----------+      +-----------+       +-----------+
            |
       +----v-------------------------------------------+
       | Supabase Postgres / object storage / audit     |
       | Redis + background workers when needed        |
       +------------------------------------------------+
                              |
                     external providers
          Claude / realtime voice / ASR-TTS / search
          Google / GitHub / storage / creative services

       Flutter mobile companion (later) uses same API.
```

## 2. Trust boundaries

1. Desktop UI is not trusted with provider secrets.
2. Backend authenticates every request and checks workspace ownership.
3. Every tool call passes through the policy engine.
4. Local computer agent only accepts signed, scoped jobs from the authenticated backend.
5. Filesystem and terminal tools run in allowlisted workspaces or sandbox.
6. External actions require approval tokens bound to the exact action and parameters.
7. Tool results are verified before being shown as successful.

## 3. Main request lifecycle

1. Capture user text/audio or an explicitly shared image/screen.
2. Resolve active conversation, user and workspace.
3. Retrieve relevant structured project facts and semantic memories.
4. Send a compact, source-labelled context to the selected reasoning model.
5. Orchestrator returns a response or a typed tool plan.
6. Policy engine validates tool, scope, risk and approval requirements.
7. Execute allowed tool calls with timeouts, idempotency keys and logs.
8. Verify outputs; retry only safe/idempotent operations.
9. Stream response and activity state to client.
10. Save conversation summary and approved memory updates.

## 4. Proposed database entities

- profiles: user preferences and identity settings.
- workspaces: personal/business spaces.
- workspace_members: membership and roles for future multi-user.
- projects: product records and current status.
- project_updates: dated status updates.
- project_decisions: decision, rationale, source and superseded decision.
- tasks: assigned work, priority, status and due date.
- milestones: project milestones and dependencies.
- memories: user-approved facts and memory metadata.
- memory_embeddings: vector representations linked to memory/document chunks.
- documents: metadata, storage path, owner, source and retention.
- document_chunks: extracted text, page/section and embeddings.
- conversations: sessions and active project context.
- messages: text, modality and references to capture artifacts.
- avatar_profiles: character, rig, voice and presentation settings.
- devices: registered clients and local agents.
- integrations: connected provider identity and status.
- integration_permissions: granted scopes and revocation.
- capture_sessions: explicit screen/camera session metadata.
- agent_runs: plan, status, parent run and result summary.
- tool_runs: tool name, parameters hash, result, duration and verification.
- approval_requests: exact proposed action, expiry, decision and approver.
- audit_logs: append-only record of sensitive events.
- scheduled_jobs: user-configured proactive tasks.
- usage_events: token/audio/avatar/tool usage for cost accounting.

All user-owned rows carry workspace_id and appropriate owner metadata. Enable RLS; never rely only on frontend filtering. Keep provider tokens in a server-side encrypted secret store, not ordinary readable tables.

## 5. Tool permission model

Tool definitions declare:
- name and version
- required scopes
- read/write/destructive classification
- target resource constraints
- whether approval is required
- timeout and retry policy
- idempotency behaviour
- verification method

Approval is bound to the exact tool, arguments hash, target and expiry. Any material argument change invalidates approval.

## 6. Avatar runtime

- Render a rigged GLB/GLTF model using Three.js.
- Require a documented licence and commercial-use rights.
- Prefer ARKit-style facial blend shapes or compatible visemes.
- Use timestamped speech/phoneme/viseme data when provider supplies it.
- Drive idle animation, blink, gaze and body movement independently of the LLM.
- Avatar provider is an adapter; conversation and memory do not depend on avatar vendor.
- Fallback to a local 3D avatar if hosted avatar service is unavailable.

## 7. Voice runtime

- Realtime provider adapter supports streaming input/output, turn detection and interruption.
- Audio playback cancellation is immediate on barge-in.
- Maintain transcript and conversation event IDs.
- Keep ASR and TTS fallback adapters.
- Test Nigerian English accent recognition with real, consented sample utterances.
- Do not store raw audio by default; configure retention explicitly.

## 8. Computer operator

Use browser automation for browser tasks and a local desktop agent for native application control. The local agent must:
- pair with the user's account;
- show a persistent active-session indicator;
- accept only scoped jobs;
- restrict file access to selected workspaces;
- block dangerous shell commands by default;
- require confirmation for external side effects;
- record screenshots/step evidence only when the user has enabled it;
- provide a kill switch and session revocation.

## 9. Deployment environments

- local development: desktop client + local API + development Supabase project.
- staging: separate database, OAuth credentials, test integrations and fake external side effects.
- production: separate secrets, database, allowlists, monitoring and backup/restore procedure.

Never use production user data in test fixtures. Never commit .env files or credentials.
