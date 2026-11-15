# The Same Job Test

Public route: `/same-job/`. Compares extracted wording from two estimates and prepares questions; it does not judge contractors, choose a price, establish code compliance or certify equivalent scope.

## Privacy and parsing

- PDFs and pasted source text stay in memory in the open page. There is no document upload endpoint or external document/AI service.
- Source passages are rendered with text nodes, never HTML. Clear, replacement and pagehide purge source state and result DOM. Native worker cancellation and per-slot versions prevent stale reads from restoring cleared data.
- PDF.js 6.5.438 is pinned. The build copies the matching self-hosted legacy parser/worker, CMaps, standard fonts and Apache license from the npm package; no viewer, sandbox or OCR service is included. The heavy parser loads only on PDF selection.
- Explicit native module workers prevent fake-worker fallback. Limits: 10 MB, 25 pages, 150,000 extracted characters per file, 20-second deadline. Parsing runs sequentially, with native error, abort and timeout handling. Graceful cleanup is bounded before hard termination.
- Scans and image-only pages are not OCR-read. Unreadable pages are identified; fully unreadable files fail with a paste-text alternative. Pasted wording is limited to 150,000 characters per side.
- Results use keyword matching, up to three short passages per topic, and source page numbers. Mentions do not establish inclusion or equivalence; not-found does not establish exclusion. Cautious wording flags are prompts, never automatic exclusions.

## Request boundary

Visitors explicitly choose the trade. All ten topic questions are initially selected; visitors may uncheck and edit. Regeneration cannot silently discard edited notes.

Only after the visitor chooses to review a request are the edited question notes (max 2,400 characters) placed in same-tab session storage. No source PDFs or passages are included automatically. The request form accepts matching notes for ten minutes and consumes them once, rejects expired/wrong-intent data, requires fresh consent, and names the receiving business. Normal office-review routing remains in place. Nothing auto-submits or directly broadcasts to businesses. Notes are never placed in a URL or analytics; only the bounded entry category `estimate-check` is attributed.

The question-sheet HTML download safely escapes notes, forbids scripts/network/forms, and includes no source documents. Share links contain only the public tool URL.

## Verification

Production build and full repository checks are required before merge. Added regression coverage includes hostile source/export text, page references, trade selection, no network/storage during comparison, pagehide clearing, edited-note preservation, stale PDF races, failed replacement clearing, worker error/abort/deadline, file/page/text limits, scanned/password-protected fallbacks, scoped CSP, single-use/expired/wrong-intent handoff and fresh-consent request behavior.

A local Chrome harness successfully extracted a synthetic two-page PDF under same-origin script/worker/connect CSP, then ran both synthetic PDFs through the actual controller and verified permit passages on PDF page 2. Browser handoff confirmed only question notes arrived and consent remained unchecked; returning cleared source text. Responsive checks covered 320, 390, 1024 and 1440 pixels on the tool, home, request, contacts, privacy, provider and estimate guide pages without horizontal page overflow. No real customer documents were used. Safari was not directly tested; the parser uses stream readers rather than `getTextContent()` to avoid its known async-iterator compatibility issue.
