# Feedback, certificates and reports

After an event, organisers collect feedback, optionally issue participation certificates, and pull data out of Yuyu. This module covers the per-event feedback form and its two privacy modes, the layered certificate designer and the `sharp` renderer, the post-event PDF report, the streamed CSV exports, and saved views (named filter sets on the dashboard's long lists). The common thread is a privacy line. Anonymous feedback stays anonymous, reports count answers without copying them, exports are uncached and audited, and a saved view never grants access.

## Key files

| Path | Role |
| --- | --- |
| `lib/feedback.ts` | `submitFeedback`: validation, certificate eligibility and response creation in one locked transaction |
| `lib/feedbackTemplates.ts` | Starter forms `QUICK_PULSE`, `EVENT_REVIEW`, `CONTENT_REVIEW` |
| `lib/core/feedbackSettings.ts` | `saveFeedbackSettingsWithAccess` (shared with the mobile `feedback/state` route) |
| `app/actions/feedback-form.ts` | Settings, fields, templates, `loadFeedbackResponsesPage` |
| `lib/eventDashboard/feedbackResponses.ts` | Paged responses (`FEEDBACK_RESPONSES_PAGE_SIZE` = 25) |
| `app/api/feedback/route.ts` | Public `POST /api/feedback` |
| `lib/certificateTemplate.ts` | Template schema (layers, merge tags, fonts), legacy upgrade |
| `lib/certificateAssets.ts` | `certificateImagesAreOwned` |
| `lib/renderCertificate.ts` | `renderCustomCertificate`, `certificateMergeValues` |
| `app/actions/certificate.ts` | Upload background and layer images, `previewCertificate` |
| `app/api/feedback/certificate/[token]/route.ts` | Certificate JPEG download |
| `lib/eventReport.ts` | Metrics for an event or occurrence, `isReportAvailable`, `summariseQuestions` |
| `lib/eventReportPdf.ts` | `createEventReportPdf` (pdf-lib) |
| `app/api/reports/event/[eventId]/route.ts`, `app/api/reports/instance/[instanceId]/route.ts` | Report downloads |
| `lib/csv.ts`, `lib/csvExport.ts` | Formula-safe CSV cells and the streaming export helpers |
| `app/api/exports/events/[eventId]/*/route.ts` | Attendee, attendee-email, teams, judging and feedback exports |
| `lib/savedViews.ts`, `lib/core/savedViews.ts`, `app/actions/saved-views.ts` | Saved views |

## How it works

### Feedback forms

Data model: `EventFeedbackForm` (one per event: `isOpen`, `title`, `thankYouMessage`, `certificateEnabled`, `certificateTemplate`), `EventFeedbackField` (questions, typed like registration fields), `EventFeedbackResponse` and `EventFeedbackAnswer`. Each answer keeps an immutable snapshot of the field's key, label and type, so old answers stay meaningful after the form is edited.

Organisation owners and admins manage the form (`feedbackAccessForUser`). Changes share the `feedback` action bucket and are audited as `FEEDBACK_FORM_UPDATED`. The public page is `/:orgSlug/:eventSlug/feedback`. Opening a form emails nobody, so organisers share the link themselves (for example with the `{{feedbackUrl}}` broadcast placeholder).

| Mode | Identity stored | Response row |
| --- | --- | --- |
| Certificates off | None | `rsvpId` and `certificateToken` both null. Repeat responses are allowed |
| Certificates on | Email must match a `CONFIRMED` RSVP (guest or account email, case-insensitive) | `rsvpId` and a 64-hex-character `certificateToken` both set. Repeats are allowed |

`POST /api/feedback` applies the `feedback` bucket (8 per minute) per IP and, when an email is sent, per hashed email too. `submitFeedback` then:

1. Finds the published event and its form.
2. Opens a transaction that takes `SELECT … FOR UPDATE` on the `Event` row and then the `EventFeedbackForm` row, and re-checks that the event is published and the form is open.
3. Validates typed answers against the current fields.
4. In certificate mode, looks up the confirmed RSVP and generates the token. The current `certificateTemplate` is snapshotted onto the response.
5. Creates the response and answers, then after commit emits the `feedback.submitted` webhook, which carries no answers.

::: warning Known boundary
Certificate eligibility proves knowledge of a confirmed attendee's email, not control of that inbox.
:::

### Certificates

- **Template** (`certificateTemplateSchema`): a `backgroundKey` plus up to 20 layers. Text layers hold up to 300 characters with merge tags `{{name}}`, `{{event}}`, `{{eventDate}}`, `{{organisation}}` and `{{issueDate}}`, a font (`serif`, `sans` or `mono`, all DejaVu), size, colour, bold, italic, uppercase, letter spacing and alignment. Image layers hold logos, signatures or seals. Boxes are percentages of the image. Templates in the older single name-area format are upgraded by `upgradeLegacyTemplate`.
- **Uploads**: JPEG, PNG or WebP up to 5 MB, re-encoded to lossless WebP with `createSafeWebpDerivative`. The longest side is capped at 6000 px for backgrounds and 3000 px for layer images. They are stored under `organisations/<orgId>/certificate-backgrounds/` and `organisations/<orgId>/certificate-assets/`, and share the `upload` bucket.
- **Ownership**: on save and on preview, `certificateImagesAreOwned` requires every referenced key to be a `image/webp` `Asset` of the same organisation.
- **Preview**: `previewCertificate` renders the exact JPEG on the server and returns a data URL, so fonts and fitting can be checked before saving.
- **Download**: `GET /api/feedback/certificate/:token` validates the token shape, loads the response, and returns `404` unless it has a token and a still-`CONFIRMED` RSVP. It renders the snapshotted template with `renderCustomCertificate`, or a built-in SVG certificate when none was set. The response is `image/jpeg` with `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer`.

### Post-event PDF report

`GET /api/reports/event/:eventId` and `GET /api/reports/instance/:instanceId` (Node runtime) return `404` unless the caller is signed in, the event or occurrence has ended (`isReportAvailable`), and the caller is an organisation owner or admin. The metrics come from `getEventReportMetrics` or `getOccurrenceReportMetrics`, and `createEventReportPdf` draws the sign-up timeline, arrivals by time and device, programme, speakers and sponsors, answer counts, emails sent, and team. `summariseQuestions` gives per-option counts for choice questions, but typed answers (free text, email, phone, "Other") are only **counted**. Downloads are audited as `EVENT_REPORT_DOWNLOADED` or `EVENT_OCCURRENCE_REPORT_DOWNLOADED`.

### CSV exports

| Route | Who | Audit |
| --- | --- | --- |
| `/api/exports/events/:eventId/attendees` | Owner, admin, or `MANAGE_REGISTRATIONS` | `ATTENDEE_LIST_EXPORTED` |
| `/api/exports/events/:eventId/attendee-emails` | `canManageRegistrationsFor` | `ATTENDEE_LIST_EXPORTED` |
| `/api/exports/events/:eventId/teams` | `resolveOrganiserEvent` (`lib/core/teams.ts`) | `TEAM_LIST_EXPORTED` |
| `/api/exports/events/:eventId/judging` | `resolveJudgingOrganiser` (`lib/judgingAccess.ts`) | `JUDGING_SUBMISSIONS_EXPORTED`, `JUDGING_SCORES_EXPORTED` |
| `/api/exports/events/:eventId/feedback` | Owner or admin | `FEEDBACK_RESPONSES_EXPORTED` |
| `/api/exports/account` | The signed-in user (`dataExport` bucket, 5 per hour) | `ACCOUNT_DATA_EXPORTED` |

Every cell goes through `escapeCsvCell`, which prefixes formula-like values (`=`, `+`, `-` or `@`, even after leading whitespace or control characters) with `'`. `csvByteStream` and `csvStreamResponse` stream rows in bounded batches. Every denial and every malformed request gets the same empty `404` with `EXPORT_NO_STORE_HEADERS` (`private, no-store`, `no-referrer`, `nosniff`). Audit metadata records filter **names** only (`exportFilterNames`), never search text.

### Saved views

The event dashboard's long lists keep filters in the URL. Each surface (`GUESTS_PEOPLE`, `GUESTS_TEAMS`, `JUDGING_SUBMISSIONS`, `JUDGING_RESULTS`, `JUDGING_PROGRESS`) has an allow-list of keys and values in `SURFACE_PARAMS`. `sanitizeViewParams` drops unknown keys, unknown values and defaults. A `SavedView` stores a name (up to 60 characters), the params and a `shared` flag, scoped to its organisation, event and surface. The limits are 50 views per user per list (`SAVED_VIEWS_PER_USER_LIMIT`) and 100 views shown in a menu (`SAVED_VIEWS_LIST_LIMIT`). `resolveSavedViewAccess` re-checks the list's own permission on every call. Create, delete, share and unshare are audited (`SAVED_VIEW_*`) with the surface only.

## Invariants

- **Identity and certificate travel together.** The check constraint `EventFeedbackResponse_identity_capability_pair` allows either both `rsvpId` and `certificateToken` to be null, or both to be set. Never write one without the other.
- **Submission is serialised per event and form.** Keep the `FOR UPDATE` locks on `Event` and `EventFeedbackForm` in `submitFeedback`, so a mode switch cannot interleave with a submission.
- **Answers are snapshots.** `EventFeedbackAnswer` keeps `fieldKey`, `fieldLabel` and the type. The `EventFeedbackAnswer_typed_value` constraint requires exactly the matching value column.
- **Certificate layouts are snapshots.** Edits affect only new submissions. Issued certificates are not revoked when the form mode changes later.
- **Certificate images must belong to the organisation.** Always call `certificateImagesAreOwned` before saving or rendering a template.
- **Reports and webhooks never copy typed answers**, emails or phone numbers.
- **Exports are uncached, audited, and refuse with a bare `404`.** Never return a `403` that confirms the event exists.
- **A saved view never grants access.** Params are re-sanitised on write and on read, and the list re-checks its permission.

## Making changes

- **Add a merge tag.** Extend `certificateMergeTags` and the `MERGE_TAG` pattern in `lib/certificateTemplate.ts`, fill the value in `certificateMergeValues` (`lib/renderCertificate.ts`), and extend `tests/unit/certificate-template.test.ts`.
- **Add a feedback starter template.** Add it to `lib/feedbackTemplates.ts`, widening the `id` union.
- **Add a report section.** Add the metric to `EventReportMetrics` and both loaders in `lib/eventReport.ts`, draw it in `createEventReportPdf`, and keep it aggregate-only. Test in `tests/unit/eventReport.test.ts`.
- **Add an export.** Create `app/api/exports/events/[eventId]/<name>/route.ts`. Use `exportNotFound` for every refusal, `csvStreamResponse` with `exportFilename`, record an audit event with `exportFilterNames`, and add a route test modelled on `tests/unit/attendee-export-route.test.ts`.
- **Add a saved-view filter.** Add the key and choices to `SURFACE_PARAMS` (and a preset to `VIEW_PRESETS` if useful) in `lib/savedViews.ts`. The server list must compute the filter itself.

## Testing

| File | Covers |
| --- | --- |
| `tests/unit/feedback.test.ts`, `feedback-route.test.ts`, `feedback-form-actions.test.ts` | Validation, modes, route limits, settings actions |
| `tests/integration/feedback.db.test.ts` | Locked submission, constraint, certificate linkage |
| `tests/unit/certificate-template.test.ts`, `certificate-download.test.ts` | Layer schema, merge tags, download rules |
| `tests/unit/eventReport.test.ts`, `event-report-route.test.ts` | Metrics and access |
| `tests/unit/csv.test.ts`, `filtered-exports.test.ts`, `attendee-export-route.test.ts`, `feedback-export-route.test.ts` | CSV safety and export guards |
| `tests/unit/saved-views.test.ts`, `saved-views-actions.test.ts`, `tests/integration/saved-views.db.test.ts`, `tests/e2e/saved-views.spec.ts` | Saved views |

```bash
npx vitest run tests/unit/feedback.test.ts tests/unit/certificate-template.test.ts tests/unit/csv.test.ts
TEST_DATABASE_URL="postgresql://yuyu:yuyu_dev@localhost:5432/yuyu_test" npm run test:integration -- tests/integration/feedback.db.test.ts
```

## Further reading

- [docs/FEATURES.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/FEATURES.md) (Feedback and certificates, Event analytics, Saved views)
- [docs/SECURITY.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/SECURITY.md)
- [Storage and media](/features/storage-and-media)
- [Registration and RSVP](/features/registration-and-rsvp)
- [Webhooks](/api/webhooks)
