# JARVIS — Master Product Requirements Document

**Product owner:** Ibitoye Oluwasegun Emmanuel  
**Company:** CEO Global Dev  
**Working product lineage:** AURA OS  
**Version:** 1.1 — consolidated engineering baseline  
**Status:** Approved direction; implementation in progress

## 1. Product vision

JARVIS is a personal AI operating environment: a persistent, multimodal, voice-first digital collaborator that appears as a realistic 3D human in the user's workspace, understands information the user deliberately shares, remembers approved personal and project context, and performs authorised digital work through connected tools.

It is not just a chatbot with an animated face. Its core value is the combination of presence, perception, memory, reasoning, tools, orchestration and user control.

**Product promise:** Your personal AI. Your workspace. Your intelligence. Your operations.

## 2. Founder and initial deployment

The first deployment is for the founder of CEO Global Dev. It should learn the founder's approved working context and support existing ventures, initially including DiasporaOS, Drive Secure, HANDLY, PPOINT and SellLive. Project records must be configurable; this list is seed data, not a hard-coded limit.

The first release is private and single-user in its product experience, but the data model must support secure multi-user and multi-tenant expansion later.

## 3. Experience principles

- The user should feel as though an intelligent digital collaborator has joined the office.
- The avatar is the face; voice is the interaction; perception is the eyes; memory is continuity; tools are the hands; orchestration is coordination; permissions are control.
- Conversation must be natural, low-friction and interruptible.
- JARVIS should show what it is doing during longer operations.
- It must distinguish facts, estimates, assumptions and unknowns.
- It must never claim that an action succeeded until it has verified the result.
- The user owns the memory and controls connected accounts, captures, permissions and retention.

## 4. Avatar and spatial presence

### Required experience
- Realistic, cinematic 3D human avatar, selectable male or female presentation.
- Configurable face, hair, skin tone, clothing, voice, personality and virtual-office environment.
- Natural blinking, gaze, head motion, idle movement, listening and speaking states.
- Lip synchronisation driven by phoneme/viseme or timestamp data where available.
- Expressive but restrained facial animation; no uncanny exaggerated gestures.
- Full-screen office mode, floating compact mode and shared-workspace mode.
- Avatar can be changed without changing the conversation engine or memory.

### Engineering direction
Use a rigged GLB/GLTF avatar rendered with Three.js, with facial blend shapes/morph targets and a compatible animation rig. Keep the avatar renderer behind an adapter so a hosted real-time avatar provider can be used for an early proof-of-concept without making it a permanent dependency. Validate model licensing and commercial-use rights before shipping any character.

## 5. Real-time voice and conversation

- Two-way streaming voice conversation.
- User can interrupt speech naturally; playback stops promptly and the new turn is processed.
- Voice activity detection, turn detection and barge-in handling.
- Push-to-talk and configurable wake-word mode.
- Visible microphone/listening indicator and explicit microphone permission.
- Speech-to-text and text-to-speech adapters.
- Nigerian English recognition and voice quality evaluation, plus selectable voice/accent options.
- Conversation state and relevant memory persist across sessions.
- Text fallback, captions and transcript review.
- Network-loss recovery and clear connection states.

Wake-word activation is opt-in. No hidden or default recording.

## 6. Vision and perception

Inputs:
- Explicit screen-share sessions.
- User-triggered screenshots.
- Camera snapshots or user-started camera sessions.
- Uploaded images, PDFs and documents.
- Optional user-authorised device inputs.

Tasks:
- Explain visible application state, errors and workflows.
- Read and summarise bills, receipts, invoices and documents.
- Identify and explain objects, labels, ports, connectors and product information when possible.
- Compare images/products and describe uncertainty.
- OCR, chart/table understanding, visual annotation and document extraction.
- Guide the user through a screen with numbered steps or highlights.

Capture must be visible, consent-based and stoppable. No covert recording or background monitoring of people.

## 7. Shared visual workspace

A shared surface where user and JARVIS can:
- View a browser or app workspace.
- Display and annotate screenshots.
- Create flowcharts, architecture diagrams and whiteboards.
- Preview code, documents, images and presentations.
- Compare versions side by side.
- Show agent plans, tool activity and task progress.
- Drag and drop files.
- Expand the workspace while keeping the avatar visible in a dock or picture-in-picture panel.

