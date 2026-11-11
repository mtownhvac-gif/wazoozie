# Before It Disappears

A homeowner notebook for documenting useful details before work is concealed. Live path: `/before-it-disappears/`.

Six project types each contain four fixed editorial prompts. The job stage changes the requested evidence: plan the record before work, arrange crew photos during accessible work, or request existing records after finishing. A cutaway slider explains the distinction between visible finishes and concealed work. It is an illustration, not a construction detail.

Notes and discussion marks are scoped by project and kept in localStorage. Optional JPEG/PNG/WebP photos (4 MB maximum each, one per checkpoint) are held in a dedicated IndexedDB store. Photo persistence failure leaves a temporary in-tab copy and displays a warning to download. The tool makes no network requests, uses no model service, and does not upload notebook content. Existing site scripts still load normally.

A share URL allowlists only project and stage. Photos, notes and discussion marks are excluded. The downloaded self-contained HTML file includes only the current project's content, escapes notes, validates image data URLs and disallows active scripts/network content with its own CSP. It can be opened offline and printed. The photo-request copy excludes all private notebook content. Print expands record details and restores them afterward.

Clear requires a native confirmation and clears all notebook projects, including the photo store; downloaded files remain separate. Storage failure is reported rather than represented as successful deletion. Browser storage is not an archival guarantee; users are told to download what they want to retain.

Sources: NWFA Installation Guidelines; ENERGY STAR HVAC Quality Installation; Schluter water-test guidance. Requirements depend on the product, project and responsible contractor. No completion score, diagnosis, workmanship certification, or inspection approval is inferred from a picture or discussion checkbox. New contractor prospects have not been added to directory listings by this feature.

Validation: production build, existing repository checks, and behavioral tests covering scoped notes, stage changes, cutaway, malformed links, export escaping, photo handling when persistence is blocked, clipboard fallback, clear and print behavior.
