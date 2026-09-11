# KomunasApp and Linqra Entity Data Model

This document describes the MongoDB entities used by **KomunasApp** (USCIS intelligence) and **Linqra** (API gateway, agents, Knowledge Hub, subscriptions). It covers what each collection stores, how records relate, and how the USCIS sentinel pipeline writes data.

Sample documents live in this folder (`docs/data/`).

| Database | Owner | Role |
| :--- | :--- | :--- |
| `Komunas` | KomunasApp | Live USCIS sync state, version history, local users, WhatsApp, demos |
| `Linqra` (gateway) | Linqra API Gateway | Subscriptions, notifications, catalog metadata, agents, workflows, Knowledge Hub, tenancy |

KomunasApp does **not** own subscriptions or emails. It scrapes USCIS, commits state locally, then Linqra stores who is watching and who got mailed.

---

## 1. Shared join keys

Almost every USCIS-related record is keyed by the same triple:

| Field | Example | Meaning |
| :--- | :--- | :--- |
| `domain` | `uscis-sentinel` | Product domain for this monitoring program |
| `category` | `forms`, `announcements`, `policy-manual`, `visa-bulletin`, `processing-times` | Resource family |
| `resourceId` | `I-600`, `newsroom-alerts`, `filing-charts` | Concrete resource inside that family |

Other cross-system IDs:

| Field | From | To |
| :--- | :--- | :--- |
| `teamId` | Komunas `users.teamId` | Linqra `teams._id` |
| `agentTaskId` | Komunas `resource_sync_state.agentTaskId` | Linqra `agent_tasks._id` |
| `documentId` | Komunas `resource_sync_state.documentId` | Linqra `knowledge_hub_documents.documentId` (UUID, not Mongo `_id`) |
| `subscriptionId` | Linqra `resource_notifications.subscriptionId` | Linqra `resource_subscriptions._id` |
| `userId` (Linqra subscriptions) | Email / username | Linqra identity used at subscribe time (often the Komunas login email) |

```text
Organization ──< Team ──< TeamMember >── User (Linqra)
                  │
                  ├── Agent ──< AgentTask ──< AgentExecution
                  │                 │
                  │                 └── linq_config.workflow ──> LinqWorkflowExecution
                  │
                  ├── KnowledgeHubCollection ──< KnowledgeHubDocument ──< Chunk / Version
                  │
                  └── ResourceSubscription ──< ResourceUpdateNotification

Komunas User.teamId ─────────────────────────────> Team._id

ResourceSyncState (Komunas)
  ├── (domain, category, resourceId) ──> ResourceMetadata (Linqra catalog)
  ├── (domain, category, resourceId) ──> ResourceSubscription (who is watching)
  ├── agentTaskId ─────────────────────> AgentTask
  ├── documentId ──────────────────────> KnowledgeHubDocument.documentId
  └── _id ──< ResourceVersionHistory.syncStateId
```

---

## 2. End-to-end write path (USCIS sentinel)

Daily (or on demand) a Linqra **AgentTask** runs an embedded workflow:

1. **Check** — Komunas scraper writes nothing yet. It returns hashes, edition, URLs, and `shouldSync` / `changed`.
2. **Ingest** (forms only) — Linqra Knowledge Hub creates or reuses `KnowledgeHubDocument` rows (and chunks/embeddings in Milvus).
3. **Delta + LLM** — Linqra extracts text deltas and asks the model for a JSON analysis.
4. **Commit** — Komunas upserts `resource_sync_state` and inserts `resource_version_history`.
5. **Dispatch** (only if a real change) — Linqra finds enabled `resource_subscriptions` for that triple and inserts `resource_notifications`, then emails.

`resource_metadata` is the static catalog (display names). It is not rewritten on every scan.

---

## 3. Komunas database (`Komunas`)

### 3.1 `resource_sync_state` — `ResourceSyncState`

**Purpose:** Current live snapshot of one monitored USCIS resource. One row per `(domain, category, resourceId)` (unique index `resource_sync_idx`).

**Functionality:**