## 8. Computer and browser operator

Capabilities, subject to permissions:
- Open and navigate supported applications and websites.
- Search public information.
- Click, type, scroll and inspect page state.
- Read and create files in approved workspaces.
- Use terminal commands in a restricted execution environment.
- Inspect repositories, run tests and propose code changes.
- Prepare commits, pull requests and deployments.
- Capture evidence and report the result.

Use a controlled desktop agent and browser automation adapter. Separate observation from execution. Use allowlists, scoped folders, command policies, sandboxing and action logs. Destructive operations and production changes require explicit confirmation.

## 9. Project brain and persistent memory

Memory categories:
1. Identity and interaction preferences.
2. Project knowledge and current status.
3. Decisions, rationale and superseded decisions.
4. Tasks, deadlines and milestones.
5. Documents and extracted knowledge.
6. Conversation summaries and user-approved facts.
7. Operational history and verified tool results.

For every project store name, objective, description, stage, repository, deployment, stack, requirements, architecture, decisions, bugs, tasks, dependencies, milestones, dates, documents, updates and next actions.

Functions:
- Create, retrieve, update, correct, archive and delete memories.
- Search semantically and structurally.
- Show the source and timestamp for remembered facts where possible.
- Detect stale information and ask before treating it as current.
- Daily and weekly briefings.
- User inspection, export and deletion controls.

Use PostgreSQL as the source of truth and pgvector for semantic retrieval; vector search is not the database's only memory mechanism.

## 10. Specialist agents and orchestration

A central orchestrator delegates to specialist agents with narrowly scoped tools and shared approved context.

Initial agents:
- Research and intelligence.
- Software engineering.
- Business strategy and finance.
- Creative and marketing.
- Operations and planning.
- Security and fraud analysis.
- Document and meeting assistant.

The orchestrator must plan multi-step tasks, track state, handle retries safely, request approvals, verify outputs and summarise results. Agents cannot silently expand their permissions.

## 11. Research and public information

- Search public websites and reputable sources for topics the user names.
- Research companies, products, markets, news, laws, regulations, public court materials and industries.
- Produce cited summaries, market maps, competitor comparisons and investor-ready reports.
- Label claims as confirmed, reported, estimated, disputed or unverified.
- Include source date, publication date where available, and confidence/limitations.
- Respect website terms, platform rules, copyright and access controls.

Social-media research is limited to public topic/organisation/product research and accounts the user is authorised to access. Do not scrape or profile a targeted private individual, infer sensitive traits, bypass privacy controls or create surveillance dossiers.

## 12. Engineering copilot

- GitHub repository inspection and code search.
- Architecture and API design.
- Database schema and migration generation.
- Code generation and controlled file editing.
- Debugging and log analysis.
- Unit, integration and end-to-end test generation.
- Build verification and deployment assistance.
- Documentation and technical handoff.
- Support TypeScript, JavaScript, Python, Dart, Flutter, React, Next.js, FastAPI and SQL initially.

Code changes should be made in a branch or isolated workspace, reviewed as diffs, tested and approved before merge or production deployment.

## 13. Business and personal operations

- Gmail and Google Calendar integrations.
- Task and reminder management.
- Focus-time planning and weekly reviews.
- Meeting preparation, transcription where consented, summaries and action items.
- Email, WhatsApp and proposal drafting in the user's chosen voice.
- Invoice and document creation.
- Expense classification and simple financial summaries.
- Project and business reporting.

External messages, calls, bookings, payments and publications require explicit confirmation immediately before the action. Calls/messages are limited to the user's own contacts and supported services.

## 14. Creative and marketing studio

- Brand profiles per project.
- Copywriting, proposals, pitch decks and landing pages.
- Social posts, content calendars, video scripts and storyboards.
- Image/video generation integrations.
- Thumbnail and presentation concepts.
- Brand voice, colour and typography references.
- Asset organisation and approval workflow.

## 15. Scam and fraud intelligence

Accept pasted text, links, screenshots, invoices, payment requests and investment offers. Identify suspicious indicators, explain the reasoning, recommend independent verification and distinguish warning signals from confirmed fraud. Do not claim a risk score proves fraud or guarantees safety.

## 16. Device and environment integrations

