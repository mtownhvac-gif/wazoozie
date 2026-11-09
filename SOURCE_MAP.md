# Wazoozie source of truth

The complete current production source lives in [mtownhvac-gif/wazoozie](https://github.com/mtownhvac-gif/wazoozie). Production is the `wazoozie` Cloudflare Worker serving wazoozie.com and www.wazoozie.com. GitHub main is connected to production deployment. The old Sites preview is historical, not production.

## What is here

| Location | Contents |
| --- | --- |
| `build.py`, root Python modules, `src/` | Page templates, content and site generator |
| `assets/` | Site artwork, fonts, styles and browser scripts |
| `entry.mjs`, `worker.mjs`, `server/`, root JavaScript modules | Worker routes, project inbox and account services |
| `wrangler.jsonc` | Cloudflare bindings, migrations and production domains |
| `tests/`, `check_*.py`, `check_agent.mjs` | Site and service verification |
| `package.json`, `package-lock.json`, `scripts/` | Reproducible dependencies and development tools |
| `archives/sites-preview-v3/` | All 11 tracked files from the original Sites preview, preserving original paths |
| `.github/workflows/verify.yml` | Build, checks and downloadable generated site on GitHub Actions |
| `docs/source-inventory.json` | SHA-256 inventory of every source file at this release, excluding the inventory itself |

## Run or export

Use Node 22 and Python 3.12 or later:

```sh
npm ci
npm run build:production
npm run check
npm run dev
```

`dist/` is generated, not separately edited or committed. Download the repository using GitHub **Code → Download ZIP**, or clone it. Each successful verification run also has a **wazoozie-built-site** artifact under GitHub Actions, available for 30 days. Rebuild locally whenever an artifact expires. Production needs the Worker backend; uploading `dist/` alone only reproduces the static pages.

For a full source ZIP from a checkout:

```sh
git archive --format=zip --output=wazoozie-source.zip HEAD
```

## Original Sites work

The archived source was recovered from Site `appgprj_6aebd29dda24819183060f3384430af1`, version 3, commit `5e538f522a1b1a58026a6d1e2b8a73cecedce240`. It includes the original HTML, generator, checks, hosting configuration, README, development notes and both original hero images. Historical hosting settings inside the archive are preserved for reference; do not deploy them over production. Current production has no dependency on the old Sites preview.

## Email and private configuration

`hello@wazoozie.com` forwards inbound mail to the office through Cloudflare Email Routing. This is not an outbound mailbox or Gmail send-as configuration. The public contact page is `/hello/`; existing business service requests keep their own routes.

Cloudflare secrets, login credentials, live customer records, inbox records and account data are not source files and must not be committed. Preserve deployed secrets and Durable Objects when deploying; use `npm run deploy`, which includes `--keep-vars`. See `EMAIL_DELIVERY.md`, `DEVELOPMENT.md` and the current Worker configuration for setup and operational details. Exporting production data is a separate private backup task.