- Written by `commitUpdate` after a workflow run.
- Read by public status APIs and the Komunas UI (forms library, form detail, newsroom, processing times).
- `enabled = false` is a soft delete (for example after Knowledge Hub documents disappear).
- `changeDetected` is the latest commit’s change flag. The UI also looks at version history in a 72-hour window.

**Fields:**

| Field | Role |
| :--- | :--- |
| `domain`, `category`, `resourceId` | Identity triple |
| `displayName` | Human label scraped from USCIS (e.g. form H1) |
| `agentTaskId` | Linqra task that last committed |
| `resourceUrl`, `instructionsUrl` | Primary and instructions PDF (or page URL for non-PDF feeds) |
| `supplementalResources` | Map of extra PDFs (`supp1`, `i130a`, …) with `name`, `url`, `hash`, `documentId` |
| `lastKnownVersion` | Edition date or feed version string (`01/20/25`, `September 04, 2026`) |
| `effectiveDate` | Mandatory-use date when known |
| `lastKnownHash`, `lastKnownInstructionsHash` | SHA-256 of downloaded bytes |
| `documentId`, `instructionsDocumentId` | Current Knowledge Hub UUIDs |
| `oldDocumentId`, `oldInstructionsDocumentId` | Previous UUIDs used for delta compare |
| `changeType` | `FORM_UPDATE`, `ANNOUNCEMENT_UPDATE`, `POLICY_UPDATE`, `VISA_BULLETIN_UPDATE`, `PROCESSING_TIMES_UPDATE` |
| `summary` | Human summary from the agent (or the no-change default) |
| `changeDetected` | Whether this commit was a material update |
| `lastAnalysis` | Full LLM JSON (or a `NO_CHANGE` stub) |
| `payload` | Structured digest (alerts, updates, visa tables, processing-time combinations) |
| `lastCheckedAt`, `lastUpdatedAt`, `updatedAt` | Check vs commit vs Spring last-modified |
| `enabled` | Soft-active flag |

**Example (forms)** — I-600 current state from [`Komunas.resource_sync_state.json`](Komunas.resource_sync_state.json):

- `lastKnownVersion`: `01/20/25`
- `documentId`: `8013bd1c-9408-409e-b517-e6410caf9860` → Knowledge Hub file `I-600_01/20/25.pdf` (created 2026-03-26, `AI_READY`, 58 chunks)
- `instructionsDocumentId`: `dd325404-2a6c-4b7e-88c3-0d0f8fca0a9b` → `I-600_instructions_01/20/25.pdf`
- `supplementalResources.supp1/supp2/supp3` match KH `I-600_supp{n}_01/20/25.pdf` UUIDs `2977f889…`, `6bcbe1a8…`, `e2c7bc8d…`
- `changeDetected`: `false` on a routine no-change scan
- `agentTaskId`: `69c55d8d72d4a82240eaf787`

**Example (announcements)** — `newsroom-alerts` in the same file stores the AI digest in both `lastAnalysis` and `payload.alerts[]` (title, date, summary, url).

---

### 3.2 `resource_version_history` — `ResourceVersionHistory`

**Purpose:** Immutable (soft-deletable) log of every commit for a resource. The UI timeline, Change Monitor, and 72-hour “recent change” badge read this collection.

**Functionality:**

- One insert per workflow commit, including no-change scans.
- `syncStateId` points at the parent `resource_sync_state._id`.
- `enabled = false` when the parent sync state is deactivated (orphaned Knowledge Hub docs).

**Fields:** Same identity and document/hash fields as sync state, plus:

| Field | Role |
| :--- | :--- |
| `syncStateId` | FK to `resource_sync_state._id` |
| `version` | Version string at detection time |
| `hash` / `instructionsHash` | Content hashes at that commit |
| `analysis` | LLM snapshot for that run (raw chat completion or parsed JSON) |
| `payload` | Structured digest for that run |
| `detectedAt` | When this history row was written |
| `changeDetected` | Whether that run was treated as a material update |

**Example** from [`Komunas.resource_version_history.json`](Komunas.resource_version_history.json): newsroom history row `_id 69fea2d7…eb` links `syncStateId` `69fea2d7…ea` (the matching sync-state document). `analysis` can be the raw OpenAI `chat.completion` object; `payload` holds the parsed alerts list.

