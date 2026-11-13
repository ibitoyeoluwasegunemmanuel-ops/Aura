# JARVIS — Build Roadmap and Definition of Done

## Development rule

Build a working vertical slice, not a set of disconnected screens. Each milestone ends with a reproducible test and a recorded status. Keep AURA's main branch untouched; develop on `jarvis-foundation`.

## Milestone 0 — Foundation and repository audit
- [ ] Record existing AURA routes, components, backend endpoints and working integrations.
- [ ] Identify insecure client-side API key use and remove secrets from browser bundles.
- [ ] Establish branch protection/review workflow where available.
- [ ] Add architecture and PRD docs.
- [ ] Decide whether to migrate CRA to Vite as part of Tauri shell; preserve useful UI components.
- [ ] Add lint, typecheck and test commands.
- [ ] Establish environment variable validation and safe examples.

**Done when:** existing app is documented, baseline build is reproducible, and the new branch is isolated.

## Milestone 1 — Desktop shell and visual identity
- [ ] Tauri 2 desktop shell.
- [ ] React + TypeScript UI.
- [ ] Dark premium office interface with calm cyan/neutral accents.
- [ ] Main avatar stage, workspace panel, activity rail and controls.
- [ ] Detect OS/version/architecture at runtime; do not assume Windows 10 or 11.
- [ ] Graceful WebView2/runtime diagnostics.
- [ ] Window modes: full-screen, normal and compact.

**Done when:** desktop app starts on supported Windows 10+ and Windows 11 environments and reports detected platform details.

## Milestone 2 — 3D avatar
- [ ] Select/licence a realistic rigged GLB avatar.
- [ ] Three.js renderer and lighting.
- [ ] Idle, listening, thinking and speaking states.
- [ ] Blink, gaze and head movement.
- [ ] Viseme/blend-shape lip-sync.
- [ ] Avatar profile settings and replaceable model adapter.
- [ ] Reduced-motion and low-performance fallback.

**Done when:** avatar renders consistently, animates state changes and lip-syncs a known test audio sample.

## Milestone 3 — Voice loop
- [ ] Realtime voice provider adapter.
- [ ] Microphone permission and visible capture indicator.
- [ ] Streaming response audio.
- [ ] Barge-in / interruption and cancellation.
- [ ] Transcript and captions.
- [ ] Push-to-talk.
- [ ] Wake word only as opt-in follow-up.
- [ ] Network interruption and reconnect behaviour.
- [ ] Nigerian English test set.

**Done when:** user can converse, interrupt, resume and inspect the transcript without losing context.

## Milestone 4 — Project memory
- [ ] Supabase schema and migrations.
- [ ] RLS policies and workspace isolation.
- [ ] Projects, updates, decisions, tasks and milestones.
- [ ] Memory write/retrieve/correct/delete.
- [ ] pgvector semantic search.
- [ ] Seed founder project records with confirmed context only.
- [ ] Source and freshness metadata.
- [ ] Daily briefing endpoint.

**Done when:** JARVIS retrieves a seeded project and a decision after a fresh app session, with source and timestamp.

## Milestone 5 — Vision and shared workspace
- [ ] Explicit screen capture.
- [ ] Camera snapshot flow.
- [ ] Image/document upload.
- [ ] OCR and vision provider adapter.
- [ ] Shared workspace preview.
- [ ] Visual annotations and screen explanation.
- [ ] Capture stop button and retention controls.

**Done when:** user can share a screenshot/document, ask a question and receive an evidence-grounded answer.

## Milestone 6 — Orchestrator and tool gateway
- [ ] Typed tool registry.
- [ ] Planning and task state machine.
- [ ] Approval requests bound to exact action.
- [ ] Tool execution logs and evidence.
- [ ] Timeouts, safe retries and cancellation.
- [ ] Emergency stop.
- [ ] Agent routing and shared context.

**Done when:** a multi-step safe task can be planned, executed, verified and reported with full action history.

## Milestone 7 — Browser and desktop operator
- [ ] Playwright browser session.
- [ ] Approved domains and authenticated user sessions.
- [ ] Local desktop agent pairing.
- [ ] Workspace-scoped file tools.
- [ ] Restricted terminal runner.
- [ ] Screenshots and step evidence.
- [ ] Destructive-action safeguards.

**Done when:** JARVIS completes a safe browser workflow and a safe file operation, and blocks an unapproved external side effect.

## Milestone 8 — Specialist capabilities
- [ ] Research agent with citations and confidence labels.
- [ ] Engineering agent with branch-based code edits and tests.
- [ ] Business/operations agent.
- [ ] Creative studio.
- [ ] Scam/fraud checker.
- [ ] Document and meeting assistant.

## Milestone 9 — Integrations and mobile companion
- [ ] GitHub OAuth and repository scopes.
- [ ] Google Calendar and Gmail OAuth.
- [ ] User-authorised communication integrations.
- [ ] Flutter companion app.
- [ ] Push notifications and task handoff.
- [ ] Integration permission dashboard.

## Milestone 10 — Commercial readiness
- [ ] Multi-tenant onboarding.
- [ ] Subscription and usage metering.
- [ ] Provider cost controls.
- [ ] Admin console.
- [ ] Privacy and retention controls.
- [ ] Security review and penetration testing.
- [ ] Backups and incident response.
- [ ] Legal review for target markets.

## MVP demo script

1. Launch JARVIS desktop and show detected OS.
2. Greet the 3D avatar and start a voice conversation.
3. Interrupt the avatar mid-sentence.
4. Share a screenshot and ask it to explain the visible error.
5. Ask: "What is the current status of Drive Secure?"
6. Ask it to open an approved repository and inspect a file.
7. Ask it to create a report in the designated sandbox folder.
8. Review the proposed action, approve it and observe execution.
9. Verify the file exists and open it.
10. Restart JARVIS and confirm project memory remains.

## Release gates

- No API keys in frontend bundles.
- No hidden microphone or camera capture.
- No unapproved external side effects.
- No production writes from untrusted tool output.
- No claimed success without verification.
- No feature marked complete without automated or reproducible acceptance evidence.