Potential integrations include Windows/macOS computers, Android/iOS companion devices, microphones, cameras, displays, speakers, Bluetooth accessories and user-authorised smart devices. Device access is explicit, scoped and revocable. No unauthorised discovery or control of other people's devices.

## 17. Proactive intelligence

Opt-in briefings and alerts for connected projects, configured deadlines, failed builds, calendar conflicts, agreed monitoring topics and incomplete tasks. No unrequested surveillance or unbounded monitoring. Every proactive rule must be visible, editable and disableable.

## 18. Operating modes

- **Observe:** analyse approved information without changing it.
- **Assist:** prepare drafts, plans and proposed changes.
- **Operator:** execute allowed steps under configured permissions.

Require confirmation for external communication, calls, payments, publication, deletion, permission changes, production database changes, merges and production deployments. Provide emergency stop, revocation and audit history.

## 19. Security, privacy and compliance

- Strong authentication and session controls.
- Encrypted transport and storage.
- Server-side secrets; never expose provider keys in frontend code.
- Per-integration OAuth scopes and revocation.
- Tenant isolation and database row-level security.
- Local credential vault where applicable.
- Sandboxed execution and filesystem allowlists.
- Visible capture indicators and user-controlled retention.
- Audit logs for sensitive actions.
- Data export, correction and deletion.
- Privacy impact and legal review for Nigeria Data Protection Act 2023 and other relevant markets.
- No recording of others without consent.

## 20. Platform and architecture direction

- Desktop shell: Tauri 2 with React and TypeScript.
- 3D avatar: Three.js with licensed rigged GLB/GLTF character.
- Mobile companion: Flutter (later milestone).
- Optional web control panel: Next.js.
- Backend: Python FastAPI.
- Database: Supabase PostgreSQL with pgvector.
- Realtime state/cache: Redis when justified.
- AI reasoning: Claude adapter plus model-provider abstraction.
- Realtime voice: low-latency voice provider adapter; evaluate current realtime APIs.
- Speech fallback: ASR/TTS adapters with timestamp/viseme support.
- Browser automation: Playwright.
- Desktop automation: restricted local agent.
- Integrations: MCP and direct vendor APIs.
- Background jobs: worker queue; n8n only for suitable external workflows.
- Monitoring: structured logs, error monitoring and usage/cost telemetry.

The existing AURA React application is a starting asset, not a constraint. Preserve it on the current main branch. Desktop conversion and major refactoring happen on the dedicated JARVIS branch.

## 21. MVP acceptance criteria

The first meaningful demo must prove:
1. Desktop application launches on a supported Windows computer.
2. Realistic 3D avatar renders and has listening/speaking/idle states.
3. Two-way voice works and user can interrupt the assistant.
4. User can explicitly share a screen or camera snapshot and ask questions.
5. JARVIS can remember and retrieve at least one seeded project and decision.
6. A shared workspace displays an agent's plan and activity.
7. JARVIS can inspect a safe browser task and report evidence.
8. A safe file operation can be proposed, approved, executed and verified.
9. Sensitive external actions are blocked pending approval.
10. App restart does not erase persistent project memory.

A feature is not complete because a button exists. It must pass an end-to-end test and report its actual state.

## 22. Roadmap

**Foundation:** repo hygiene, architecture, secure configuration, desktop shell, backend health, database migrations.

**Alpha:** 3D avatar, real-time voice, interruption, project memory, explicit screen/camera understanding, shared workspace.

**Beta:** browser and computer operator, agent orchestration, GitHub engineering workflows, research citations, approvals and audit trail.

**V2:** Gmail, Calendar, documents, marketing studio, fraud checker, finance tools, mobile companion, proactive briefings.

**V3:** multi-user commercial platform, organisations, subscriptions, usage metering, admin console, enterprise controls and private deployment.

## 23. Delivery and quality rules

- Maintain this PRD as the source of truth.
- Record architecture decisions and requirement changes.
- Never overwrite existing AURA functionality without review.
- Keep changes modular and testable.
- Use migrations for schema changes.
- Keep development and production separate.
- No secrets in source control.
- No fake integrations or success messages.
- Verify every tool action.
- Build and test after each milestone.
- Document limitations and provider costs.
- Do not promise perfect human behaviour or unrestricted autonomy.