---

### 3.3 `users` — `User`

**Purpose:** Komunas-native login accounts (HMAC JWT), **not** Linqra/Keycloak users.

| Field | Role |
| :--- | :--- |
| `username`, `email` | Unique login identifiers |
| `password` | Local password hash |
| `fullname` | Display name |
| `roles` | e.g. `USER`; Super Admin gating uses gateway JWT roles separately |
| `isActive` | Account enabled |
| `teamId` | Assigned Linqra workspace team |
| `reset_token`, `reset_token_expiry` | Forgot-password flow |
| `avatarUrl` | Optional avatar |

Komunas overlays Linqra subscriptions onto status APIs using the logged-in email as `userId`.

---

### 3.4 `saved_searches` — `SavedSearch`

Persisted search queries for a Komunas user (`user_id` + `query` + `created_at`). UI: Saved Searches page.

---

### 3.5 `demo_requests` — `DemoRequest`

Inbound demo leads from the public site: `name`, `email`, `company`, `notes`, `emailSent`, `created_at`. Admin notification email is sent through Linqra mail.

---

### 3.6 `whatsapp_contacts` — `WhatsAppContact`

WhatsApp Business contacts seen via the webhook.

| Field | Role |
| :--- | :--- |
| `wa_id` | Unique WhatsApp user id |
| `profile_name`, `phone_number` | Display identity |
| `first_seen`, `last_seen`, `message_count` | Activity |
| `is_active` | Soft active |
| `last_webhook_field` | Last webhook type (`messages`, `message_echoes`, `history`) |

---

### 3.7 `whatsapp_messages` — `WhatsAppMessage`

Inbound/outbound WhatsApp messages keyed by `whatsapp_id` and `from_number`. `wa_id` links to `whatsapp_contacts`. Stores body, media, status, and webhook field.

These collections are Komunas-local. They are not the Linqra `conversations` / `conversation_messages` used by AI assistants.

---

### 3.8 Embedded type: `SupplementalResource`

Not its own collection. Nested under sync state and history:

| Field | Role |
| :--- | :--- |
| `name` | e.g. Supplement 1 |
| `url` | USCIS PDF URL |
| `hash` | SHA-256 of that PDF |
| `documentId` | Current Knowledge Hub UUID |
| `oldDocumentId` | Previous UUID (check/commit delta) |

---

## 4. Linqra database — USCIS / Komunas integration

These three collections are the Linqra side of the sentinel product. Samples: [`Linqra.resource_metadata.json`](Linqra.resource_metadata.json), [`Linqra.resource_subscriptions.json`](Linqra.resource_subscriptions.json), [`Linqra.resource_notifications.json`](Linqra.resource_notifications.json).

### 4.1 `resource_metadata` — `ResourceMetadata`

**Purpose:** Catalog of subscribe-able resources. Unique on `(domain, category, resourceId)`.

| Field | Example |
| :--- | :--- |
| `domain` | `uscis-sentinel` |
| `category` | `forms` |
| `resourceId` | `I-485` |
| `displayName` | `I-485 Green Card Application` |
| `description` | Short catalog blurb |

Komunas status APIs may overlay `displayName` from here (via the user’s subscription) onto scraped names.

---

### 4.2 `resource_subscriptions` — `ResourceSubscription`

**Purpose:** Who is watching which resource, and how to deliver alerts.

Unique on `(userId, domain, category, resourceId, appName)`.

| Field | Role |
| :--- | :--- |
| `userId` | Subscriber identity (email in samples, e.g. `mehmetsen80@gmail.com`) |
| `teamId` | Optional team-wide subscription |
| `domain`, `category`, `resourceId` | Same triple as Komunas sync state |
| `appName` | `komunas-app` |
| `enabled` | Soft on/off |
| `delivery.emailEnabled`, `delivery.email` | Outbound email target (may differ from `userId`) |
| `delivery.webhookEnabled`, `delivery.webhookUrl` | Optional webhook |
| `filters` | Optional extra filters |
| `createdAt`, `updatedAt` | Audit |

Komunas `SubscriptionController` proxies create/delete to Linqra. The UI subscribe modals write these rows.

---

### 4.3 `resource_notifications` — `ResourceUpdateNotification`

**Purpose:** In-app (and emailed) alert instances. One row per subscriber per dispatch.

| Field | Role |
| :--- | :--- |
| `subscriptionId` | Parent subscription |
| `domain`, `category`, `resourceId`, `appName` | Resource identity (`komunas-app`) |
| `type` | `EDITION_UPDATE`, `NEWS_UPDATE`, `POLICY_UPDATE`, `PROCESSING_TIMES_UPDATE`, … |
| `severity` | `HIGH`, `MEDIUM`, `LOW` |
| `summary` | Email / inbox title |
| `details` | Longer body |
| `delta` | Structured payload (e.g. `alerts[]` for newsroom) |
| `read` | Inbox read state |
| `reportUrl` | Link back to Komunas (`https://komunas.com` or a resource URL) |
| `createdAt` | When dispatched |

Workflow step `/api/notifications/dispatch` creates these. Komunas `NotificationController` lists/marks them via Linqra.

---

## 5. Linqra database — agents, workflows, Knowledge Hub

These drive the sentinel jobs that write Komunas state.

### 5.1 Tenancy

| Collection | Entity | Role |
| :--- | :--- | :--- |
| `organizations` | `Organization` | Top-level tenant (`name`, `shortName`) |
| `teams` | `Team` | Workspace. Komunas users store this id in `teamId`. Knowledge Hub docs and agent tasks are team-scoped. Sample I-600 ingest uses team `681a97eaec715f343bcb1ecf`. |
| `team_members` | `TeamMember` | `(teamId, userId)` membership + `UserRole` + status |
| `users` | `User` | Linqra/gateway users (username, email, roles). Separate from Komunas `users`. |

### 5.2 Agents and executions

| Collection | Entity | Role |
| :--- | :--- | :--- |
| `agents` | `Agent` | Named agent per team (e.g. USCIS Form Monitor). `supportedIntents`, `capabilities`, `appEndpoints`. |
| `agent_tasks` | `AgentTask` | Schedulable unit. For Komunas this is usually `WORKFLOW_EMBEDDED`: `linqConfig.query.workflow` is the JSON in `docs/forms/*.json`. Cron via `cronExpression`. Komunas stores `agentTaskId` on sync state. |
| `agent_task_versions` | `AgentTaskVersion` | Immutable history of a task’s workflow config |
| `agent_executions` | `AgentExecution` | One run of a task (`executionId` UUID, status, duration, step progress, LLM/API call logs). Joins `agentId`, `taskId`, `teamId`, `workflowExecutionId`. |
| `execution_queue` | `ExecutionQueue` | Short-lived queue row while a run is starting |

### 5.3 Linq workflows

| Collection | Entity | Role |
| :--- | :--- | :--- |
| `linq_workflows` | `LinqWorkflow` | Reusable named workflow template (`request` is a `LinqRequest`) |
| `linq_workflow_versions` | `LinqWorkflowVersion` | Versioned copies of that template |
| `linq_workflow_executions` | `LinqWorkflowExecution` | Concrete execution: input `request`, full `response` (all step results), `agentTaskId`, `agentExecutionId`, duration, status |

The I-600 false-positive email was one `LinqWorkflowExecution` whose step 12 called notification dispatch. Form sync state still points at the same `agentTaskId`.

### 5.4 Knowledge Hub (PDF ingest)

Form workflows call Linqra `/api/ingression/url` with the USCIS PDF URL plus a constructed `fileName`. The Knowledge Hub document’s Mongo `_id` is an ObjectId; Komunas stores the UUID `documentId`. There is no URL field on the KH document — the source URL lives on Komunas `resource_sync_state`. Re-ingesting the same URL returns the existing UUID (that is why a no-change form scan can still “ingest” in milliseconds).

Samples: [`Linqra.knowledge_hub_collection.json`](Linqra.knowledge_hub_collection.json), [`Linqra.knowledge_hub_documents.json`](Linqra.knowledge_hub_documents.json), [`Linqra.knowledge_hub_document_metadata.json`](Linqra.knowledge_hub_document_metadata.json), [`Linqra.knowledge_hub_chunks.json`](Linqra.knowledge_hub_chunks.json).

#### Collections in the dump

| `_id` | Name | Team | Role vs Komunas |
| :--- | :--- | :--- | :--- |
| `69b59281335da35d18c7b354` | **USCIS Files Sync** | `681a97eaec715f343bcb1ecf` | Live sentinel ingest target. Description says documents are ingested by the USCIS Sentinel agent. Milvus: `uscis_forms_openai_text_embedding_3_small_1536`. Holds 78 of 87 sampled documents, including all I-600 PDFs. |
| `6908293ccf9b906ef0b5ac53` | USCIS Marriage-Based Applications | same team | Curated library (e.g. `i-485.pdf`, `i-130_instructions.pdf`) from late 2025, **not** the daily agent dump. |
| `69520cf621458438d23771d0` | Crews Center F1 Visa & Entrepreneurship Advisor | `69442654fcd48d2383fab507` | Unrelated tenant collection. |
| `69c2bb8728539969453e0d44` | Computer Science Advising Knowledge Base | `681a97eaec715f343bcb1ecf` | Unrelated. |
| `6a346ac027a21d4c9910c6ae` | International Students Documents | `6a3469c127a21d4c9910c6a6` | Unrelated; no Milvus name yet. |

Checked-in form workflow JSON still has `params.collectionId` `69ac77018626a22133fff877`, which is **not** in this dump. Live I-600 rows sit in **USCIS Files Sync**. Treat AgentTask params on Linqra as the source of truth, not the template file.

#### `knowledge_hub_documents` — `KnowledgeHubDocument`

**Purpose:** One ingested file. Unique on `documentId` (UUID). Indexed by `(teamId, collectionId)` and status.

**Functionality:**

- Created by URL ingression. Status becomes `AI_READY` after chunking/embeddings.
- Filename convention from form workflows: `{resourceId}_{edition}.pdf`, `{resourceId}_instructions_{edition}.pdf`, `{resourceId}_suppN_{edition}.pdf`.
- S3: `raw/{teamId}/{collectionId}/{documentId}_{fileName}` and `processed/{teamId}/{collectionId}/{documentId}.json`.
- `encrypted: true` + `encryptionKeyVersion: v1` for current USCIS files.
- `currentVersion` starts at 1. File-level history lives in `knowledge_hub_document_versions` (not in this dump).

**I-600 example** (created `2026-03-26T16:25:50Z`, same UUIDs Komunas still holds):

| `fileName` | `documentId` | Chunks / tokens |
| :--- | :--- | :--- |
| `I-600_01/20/25.pdf` | `8013bd1c-9408-409e-b517-e6410caf9860` | 58 / 40080 |
| `I-600_instructions_01/20/25.pdf` | `dd325404-2a6c-4b7e-88c3-0d0f8fca0a9b` | 22 / 8188 |
| `I-600_supp1_01/20/25.pdf` | `2977f889-9887-4091-b6f5-b3dd2cd1e04b` | 25 / 13156 |
| `I-600_supp2_01/20/25.pdf` | `6bcbe1a8-fa06-4ca1-91aa-eeb86a0d0d54` | 7 / 3025 |
| `I-600_supp3_01/20/25.pdf` | `e2c7bc8d-9507-4dc6-8b86-3b2942426c2f` | 22 / 16738 |

Chunking options on these rows: `chunkSize` 400, `overlapTokens` 50, `chunkStrategy` `sentence`, `processingModel` `text-embedding-3-small`.

Form commit payload maps:

- `documentId` ← primary PDF
- `instructionsDocumentId` ← instructions PDF
- `supplementalResources.*.documentId` ← extra PDFs

#### `knowledge_hub_document_metadata` — `KnowledgeHubDocumentMetaData`

**Purpose:** Extracted PDF stats and catalog fields, unique on `(documentId, teamId, collectionId)`. One row per sampled document (87).

I-600 primary PDF: `pageCount` 16, `wordCount` 22136, `documentType` `PDF`, `status` `EXTRACTED`, `extractionModel` `ProcessedJSONParser`. `title` / `author` / `subject` / `creator` are ciphertext (`encryptionKeyVersion: v1`). `customMetadata` also stores chunk totals and a `graphExtraction` run (entity + relationship extraction, e.g. `gemini-2.0-flash` on I-600).

#### `knowledge_hub_chunks` — `KnowledgeHubChunk`

**Purpose:** Ordered text slices for RAG. Unique on `(documentId, chunkIndex)`. Embeddings are in Milvus (`KnowledgeHubCollection.milvusCollectionName`), not on this row.

I-600 form has exactly 58 chunk rows, matching `totalChunks` / `totalEmbeddings` on the document. Typical fields: `chunkId` UUID, `tokenCount`, `startPosition`/`endPosition`, `pageNumbers`, `containsTable`, `qualityScore`, `language`. `text` is ciphertext when `encryptionKeyVersion` is set (`team_chunk_keys` holds the team key; that collection is not in this dump).

Related collections without samples here: `knowledge_hub_document_versions`, `team_chunk_keys`, `graph_extraction_jobs`, `collection_export_jobs`.

---

## 6. Linqra database — platform (not USCIS-specific)

These collections are Linqra’s product surface. Komunas uses some of them indirectly (mTLS routes, tools, assistants).

### 6.1 Gateway routing and health

| Collection | Entity | Role |
| :--- | :--- | :--- |
| `apiRoutes` | `ApiRoute` | Registered microservice routes (`komunas-app` is one). Health check config, rate limits, filters. |
| `apiRouteVersions` | `ApiRouteVersion` | Version history of a route |
| `routeVersionMetadata` | `RouteVersionMetadata` | Extra metadata per route version |
| `apiEndpoints` | `ApiEndpoint` | Endpoint definitions under a route |
| `apiEndpointVersions` | `ApiEndpointVersion` | Endpoint version history |
| `apiEndpointVersionMetadata` | `ApiEndpointVersionMetadata` | Extra endpoint-version metadata |
| `team_routes` | `TeamRoute` | Which teams may call which routes |
| `api_keys` | `ApiKey` | Team API keys |
| `apiMetrics` | `ApiMetric` | Per-route traffic/latency metrics |
| `alerts` | `Alert` | Metric threshold alerts on routes |

Embedded (not standalone collections): `FilterConfig`, `HealthCheckConfig`, `HealthThresholds`, `AlertRule`, `AlertSeverity`, `RoutePermission`.

### 6.2 Tools and LLM catalog

| Collection | Entity | Role |
| :--- | :--- | :--- |
| `tool_definitions` | `ToolDefinition` | Callable tools (`toolId` e.g. `uscis_status_forms`) with Linq config, schemas, pricing |
| `tool_executions` | `ToolExecution` | One invocation of a tool |
| `llm_models` | `LlmModel` | Available models |
| `linq_llm_models` | `LinqLlmModel` | Linq-protocol model wiring |
| `llm_pricing_snapshots` | `LlmPricingSnapshot` | Historical token pricing |

### 6.3 Assistants and chat

| Collection | Entity | Role |
| :--- | :--- | :--- |
| `ai_assistants` | `AIAssistant` | RAG/chat assistants bound to a team and Knowledge Hub collections |
| `conversations` | `Conversation` | Chat thread (`assistantId`, `teamId`, `username`) |
| `conversation_messages` | `ConversationMessage` | Messages in a conversation |
| `doc_reviews` | `DocReviewAssistant` | Document-review assistant sessions |

### 6.4 Ops, security, billing

| Collection | Entity | Role |
| :--- | :--- | :--- |
| `audit_logs` | `AuditLog` | User/system actions (hot 90 days in Mongo) |
| `system_change_logs` | `SystemChangeLog` | Platform change log |
| `security_incidents` | `SecurityIncident` | Security events |
| `external_user_credits` | `ExternalUserCredit` | External API credit balances |
| `external_usage_log` | `ExternalUsageLog` | External usage accounting |

Enums stored as fields, not collections: `TeamStatus`, `TeamMemberStatus`.

---

## 7. Category → collections mapping

| `category` | Komunas `resourceId` examples | Linqra catalog | Typical `changeType` / notification `type` |
| :--- | :--- | :--- | :--- |
| `forms` | `I-600`, `I-485`, `N-400` | `resource_metadata` row per form | `FORM_UPDATE` / `EDITION_UPDATE` |
| `announcements` | `newsroom-alerts`, `news-releases` | same triple | `ANNOUNCEMENT_UPDATE` / `NEWS_UPDATE` |
| `policy-manual` | `policy-updates` | same triple | `POLICY_UPDATE` |
| `visa-bulletin` | `filing-charts` | same triple | `VISA_BULLETIN_UPDATE` |
| `processing-times` | `I-130` (and office splits in check APIs) | same triple | `PROCESSING_TIMES_UPDATE` |

Forms also occupy Knowledge Hub documents. Newsroom/policy/visa/processing times usually store content in `payload` on Komunas state, not as PDFs.

---

## 8. Functional relationships (who writes what)

| Action | Writer | Collections touched |
| :--- | :--- | :--- |
| Subscribe to I-130 | Komunas UI → Linqra | `resource_subscriptions` |
| Daily form scan (no change) | AgentTask → Komunas commit | `resource_sync_state` upsert, `resource_version_history` insert |
| Form edition change | AgentTask → KH ingest → Komunas commit → Linqra dispatch | `knowledge_hub_documents` (+ chunks), Komunas state/history, `resource_notifications` |
| Newsroom digest | AgentTask → Komunas commit → dispatch if `changed` | Komunas state `payload.alerts`, notifications `delta.alerts` |
| Mark alert read | Komunas UI → Linqra | `resource_notifications.read` |
| KH doc deleted | Linqra webhook → Komunas | Nulls `documentId`, sets `resource_sync_state.enabled = false` |
| Register / login | Komunas | `users` (Komunas DB only) |
| Assign workspace team | Komunas Super Admin | `users.teamId` → Linqra `teams` |

---

## 9. Sample data files

| File | Collection | What it illustrates |
| :--- | :--- | :--- |
| [`Komunas.resource_sync_state.json`](Komunas.resource_sync_state.json) | `resource_sync_state` | Live rows for newsroom, forms (including I-600 supplements), hashes, KH UUIDs, `agentTaskId` |
| [`Komunas.resource_version_history.json`](Komunas.resource_version_history.json) | `resource_version_history` | Timeline rows with `syncStateId` and LLM `analysis` |
| [`Linqra.resource_metadata.json`](Linqra.resource_metadata.json) | `resource_metadata` | Catalog labels for forms/feeds |
| [`Linqra.resource_subscriptions.json`](Linqra.resource_subscriptions.json) | `resource_subscriptions` | Per-user watches + delivery email |
| [`Linqra.resource_notifications.json`](Linqra.resource_notifications.json) | `resource_notifications` | HIGH news alerts with `subscriptionId` and `delta.alerts` |
| [`Linqra.knowledge_hub_collection.json`](Linqra.knowledge_hub_collection.json) | `knowledge_hub_collection` | Team libraries; sentinel PDFs live in **USCIS Files Sync** |
| [`Linqra.knowledge_hub_documents.json`](Linqra.knowledge_hub_documents.json) | `knowledge_hub_documents` | Ingested PDFs; I-600 UUIDs join Komunas `documentId` |
| [`Linqra.knowledge_hub_document_metadata.json`](Linqra.knowledge_hub_document_metadata.json) | `knowledge_hub_document_metadata` | Page/word counts, encrypted PDF headers, graph-extraction stats |
| [`Linqra.knowledge_hub_chunks.json`](Linqra.knowledge_hub_chunks.json) | `knowledge_hub_chunks` | Encrypted RAG slices; embeddings are in Milvus |

Use those files as the source of truth for field shapes in production, alongside the Java entity classes:

- Komunas: `../../src/main/java/org/lite/komunas/entity/`
- Linqra: `/Users/mehmetsen/IdeaProjects/Linqra/api-gateway/src/main/java/org/lite/gateway/entity/`
